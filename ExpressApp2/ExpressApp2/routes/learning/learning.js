'use strict';
var express = require('express');
var Client = require('node-rest-client').Client;
var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var dbConnect = require('../../config/dbConnect');
var paging = require('../../config/paging');
var util = require('../../config/util');
var Client = require('node-rest-client').Client;

const syncClient = require('sync-rest-client');
const appDbConnect = require('../../config/appDbConnect');
const appSql = require('mssql');

var router = express.Router();

//const HOST = 'https://westus.api.cognitive.microsoft.com'; // Luis api host
/* GET users listing. */
router.get('/', function (req, res) {
    req.session.selMenus = 'ms1';
    req.session.selMenu = 'm3';
    res.redirect('/learning/recommend');
});

router.get('/recommend', function (req, res) {
    req.session.selMenus = 'ms1';
    res.render('recommend', { selMenus: 'ms1' });
});

router.post('/recommend', function (req, res) {
    var selectType = req.body.selectType;
    var currentPage = req.body.currentPage;
    var searchRecommendText = req.body.searchRecommendText;

    (async () => {
        try {
            var entitiesQueryString = "" +
                "SELECT TBZ.* \n" +
                "  FROM ( \n" +
                "        SELECT TBY.*  \n" +
                "          FROM ( \n" +
                "		        SELECT ROW_NUMBER() OVER(ORDER BY TBX.SEQ DESC) AS NUM,  \n" +
                "                       COUNT('1') OVER(PARTITION BY '1') AS TOTCNT,  \n" +
                "                       CEILING((ROW_NUMBER() OVER(ORDER BY TBX.SEQ DESC) )/ convert(numeric ,10)) PAGEIDX,  \n" +
                "                       TBX.*  \n" +
                "                 FROM (  \n" +
                "                        SELECT SEQ,QUERY,CONVERT(CHAR(19), UPD_DT, 20) AS UPD_DT,(SELECT RESULT FROM dbo.FN_ENTITY_ORDERBY_ADD(QUERY)) AS ENTITIES, TBH.QUERY_KR \n" +
                "                          FROM TBL_QUERY_ANALYSIS_RESULT, ( \n" +
                "						                                     SELECT CUSTOMER_COMMENT_KR AS QUERY_KR \n" +
                "						                                       FROM TBL_HISTORY_QUERY \n" +
                "						                                      GROUP BY CUSTOMER_COMMENT_KR ) TBH \n" +
                "                         WHERE RESULT NOT IN ('H')  \n" +
                "                           AND TRAIN_FLAG = 'N'  \n" +
                "                           AND QUERY = dbo.fn_replace_regex(TBH.QUERY_KR)  \n";

            if (selectType == 'yesterday') {
                entitiesQueryString += " AND (CONVERT(CHAR(10), UPD_DT, 23)) like '%'+(select CONVERT(CHAR(10), (select dateadd(day,-1,getdate())), 23)) + '%'";
            } else if (selectType == 'lastWeek') {
                entitiesQueryString += " AND (CONVERT(CHAR(10), UPD_DT, 23)) >= (SELECT CONVERT(CHAR(10), (DATEADD(wk, DATEDIFF(d, 0, getdate()) / 7 - 1, -1)), 23))";
                entitiesQueryString += " AND (CONVERT(CHAR(10), UPD_DT, 23)) <= (SELECT CONVERT(CHAR(10), (DATEADD(wk, DATEDIFF(d, 0, getdate()) / 7 - 1, 5)), 23))";
            } else if (selectType == 'lastMonth') {
                entitiesQueryString += "  AND CONVERT(CHAR(10), UPD_DT, 23)  BETWEEN CONVERT(CHAR(10),dateadd(month,-1,getdate()), 23) and CONVERT(CHAR(10), getdate(), 23) ";
            } else {
            }

            if (searchRecommendText) {

                entitiesQueryString += " AND QUERY LIKE '%" + searchRecommendText + "%' ";
            }

            entitiesQueryString += "" +
                "                       ) TBX \n" +
                "			   ) TBY \n" +
                "	     ) TBZ \n" +
                " WHERE 1=1  \n" +
                "   AND PAGEIDX = @currentPage  \n" +
                " ORDER BY NUM \n";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
                .input('currentPage', sql.Int, currentPage)
                .query(entitiesQueryString)
            let rows = result1.recordset;


            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};
                var query = rows[i].QUERY_KR;
                var seq = rows[i].SEQ;
                var entities = rows[i].ENTITIES;
                var updDt = rows[i].UPD_DT;
                var entityArr = rows[i].ENTITIES.split(',');
                var luisQueryString = "";

                item.QUERY = query;
                item.UPD_DT = updDt;
                item.SEQ = seq;
                item.ENTITIES = entities;
                if (entityArr[0] == "") {
                    item.intentList = [];
                } else {
                    for (var j = 0; j < entityArr.length; j++) {
                        if (j == 0) {
                            luisQueryString += "SELECT DISTINCT LUIS_INTENT FROM TBL_DLG_RELATION_LUIS WHERE LUIS_ENTITIES LIKE '%" + entityArr[j] + "%'"
                        } else {
                            luisQueryString += "OR LUIS_ENTITIES LIKE '%" + entityArr[j] + "%'";
                        }
                    }
                    let luisIntentList = await pool.request()
                        .query(luisQueryString)
                    item.intentList = luisIntentList.recordset
                }
                result.push(item);
            }

            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT) });
            } else {
                res.send({ list: result });
            }

        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.get('/utterances', function (req, res) {
    var utterance = req.query.utterance;

    req.session.selMenus = 'ms2';
    res.render('utterances', {
        selMenus: req.session.selMenus,
        utterance: utterance
    });
});


router.post('/getLuisInfo', function (req, res) {

    (async () => {
        try {

            var searchInfo = req.body.searchInfo;

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            if (searchInfo == 'luisIntent') {

                var luisId = req.body.luisId;


                var getLuisIntentQuery = " SELECT DISTINCT LUIS_INTENT FROM TBL_DLG_RELATION_LUIS WHERE LUIS_ID = @luisId";

                let getLuisIntent_result = await pool.request().input('luisId', sql.NVarChar, luisId).query(getLuisIntentQuery);
                let getLuisIntent_rows = getLuisIntent_result.recordset;

                var luisIntentList = [];
                for (var i = 0; i < getLuisIntent_rows.length; i++) {
                    var item = {};

                    var luisIntent = getLuisIntent_rows[i].LUIS_INTENT;

                    item.luisIntent = luisIntent;

                    luisIntentList.push(item);
                }

                res.send({ luisIntentList: luisIntentList });
            } else if (searchInfo == 'luisId') {

                var getLuisIdQuery = " SELECT DISTINCT LUIS_ID FROM TBL_DLG_RELATION_LUIS ";

                let getLuisId_result = await pool.request().query(getLuisIdQuery);
                let getLuisId_rows = getLuisId_result.recordset;

                var luisIdList = [];
                for (var i = 0; i < getLuisId_rows.length; i++) {
                    var item = {};

                    var luisId = getLuisId_rows[i].LUIS_ID;

                    item.luisId = luisId;

                    luisIdList.push(item);
                }

                res.send({ luisIdList: luisIdList });
            }


        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.get('/dialog', function (req, res) {

    req.session.selMenus = 'ms3';
    if (!req.session.sid) {
        res.render('dialog');
    } else {

        (async () => {
            try {
                var group_query = "select distinct GroupL from TBL_DLG where GroupL is not null";
                //var group_query = "SELECT DISTINCT GroupL FROM TBL_DLG WHERE GroupL = '" + searchGroupL + "'";
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                let result2 = await pool.request().query(group_query);
                let rows2 = result2.recordset;

                var groupList = [];
                for (var i = 0; i < rows2.length; i++) {
                    var item2 = {};

                    var largeGroup = rows2[i].GroupL;

                    //item2.largeGroup = largeGroup;
                    //groupList.push(item2);
                }

                res.render('dialog', {
                    selMenus: req.session.selMenus,
                    groupList: rows2
                });
            } catch (err) {
                console.log(err)
                // ... error checks
            } finally {
                sql.close();
            }
        })()
    }

});


//다이얼로그 대그룹 중그룹 소그룹 셀렉트 박스
router.post('/searchGroup', function (req, res) {
    var searchTxt = '';
    if (req.body.searchTxt != '' && req.body.searchType != '1') {
        searchTxt = req.body.searchTxt;
    }
    var group = req.body.group;
    var groupName = req.body.groupName;
    var groupL = req.body.groupL;

    (async () => {
        try {

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            var searchGroupQuery;
            if (group == 'searchMedium') {

                searchGroupQuery = "SELECT DISTINCT tbp.GroupM " +
                    "  FROM (SELECT a.GroupL, a.GroupM, GroupS " +
                    "          FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b " +
                    "         WHERE a.DLG_ID = b.DLG_ID   and LUIS_ENTITIES like '%" + searchTxt + "%' ) tbp " +
                    " WHERE GroupL = @groupName";

                let result1 = await pool.request().input('groupName', sql.NVarChar, groupName).query(searchGroupQuery);
                let rows = result1.recordset;

                var groupList = [];
                for (var i = 0; i < rows.length; i++) {
                    var item = {};

                    var mediumGroup = rows[i].GroupM;

                    item.mediumGroup = mediumGroup;

                    groupList.push(item);
                }

                res.send({ groupList: groupList });
            } else if (group == 'searchSmall') {
                searchGroupQuery = "SELECT DISTINCT tbp.GroupS " +
                    "  FROM (SELECT a.GroupL, a.GroupM, GroupS " +
                    "          FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b " +
                    "         WHERE a.DLG_ID = b.DLG_ID   and LUIS_ENTITIES like '%" + searchTxt + "%' ) tbp " +
                    " WHERE GroupL = '" + groupL + "' and GroupM = @groupName";
                //searchGroupQuery = "select distinct GroupS from TBL_DLG where GroupL = '" + groupL + "' and GroupM = @groupName";

                let result1 = await pool.request().input('groupName', sql.NVarChar, groupName).query(searchGroupQuery);
                let rows = result1.recordset;

                var groupList = [];
                for (var i = 0; i < rows.length; i++) {
                    var item = {};
                    var smallGroup = rows[i].GroupS;

                    item.smallGroup = smallGroup;

                    groupList.push(item);
                }

                res.send({ groupList: groupList });
            }

        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

//dialog.html 소그룹이 선택 돼었을때 리스트 뿌려주기
router.post('/selectSmallGroup', function (req, res) {

    var groupName = req.body.groupName;
    var currentPage = 1;

    if (req.body.currentPage != null) {
        currentPage = req.body.currentPage;
    }
    (async () => {
        try {

            var selectSmallGroup = "select tbp.* from " +
                "(select ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC) AS NUM, " +
                "COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, " +
                "CEILING((ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC))/ convert(numeric ,10)) PAGEIDX, " +
                "DLG_DESCRIPTION, GroupS, DLG_API_DEFINE ,LUIS_ENTITIES" +
                "from TBL_DLG a, TBL_DLG_RELATION_LUIS b " +
                "where a.DLG_ID = b.DLG_ID and GroupS like '%" + groupName + "%' " +
                "and DLG_API_DEFINE like '%" + sourceType + "%') tbp " +
                "WHERE PAGEIDX = @currentPage";

            //var searchMidGroup = "select * from TBL_DLG where GroupS = @groupName";
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(selectSmallGroup);
            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var description = rows[i].DLG_DESCRIPTION;
                var apidefine = rows[i].DLG_API_DEFINE;
                var luisentent = rows[i].LUIS_INTENT;
                var smallGroup = rows[i].GroupS;

                item.DLG_DESCRIPTION = description;
                item.DLG_API_DEFINE = apidefine;
                item.LUIS_INTENT = luisentent;
                item.GroupS = smallGroup;

                result.push(item);
            }
            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT) });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});


router.post('/searchIptDlg', function (req, res) {

    var currentPage = req.body.currentPage;
    var searchText = req.body.searchText;

    (async () => {
        try {

            var dlg_desQueryString = "SELECT tbp.* FROM " +
                "  (SELECT ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC) AS NUM, " +
                "      a.DLG_ID AS DLG_ID, " +
                "      COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, " +
                "      CEILING((ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC))/ convert(numeric ,10)) PAGEIDX, " +
                "      DLG_DESCRIPTION, DLG_API_DEFINE ,LUIS_ENTITIES, LUIS_INTENT, GroupS, MissingEntities " +
                "  FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b where a.DLG_ID = b.DLG_ID ";

            //dlg_desQueryString+= "  and LUIS_ENTITIES like '%" + searchText + "%' ";
            dlg_desQueryString += "  and LUIS_INTENT like '%" + searchText + "%' ";
            dlg_desQueryString += ") tbp WHERE PAGEIDX = @currentPage";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);//dbConnect.getConnection(sql);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(dlg_desQueryString);
            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var description = rows[i].DLG_DESCRIPTION;
                var apidefine = rows[i].DLG_API_DEFINE;
                var luisentties = rows[i].LUIS_ENTITIES;
                var luisentent = rows[i].LUIS_INTENT;
                var smallGroup = rows[i].GroupS;
                var dialogueId = rows[i].DLG_ID;
                var missingEntities = rows[i].MissingEntities;

                item.DLG_ID = dialogueId;
                item.DLG_DESCRIPTION = description;
                item.DLG_API_DEFINE = apidefine;
                item.LUIS_ENTITIES = luisentties;
                item.LUIS_INTENT = luisentent;
                item.GroupS = smallGroup;
                item.MissingEntities = missingEntities;

                result.push(item);
            }
            var group_query = "SELECT DISTINCT tbp.GroupL " +
                "   FROM (SELECT a.GroupL, a.GroupM, GroupS " +
                "           FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b " +
                //"          WHERE a.DLG_ID = b.DLG_ID   and LUIS_ENTITIES like '%" + searchText +  "%' ) tbp " +
                "          WHERE a.DLG_ID = b.DLG_ID   and LUIS_INTENT like '%" + searchText + "%' ) tbp " +
                "  WHERE GroupL is not null";
            //var group_query = "select distinct GroupL from TBL_DLG where GroupL is not null";
            let result2 = await pool.request().query(group_query);
            let rows2 = result2.recordset;

            var groupList = [];
            for (var i = 0; i < rows2.length; i++) {
                var item2 = {};

                var largeGroup = rows2[i].GroupL;

                item2.largeGroup = largeGroup;

                groupList.push(item2);
            }

            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT), groupList: groupList });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/dialogs2', function (req, res) {

    //var searchTxt = req.body.searchTxt;
    var currentPage = req.body.currentPage;
    var sourceType2 = req.body.sourceType2;
    var searchGroupL = req.body.searchGroupL;
    var searchGroupM = req.body.searchGroupM;
    var searchGroupS = req.body.searchGroupS;

    (async () => {
        try {

            var dlg_desQueryString = "select tbp.* from \n" +
                "(select ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC) AS NUM, \n" +
                "  a.DLG_ID AS DLG_ID, \n" +
                "  COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n" +
                "  CEILING((ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                "  DLG_NAME, DLG_DESCRIPTION, DLG_API_DEFINE ,LUIS_ENTITIES, LUIS_INTENT, GroupL, GroupM, GroupS, MissingEntities \n" +
                "  from TBL_DLG a, TBL_DLG_RELATION_LUIS b where a.DLG_ID = b.DLG_ID \n";
            if (req.body.searchText && !req.body.upperGroupL) {
                //dlg_desQueryString += "AND b.LUIS_ENTITIES like '%" + req.body.searchText + "%' \n";
                dlg_desQueryString += "AND b.LUIS_INTENT like '%" + req.body.searchText + "%' \n";
            }
            dlg_desQueryString += "and DLG_API_DEFINE like '%" + sourceType2 + "%' \n";

            if (req.body.upperGroupL) {
                dlg_desQueryString += "and GroupL = '" + req.body.upperGroupL + "' \n";
            }

            if (req.body.upperGroupM) {
                dlg_desQueryString += "and GroupM = '" + req.body.upperGroupM + "' \n";
            }

            if (req.body.upperGroupS) {
                dlg_desQueryString += "and GroupS = '" + req.body.upperGroupS + "' \n";
            }
            if (searchGroupL) {
                dlg_desQueryString += "and GroupL = '" + searchGroupL + "' \n";
            }

            if (searchGroupM) {
                dlg_desQueryString += "and GroupM = '" + searchGroupM + "' \n";
            }

            if (searchGroupS) {
                dlg_desQueryString += "and GroupS = '" + searchGroupS + "' \n";
            }

            dlg_desQueryString += ") tbp WHERE PAGEIDX = @currentPage \n";

            console.log("dlg_desQueryString===" + dlg_desQueryString);

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(dlg_desQueryString);
            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var description = rows[i].DLG_DESCRIPTION;
                var apidefine = rows[i].DLG_API_DEFINE;
                var luisentties = rows[i].LUIS_ENTITIES;
                var luisentent = rows[i].LUIS_INTENT;
                var smallGroup = rows[i].GroupS;
                var dialogueId = rows[i].DLG_ID;
                var missingEntities = rows[i].MissingEntities;

                item.DLG_ID = dialogueId;
                item.DLG_DESCRIPTION = description;
                item.DLG_API_DEFINE = apidefine;
                item.LUIS_ENTITIES = luisentties;
                item.LUIS_INTENT = luisentent;
                item.GroupS = smallGroup;
                item.MissingEntities = missingEntities;

                result.push(item);
            }

            var group_query = "select distinct GroupL from TBL_DLG where GroupL is not null";
            //var group_query = "SELECT DISTINCT GroupL FROM TBL_DLG WHERE GroupL = '" + searchGroupL + "'";
            let result2 = await pool.request().query(group_query);
            let rows2 = result2.recordset;

            var groupList = [];
            for (var i = 0; i < rows2.length; i++) {
                var item2 = {};

                var largeGroup = rows2[i].GroupL;

                item2.largeGroup = largeGroup;

                groupList.push(item2);
            }

            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT), groupList: groupList });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

});

router.post('/dialogs', function (req, res) {
    var searchTxt = req.body.searchTxt;
    var currentPage = req.body.currentPage;

    (async () => {
        try {
            var sourceType = req.body.sourceType;
            var groupType = req.body.groupType;
            var dlg_desQueryString = "select tbp.* from \n" +
                "(select ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC) AS NUM, \n" +
                "      a.DLG_ID AS DLG_ID, \n" +
                "COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n" +
                "CEILING((ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                "DLG_NAME, DLG_DESCRIPTION, DLG_API_DEFINE ,LUIS_ENTITIES, LUIS_INTENT, GroupL, GroupM, GroupS, ContextLabel,MissingEntities \n" +
                "FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b \n" +
                "WHERE a.DLG_ID = b.DLG_ID \n";
            if (req.body.searchTxt !== '') {
                //dlg_desQueryString += "AND b.LUIS_ENTITIES like '%" + req.body.searchTxt + "%' \n";
                dlg_desQueryString += "AND b.LUIS_INTENT like '%" + req.body.searchTxt + "%' \n";
            }
            if (req.body.searchGroupL !== '') {
                dlg_desQueryString += "AND a.GroupL = '" + req.body.searchGroupL + "' \n";
            }
            if (req.body.searchGroupM !== '') {
                dlg_desQueryString += "AND a.GroupM = '" + req.body.searchGroupM + "' \n";
            }
            if (req.body.searchGroupS !== '') {
                dlg_desQueryString += "AND a.GroupS = '" + req.body.searchGroupS + "' \n";
            }


            /*
                        if (groupType != 'View all') {
                            dlg_desQueryString += "and GroupS = '" + groupType + "' ";
                        }      
            */
            dlg_desQueryString += "AND DLG_API_DEFINE like '%" + sourceType + "%') tbp \n" +
                "WHERE PAGEIDX = @currentPage";
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(dlg_desQueryString);
            let rows = result1.recordset;

            console.log("dialogs dlg_desQueryString===" + dlg_desQueryString);

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};


                var description = rows[i].DLG_DESCRIPTION;
                var apidefine = rows[i].DLG_API_DEFINE;
                var luisentties = rows[i].LUIS_ENTITIES;
                var luisentent = rows[i].LUIS_INTENT;
                var smallGroup = rows[i].GroupS;
                var dialogueId = rows[i].DLG_ID;
                var missingEntities = rows[i].MissingEntities;

                item.DLG_ID = dialogueId;
                item.DLG_DESCRIPTION = description;
                item.DLG_API_DEFINE = apidefine;
                item.LUIS_ENTITIES = luisentties;
                item.LUIS_INTENT = luisentent;
                item.GroupS = smallGroup;
                item.MissingEntities = missingEntities;

                result.push(item);
            }
            var group_query = "SELECT DISTINCT tbp.GroupL " +
                "   FROM (SELECT a.GroupL, a.GroupM, GroupS " +
                "           FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b " +
                //"          WHERE a.DLG_ID = b.DLG_ID   and LUIS_ENTITIES like '%" + searchTxt +  "%' ) tbp " +
                "          WHERE a.DLG_ID = b.DLG_ID   and LUIS_INTENT like '%" + searchTxt + "%' ) tbp " +
                "  WHERE GroupL is not null";
            //var group_query = "select distinct GroupL from TBL_DLG where GroupL is not null";
            let result2 = await pool.request().query(group_query);
            let rows2 = result2.recordset;

            var groupList = [];
            for (var i = 0; i < rows2.length; i++) {
                var item2 = {};

                var largeGroup = rows2[i].GroupL;

                item2.largeGroup = largeGroup;

                groupList.push(item2);
            }

            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT), groupList: groupList });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/utterInputAjax', function (req, res, next) {

    //view에 있는 data 에서 던진 값을 받아서
    var iptUtterance = req.body['iptUtterance[]'];
    var iptUtteranceArr = [];
    var entitiesArr = [];
    var selBoxArr = [];
    var commonEntitiesArr = [];

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            //res.send({result:true, iptUtterance:iptUtterance, entities:entities, selBox:rows2, commonEntities: commonEntities});
            for (var i = 0; i < (typeof iptUtterance !== 'string' ? iptUtterance.length : 1); i++) {
                var iptUtterTmp = (typeof iptUtterance === 'string' ? iptUtterance : iptUtterance[i]);
                let result1 = await pool.request()
                    .input('iptUtterance', sql.NVarChar, iptUtterTmp)
                    .query('SELECT RESULT FROM dbo.FN_ENTITY_ORDERBY_ADD(@iptUtterance)')

                let rows = result1.recordset;

                if (rows[0]['RESULT'] != '') {
                    var entities = rows[0]['RESULT'];
                    var entityArr = entities.split(',');
                    var queryString = "";
                    for (var j = 0; j < entityArr.length; j++) {
                        if (j == 0) {
                            queryString += "SELECT DISTINCT LUIS_INTENT FROM TBL_DLG_RELATION_LUIS WHERE LUIS_ENTITIES LIKE '%" + entityArr[j] + "%'"
                        } else {
                            queryString += "OR LUIS_ENTITIES LIKE '%" + entityArr[j] + "%'";
                        }
                    }

                    let result2 = await pool.request()
                        .query(queryString)

                    let rows2 = result2.recordset

                    var queryString2 = "SELECT ENTITY_VALUE,ENTITY FROM TBL_COMMON_ENTITY_DEFINE WHERE ENTITY IN (";
                    for (var j = 0; j < entityArr.length; j++) {
                        queryString2 += "'";
                        queryString2 += entityArr[j];
                        queryString2 += "'";
                        queryString2 += (j != entityArr.length - 1) ? "," : "";
                    }
                    queryString2 += ")";
                    let result3 = await pool.request()
                        .query(queryString2)
                    console.log("queryString2===" + queryString2);
                    let rows3 = result3.recordset
                    var commonEntities = [];
                    for (var j = 0; j < rows3.length; j++) {
                        // 중복되는 엔티티가 있는 경우 길이가 긴 것이 우선순위를 갖음
                        if (iptUtterTmp.indexOf(rows3[j].ENTITY_VALUE) != -1) {
                            // 첫번째 엔티티는 등록
                            var isCommonAdd = false;
                            if (commonEntities.length == 0) {
                                isCommonAdd = true;
                            } else {
                                for (var k = 0; k < commonEntities.length; k++) {
                                    var longEntity = '';
                                    var shortEntity = '';
                                    var isAdd = false;
                                    if (rows3[j].ENTITY_VALUE.length >= commonEntities[k].ENTITY_VALUE.length) {
                                        longEntity = rows3[j].ENTITY_VALUE;
                                        shortEntity = commonEntities[k].ENTITY_VALUE;
                                        isAdd = true;
                                    } else {
                                        longEntity = commonEntities[k].ENTITY_VALUE;
                                        shortEntity = rows3[j].ENTITY_VALUE;
                                    }
                                    if (longEntity.indexOf(shortEntity) != -1) {
                                        if (isAdd) {
                                            commonEntities.splice(k, 1);
                                            isCommonAdd = true;
                                            break;
                                        }
                                    } else {
                                        isAdd = true;
                                    }
                                    if (isAdd && k == commonEntities.length - 1) {
                                        isCommonAdd = true;
                                    }
                                }
                            }
                            if (isCommonAdd) {
                                var item = {};
                                item.ENTITY_VALUE = rows3[j].ENTITY_VALUE;
                                item.ENTITY = rows3[j].ENTITY;
                                commonEntities.push(item);
                            }
                        }

                    }
                    iptUtteranceArr.push(iptUtterTmp);
                    entitiesArr.push(entities);
                    selBoxArr.push(rows2);
                    commonEntitiesArr.push(commonEntities);
                    //res.send({result:true, iptUtterance:iptUtterance, entities:entities, selBox:rows2, commonEntities: commonEntities});

                } else {
                    iptUtteranceArr.push(iptUtterTmp);
                    entitiesArr.push(null);
                    selBoxArr.push(null);
                    commonEntitiesArr.push(null);
                    //res.send({result:true, iptUtterance:iptUtterance});

                }
            }

            res.send({ result: true, iptUtterance: iptUtteranceArr, entities: entitiesArr, selBox: selBoxArr, commonEntities: commonEntitiesArr });

        } catch (err) {
            // ... error checks
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })

});


router.get('/entities', function (req, res) {

    req.session.selMenus = 'ms4';
    res.render('entities', {
        selMenus: req.session.selMenus,
    });
});


router.post('/entities', function (req, res) {

    var currentPage = req.body.currentPage;

    (async () => {
        try {

            var entitiesQueryString = "SELECT tbp.* \n"
                + "  FROM ( SELECT ROW_NUMBER() OVER(ORDER BY api_group DESC) AS NUM, \n"
                + "                COUNT('1') OVER(PARTITION BY '1') AS TOTCNT,  \n"
                + "                CEILING((ROW_NUMBER() OVER(ORDER BY api_group DESC))/ convert(numeric ,10)) PAGEIDX, \n"
                + "                entity_value, entity, api_group \n"
                + "           from (   \n"
                + "                SELECT DISTINCT entity, API_GROUP ,  \n"
                + "                       STUFF(( SELECT '[' + b.entity_value + ']' \n"
                + "                                 FROM TBL_COMMON_ENTITY_DEFINE b \n"
                + "                                WHERE b.entity = a.entity FOR XML PATH('') ),1,1,'[') AS entity_value  \n"
                + "                  FROM TBL_COMMON_ENTITY_DEFINE a \n"
                + "                 WHERE API_GROUP != 'OCR TEST' \n"
                + "              GROUP BY entity, API_GROUP) tbl_common_entity_define \n"
                + "         WHERE api_group != 'OCR TEST') tbp \n"
                + "WHERE PAGEIDX = @currentPage; \n"

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(entitiesQueryString);

            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var entitiyValue = rows[i].entity_value;
                var entity = rows[i].entity;
                var apiGroup = rows[i].api_group;

                item.ENTITY_VALUE = entitiyValue;
                item.ENTITY = entity;
                item.API_GROUP = apiGroup;

                result.push(item);
            }
            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT) });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

//엔티티 밸류 추가
router.post('/addEntityValue', function (req, res) {

    var apiGroup = req.body.apiGroup;
    var entityDefine = req.body.entityDefine;
    var addEntityValue = req.body.addEntityValue;

    (async () => {
        try {

            var insertQueryString1 = "insert into TBL_COMMON_ENTITY_DEFINE(ENTITY, ENTITY_VALUE, API_GROUP) values(@entityDefine, @addEntityValue, @apiGroup)";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let result1 = await pool.request()
                .input('entityDefine', sql.NVarChar, entityDefine)
                .input('addEntityValue', sql.NVarChar, addEntityValue)
                .input('apiGroup', sql.NVarChar, apiGroup)
                .query(insertQueryString1);

            res.send({ status: 200, message: 'insert Success' });

        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'insert Entity Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })

});



//엔티티 삭제
router.post('/deleteEntity', function (req, res) {

    var delEntityDefine = req.body.delEntityDefine;
    
    (async () => {
        try {

            var deleteAppStr = "DELETE FROM TBL_COMMON_ENTITY_DEFINE WHERE ENTITY = '" + delEntityDefine + "'; \n";
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let result1 = await pool.request().query(deleteAppStr);

            res.send({ status: 200, message: 'delete Entity Success' });
            
        } catch (err) {
            console.log(err);
            console.log("res 500");
            res.send({ status: 500, message: 'delete Entity Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })

});



//엔티티 추가
router.post('/insertEntity', function (req, res) {

    //var entityDefine = req.body.entityDefine;
    //var entityValue = req.body.entityValueList;
    //var apiGroup = req.body.apiGroup;
    var entityList = req.body;
    var entityTemp = [];
    if (entityList.entityDefine) {
        var tmpObj = new Object();
        tmpObj.entityDefine = entityList.entityDefine;
        tmpObj.apiGroup = entityList.apiGroup;
        tmpObj.entityValue = entityList.entityValue;
        entityTemp.push(tmpObj);
        entityList = entityTemp;
    }
    //var entityList = JSON.parse(req.body.entityObj);
    (async () => {
        try {
            var entityInputStr = "";
            entityInputStr += " SELECT COUNT(*) as count FROM TBL_COMMON_ENTITY_DEFINE \n";
            entityInputStr += "  WHERE 1=1 \n";
            entityInputStr += "    AND ENTITY = '" + entityList[0].entityDefine + "' \n";
            entityInputStr += "    AND API_GROUP = '" + entityList[0].apiGroup + "' \n";
            entityInputStr += "    AND ( ";
            for (var i = 0; i < entityList.length; i++) {
                if (i !== 0) { entityInputStr += "     OR " }
                entityInputStr += "ENTITY_VALUE = '" + entityList[i].entityValue + "' \n";
            }
            entityInputStr += "); \n";
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let result0 = await pool.request().query(entityInputStr);
            /*
            var selectQuery  = ' SELECT COUNT(*) as count FROM TBL_COMMON_ENTITY_DEFINE ';
                selectQuery += ' WHERE ENTITY_VALUE = @entityValue ';
                selectQuery += ' AND ENTITY = @entityDefine ';
                selectQuery += ' AND API_GROUP = @apiGroup ';
            let result0 = await pool.request()
            .input('entityValue', sql.NVarChar, entityValue)
            .input('entityDefine', sql.NVarChar, entityDefine)
            .input('apiGroup', sql.NVarChar, apiGroup)
            .query(selectQuery);  
            */
            let rows = result0.recordset;

            if (rows[0].count == 0) {

                var entityInputStr = "";
                for (var i = 0; i < entityList.length; i++) {
                    entityInputStr += " INSERT INTO tbl_common_entity_define(ENTITY, ENTITY_VALUE, API_GROUP) \n";
                    entityInputStr += " VALUES ('" + entityList[i].entityDefine + "', '" + entityList[i].entityValue + "', '" + entityList[i].apiGroup + "'); \n";
                }

                let result1 = await pool.request().query(entityInputStr);

                res.send({ status: 200, message: 'insert Success' });
            } else {
                res.send({ status: 'Duplicate', message: 'Duplicate entities exist' });
            }

        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'insert Entity Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })

});

//엔티티 수정
router.post('/updateEntity', function (req, res) {

    var entity = req.body.entityDefine;
    var updEntityValue = req.body.entityValue;
    var apiGroup = req.body.api_group;
    var oriEntityValue = [];
    var insertValue = [];
    var deleteValue = [];
    var intentInfo = [];
    var entityCheck = false;

    var appName = req.session.appName;
    var subsKey = req.session.subsKey;

    var options = {
        headers: {
            'Ocp-Apim-Subscription-Key': subsKey
        }
    };

    var client = new Client();

    var selEntityQuery = "SELECT ENTITY_VALUE, ENTITY, API_GROUP, TRAIN_FLAG\n";
    selEntityQuery += "FROM TBL_COMMON_ENTITY_DEFINE\n";
    selEntityQuery += "WHERE ENTITY = @entity";

    var delEntityQuery = "DELETE FROM TBL_COMMON_ENTITY_DEFINE WHERE ENTITY_VALUE = @entityValue";

    var insertEntityQuery = "INSERT INTO TBL_COMMON_ENTITY_DEFINE(ENTITY_VALUE,ENTITY,API_GROUP,TRAIN_FLAG)\n";
    insertEntityQuery += "VALUES(@entityValue, @entity, @apiGroup, 'Y')";

    (async () => {
        try {
            let appPool = await appDbConnect.getAppConnection(appSql, req.session.appName, req.session.dbValue);

            let selEntity = await appPool.request()
                .input('entity', sql.NVarChar, entity)
                .query(selEntityQuery);

            var selEntityRecord = selEntity.recordset;

            for (var i = 0; i < selEntityRecord.length; i++) {
                oriEntityValue.push(selEntityRecord[i].ENTITY_VALUE);
            }

            deleteValue = JSON.parse(JSON.stringify(oriEntityValue));
            insertValue = JSON.parse(JSON.stringify(updEntityValue));

            for (var i = 0; i < selEntityRecord.length; i++) {
                for (var j = 0; j < updEntityValue.length; j++) {
                    if (oriEntityValue[i] == updEntityValue[j]) {
                        deleteValue.splice(deleteValue.indexOf(oriEntityValue[i]), 1);
                        insertValue.splice(insertValue.indexOf(updEntityValue[i]), 1);
                        break;
                    }
                }
            }

            //console.log("deleteValue===="+deleteValue);
            //console.log("insertValue===="+insertValue);

            if (insertValue.length > 0 || deleteValue.length > 0) {
                for (var i = 0; i < insertValue.length; i++) {

                    let insertEntity = await appPool.request()
                                .input('entityValue', sql.NVarChar, insertValue[i])
                                .input('entity', sql.NVarChar, entity)
                                //.input('apiGroup', sql.NVarChar, apiGroup)
                                .input('apiGroup', sql.NVarChar, "COMMON")
                                .query(insertEntityQuery);
                                //console.log("insertEntityQuery===="+insertEntityQuery);

                            break;
                }

                for (var delNum = 0; delNum < deleteValue.length; delNum++) {
                    let delEntity = await appPool.request()
                                    .input('entityValue', sql.NVarChar, deleteValue[delNum])
                                    .query(delEntityQuery);
                                    //console.log("delEntityQuery===="+delEntityQuery);
                }
            }
            res.send({ status: 200 });
        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'insert Entity Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })


});

//엔티티 검색
router.post('/searchEntities', function (req, res) {

    var currentPage = req.body.currentPage;
    var searchEntities = req.body.searchEntities;

    (async () => {
        try {

            var entitiesQueryString = "SELECT tbp.* \n FROM "
                + "    (SELECT ROW_NUMBER() OVER(ORDER BY api_group DESC) AS NUM, \n"
                + "            COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"
                + "            CEILING((ROW_NUMBER() OVER(ORDER BY api_group DESC))/ convert(numeric ,10)) PAGEIDX, \n"
                + "            entity_value, entity, api_group from (SELECT DISTINCT entity, API_GROUP , \n"
                + "            STUFF(( SELECT '[' + b.entity_value + ']' \n "
                + "                      FROM TBL_COMMON_ENTITY_DEFINE b \n"
                + "                     WHERE b.entity = a.entity \n "
                + "                       AND b.API_GROUP = a.API_GROUP FOR XML PATH('') ),1,1,'[') AS entity_value \n"
                + "      FROM TBL_COMMON_ENTITY_DEFINE a \n"
                + "     WHERE API_GROUP != 'OCR TEST' \n"
                + "       AND (entity like @searchEntities or entity_value like @searchEntities) \n"
                + "  GROUP BY entity, API_GROUP) a \n"
                + "      ) tbp  \n"
                + "WHERE PAGEIDX = 1 \n";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).input('searchEntities', sql.NVarChar, '%' + searchEntities + '%').query(entitiesQueryString);

            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var entitiyValue = rows[i].entity_value;
                var entity = rows[i].entity;
                var apiGroup = rows[i].api_group;

                item.ENTITY_VALUE = entitiyValue;
                item.ENTITY = entity;
                item.API_GROUP = apiGroup;

                result.push(item);
            }
            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT) });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/selectDlgListAjax', function (req, res) {

    var entity = [];
    entity = req.body['entity[]'];


    var relationText = "SELECT RNUM, LUIS_ENTITIES, A.DLG_ID DLG_ID, B.DLG_TYPE, DLG_ORDER_NO, LUIS_ID, LUIS_INTENT \n"
        + "FROM (\n"
        + "SELECT RANK() OVER(ORDER BY LUIS_ENTITIES) AS RNUM, LUIS_ENTITIES, DLG_ID, LUIS_ID, LUIS_INTENT \n"
        + "FROM TBL_DLG_RELATION_LUIS \n"
        + "WHERE 1=1\n";
    if (Array.isArray(entity)) {
        for (var i = 0; i < entity.length; i++) {
            if (i == 0) {
                relationText += "AND LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            } else {
                relationText += "OR LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            }
        }
    } else {
        relationText += "AND LUIS_ENTITIES LIKE '%" + entity + "%'\n";
    }

    relationText += "GROUP BY LUIS_ENTITIES, DLG_ID, LUIS_ID, LUIS_INTENT \n"
        + ") A LEFT OUTER JOIN TBL_DLG B\n"
        + "ON A.DLG_ID = B.DLG_ID \n"
        + "WHERE RNUM = 1\n"
        + "ORDER BY LUIS_ENTITIES desc, DLG_ORDER_NO";

    var dlgText = "SELECT DLG_ID, CARD_TITLE, CARD_TEXT, USE_YN, '2' AS DLG_TYPE \n"
        + "FROM TBL_DLG_TEXT\n"
        + "WHERE USE_YN = 'Y'\n"
        + "AND DLG_ID IN (\n"
        + "SELECT DISTINCT DLG_ID\n"
        + "FROM TBL_DLG_RELATION_LUIS\n"
        + "WHERE 1=1\n";
    if (Array.isArray(entity)) {
        for (var i = 0; i < entity.length; i++) {
            if (i == 0) {
                dlgText += "AND LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            } else {
                dlgText += "OR LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            }
        }
    } else {
        dlgText += "AND LUIS_ENTITIES LIKE '%" + entity + "%'\n";
    }

    dlgText += ") \n ORDER BY DLG_ID";

    var dlgCard = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, IMG_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n"
        + "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n"
        + "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n"
        + "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n"
        + "CARD_ORDER_NO, CARD_VALUE,\n"
        + "USE_YN, '3' AS DLG_TYPE \n"
        + "FROM TBL_DLG_CARD\n"
        + "WHERE USE_YN = 'Y'\n"
        + "AND DLG_ID IN (\n"
        + "SELECT DISTINCT DLG_ID\n"
        + "FROM TBL_DLG_RELATION_LUIS\n"
        + "WHERE 1=1\n";
    if (Array.isArray(entity)) {
        for (var i = 0; i < entity.length; i++) {
            if (i == 0) {
                dlgCard += "AND LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            } else {
                dlgCard += "OR LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            }
        }
    } else {
        dlgCard += "AND LUIS_ENTITIES LIKE '%" + entity + "%'\n";
    }

    dlgCard += ") \n ORDER BY DLG_ID";

    var dlgMedia = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, MEDIA_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n"
        + "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n"
        + "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n"
        + "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n"
        + "CARD_VALUE,\n"
        + "USE_YN, '4' AS DLG_TYPE \n"
        + "FROM TBL_DLG_MEDIA\n"
        + "WHERE USE_YN = 'Y'\n"
        + "AND DLG_ID IN (\n"
        + "SELECT DISTINCT DLG_ID\n"
        + "FROM TBL_DLG_RELATION_LUIS\n"
        + "WHERE 1=1\n";

    if (Array.isArray(entity)) {
        for (var i = 0; i < entity.length; i++) {
            if (i == 0) {
                dlgMedia += "AND LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            } else {
                dlgMedia += "OR LUIS_ENTITIES LIKE '%" + entity[i] + "%'\n";
            }
        }
    } else {
        dlgMedia += "AND LUIS_ENTITIES LIKE '%" + entity + "%'\n";
    }

    dlgMedia += ") \n ORDER BY DLG_ID";

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let dlgTextResult = await pool.request()
                .query(dlgText);
            let rowsText = dlgTextResult.recordset;

            let dlgCardResult = await pool.request()
                .query(dlgCard);
            let rowsCard = dlgCardResult.recordset;

            let dlgMediaResult = await pool.request()
                .query(dlgMedia);
            let rowsMedia = dlgMediaResult.recordset;

            let result1 = await pool.request()
                .query(relationText)
            let rows = result1.recordset;
            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var row = {};
                row.RNUM = rows[i].RNUM;
                row.LUIS_ENTITIES = rows[i].LUIS_ENTITIES;
                row.DLG_ID = rows[i].DLG_ID;
                row.DLG_TYPE = rows[i].DLG_TYPE;
                row.DLG_ORDER_NO = rows[i].DLG_ORDER_NO;
                row.LUIS_ID = rows[i].LUIS_ID;
                row.LUIS_INTENT = rows[i].LUIS_INTENT;
                row.dlg = [];

                let dlg_type = rows[i].DLG_TYPE;
                if (dlg_type == 2) {
                    for (var j = 0; j < rowsText.length; j++) {
                        let textDlgId = rowsText[j].DLG_ID;
                        if (row.DLG_ID == textDlgId) {
                            row.dlg.push(rowsText[j]);
                        }
                    }
                } else if (dlg_type == 3) {
                    for (var j = 0; j < rowsCard.length; j++) {
                        var cardDlgId = rowsCard[j].DLG_ID;
                        if (row.DLG_ID == cardDlgId) {
                            row.dlg.push(rowsCard[j]);
                        }
                    }
                } else if (dlg_type == 4) {
                    for (var j = 0; j < rowsMedia.length; j++) {
                        var mediaDlgId = rowsMedia[j].DLG_ID;
                        if (row.DLG_ID == mediaDlgId) {
                            row.dlg.push(rowsMedia[j]);
                        }
                    }
                }
                result.push(row);
            }

            res.send({ list: result });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        console.log(err);
    })
});

//다이얼로그 추가
router.post('/insertDialog', function (req, res) {
    res.send({ status: 600, message: 'ing...' });

});

router.post('/learnUtterAjax', function (req, res) {
    var luisId = req.body.luisId;
    var luisIntent = req.body.luisIntent;

    var entities = req.body.entities;
    var predictIntent = req.body.predictIntent;

    var dlgId = [];
    dlgId = req.body['dlgId[]'];

    var contextData = [];
    contextData = req.body['contextData[]'];

    if (contextData == undefined) {
        contextData = [];
    }

    var contextDataLength;
    if (typeof contextData === "string") {
        contextDataLength = 1;
    } else {
        contextDataLength = contextData.length
    }

    var queryText = "";
    if (contextDataLength == 0) {
        queryText = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_ID,DLG_API_DEFINE,USE_YN, CONTEXTLABEL) "
            + "VALUES( @luisId, @luisIntent, @entities, @dlgId, 'D', 'Y', 'F' ); \n";
    } else {
        queryText = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_ID,DLG_API_DEFINE,USE_YN, CONTEXTLABEL) "
            + "VALUES( @luisId, @luisIntent, @entities, @dlgId, 'D', 'Y', 'T'); \n";
    }


    var updateQueryText = "";
    var utterArry;
    if (req.body['utters[]']) {
        utterArry = req.body['utters[]'];
        utterArry = utterArry.replace("'", "''");
        for (var i = 0; i < (typeof utterArry === "string" ? 1 : utterArry.length); i++) {
            updateQueryText += "UPDATE TBL_QUERY_ANALYSIS_RESULT SET TRAIN_FLAG = 'Y' WHERE QUERY = '" + (typeof utterArry === "string" ? utterArry.replace(" ", "") : utterArry[i]) + "'; \n";
        }
    }


    var updateTblDlg = "UPDATE TBL_DLG SET GroupS = @entities WHERE DLG_ID = @dlgId; \n";

    var selectAppIdQuery = "SELECT CHATBOT_ID, APP_ID, VERSION, APP_NAME,CULTURE, SUBSC_KEY \n";
    selectAppIdQuery += "FROM TBL_LUIS_APP \n";
    selectAppIdQuery += "WHERE CHATBOT_ID = (SELECT CHATBOT_NUM FROM TBL_CHATBOT_APP WHERE CHATBOT_NAME='" + req.session.appName + "')\n";

    var upQuery = "UPDATE TBL_QUERY_ANALYSIS_RESULT SET LUIS_ID = @luisID, LUIS_INTENT = @intetID, LUIS_INTENT_SCORE = '1', RESULT = 'H' "
        + "WHERE QUERY = @Query";

    var inCacheQuery = "INSERT INTO TBL_QUERY_INTENT(QUERY, LUIS_ID, LUIS_INTENT, DLG_ID)\n"
        + "VALUES(@query,@luisId, @intent, @dlgId)";

    var selCacheQuery = "SELECT QUERY, LUIS_ID, LUIS_INTENT, DLG_ID\n"
        + "FROM TBL_QUERY_INTENT\n"
        + "WHERE QUERY = @query\n"
        + "AND LUIS_ID = @luisId\n"
        + "AND LUIS_INTENT = @intent\n"
        + "AND DLG_ID = @dlgID";

    var checkQuery = "SELECT RELATION_ID FROM TBL_DLG_RELATION_LUIS WHERE LUIS_INTENT = @luisIntent AND DLG_ID = @dlgId AND LUIS_ID = @luisId";

    var contextQuery = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_ID,DLG_API_DEFINE,USE_YN, CONTEXTLABEL, MISSINGENTITIES) "
        + "VALUES( @luisId, @luisIntent, @entities, @dlgId, 'D', 'Y', 'T', @missing_entity ); \n";

    var contextDefineQuery = "INSERT INTO TBL_CONTEXT_DEFINE(INTENT, ENTITIES) "
        + "VALUES( @contextIntent, @contextEntity ); \n";

    var updateTblDlgQuery = "UPDATE TBL_DLG SET GROUPM=@luisIntent WHERE DLG_ID=@dlgId";

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1;
            let result2;
            let checkResult;

            /*
            * 이미 학습되어서 디비에 들어간 내용을 다시 학습시키는 것을 방지함.
            * 
            *   
            for(var jjj = 0 ; jjj < (typeof dlgId ==="string" ? 1:dlgId.length); jjj++){
             checkResult = await pool.request()
                 .input('luisId', sql.NVarChar, luisId)
                 .input('luisIntent', sql.NVarChar, luisIntent)
                 .input('dlgId', sql.NVarChar, (typeof dlgId ==="string" ? dlgId:dlgId[jjj]))
                 .query(checkQuery);
 
                 if(checkResult.recordset.length > 0) {
                     return res.send({result:"learned"});
                 }else{
                     //nothing
                 }
            }
          */


            for (var j = 0; j < (typeof dlgId === "string" ? 1 : dlgId.length); j++) {
                if (j === ((typeof dlgId === "string" ? 1 : dlgId.length) - 1)) {
                    queryText += updateQueryText
                }

                if (entities != "" && entities != null) {
                    result1 = await pool.request()
                        .input('luisId', sql.NVarChar, luisId)
                        .input('luisIntent', sql.NVarChar, luisIntent)
                        .input('entities', sql.NVarChar, entities)
                        .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                        .query(queryText);


                    result2 = await pool.request()
                        .input('entities', sql.NVarChar, entities)
                        .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                        .query(updateTblDlg);
                } else {

                    var selCacheResult = await pool.request()
                        .input('query', sql.NVarChar, req.body['utters[]'].replace(" ", ""))
                        .input('luisId', sql.NVarChar, luisId)
                        .input('intent', sql.NVarChar, luisIntent)
                        .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                        .query(selCacheQuery)

                    if (selCacheResult.recordset.length == 0) {
                        /*
                        * entity 가 없어도 TBL_DLG_RELATION_LUIS 에는 insert
                        * entity 가 없으면 TBL_DLG_RELATION_LUIS table 을 보지 않고 TBL_QUERY_INTENT table 에서 정보를 빼온다.
                        * entity 가 없으니까 tbl_dlg 의 groups 를 update 할 필요는 없다.
                        */
                        var regExpData = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;//특수문자
                        var query_ori_data = req.body['utters[]'];
                        var query_data = query_ori_data.replace(regExpData, "");//특수문자 제거
                        query_data = query_data.replace(/(\s*)/g, "");//공백제거
                        var relationLuisResult = await pool.request()
                            .input('luisId', sql.NVarChar, luisId)
                            .input('luisIntent', sql.NVarChar, luisIntent)
                            .input('entities', sql.NVarChar, entities)
                            .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                            .query(queryText);
                        var inCacheResult = await pool.request()
                            //.input('query', sql.NVarChar, req.body['utters[]'].replace(" ",""))
                            .input('query', sql.NVarChar, query_data)
                            .input('luisId', sql.NVarChar, luisId)
                            .input('intent', sql.NVarChar, luisIntent)
                            .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                            .query(inCacheQuery);
                    }
                }
            }
            //context 데이터에 따라서 db insert
            if (contextDataLength == 0) {

            } else {
                var context_dlgid;
                var context_missingEntity;
                var context_defineEntity = "";
                var temp_context;
                var check_array;
                for (var a = 0; a < contextDataLength; a++) {
                    if (typeof contextData === "string") {
                        temp_context = contextData;
                    } else {
                        temp_context = contextData[a];
                    }

                    check_array = temp_context.split('||');
                    context_dlgid = check_array[0];
                    context_missingEntity = check_array[1];

                    context_defineEntity = context_defineEntity + check_array[1] + ":,";

                    var contextResult = await pool.request()
                        .input('luisId', sql.NVarChar, luisId)
                        .input('luisIntent', sql.NVarChar, luisIntent)
                        .input('entities', sql.NVarChar, entities)
                        .input('dlgId', sql.NVarChar, context_dlgid)
                        .input('missing_entity', sql.NVarChar, context_missingEntity)
                        .query(contextQuery);

                    var updateTblDlgResult = await pool.request()
                        .input('luisIntent', sql.NVarChar, luisIntent)
                        .input('dlgId', context_dlgid)
                        .query(updateTblDlgQuery);

                }
                context_defineEntity = context_defineEntity.slice(0, -1);
                var contextDefineResult = await pool.request()
                    .input('contextIntent', sql.NVarChar, luisIntent)
                    .input('contextEntity', context_defineEntity)
                    .query(contextDefineQuery);


            }

            /*
            * 루이스에 선택된 intent에 utterance 를 넣는다.
            * 그 후에 train 시킨다.
            *  20180330 Jun Hyoung Park
            */
            var insertUtter;
            var appId;
            let selectAppId1;

            let pool1 = await dbConnect.getConnection(sql);

            selectAppId1 = await pool1.request()
                .query(selectAppIdQuery);


            for (var i = 0; i < selectAppId1.recordset.length; i++) {
                appId = selectAppId1.recordset[i].APP_ID;
            }

            var options = {
                headers: {
                    'Ocp-Apim-Subscription-Key': req.session.subsKey
                }
            };

            if (req.body['utters[]']) {
                insertUtter = req.body['utters[]'];
                for (var i = 0; i < (typeof utterArry === "string" ? 1 : utterArry.length); i++) {
                    insertUtter = (typeof utterArry === "string" ? utterArry : utterArry[i]);

                    if (entities == null || entities == "") {

                        var selectQueryResult = await pool.request()
                            .input('Query', sql.NVarChar, insertUtter.replace(" ", ""))
                            .query("SELECT QUERY FROM TBL_QUERY_ANALYSIS_RESULT WHERE QUERY = @Query");

                        if (selectQueryResult.recordset.length > 0) {
                            var upResult = await pool.request()
                                .input('Query', sql.NVarChar, insertUtter.replace(" ", ""))
                                .input('luisID', sql.NVarChar, luisId)
                                .input('intetID', sql.NVarChar, luisIntent)
                                .query(upQuery)
                        } else {
                            var spResult = await pool.request()
                                .input('Query', sql.NVarChar, insertUtter.replace(" ", ""))
                                .input('intentID', sql.NVarChar, luisIntent)
                                .input('entitiesIDS', sql.NVarChar, 'none')
                                .input('intentScore', sql.NVarChar, '1')
                                .input('luisID', sql.NVarChar, luisId)
                                .input('result', sql.NVarChar, 'H')
                                .input('appID', sql.NVarChar, '')
                                .execute('sp_insertusehistory4')
                        }
                    }
                }
                

            } else {

            }
            return res.send({ result: true });
            /********************************************* */
            //console.log(result1);
            //console.log(result2);

            /*
            let rows = result1.rowsAffected;

            if(rows[0] == 1) {
                res.send({result:true});
            } else {
                res.send({result:false});
            }
            */

        } catch (err) {
            // ... error checks
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});


router.post('/deleteRecommend', function (req, res) {
    var seqs = req.body.seq;
    var arryseq = seqs.split(',');
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            for (var i = 0; i < arryseq.length; i++) {
                var deleteQueryString1 = "UPDATE TBL_QUERY_ANALYSIS_RESULT SET TRAIN_FLAG = 'Y' WHERE seq='" + arryseq[i] + "'";
                let result5 = await pool.request().query(deleteQueryString1);
            }
            res.send();
        } catch (err) {

        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        console.log(err);
    })
});

router.post('/selectGroup', function (req, res) {
    var selectId = req.body.selectId;
    var selectValue1 = req.body.selectValue1;
    var selectValue2 = req.body.selectValue2;
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            var queryText = "";
            if (selectId == "searchIntentGroup") {
                queryText = "SELECT DISTINCT ISNULL(DLG_INTENT, 'NONE') AS 'DLG_INTENT' FROM TBL_DLG WHERE DLG_GROUP = 2 ";
            } else if (selectId == "searchLargeGroup") {
                queryText = "SELECT DISTINCT GroupL AS 'GROUP' FROM TBL_DLG WHERE GroupL IS NOT NULL";
            } else if (selectId == "searchMediumGroup") {
                selectValue1 = selectValue1.trim();
                queryText = "SELECT DISTINCT GroupM AS 'GROUP'\n";
                queryText += "FROM TBL_DLG\n";
                queryText += "WHERE GroupM IS NOT NULL\n";
                queryText += "AND GroupL = '" + selectValue1 + "'";
            } else if (selectId == "searchSmallGroup") {
                selectValue1 = selectValue1.trim();
                selectValue2 = selectValue2.trim();
                queryText = "SELECT DISTINCT GroupS AS 'GROUP'\n";
                queryText += "FROM TBL_DLG\n";
                queryText += "WHERE GroupS IS NOT NULL\n";
                queryText += "AND GroupL = '" + selectValue1 + "'\n";
                queryText += "AND GroupM = '" + selectValue2 + "'";
            }

            let result = await pool.request().query(queryText);
            var rows = result.recordset;

            res.send({ rows: rows });
        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        console.log(err);
    })
});

router.post('/searchDialog', function (req, res) {
    var searchLargeGroup = req.body.searchLargeGroup;
    var searchMediumGroup = req.body.searchMediumGroup;
    var searchSmallGroup = req.body.searchSmallGroup;
    var serachDlg = req.body.serachDlg.trim();

    var tblDlgSearch = "SELECT RNUM, GroupS, DLG_ID, DLG_TYPE, DLG_ORDER_NO, GroupL, GroupM \n";
    tblDlgSearch += "FROM (\n";
    tblDlgSearch += "SELECT RANK() OVER(ORDER BY GroupS) AS RNUM, GroupS, DLG_ID, DLG_TYPE, DLG_ORDER_NO, GroupL, GroupM \n";
    tblDlgSearch += "FROM TBL_DLG \n";
    tblDlgSearch += "WHERE 1=1\n";
    if (serachDlg) {

        tblDlgSearch += "AND GroupS like '%" + serachDlg + "%'\n";
    } else {

        if (searchLargeGroup) {
            tblDlgSearch += "AND GroupL = '" + searchLargeGroup + "'\n";
            if (searchMediumGroup) {
                tblDlgSearch += "AND GroupM = '" + searchMediumGroup + "'\n";
                if (searchSmallGroup) {
                    tblDlgSearch += "AND GroupS = '" + searchSmallGroup + "'\n";
                }
            }
        }
    }
    tblDlgSearch += ")A \n ORDER BY DLG_ID"

    var dlgText = "SELECT DLG_ID, CARD_TITLE, CARD_TEXT, USE_YN, '2' AS DLG_TYPE \n"
    dlgText += "FROM TBL_DLG_TEXT\n";
    dlgText += "WHERE USE_YN = 'Y'\n"
    dlgText += "AND DLG_ID IN (\n"
    dlgText += "SELECT DISTINCT DLG_ID\n"
    dlgText += "FROM TBL_DLG\n"
    dlgText += "WHERE 1=1\n";

    if (serachDlg) {

        dlgText += "AND GroupS like '%" + serachDlg + "%'\n";
    } else {
        if (searchLargeGroup) {
            dlgText += "AND GroupL = '" + searchLargeGroup + "'\n";
            if (searchMediumGroup) {
                dlgText += "AND GroupM = '" + searchMediumGroup + "'\n";
                if (searchSmallGroup) {
                    dlgText += "AND GroupS = '" + searchSmallGroup + "'\n";
                }
            }
        }
    }
    dlgText += ") \n ORDER BY DLG_ID";

    var dlgCard = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, IMG_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n";
    dlgCard += "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n";
    dlgCard += "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n";
    dlgCard += "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n";
    dlgCard += "CARD_ORDER_NO, CARD_VALUE,\n";
    dlgCard += "USE_YN, '3' AS DLG_TYPE \n";
    dlgCard += "FROM TBL_DLG_CARD\n";
    dlgCard += "WHERE USE_YN = 'Y'\n";
    dlgCard += "AND DLG_ID IN (\n";
    dlgCard += "SELECT DISTINCT DLG_ID\n";
    dlgCard += "FROM TBL_DLG\n";
    dlgCard += "WHERE 1=1\n";

    if (serachDlg) {

        dlgCard += "AND GroupS like '%" + serachDlg + "%'\n";
    } else {

        if (searchLargeGroup) {
            dlgCard += "AND GroupL = '" + searchLargeGroup + "'\n";
            if (searchMediumGroup) {
                dlgCard += "AND GroupM = '" + searchMediumGroup + "'\n";
                if (searchSmallGroup) {
                    dlgCard += "AND GroupS = '" + searchSmallGroup + "'\n";
                }
            }
        }
    }
    dlgCard += ") \n ORDER BY DLG_ID";

    var dlgMedia = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, MEDIA_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n";
    dlgMedia += "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n";
    dlgMedia += "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n";
    dlgMedia += "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n";
    dlgMedia += "CARD_VALUE,\n";
    dlgMedia += "USE_YN, '4' AS DLG_TYPE \n";
    dlgMedia += "FROM TBL_DLG_MEDIA\n";
    dlgMedia += "WHERE USE_YN = 'Y'\n";
    dlgMedia += "AND DLG_ID IN (\n";
    dlgMedia += "SELECT DISTINCT DLG_ID\n";
    dlgMedia += "FROM TBL_DLG\n";
    dlgMedia += "WHERE 1=1\n";

    if (serachDlg) {

        dlgMedia += "AND GroupS like '%" + serachDlg + "%'\n";
    } else {

        if (searchLargeGroup) {
            dlgMedia += "AND GroupL = '" + searchLargeGroup + "'\n";
            if (searchMediumGroup) {
                dlgMedia += "AND GroupM = '" + searchMediumGroup + "'\n";
                if (searchSmallGroup) {
                    dlgMedia += "AND GroupS ='" + searchSmallGroup + "'\n";
                }
            }
        }
    }
    dlgMedia += ") \n ORDER BY DLG_ID";

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let dlgTextResult = await pool.request()
                .query(dlgText);
            let rowsText = dlgTextResult.recordset;

            let dlgCardResult = await pool.request()
                .query(dlgCard);
            let rowsCard = dlgCardResult.recordset;

            let dlgMediaResult = await pool.request()
                .query(dlgMedia);
            let rowsMedia = dlgMediaResult.recordset;

            let result1 = await pool.request()
                .query(tblDlgSearch)
            let rows = result1.recordset;
            var result = [];
            for (var i = 0; i < rows.length; i++) {

                var row = {};
                row.RNUM = rows[i].RNUM;
                row.GroupS = rows[i].GroupS;
                row.DLG_ID = rows[i].DLG_ID;
                row.DLG_TYPE = rows[i].DLG_TYPE;
                row.DLG_ORDER_NO = rows[i].DLG_ORDER_NO;
                row.GroupL = rows[i].GroupL;
                row.GroupM = rows[i].GroupM;
                row.dlg = [];

                let dlg_type = rows[i].DLG_TYPE;
                if (dlg_type == 2) {
                    for (var j = 0; j < rowsText.length; j++) {
                        let textDlgId = rowsText[j].DLG_ID;
                        if (row.DLG_ID == textDlgId) {
                            row.dlg.push(rowsText[j]);
                        }
                    }
                } else if (dlg_type == 3) {
                    for (var j = 0; j < rowsCard.length; j++) {
                        var cardDlgId = rowsCard[j].DLG_ID;
                        if (row.DLG_ID == cardDlgId) {
                            row.dlg.push(rowsCard[j]);
                        }
                    }
                } else if (dlg_type == 4) {
                    for (var j = 0; j < rowsMedia.length; j++) {
                        var mediaDlgId = rowsMedia[j].DLG_ID;
                        if (row.DLG_ID == mediaDlgId) {
                            row.dlg.push(rowsMedia[j]);
                        }
                    }
                }
                result.push(row);
            }

            res.send({ list: result });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        sql.close();
        console.log(err);
    })
});




router.post('/searchDialogByIntent', function (req, res) {
    var searchIntentGroup = req.body.searchIntentGroup;
    var serachDlg = req.body.serachDlg.trim();
    
    var tblDlgSearch = `
       SELECT RELATION_NUM, GroupS, DLG_ID, DLG_TYPE, DLG_ORDER_NO, GroupL, GroupM
         FROM TBL_DLG
        WHERE 1=1 
          AND DLG_GROUP = 2 
    `;

    if (searchIntentGroup) {
        if (searchIntentGroup != "NONE") {
            tblDlgSearch += "  AND DLG_INTENT = '" + searchIntentGroup + "' \n";
        } else {
            tblDlgSearch += "  AND DLG_INTENT IS NULL \n";
        }
    }
    tblDlgSearch += " ORDER BY RELATION_NUM, DLG_ORDER_NO;";

    var dlgText = "SELECT DLG_ID,TEXT_DLG_ID, CARD_TITLE, CARD_TEXT, USE_YN, '2' AS DLG_TYPE \n"
    dlgText += "   FROM TBL_DLG_TEXT\n";
    dlgText += "  WHERE USE_YN = 'Y'\n"
    dlgText += "    AND DLG_ID IN (\n"
    dlgText += "       SELECT DISTINCT DLG_ID\n"
    dlgText += "         FROM TBL_DLG\n"
    dlgText += "        WHERE 1=1\n";
    
    if (serachDlg) {

        dlgText += "         AND CARD_TEXT like '%" + serachDlg + "%'\n";
    } 
    if (searchIntentGroup) {
        if (searchIntentGroup != "NONE") {
            dlgText += "         AND DLG_INTENT = '" + searchIntentGroup + "'\n";
        } else {
            dlgText += "         AND DLG_INTENT IS NULL\n";
        }
    }

    dlgText += ") \n ORDER BY DLG_ID";

    var dlgCard = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, IMG_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n";
    dlgCard += "          BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n";
    dlgCard += "          BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n";
    dlgCard += "          BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n";
    dlgCard += "          CARD_ORDER_NO, CARD_VALUE,\n";
    dlgCard += "          USE_YN, '3' AS DLG_TYPE \n";
    dlgCard += "   FROM TBL_DLG_CARD\n";
    dlgCard += "  WHERE USE_YN = 'Y'\n";
    dlgCard += "    AND DLG_ID IN (\n";
    dlgCard += "              SELECT DISTINCT DLG_ID\n";
    dlgCard += "                FROM TBL_DLG\n";
    dlgCard += "               WHERE 1=1\n";

    if (serachDlg) {

        dlgCard += "                 AND CARD_TEXT like '%" + serachDlg + "%'\n";
    } 
    if (searchIntentGroup) {
        if (searchIntentGroup != "NONE") {
            dlgCard += "                 AND DLG_INTENT = '" + searchIntentGroup + "'\n";
        } else {
            dlgCard += "                 AND DLG_INTENT IS NULL\n";
        }
    }
    dlgCard += ") \n ORDER BY DLG_ID";

    var dlgMedia = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, MEDIA_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n";
    dlgMedia += "         BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n";
    dlgMedia += "         BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n";
    dlgMedia += "         BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n";
    dlgMedia += "         CARD_VALUE,\n";
    dlgMedia += "         USE_YN, '4' AS DLG_TYPE \n";
    dlgMedia += "   FROM TBL_DLG_MEDIA\n";
    dlgMedia += "  WHERE USE_YN = 'Y'\n";
    dlgMedia += "    AND DLG_ID IN (\n";
    dlgMedia += "              SELECT DISTINCT DLG_ID\n";
    dlgMedia += "                FROM TBL_DLG\n";
    dlgMedia += "               WHERE 1=1\n";

    if (serachDlg) {

        dlgMedia += "                 AND CARD_TEXT like '%" + serachDlg + "%'\n";
    } 
    if (searchIntentGroup) {
        if (searchIntentGroup != "NONE") {
            dlgMedia += "                 AND DLG_INTENT = '" + searchIntentGroup + "'\n";
        } else {
            dlgMedia += "                 AND DLG_INTENT IS NULL\n";
        }
    }
    dlgMedia += ") \n ORDER BY DLG_ID";

    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let dlgTextResult = await pool.request()
                .query(dlgText);
            let rowsText = dlgTextResult.recordset;

            let dlgCardResult = await pool.request()
                .query(dlgCard);
            let rowsCard = dlgCardResult.recordset;

            let dlgMediaResult = await pool.request()
                .query(dlgMedia);
            let rowsMedia = dlgMediaResult.recordset;

            let result1 = await pool.request()
                .query(tblDlgSearch)
            let rows = result1.recordset;
            var result = [];
            for (var i = 0; i < rows.length; i++) {

                var row = {};
                row.RNUM = rows[i].RELATION_NUM ;
                row.DLG_ID = rows[i].DLG_ID;
                row.DLG_TEXT_ID = rows[i].DLG_ID;
                row.DLG_TYPE = rows[i].DLG_TYPE;
                row.DLG_ORDER_NO = rows[i].DLG_ORDER_NO;
                //row.GroupL = rows[i].GroupL;
                //row.GroupM = rows[i].GroupM;
                //row.GroupS = rows[i].GroupS;
                row.dlg = [];

                var isExist = false;
                let dlg_type = rows[i].DLG_TYPE;
                if (dlg_type == 2) {
                    for (var j = 0; j < rowsText.length; j++) {
                        let textDlgId = rowsText[j].DLG_ID;
                        if (row.DLG_ID == textDlgId) {
                            row.dlg.push(rowsText[j]);
                            isExist = true;
                            break;
                        }
                    }
                } else if (dlg_type == 3) {
                    for (var j = 0; j < rowsCard.length; j++) {
                        var cardDlgId = rowsCard[j].DLG_ID;
                        if (row.DLG_ID == cardDlgId) {
                            row.dlg.push(rowsCard[j]);
                            isExist = true;
                            break;
                        }
                    }
                } else if (dlg_type == 4) {
                    for (var j = 0; j < rowsMedia.length; j++) {
                        var mediaDlgId = rowsMedia[j].DLG_ID;
                        if (row.DLG_ID == mediaDlgId) {
                            row.dlg.push(rowsMedia[j]);
                            isExist = true;
                            break;
                        }
                    }
                }
                if (isExist) {
                    var isDupleDlg = false;
                    for (var k=0; k<result.length; k++) {
                         if (result[k].DLG_ID == row.DLG_ID) {
                            isDupleDlg = true;
                            break;
                        }
                    }
                    if (!isDupleDlg) {
                        result.push(row);
                    }
                }
            }

            res.send({ list: result });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        sql.close();
        console.log(err);
    })
});



router.post('/addDialog', function (req, res) {

    //var data = req.body['data[]'];
    var data = req.body.data;
    //var luisEntities = req.body['entities[]'];
    var array = [];
    var queryText = "";
    var tblDlgId = [];
    if (typeof data == "string") {
        console.log("data is string");
        var json = JSON.parse(data);

        for (var key in json) {
            console.log("key : " + key + " value : " + json[key]);
        }

    } else {
        console.log("data is object==adddialog");

        //array = JSON.parse(data);

        var dataIdx = data.length;

        for (var i = 0; i < dataIdx; i++) {
            array[i] = JSON.parse(data[i]);
        }

        for (var i = 0; i < array.length; i++) {
            for (var key in array[i]) {
                console.log("key : " + key + " value : " + array[i][key]);
            }
        }
    }

    var selectAppIdQuery = "SELECT CHATBOT_ID, APP_ID, VERSION, APP_NAME,CULTURE, SUBSC_KEY \n";
    selectAppIdQuery += "FROM TBL_LUIS_APP \n";
    selectAppIdQuery += "WHERE CHATBOT_ID = (SELECT CHATBOT_NUM FROM TBL_CHATBOT_APP WHERE CHATBOT_NAME='" + req.session.appName + "')\n";

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            /*
            //dyyoo 2018-12-05작업 시작
            */
            var selectDlgId = `
            SELECT CASE 
                        WHEN (SELECT COUNT(DLG_ID) FROM TBL_DLG WHERE DLG_ID IN ( SELECT ISNULL(MAX(DLG_ID)+1,1) AS DLG_ID FROM TBL_DLG WHERE DLG_GROUP = 2 ) ) > 0 
                        THEN (SELECT ISNULL(MAX(DLG_ID)+1,1) AS DLG_ID FROM TBL_DLG) 
                        ELSE ( SELECT ISNULL(MAX(DLG_ID)+1,1) AS DLG_ID FROM TBL_DLG WHERE DLG_GROUP = 2 ) 
                   END AS DLG_ID;
            `;
            
            
            //'SELECT ISNULL(MAX(RELATION_NUM)+1,1) AS RELATION_NUM FROM TBL_DLG;';
            /*
            //dyyoo 2018-12-05작업 끝
            */

            //var selectDlgId = 'SELECT ISNULL(MAX(DLG_ID)+1,1) AS DLG_ID FROM TBL_DLG';
            var insertTblDlg = `
            INSERT INTO TBL_DLG(DLG_ID, DLG_DESCRIPTION, DLG_LANG, DLG_GROUP, DLG_TYPE, DLG_ORDER_NO, USE_YN ) 
            VALUES (@dlgId, @dialogText, 'KO', @dlgGroup, @dlgType, @dialogOrderNo, 'Y');
            `;
            
            //'INSERT INTO TBL_DLG(DLG_ID,DLG_NAME,DLG_DESCRIPTION,DLG_LANG,DLG_TYPE,DLG_ORDER_NO,USE_YN, GroupL, GroupM, DLG_GROUP) VALUES ' +
            //    '(@dlgId,@dialogText,@dialogText,\'KO\',@dlgType,@dialogOrderNo,\'Y\', @largeGroup, @predictIntent, @dlgGroup)';
            var inserTblDlgText = 'INSERT INTO TBL_DLG_TEXT(DLG_ID,CARD_TITLE,CARD_TEXT,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,\'Y\')';
                
            var insertTblCarousel_M = 'INSERT INTO TBL_DLG_CARD(DLG_ID,CARD_TITLE,CARD_TEXT,IMG_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_1_CONTEXT_M,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_ORDER_NO,USE_YN,CARD_VALUE) VALUES ' +
            '(@dlgId,@dialogTitle,@dialogText,@imgUrl,@btn1Type,@buttonName1,@buttonContent1,@buttonContent1_M,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardOrderNo,\'Y\',@cardValue)';
        
            var insertTblCarousel = 'INSERT INTO TBL_DLG_CARD(DLG_ID,CARD_TITLE,CARD_TEXT,IMG_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_ORDER_NO,USE_YN,CARD_VALUE) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,@imgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardOrderNo,\'Y\',@cardValue)';
            var insertTblDlgMedia = 'INSERT INTO TBL_DLG_MEDIA(DLG_ID,CARD_TITLE,CARD_TEXT,MEDIA_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_DIVISION,CARD_VALUE,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,@mediaImgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardDivision,@cardValue,\'Y\')';

            var largeGroup = array[array.length - 1]["largeGroup"];
            var dlgGroup = array[array.length - 1]["dlgGroup"];
            var description = array[array.length - 1]["description"];
            var predictIntent = array[array.length - 1]["predictIntent"];
            var dialogOrderNo = array[array.length - 1]["dlgOrderNo"];


            let result1 = await pool.request()
                .query(selectDlgId)
            let dlgId = result1.recordset;
            for (var i = 0; i < (array.length - 1); i++) {
                var insertDlgOrderNo = 0;

                
                var inputDlgId = dlgId[0].DLG_ID+i;

                if(dialogOrderNo==1000){
                    insertDlgOrderNo = i+1;
                }else{
                    insertDlgOrderNo = dialogOrderNo;
                }
                let result2 = await pool.request()
                    .input('dlgId', sql.Int, inputDlgId)
                    .input('dialogText', sql.NVarChar, (description.trim() == '' ? null : description.trim()))
                    .input('dlgType', sql.NVarChar, array[i]["dlgType"])
                    //.input('dialogOrderNo', sql.Int, (i + 1))
                    .input('dialogOrderNo', sql.Int, insertDlgOrderNo)
                    .input('dlgGroup', sql.NVarChar, dlgGroup)
                    .query(insertTblDlg);
                //.input('luisEntities', sql.NVarChar, (typeof luisEntities ==="string" ? luisEntities:luisEntities[j]))
                
                //res.send({ list: tblDlgId });
                //return false;
                if (array[i]["dlgType"] == "2") {

                    /*
                    let result3 = await pool.request()
                    .query(selectTextDlgId)
                    let textDlgId = result3.recordset;
                    */

                    let result4 = await pool.request()
                        .input('dlgId', sql.Int, inputDlgId)
                        //.input('dialogTitle', sql.NVarChar, (array[i]["dialogTitle"].trim() == '' ? null: array[i]["dialogTitle"].trim()) )
                        .input('dialogTitle', sql.NVarChar, (array[i]["dialogTitle"].trim() == '' ? '' : array[i]["dialogTitle"].trim()))
                        .input('dialogText', sql.NVarChar, (array[i]["dialogText"].trim() == '' ? null : array[i]["dialogText"].trim()))
                        .query(inserTblDlgText);

                } else if (array[i]["dlgType"] == "3") {

                    for (var j = 0; j < array[i].carouselArr.length; j++) {
                        var carTmp = array[i].carouselArr[j];

                        // 공백은 Null 처리
                        for (var key in carTmp) {
                            //console.log("캐러절 key : " + key + " value : " + carTmp[key]);
                            carTmp[key] = carTmp[key].trim();

                            if (carTmp[key].trim() == '') {
                                carTmp[key] = null;
                            }
                        }

                        let result2 = await pool.request()
                            .input('typeDlgId', sql.NVarChar, inputDlgId)
                            .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                            .input('dialogTitle', sql.NVarChar, carTmp["dialogTitle"])
                            .input('dialogText', sql.NVarChar, carTmp["dialogText"])
                            .input('imgUrl', sql.NVarChar, carTmp["imgUrl"])
                            .input('cardValue', sql.NVarChar, carTmp["cardValue"])
                            .input('btn1Type', sql.NVarChar, carTmp["btn1Type"])
                            .input('buttonName1', sql.NVarChar, carTmp["cButtonName1"])
                            .input('buttonContent1', sql.NVarChar, carTmp["cButtonContent1"])
                            .input('buttonContent1_M', sql.NVarChar, carTmp["cButtonContentM"])
                            .input('btn2Type', sql.NVarChar, carTmp["btn2Type"])
                            .input('buttonName2', sql.NVarChar, carTmp["cButtonName2"])
                            .input('buttonContent2', sql.NVarChar, carTmp["cButtonContent2"])
                            .input('btn3Type', sql.NVarChar, carTmp["btn3Type"])
                            .input('buttonName3', sql.NVarChar, carTmp["cButtonName3"])
                            .input('buttonContent3', sql.NVarChar, carTmp["cButtonContent3"])
                            .input('btn4Type', sql.NVarChar, carTmp["btn4Type"])
                            .input('buttonName4', sql.NVarChar, carTmp["cButtonName4"])
                            .input('buttonContent4', sql.NVarChar, carTmp["cButtonContent4"])
                            .input('cardOrderNo', sql.Int, (j + 1))
                            .query(insertTblCarousel_M);
                    }

                    tblDlgId.push(dlgId[0].DLG_ID);

                } else if (array[i]["dlgType"] == "4") {
                    // 공백은 Null 처리
                    for (var key in array[i]) {
                        //console.log("카드 key : " + key + " value : " + array[i]);
                        array[i][key] = array[i][key].trim();

                        if (array[i][key].trim() == '') {
                            array[i][key] = null;
                        }
                    }

                    //동영상 일때 cardDivision 컬럼에 play 가 있어야 한다.
                    //이것은 임시방편으로서 나중에는 수정을 해야 한다.
                    //수정하는 부분에도 있다....함께 고쳐야 한다.
                    var cardDivision = "";
                    if (array[i]["mediaUrl"] == "" || array[i]["mediaUrl"] == null) {

                    } else {
                        cardDivision = "play";
                    }

                    let result4 = await pool.request()
                        .input('dlgId', sql.Int, inputDlgId)
                        .input('dialogTitle', sql.NVarChar, array[i]["dialogTitle"])
                        .input('dialogText', sql.NVarChar, array[i]["dialogText"])
                        .input('mediaImgUrl', sql.NVarChar, array[i]["mediaImgUrl"])
                        .input('btn1Type', sql.NVarChar, array[i]["btn1Type"])
                        .input('buttonName1', sql.NVarChar, array[i]["mButtonName1"])
                        .input('buttonContent1', sql.NVarChar, array[i]["mButtonContent1"])
                        .input('btn2Type', sql.NVarChar, array[i]["btn2Type"])
                        .input('buttonName2', sql.NVarChar, array[i]["mButtonName2"])
                        .input('buttonContent2', sql.NVarChar, array[i]["mButtonContent2"])
                        .input('btn3Type', sql.NVarChar, array[i]["btn3Type"])
                        .input('buttonName3', sql.NVarChar, array[i]["mButtonName3"])
                        .input('buttonContent3', sql.NVarChar, array[i]["mButtonContent3"])
                        .input('btn4Type', sql.NVarChar, array[i]["btn4Type"])
                        .input('buttonName4', sql.NVarChar, array[i]["mButtonName4"])
                        .input('buttonContent4', sql.NVarChar, array[i]["mButtonContent4"])
                        .input('cardDivision', sql.NVarChar, cardDivision)
                        .input('cardValue', sql.NVarChar, array[i]["mediaUrl"])
                        .query(insertTblDlgMedia)

                    tblDlgId.push(dlgId[0].DLG_ID);
                }

                tblDlgId.push(dlgId[0].DLG_ID);
            }

            res.send({ list: tblDlgId });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        sql.close();
        console.log(err);
    })

});




router.post('/getDlgAjax', function (req, res) {

    var entity = [];
    var dlgID = req.body.dlgID;
    var missingEntitiesData = req.body.missingEntitiesData;

    if (missingEntitiesData == "" || missingEntitiesData == null) {
        missingEntitiesData = "No Missing Entity";
    }

    var selectDlgType = " SELECT DLG_TYPE \n" +
        " , DLG_DESCRIPTION , GROUPL , GROUPM, GROUPS, '' as MissingEntities, RELATION_NUM \n" +
        " FROM TBL_DLG \n" +
        " WHERE DLG_ID=" + dlgID + " \n";


    var dlgText = "SELECT DLG_ID, CARD_TITLE, CARD_TEXT, USE_YN, '2' AS DLG_TYPE \n"
        + "FROM TBL_DLG_TEXT\n"
        + "WHERE 1=1 \n"
        + "AND USE_YN = 'Y'\n"
        + "AND DLG_ID = " + dlgID + " \n";
    + "ORDER BY DLG_ID";

    var dlgCard = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, IMG_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n"
        + "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n"
        + "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n"
        + "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n"
        + "CARD_ORDER_NO, CARD_VALUE,\n"
        + "USE_YN, '3' AS DLG_TYPE \n"
        + "FROM TBL_DLG_CARD\n"
        + "WHERE 1=1\n"
        + "AND USE_YN = 'Y'\n"
        + "AND DLG_ID = " + dlgID + " \n";
    + "ORDER BY DLG_ID";

    var dlgMedia = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, MEDIA_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n"
        + "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n"
        + "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n"
        + "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n"
        + "CARD_VALUE,\n"
        + "USE_YN, '4' AS DLG_TYPE \n"
        + "FROM TBL_DLG_MEDIA\n"
        + "WHERE 1=1\n"
        + "AND USE_YN = 'Y'\n"
        + "AND DLG_ID = " + dlgID + " \n";
    + "ORDER BY DLG_ID";

    var contextQry = "SELECT DLG_ID, CONTEXTLABEL, MISSINGENTITIES FROM TBL_DLG_RELATION_LUIS WHERE CONTEXTLABEL='T' \n"
        + "AND DLG_ID = " + dlgID + " \n";


    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let dlgTextResult = await pool.request()
                .query(dlgText);
            let rowsText = dlgTextResult.recordset;

            let dlgCardResult = await pool.request()
                .query(dlgCard);
            let rowsCard = dlgCardResult.recordset;

            let dlgMediaResult = await pool.request()
                .query(dlgMedia);
            let rowsMedia = dlgMediaResult.recordset;

            let contextResult = await pool.request()
                .query(contextQry);
            let rowsContext = contextResult.recordset;

            let result1 = await pool.request()
                .query(selectDlgType)
            let rows = result1.recordset;
            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var row = {};
                row.DLG_TYPE = rows[i].DLG_TYPE;
                row.DLG_DESCRIPTION = rows[i].DLG_DESCRIPTION;
                row.GROUPL = rows[i].GROUPL;
                row.GROUPM = rows[i].GROUPM;
                row.GROUPS = rows[i].GROUPS;
                row.DLG_ID = dlgID;
                //row.MissingEntities = missingEntitiesData;
                row.MissingEntities = [];
                row.dlg = [];

                let dlg_type = rows[i].DLG_TYPE;
                if (dlg_type == 2) {
                    for (var j = 0; j < rowsText.length; j++) {
                        let textDlgId = rowsText[j].DLG_ID;
                        if (row.DLG_ID == textDlgId) {
                            row.dlg.push(rowsText[j]);
                        }
                    }
                } else if (dlg_type == 3) {
                    for (var j = 0; j < rowsCard.length; j++) {
                        var cardDlgId = rowsCard[j].DLG_ID;
                        if (row.DLG_ID == cardDlgId) {
                            row.dlg.push(rowsCard[j]);
                        }
                    }
                } else if (dlg_type == 4) {
                    for (var j = 0; j < rowsMedia.length; j++) {
                        var mediaDlgId = rowsMedia[j].DLG_ID;
                        if (row.DLG_ID == mediaDlgId) {
                            row.dlg.push(rowsMedia[j]);
                        }
                    }
                }

                for (var j = 0; j < rowsContext.length; j++) {
                    row.MissingEntities.push(rowsContext[j]);
                }

                result.push(row);
            }

            res.send({ list: result });

        } catch (err) {

            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        console.log(err);
    })
});


router.post('/deleteDialog', function (req, res) {
    var dlgId = req.body.dlgId;
    var contextYN = req.body.contextYN;
    var luisIntent = req.body.luisIntent;

    var selDlgQuery = "SELECT DLG_ID, DLG_TYPE, GROUPS FROM TBL_DLG WHERE DLG_ID = @dlgId";

    var delDlgQuery = "DELETE FROM TBL_DLG WHERE DLG_ID = @dlgId";
    var delDlgTextQuery = "DELETE FROM TBL_DLG_TEXT WHERE DLG_ID = @dlgId";
    var delDlgCardQuery = "DELETE FROM TBL_DLG_CARD WHERE DLG_ID = @dlgId";
    var delDlgMediaQuery = "DELETE FROM TBL_DLG_MEDIA WHERE DLG_ID = @dlgId";

    var delRelationQuery = "";
    var delContextDefineQuery = "";
    if (contextYN == "Y") {
        delRelationQuery = "DELETE FROM TBL_DLG_RELATION_LUIS WHERE LUIS_INTENT = @luisIntent AND CONTEXTLABEL = 'T'";
        delContextDefineQuery = "DELETE FROM TBL_CONTEXT_DEFINE WHERE LUIS_INTENT = @luisIntent";
    } else {
        delRelationQuery = "DELETE FROM TBL_DLG_RELATION_LUIS WHERE DLG_ID = @dlgId";
    }

    var selDlgGroupSQuery = "SELECT DLG_ID FROM TBL_DLG WHERE GROUPS = @groupS ORDER BY DLG_ORDER_NO";

    var updDlgOrderQuery = "UPDATE TBL_DLG SET DLG_ORDER_NO = @order WHERE DLG_ID = @dlgId";

    var order = [];

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let selDlg = await pool.request()
                .input('dlgId', sql.Int, dlgId)
                .query(selDlgQuery);

            let selDlgGroupS = await pool.request()
                .input('groupS', sql.NVarChar, selDlg.recordset[0].GROUPS)
                .query(selDlgGroupSQuery);

            for (var i = 0; i < selDlgGroupS.recordset.length; i++) {
                order.push(selDlgGroupS.recordset[i].DLG_ID);
            }

            if (selDlg.recordset[0].DLG_TYPE == 2) {
                let delDlgText = await pool.request()
                    .input('dlgId', sql.Int, dlgId)
                    .query(delDlgTextQuery);
            } else if (selDlg.recordset[0].DLG_TYPE == 3) {
                let delDlgCard = await pool.request()
                    .input('dlgId', sql.Int, dlgId)
                    .query(delDlgCardQuery);
            } else if (selDlg.recordset[0].DLG_TYPE == 4) {
                let delDlgMedia = await pool.request()
                    .input('dlgId', sql.Int, dlgId)
                    .query(delDlgMediaQuery);
            }

            let delDlg = await pool.request()
                .input('dlgId', sql.Int, dlgId)
                .query(delDlgQuery);

            if (contextYN == 'Y') {
                let delRelation = await pool.request()
                    .input('luisIntent', sql.NVarChar, luisIntent)
                    .query(delRelationQuery);
                let delContextDefine = await pool.request()
                    .input('luisIntent', sql.NVarChar, luisIntent)
                    .query(delContextDefineQuery);
            } else {
                let delRelation = await pool.request()
                    .input('dlgId', sql.Int, dlgId)
                    .query(delRelationQuery);
            }


            for (var i = 0; i < order.length; i++) {
                if (order[i] == dlgId) {
                    order.splice(i, 1);
                    break;
                }
            }

            var orderCount = 1;
/* order number
            for (var i = 0; i < order.length; i++) {
                let updDlgOrder = await pool.request()
                    .input('dlgId', sql.Int, order[i])
                    .input('order', sql.Int, orderCount++)
                    .query(updDlgOrderQuery);
            }
*/
            res.send({ "res": true });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {

    })

});

router.post('/deleteContextDialog', function (req, res) {
    var dlgId = req.body.dlgId;
    var intent = req.body.luisIntent;

    var selDlgQuery = "SELECT DLG_ID, DLG_TYPE, GROUPS FROM TBL_DLG WHERE DLG_ID = @dlgId";
    var selContextDlgQuery = "SELECT DLG_ID, LUIS_ENTITIES FROM TBL_DLG_RELATION_LUIS WHERE LUIS_INTENT = @luisIntent AND ContextLabel='T'";

    var delDlgQuery = "DELETE FROM TBL_DLG WHERE DLG_ID = @dlgId";
    var delDlgTextQuery = "DELETE FROM TBL_DLG_TEXT WHERE DLG_ID = @dlgId";
    var delDlgCardQuery = "DELETE FROM TBL_DLG_CARD WHERE DLG_ID = @dlgId";
    var delDlgMediaQuery = "DELETE FROM TBL_DLG_MEDIA WHERE DLG_ID = @dlgId";

    //var delRelationQuery = "DELETE FROM TBL_DLG_RELATION_LUIS WHERE DLG_ID = @dlgId";
    var delRelationQuery = "DELETE FROM TBL_DLG_RELATION_LUIS WHERE LUIS_INTENT = @luisIntent AND CONTEXTLABEL = 'T'";

    var selDlgGroupSQuery = "SELECT DLG_ID FROM TBL_DLG WHERE GROUPS = @groupS ORDER BY DLG_ORDER_NO";

    var updDlgOrderQuery = "UPDATE TBL_DLG SET DLG_ORDER_NO = @order WHERE DLG_ID = @dlgId";

    var order = [];

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let selDlg = await pool.request()
                .input('dlgId', sql.Int, dlgId)
                .query(selDlgQuery);

            let selContext = await pool.request()
                .input('luisIntent', sql.NVarChar, intent)
                .query(selContextDlgQuery);

            let selDlgGroupS = await pool.request()
                .input('groupS', sql.NVarChar, selDlg.recordset[0].GROUPS)
                .query(selDlgGroupSQuery);

            for (var i = 0; i < selDlgGroupS.recordset.length; i++) {
                order.push(selDlgGroupS.recordset[i].DLG_ID);
            }

            for (var i = 0; i < selContext.recordset.length; i++) {
                console.log("del dlg===" + selContext.recordset[i].DLG_ID);

                let selDlg = await pool.request()
                    .input('dlgId', sql.Int, selContext.recordset[i].DLG_ID)
                    .query(selDlgQuery);

                if (selDlg.recordset[0].DLG_TYPE == 2) {
                    let delDlgText = await pool.request()
                        .input('dlgId', sql.Int, selContext.recordset[i].DLG_ID)
                        .query(delDlgTextQuery);
                } else if (selDlg.recordset[0].DLG_TYPE == 3) {
                    let delDlgCard = await pool.request()
                        .input('dlgId', sql.Int, selContext.recordset[i].DLG_ID)
                        .query(delDlgCardQuery);
                } else if (selDlg.recordset[0].DLG_TYPE == 4) {
                    let delDlgMedia = await pool.request()
                        .input('dlgId', sql.Int, selContext.recordset[i].DLG_ID)
                        .query(delDlgMediaQuery);
                }


                let delDlg = await pool.request()
                    .input('dlgId', sql.Int, selContext.recordset[i].DLG_ID)
                    .query(delDlgQuery);
            }

            let delRelation = await pool.request()
                .input('luisIntent', sql.NVarChar, intent)
                .query(delRelationQuery);

            for (var i = 0; i < order.length; i++) {
                if (order[i] == dlgId) {
                    order.splice(i, 1);
                    break;
                }
            }

            var orderCount = 1;

            for (var i = 0; i < order.length; i++) {
                let updDlgOrder = await pool.request()
                    .input('dlgId', sql.Int, order[i])
                    .input('order', sql.Int, orderCount++)
                    .query(updDlgOrderQuery);
            }



            res.send({ "res": true });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {

    })

});

router.post('/updateDialog', function (req, res) {
    var dlgIdReq = req.body.dlgId;
    var dlgType = req.body.dlgType;
    var entity = req.body.entity;

    var data = req.body['data[]'];
    var array = [];
    var queryText = "";
    var tblDlgId = [];
    var order = [];
    if (typeof data == "string") {
        console.log("data is string");
        var json = JSON.parse(data);

        for (var key in json) {
            console.log("key : " + key + " value : " + json[key]);
        }

    } else {
        console.log("data is object");

        //array = JSON.parse(data);

        var dataIdx = data.length;

        for (var i = 0; i < dataIdx; i++) {
            array[i] = JSON.parse(data[i]);
        }

        for (var i = 0; i < array.length; i++) {
            for (var key in array[i]) {
                console.log("key : " + key + " value : " + array[i][key]);
            }
        }
    }

    var delDlgTextQuery = "DELETE FROM TBL_DLG_TEXT WHERE DLG_ID = @dlgId";
    var delDlgCardQuery = "DELETE FROM TBL_DLG_CARD WHERE DLG_ID = @dlgId";
    var delDlgMediaQuery = "DELETE FROM TBL_DLG_MEDIA WHERE DLG_ID = @dlgId";
    var delDlgQuery = "DELETE FROM TBL_DLG WHERE DLG_ID = @dlgId"

    var selDlgQuery = "SELECT DLG_ID, DLG_LANG, DLG_GROUP, DLG_TYPE, DLG_ORDER_NO, GROUPS\n";
    selDlgQuery += "FROM TBL_DLG\n";
    selDlgQuery += "WHERE DLG_ID = @dlgId";

    var selDlgGroupSQuery = "SELECT DLG_ID, DLG_LANG, DLG_GROUP, DLG_TYPE, DLG_ORDER_NO, GROUPS\n";
    selDlgGroupSQuery += "FROM TBL_DLG\n";
    selDlgGroupSQuery += "WHERE GROUPS = @groupS \n"
    selDlgGroupSQuery += "ORDER BY DLG_ORDER_NO";

    var updDlgOrderQuery = "UPDATE TBL_DLG SET DLG_ORDER_NO = @order WHERE DLG_ID = @dlgId";

    //var updDlgRelationQuery = "UPDATE TBL_DLG_RELATION_LUIS SET LUIS_ID = @luisId, LUIS_INTENT = @luisIntent WHERE DLG_ID = @dlgId";
    (async () => {
        try {

            var selectDlgId = 'SELECT ISNULL(MAX(DLG_ID)+1,1) AS DLG_ID FROM TBL_DLG';
            //var selectTextDlgId = 'SELECT ISNULL(MAX(TEXT_DLG_ID)+1,1) AS TYPE_DLG_ID FROM TBL_DLG_TEXT';
            //var selectCarouselDlgId = 'SELECT ISNULL(MAX(CARD_DLG_ID)+1,1) AS TYPE_DLG_ID FROM TBL_DLG_CARD';
            //var selectMediaDlgId = 'SELECT ISNULL(MAX(MEDIA_DLG_ID)+1,1) AS TYPE_DLG_ID FROM TBL_DLG_MEDIA';
            var insertTblDlg = 'INSERT INTO TBL_DLG(DLG_ID,DLG_NAME,DLG_DESCRIPTION,DLG_LANG,DLG_TYPE,DLG_ORDER_NO,USE_YN,GROUPL,GROUPM,GROUPS,DLG_GROUP) VALUES ' +
                '(@dlgId,@dialogText,@dialogText,\'KO\',@dlgType,@dialogOrderNo,\'Y\',@groupl,@groupm,@groups,2)';
            var inserTblDlgText = 'INSERT INTO TBL_DLG_TEXT(DLG_ID,CARD_TITLE,CARD_TEXT,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,\'Y\')';
            var insertTblCarousel = 'INSERT INTO TBL_DLG_CARD(DLG_ID,CARD_TITLE,CARD_TEXT,IMG_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_ORDER_NO,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,@imgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardOrderNo,\'Y\')';
            //var insertTblDlgMedia = 'INSERT INTO TBL_DLG_MEDIA(DLG_ID,CARD_TITLE,CARD_TEXT,MEDIA_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_VALUE,USE_YN) VALUES ' +
            //'(@dlgId,@dialogTitle,@dialogText,@imgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardValue,\'Y\')';
            var insertTblDlgMedia = 'INSERT INTO TBL_DLG_MEDIA(DLG_ID,CARD_TITLE,CARD_TEXT,MEDIA_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_DIVISION,CARD_VALUE,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,@imgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardDivision,@cardValue,\'Y\')';
            var insertTblRelation = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_ID,DLG_API_DEFINE,USE_YN) "
                + "VALUES( @luisId, @luisIntent, @entity, @dlgId, 'D', 'Y' ) ";

            var luisId = array[array.length - 1]["largeGroup"];
            var luisIntent = array[array.length - 1]["middleGroup"];
            var sourceType = array[array.length - 1]["sourceType"];
            var description = array[array.length - 1]["description"];

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let selDlgRes = await pool.request()
                .input('dlgId', sql.Int, dlgIdReq)
                .query(selDlgQuery);

            let selDlg = selDlgRes.recordset;

            let selDlgGroupS = await pool.request()
                .input('groupS', sql.NVarChar, selDlg[0].GROUPS)
                .query(selDlgGroupSQuery);

            for (var gNum = 0; gNum < selDlgGroupS.recordset.length; gNum++) {
                order.push(selDlgGroupS.recordset[gNum].DLG_ID);
            }

            //selDlg[0].DLG_ID
            //tbl_dlg 삭제
            let delDlg = await pool.request()
                .input('dlgId', sql.Int, dlgIdReq)
                .query(delDlgQuery);

            //tbl_dlg text, card, media 삭제
            if (selDlg[0].DLG_TYPE == 2) {
                let delDlgText = await pool.request()
                    .input('dlgId', sql.Int, dlgIdReq)
                    .query(delDlgTextQuery);
            } else if (selDlg[0].DLG_TYPE == 3) {
                let delDlgCard = await pool.request()
                    .input('dlgId', sql.Int, dlgIdReq)
                    .query(delDlgCardQuery);
            } else if (selDlg[0].DLG_TYPE == 4) {
                let delDlgMedia = await pool.request()
                    .input('dlgId', sql.Int, dlgIdReq)
                    .query(delDlgMediaQuery);
            }

            for (var i = 0; i < (array.length - 1); i++) {

                let result1 = await pool.request()
                    .query(selectDlgId)
                let dlgId = result1.recordset;

                let result2 = await pool.request()
                    .input('dlgId', sql.Int, i == 0 ? dlgIdReq : dlgId[0].DLG_ID)
                    .input('dialogText', sql.NVarChar, description)
                    .input('dlgType', sql.NVarChar, array[i]["dlgType"])
                    .input('dialogOrderNo', sql.Int, (i + 1))
                    .input('groupl', sql.NVarChar, luisId)
                    .input('groupm', sql.NVarChar, luisIntent)
                    .input('groups', sql.NVarChar, entity)
                    .query(insertTblDlg)

                if (array[i]["dlgType"] == "2") {

                    let result4 = await pool.request()
                        .input('dlgId', sql.Int, i == 0 ? dlgIdReq : dlgId[0].DLG_ID)
                        .input('dialogTitle', sql.NVarChar, array[i]["dialogTitle"])
                        .input('dialogText', sql.NVarChar, array[i]["dialogText"])
                        .query(inserTblDlgText);

                } else if (array[i]["dlgType"] == "3") {

                    for (var j = 0; j < array[i].carouselArr.length; j++) {
                        var carTmp = array[i].carouselArr[j];

                        carTmp["btn1Type"] = (carTmp["cButtonContent1"] != "") ? carTmp["btn1Type"] : "";
                        carTmp["btn2Type"] = (carTmp["cButtonContent2"] != "") ? carTmp["btn2Type"] : "";
                        carTmp["btn3Type"] = (carTmp["cButtonContent3"] != "") ? carTmp["btn3Type"] : "";
                        carTmp["btn4Type"] = (carTmp["cButtonContent4"] != "") ? carTmp["btn4Type"] : "";

                        let result2 = await pool.request()
                            .input('dlgId', sql.Int, i == 0 ? dlgIdReq : dlgId[0].DLG_ID)
                            .input('dialogTitle', sql.NVarChar, carTmp["dialogTitle"])
                            .input('dialogText', sql.NVarChar, carTmp["dialogText"])
                            .input('imgUrl', sql.NVarChar, carTmp["imgUrl"])
                            .input('btn1Type', sql.NVarChar, carTmp["btn1Type"])
                            .input('buttonName1', sql.NVarChar, carTmp["cButtonName1"])
                            .input('buttonContent1', sql.NVarChar, carTmp["cButtonContent1"])
                            .input('btn2Type', sql.NVarChar, carTmp["btn2Type"])
                            .input('buttonName2', sql.NVarChar, carTmp["cButtonName2"])
                            .input('buttonContent2', sql.NVarChar, carTmp["cButtonContent2"])
                            .input('btn3Type', sql.NVarChar, carTmp["btn3Type"])
                            .input('buttonName3', sql.NVarChar, carTmp["cButtonName3"])
                            .input('buttonContent3', sql.NVarChar, carTmp["cButtonContent3"])
                            .input('btn4Type', sql.NVarChar, carTmp["btn4Type"])
                            .input('buttonName4', sql.NVarChar, carTmp["cButtonName4"])
                            .input('buttonContent4', sql.NVarChar, carTmp["cButtonContent4"])
                            .input('cardOrderNo', sql.Int, (j + 1))
                            .query(insertTblCarousel);

                    }

                } else if (array[i]["dlgType"] == "4") {
                    //동영상 일때 cardDivision 컬럼에 play 가 있어야 한다.
                    //이것은 임시방편으로서 나중에는 수정을 해야 한다.
                    //입력하는 부분에도 있다....함께 고쳐야 한다.
                    var cardDivision = "";
                    if (array[i]["mediaUrl"] == "" || array[i]["mediaUrl"] == null) {

                    } else {
                        cardDivision = "play";
                    }
                    let result4 = await pool.request()
                        .input('dlgId', sql.Int, i == 0 ? dlgIdReq : dlgId[0].DLG_ID)
                        .input('dialogTitle', sql.NVarChar, array[i]["dialogTitle"])
                        .input('dialogText', sql.NVarChar, array[i]["dialogText"])
                        .input('imgUrl', sql.NVarChar, array[i]["mediaImgUrl"])
                        .input('btn1Type', sql.NVarChar, array[i]["btn1Type"])
                        .input('buttonName1', sql.NVarChar, array[i]["mButtonName1"])
                        .input('buttonContent1', sql.NVarChar, array[i]["mButtonContent1"])
                        .input('btn2Type', sql.NVarChar, array[i]["btn2Type"])
                        .input('buttonName2', sql.NVarChar, array[i]["mButtonName2"])
                        .input('buttonContent2', sql.NVarChar, array[i]["mButtonContent2"])
                        .input('btn3Type', sql.NVarChar, array[i]["btn3Type"])
                        .input('buttonName3', sql.NVarChar, array[i]["mButtonName3"])
                        .input('buttonContent3', sql.NVarChar, array[i]["mButtonContent3"])
                        .input('btn4Type', sql.NVarChar, array[i]["btn4Type"])
                        .input('buttonName4', sql.NVarChar, array[i]["mButtonName4"])
                        .input('buttonContent4', sql.NVarChar, array[i]["mButtonContent4"])
                        .input('cardDivision', sql.NVarChar, cardDivision)
                        .input('cardValue', sql.NVarChar, array[i]["mediaUrl"])
                        .query(insertTblDlgMedia)

                }

                if (i != 0) {
                    let insertTblRelationRes = await pool.request()
                        .input('luisId', sql.NVarChar, luisId)
                        .input('luisIntent', sql.NVarChar, luisIntent)
                        .input('entity', sql.NVarChar, entity)
                        .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                        .query(insertTblRelation)
                }

                tblDlgId.push(i == 0 ? parseInt(dlgIdReq) : dlgId[0].DLG_ID);
            }


            for (var oNum = 0; oNum < order.length; oNum++) {
                if (order[oNum] == tblDlgId[0]) {
                    order.splice(oNum, 1);
                    order.splice(oNum, 0, tblDlgId);
                    break;
                }
            }

            console.log(order);

            var orderCount = 1;

            for (var i = 0; i < order.length; i++) {

                if (Array.isArray(order[i])) {
                    for (var j = 0; j < order[i].length; j++) {
                        let updDlgOrder = await pool.request()
                            .input('order', sql.NVarChar, orderCount++)
                            .input('dlgId', sql.NVarChar, order[i][j])
                            .query(updDlgOrderQuery);
                    }
                } else {
                    let updDlgOrder = await pool.request()
                        .input('order', sql.NVarChar, orderCount++)
                        .input('dlgId', sql.NVarChar, order[i])
                        .query(updDlgOrderQuery);
                }
            }

            res.send({ "res": true });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {

    })
});

router.post('/getGroupSelectBox', function (req, res) {

    var selectGroupLQuery = "SELECT DISTINCT GROUPL \n";
    selectGroupLQuery += "FROM TBL_DLG \n";
    selectGroupLQuery += "WHERE GROUPL IS NOT NULL\n";

    var selectGroupMQuery = "SELECT DISTINCT GROUPM \n";
    selectGroupMQuery += "FROM TBL_DLG \n";
    selectGroupMQuery += "WHERE GROUPM IS NOT NULL\n";

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let selectGroupL = await pool.request()
                .query(selectGroupLQuery);
            let groupL = selectGroupL.recordset;

            let selectGroupM = await pool.request()
                .query(selectGroupMQuery);
            let groupM = selectGroupM.recordset;

            res.send({ "groupL": groupL, "groupM": groupM });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {

    })
});
//엔티티 추가시 group selbox 조회
router.post('/selectApiGroup', function (req, res) {

    var entityDefine = req.body.entityDefine;
    var entityValue = req.body.entityValue;
    var apiGroup = req.body.apiGroup;
    (async () => {
        try {

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            var selectQuery = '  SELECT API_GROUP \n';
            selectQuery += '    FROM TBL_COMMON_ENTITY_DEFINE \n';
            selectQuery += 'GROUP BY API_GROUP; \n';
            let result0 = await pool.request()
                .query(selectQuery);

            let rows = result0.recordset;

            res.send({ groupList: rows });

        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'insert Entity Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })

});

//의도예측 change
router.post('/changeIntentAjax', function (req, res) {

    var intent = req.body.intent;

    var selRelationQuery = "SELECT A.DLG_ID  DLG_ID, DLG_TYPE, DLG_ORDER_NO, LUIS_ID, LUIS_INTENT \n";
    selRelationQuery += "FROM TBL_DLG_RELATION_LUIS A, TBL_DLG B \n";
    selRelationQuery += "WHERE LUIS_INTENT = @intent \n";
    selRelationQuery += "AND A.DLG_ID = B.DLG_ID \n";
    selRelationQuery += "AND A.USE_YN = 'Y' \n";
    selRelationQuery += "ORDER BY DLG_ORDER_NO \n";

    var selDlgTextQuery = "SELECT DLG_ID, CARD_TITLE, CARD_TEXT, '2' AS DLG_TYPE \n";
    selDlgTextQuery += "FROM TBL_DLG_TEXT \n";
    selDlgTextQuery += "WHERE DLG_ID = @dlgId \n";

    var selDlgCardQuery = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, IMG_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n"
        + "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n"
        + "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n"
        + "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n"
        + "CARD_ORDER_NO, CARD_VALUE,\n"
        + "USE_YN, '3' AS DLG_TYPE \n"
        + "FROM TBL_DLG_CARD\n"
        + "WHERE USE_YN = 'Y'\n"
        + "AND DLG_ID = @dlgId\n"
        + "WHERE 1=1\n";

    var selDlgMediaQuery = "SELECT DLG_ID, CARD_TEXT, CARD_TITLE, MEDIA_URL, BTN_1_TYPE, BTN_1_TITLE, BTN_1_CONTEXT,\n"
        + "BTN_2_TYPE, BTN_2_TITLE, BTN_2_CONTEXT,\n"
        + "BTN_3_TYPE, BTN_3_TITLE, BTN_3_CONTEXT,\n"
        + "BTN_4_TYPE, BTN_4_TITLE, BTN_4_CONTEXT,\n"
        + "CARD_VALUE,\n"
        + "USE_YN, '4' AS DLG_TYPE \n"
        + "FROM TBL_DLG_MEDIA\n"
        + "WHERE 1=1\n"
        + "AND USE_YN = 'Y'\n"
        + "AND DLG_ID = @dlgId \n";
    + "ORDER BY DLG_ID";

    var result = [];

    (async () => {
        try {

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let selRelation = await pool.request()
                .input('intent', sql.NVarChar, intent)
                .query(selRelationQuery);

            for (var i = 0; i < selRelation.recordset.length; i++) {

                var row = {};
                row.dlg = [];
                row.LUIS_ID = selRelation.recordset[i].LUIS_ID;
                row.LUIS_INTENT = selRelation.recordset[i].LUIS_INTENT;

                if (selRelation.recordset[i].DLG_TYPE == 2) {

                    let selDlgText = await pool.request()
                        .input('dlgId', sql.NVarChar, selRelation.recordset[i].DLG_ID)
                        .query(selDlgTextQuery);

                    row.dlg.push(selDlgText.recordset[0]);

                } else if (selRelation.recordset[i].DLG_TYPE == 3) {

                    let selDlgCard = await pool.request()
                        .input('dlgId', sql.NVarChar, selRelation.recordset[i].DLG_ID)
                        .query(selDlgCardQuery);

                    for (var cardNum = 0; cardNum < selDlgCard.recordset.length; cardNum++) {
                        row.dlg.push(selDlgCard.recordset[cardNum]);
                    }

                } else if (selRelation.recordset[i].DLG_TYPE == 4) {

                    let selDlgMedia = await pool.request()
                        .input('dlgId', sql.NVarChar, selRelation.recordset[i].DLG_ID)
                        .query(selDlgMediaQuery);

                    row.dlg.push(selDlgMedia.recordset[0]);
                }

                result.push(row);
            }

            res.send({ list: result });
        } catch (error) {
            console.log(error);
        } finally {
            sql.close();
        }

    })()

    sql.on('error', err => {
        console.log(err);
    })

});

//의도예측 을 위한 select box data
router.post('/predictIntentAjax', function (req, res) {

    var iptUtterance = req.body['iptUtterance[]'];
    var request = require('request');
    var querystring = require('querystring');
    var appId;
    var HOST = req.session.hostURL;

    var selectAppIdQuery = "SELECT CHATBOT_ID, APP_ID, VERSION, APP_NAME,CULTURE, SUBSC_KEY \n";
    selectAppIdQuery += "FROM TBL_LUIS_APP \n";
    selectAppIdQuery += "WHERE CHATBOT_ID = (SELECT CHATBOT_NUM FROM TBL_CHATBOT_APP WHERE CHATBOT_NAME='" + req.session.appName + "')\n";
    //console.log("selectAppIdQuery=="+selectAppIdQuery);

    (async () => {
        try {

            let pool = await dbConnect.getConnection(sql);
            //let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let selectAppId = await pool.request()
                .query(selectAppIdQuery);

            for (var i = 0; i < selectAppId.recordset.length; i++) {
                appId = selectAppId.recordset[i].APP_ID;
            }

            var endPoint = HOST + "/luis/v2.0/apps/";
            //console.log("appId====="+appId);
            var queryParams = {
                "subscription-key": req.session.subsKey,
                "timezoneOffset": "0",
                "verbose": true,
                "q": iptUtterance
            }

            var options = {
                headers: {
                    'Ocp-Apim-Subscription-Key': req.session.subsKey
                }
            };

            var luisRequest_ = endPoint + appId + '?' + querystring.stringify(queryParams);
            //console.log("luisRequest_=="+luisRequest_);
            var luisRequest = syncClient.get(endPoint + appId + '?' + querystring.stringify(queryParams), options);
            res.send(luisRequest);
        } catch (error) {
            console.log(error);
        } finally {
            sql.close();
        }

    })()

    sql.on('error', err => {
        console.log(err);
    })
});

/*========================================================================================
context
*/
router.get('/context', function (req, res) {

    req.session.selMenus = 'ms3';
    if (!req.session.sid) {
        res.render('context');
    } else {

        (async () => {
            try {
                var group_query = "select distinct GroupL from TBL_DLG where GroupL is not null";
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                let result2 = await pool.request().query(group_query);
                let rows2 = result2.recordset;

                var groupList = [];
                for (var i = 0; i < rows2.length; i++) {
                    var item2 = {};

                    var largeGroup = rows2[i].GroupL;

                    //item2.largeGroup = largeGroup;
                    //groupList.push(item2);
                }

                res.render('context', {
                    selMenus: req.session.selMenus,
                    groupList: rows2
                });
            } catch (err) {
                console.log(err)
                // ... error checks
            } finally {
                sql.close();
            }
        })()
    }

});

router.post('/ContextList', function (req, res) {
    var searchTxt = req.body.searchTxt;
    var searchTxt = "";
    var currentPage = req.body.currentPage;

    (async () => {
        try {
            var sourceType = req.body.sourceType;
            var groupType = req.body.groupType;
            var context_ListQueryString = "select tbp.* from \n" +
                "(select ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC) AS NUM, \n" +
                "      a.DLG_ID AS DLG_ID, \n" +
                "COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n" +
                "CEILING((ROW_NUMBER() OVER(ORDER BY LUIS_ENTITIES DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                "DLG_DESCRIPTION, DLG_API_DEFINE ,LUIS_ENTITIES, LUIS_INTENT, GroupL, GroupM, GroupS, ContextLabel,MissingEntities \n" +
                "FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b \n" +
                "WHERE ContextLabel = 'T' AND a.DLG_ID = b.DLG_ID \n";
            if (req.body.searchTxt !== '') {
                //dlg_desQueryString += "AND b.LUIS_ENTITIES like '%" + req.body.searchTxt + "%' \n";
                context_ListQueryString += "AND b.LUIS_INTENT like '%" + req.body.searchTxt + "%' \n";
            }
            if (req.body.searchGroupL !== '') {
                context_ListQueryString += "AND a.GroupL = '" + req.body.searchGroupL + "' \n";
            }
            if (req.body.searchGroupM !== '') {
                context_ListQueryString += "AND a.GroupM = '" + req.body.searchGroupM + "' \n";
            }
            if (req.body.searchGroupS !== '') {3
                context_ListQueryString += "AND a.GroupS = '" + req.body.searchGroupS + "' \n";
            }

            context_ListQueryString += "AND DLG_API_DEFINE like '%" + sourceType + "%') tbp \n" +
                "WHERE PAGEIDX = @currentPage";

            //console.log("context_ListQueryString===" + context_ListQueryString);
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(context_ListQueryString);
            let rows = result1.recordset;



            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var description = rows[i].DLG_DESCRIPTION;
                var apidefine = rows[i].DLG_API_DEFINE;
                var luisentties = rows[i].LUIS_ENTITIES;
                var luisentent = rows[i].LUIS_INTENT;
                var smallGroup = rows[i].GroupS;
                var dialogueId = rows[i].DLG_ID;
                var missingEntities = rows[i].MissingEntities;

                item.DLG_ID = dialogueId;
                item.DLG_DESCRIPTION = description;
                item.DLG_API_DEFINE = apidefine;
                item.LUIS_ENTITIES = luisentties;
                item.LUIS_INTENT = luisentent;
                item.GroupS = smallGroup;
                item.MissingEntities = missingEntities;

                result.push(item);
            }
            var group_query = "SELECT DISTINCT tbp.GroupL " +
                "   FROM (SELECT a.GroupL, a.GroupM, GroupS " +
                "           FROM TBL_DLG a, TBL_DLG_RELATION_LUIS b " +
                //"          WHERE a.DLG_ID = b.DLG_ID   and LUIS_ENTITIES like '%" + searchTxt +  "%' ) tbp " +
                "          WHERE a.DLG_ID = b.DLG_ID   and LUIS_INTENT like '%" + searchTxt + "%' ) tbp " +
                "  WHERE GroupL is not null";
            //var group_query = "select distinct GroupL from TBL_DLG where GroupL is not null";
            let result2 = await pool.request().query(group_query);
            let rows2 = result2.recordset;

            var groupList = [];
            for (var i = 0; i < rows2.length; i++) {
                var item2 = {};

                var largeGroup = rows2[i].GroupL;

                item2.largeGroup = largeGroup;

                groupList.push(item2);
            }

            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT), groupList: groupList });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});


//  시나리오 이후 추가 epkim

//api 릴레이션 생성
router.post('/createApiRelation', function (req, res) {

    var inputEntity = req.body.inputEntity;
    var apiGroupRelation = req.body.apiGroupRelation;
    var luisId = '';
    var luisIntent = '';
    (async () => {
        try {

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            var apiQuery = "  SELECT LUIS_ID, LUIS_INTENT \n"
                + "    FROM TBL_DLG_RELATION_LUIS \n"
                + "   WHERE DLG_API_DEFINE = '" + apiGroupRelation + "' \n"
                + "GROUP BY LUIS_ID, LUIS_INTENT; \n"
            let result1 = await pool.request().query(apiQuery);
            let rows = result1.recordset;

            for (var j = 0; j < rows.length; j++) {

                luisId = rows[j].LUIS_ID;
                luisIntent = rows[j].LUIS_INTENT;
            }

            var queryText = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_API_DEFINE,USE_YN) \n"
                + "VALUES( @luisId, @luisIntent, (SELECT * from FN_ENTITYSUM_ORDERBY_ADD(@entities)), @dlgApiDefine, 'Y' ); \n";

            let result2 = await pool.request()
                .input('luisId', sql.NVarChar, luisId)
                .input('luisIntent', sql.NVarChar, luisIntent)
                .input('entities', sql.NVarChar, inputEntity)
                .input('dlgApiDefine', sql.NVarChar, apiGroupRelation)
                .query(queryText);

            res.send({ status: 200, message: 'create' });

        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'insert Entity Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })

});


router.get('/scenario', function (req, res) {

    req.session.selMenus = 'ms5';
    res.render('scenario', {
        selMenus: req.session.selMenus,
    });
});

router.post('/scenario', function (req, res) {

    var currentPage = req.body.currentPage;

    (async () => {
        try {

            var entitiesQueryString = ""

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(entitiesQueryString);

            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var entitiyValue = rows[i].entity_value;
                var entity = rows[i].entity;
                var apiGroup = rows[i].api_group;

                item.ENTITY_VALUE = entitiyValue;
                item.ENTITY = entity;
                item.API_GROUP = apiGroup;

                result.push(item);
            }
            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT) });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});


router.post('/scenarioInsert', function (req, res) {
    //console.log("- scenarioInsert");
    var dlgType = req.body.dlgType; 
    var dlgText = req.body.dlgText; 
    var dlgTitle = req.body.dlgTitle;
    var dlgSubTitle = req.body.dlgSubTitle;
	var dlgImgurl = req.body.dlgImgurl;
	var dlgBtn1type = req.body.dlgBtn1type;
	var dlgBtn1title = req.body.dlgBtn1title;
	var dlgBtn1context = req.body.dlgBtn1context;
	var dlgBtn2type = req.body.dlgBtn2type;
	var dlgBtn2title = req.body.dlgBtn2title;
	var dlgBtn2context = req.body.dlgBtn2context;
	var dlgBtn3type = req.body.dlgBtn3type;
	var dlgBtn3title = req.body.dlgBtn3title;
	var dlgBtn3context = req.body.dlgBtn3context;
	var dlgBtn4type = req.body.dlgBtn4type;
	var dlgBtn4title = req.body.dlgBtn4title;
	var dlgBtn4context = req.body.dlgBtn4context;
	var dlgParentdlgid = req.body.dlgParentdlgid;
	var dlgDivsion = req.body.dlgDivsion;
	var dlgUseyn = req.body.dlgUseyn;
	var dlgId = req.body.dlgId;

    console.log("- scenarioInsert() - dlgType : " + dlgType + " | dlgText : " + dlgText);

    //  
    (async () => {
        try {

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            // call SP (sp_scenario)
            console.log("- sp_scenario START" + req.session.appName + " | " + req.session.dbValue);

            let result1 = await pool.request()
                .input('dlgType', dlgType)
                .input('dlgText', dlgText)
                .input('dlgTitle', dlgTitle)
                .input('dlgSubTitle', dlgSubTitle)
                .input('dlgImgurl', dlgImgurl)
                .input('dlgParentdlgid', dlgParentdlgid)
                .input('dlgDivsion', dlgDivsion)
                .input('dlgUseyn', dlgUseyn)
                .input('dlgId', dlgId)
                .input('dlgBtn1type', dlgBtn1type)
                .input('dlgBtn1title', dlgBtn1title)
                .input('dlgBtn1context', dlgBtn1context)
                .input('dlgBtn2type', dlgBtn2type)
                .input('dlgBtn2title', dlgBtn2title)
                .input('dlgBtn2context', dlgBtn2context)
                .input('dlgBtn3type', dlgBtn3type)
                .input('dlgBtn3title', dlgBtn3title)
                .input('dlgBtn3context', dlgBtn3context)
                .input('dlgBtn4type', dlgBtn4type)
                .input('dlgBtn4title', dlgBtn4title)
                .input('dlgBtn4context', dlgBtn4context)
                .execute('sp_scenario').then(function(err, recordsets, returnValue, affected) {
                    console.log("- sp_scenario OK");
                    console.dir(recordsets);
                    console.dir(err);
                }).catch(function(err) {
                    console.log(err);
                });

        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'scenarioInsert Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })

});


router.post('/scenarioAddDialog', function (req, res) {

    var data = req.body['data[]'];
    //var luisEntities = req.body['entities[]'];
    var array = [];
    var queryText = "";
    var tblDlgId = [];
    var scenarioName = "";
    if (typeof data == "string") {
        console.log("data is string");
        var json = JSON.parse(data);

        for (var key in json) {
            console.log("key : " + key + " value : " + json[key]);
        }

    } else {
        console.log("data is object");
        console.log(data);
        //array = JSON.parse(data);
        var dataIdx = data.length;
        console.log("dataIdx:"+dataIdx);
        for (var i = 0; i < dataIdx; i++) {
            array[i] = JSON.parse(data[i]);
        }
        console.log("array.length:"+array.length);
        for (var i = 0; i < array.length; i++) {
            for (var key in array[i]) {
                console.log("key : " + key + " value : " + array[i][key]);
                if(key == "scenarioName") scenarioName = array[i][key];
                if(key == "carouselArr"){
                    /*
                    for(var j = 0; j < array[i].length; j++){
                        for(var key in array[i].["scenarioName"]){
                            console.log("+ key : " + key + " value : " + array[i][j][key]);
                        }
                    }
                    */
                }
            }
        }
    }
    console.log("* scenarioName : "+scenarioName);
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            var selectDlgId = 'SELECT ISNULL(MAX(DLG_ID)+1,1) AS DLG_ID FROM TBL_DLG';

            var insertTblDlg = 'INSERT INTO TBL_DLG(DLG_ID,DLG_NAME,DLG_DESCRIPTION,DLG_LANG,DLG_TYPE,DLG_ORDER_NO,USE_YN, GroupL, GroupM, DLG_GROUP) VALUES ' +
                '(@dlgId,@dialogText,@dialogText,\'KO\',@dlgType,@dialogOrderNo,\'Y\', @largeGroup, @middleGroup, 2)';
            var inserTblDlgText = 'INSERT INTO TBL_DLG_TEXT(DLG_ID,CARD_TITLE,CARD_TEXT,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,\'Y\')';
            var insertTblCarousel = 'INSERT INTO TBL_DLG_CARD(DLG_ID,CARD_TITLE,CARD_TEXT,IMG_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_ORDER_NO,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,@imgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardOrderNo,\'Y\')';
            var insertTblDlgMedia = 'INSERT INTO TBL_DLG_MEDIA(DLG_ID,CARD_TITLE,CARD_TEXT,MEDIA_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_VALUE,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,@mediaImgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardValue,\'Y\')';
            // insertTblScenario
            var insertTblScenario = 'INSERT INTO TBL_SCENARIO_DLG (SCENARIO_NM, SCENARIO_GROUP, DLG_ID, DLG_DEPTH, DLG_ORDER_BY, PARENT_DLG_ID) VALUES ' + 
                '(@scenarioName, \'\', @dlgId, \'\', @dlgOrderBy, @parentDlgId)';

            var largeGroup = array[array.length - 1]["largeGroup"];
            var middleGroup = array[array.length - 1]["middleGroup"];
            var description = array[array.length - 1]["description"];
            
            for (var i = 0; i < (array.length - 1); i++) {
                
                for (var key in array[i]) {
                    console.log("* key : " + key + " value : " + array[i][key]);
                }

                let result1 = await pool.request()
                    .query(selectDlgId)
                let dlgId = result1.recordset;

                let result2 = await pool.request()
                    .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                    .input('dialogText', sql.NVarChar, (array[i]["dialogText"].trim() == '' ? null : array[i]["dialogText"].trim()))
                    .input('dlgType', sql.NVarChar, array[i]["dlgType"])
                    .input('dialogOrderNo', sql.Int, (i + 1))
                    .input('largeGroup', sql.NVarChar, largeGroup)
                    .input('middleGroup', sql.NVarChar, middleGroup)
                    .query(insertTblDlg);
                //.input('luisEntities', sql.NVarChar, (typeof luisEntities ==="string" ? luisEntities:luisEntities[j]))

                if (array[i]["dlgType"] == "2") {

                    let result3 = await pool.request()
                        .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                        .input('dialogTitle', sql.NVarChar, (array[i]["dialogTitle"].trim() == '' ? null : array[i]["dialogTitle"].trim()))
                        .input('dialogText', sql.NVarChar, (array[i]["dialogText"].trim() == '' ? null : array[i]["dialogText"].trim()))
                        .query(inserTblDlgText);

                } else if (array[i]["dlgType"] == "3") {

                    for (var j = 0; j < array[i].carouselArr.length; j++) {
                        var carTmp = array[i].carouselArr[j];

                        // 공백은 Null 처리
                        for (var key in carTmp) {
                            //console.log("캐러절 key : " + key + " value : " + carTmp[key]);
                            carTmp[key] = carTmp[key].trim();

                            if (carTmp[key].trim() == '') {
                                carTmp[key] = null;
                            }
                        }

                        let result3 = await pool.request()
                            .input('typeDlgId', sql.NVarChar, array[i].dlgType)
                            .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                            .input('dialogTitle', sql.NVarChar, carTmp["dialogTitle"])
                            .input('dialogText', sql.NVarChar, carTmp["dialogText"])
                            .input('imgUrl', sql.NVarChar, carTmp["imgUrl"])
                            .input('btn1Type', sql.NVarChar, carTmp["btn1Type"])
                            .input('buttonName1', sql.NVarChar, carTmp["cButtonName1"])
                            .input('buttonContent1', sql.NVarChar, carTmp["cButtonContent1"])
                            .input('btn2Type', sql.NVarChar, carTmp["btn2Type"])
                            .input('buttonName2', sql.NVarChar, carTmp["cButtonName2"])
                            .input('buttonContent2', sql.NVarChar, carTmp["cButtonContent2"])
                            .input('btn3Type', sql.NVarChar, carTmp["btn3Type"])
                            .input('buttonName3', sql.NVarChar, carTmp["cButtonName3"])
                            .input('buttonContent3', sql.NVarChar, carTmp["cButtonContent3"])
                            .input('btn4Type', sql.NVarChar, carTmp["btn4Type"])
                            .input('buttonName4', sql.NVarChar, carTmp["cButtonName4"])
                            .input('buttonContent4', sql.NVarChar, carTmp["cButtonContent4"])
                            .input('cardOrderNo', sql.Int, (j + 1))
                            .query(insertTblCarousel);
                       
                    }

                    tblDlgId.push(dlgId[0].DLG_ID);

                } else if (array[i]["dlgType"] == "4") {    // 
                   
                    // 공백은 Null 처리
                    for (var key in array[i]) {
                        //console.log("카드 key : " + key + " value : " + array[i]);
                        array[i][key] = array[i][key].trim();

                        if (array[i][key].trim() == '') {
                            array[i][key] = null;
                        }
                    }

                    let result3 = await pool.request()
                        .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                        .input('dialogTitle', sql.NVarChar, array[i]["dialogTitle"])
                        .input('dialogText', sql.NVarChar, array[i]["dialogText"])
                        .input('mediaImgUrl', sql.NVarChar, array[i]["mediaImgUrl"])
                        .input('btn1Type', sql.NVarChar, array[i]["btn1Type"])
                        .input('buttonName1', sql.NVarChar, array[i]["mButtonName1"])
                        .input('buttonContent1', sql.NVarChar, array[i]["mButtonContent1"])
                        .input('btn2Type', sql.NVarChar, array[i]["btn2Type"])
                        .input('buttonName2', sql.NVarChar, array[i]["mButtonName2"])
                        .input('buttonContent2', sql.NVarChar, array[i]["mButtonContent2"])
                        .input('btn3Type', sql.NVarChar, array[i]["btn3Type"])
                        .input('buttonName3', sql.NVarChar, array[i]["mButtonName3"])
                        .input('buttonContent3', sql.NVarChar, array[i]["mButtonContent3"])
                        .input('btn4Type', sql.NVarChar, array[i]["btn4Type"])
                        .input('buttonName4', sql.NVarChar, array[i]["mButtonName4"])
                        .input('buttonContent4', sql.NVarChar, array[i]["mButtonContent4"])
                        .input('cardValue', sql.NVarChar, array[i]["mediaUrl"])
                        .query(insertTblDlgMedia)

                    tblDlgId.push(dlgId[0].DLG_ID);
                }

                console.log("- scenarioName : "+scenarioName)
                //  INSERT TBL_SCENARIO_DLG
                let result4 = await pool.request()
                    .input('scenarioName', sql.NVarChar, (scenarioName.trim() == '' ? null : scenarioName.trim()))
                    .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                    .input('dlgOrderBy', sql.Int, 0)
                    .input('parentDlgId', sql.Int, 0)
                    .query(insertTblScenario);

                tblDlgId.push(dlgId[0].DLG_ID);

            }

            res.send({ list: tblDlgId });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        sql.close();
        console.log(err);
    })

});

router.post('/scenarioAddChildDialog', function (req, res) {

    var data = req.body['data[]'];
    var array = [];
    var queryText = "";
    var tblDlgId = [];
    var scenarioName = "";
    if (typeof data == "string") {
        console.log("data is string");
        var json = JSON.parse(data);

        for (var key in json) {
            console.log("key : " + key + " value : " + json[key]);
        }

    } else {
        console.log("data is object");
        console.log(data);
        //array = JSON.parse(data);
        var dataIdx = data.length;
        console.log("dataIdx:"+dataIdx);
        for (var i = 0; i < dataIdx; i++) {
            array[i] = JSON.parse(data[i]);
        }
        console.log("array.length:"+array.length);
        for (var i = 0; i < array.length; i++) {
            for (var key in array[i]) {
                console.log("key : " + key + " value : " + array[i][key]);
                if(key == "scenario_nm") scenarioName = array[i][key];
                if(key == "carouselArr"){
                    /*
                    for(var j = 0; j < array[i].length; j++){
                        for(var key in array[i].["scenarioName"]){
                            console.log("+ key : " + key + " value : " + array[i][j][key]);
                        }
                    }
                    */
                }
            }
        }
    }
    //console.log("* scenario_nm : "+array[i]["scenario_nm"]);
    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            var selectDlgId = 'SELECT ISNULL(MAX(DLG_ID)+1,1) AS DLG_ID FROM TBL_DLG';

            var insertTblDlg = 'INSERT INTO TBL_DLG(DLG_ID,DLG_NAME,DLG_DESCRIPTION,DLG_LANG,DLG_TYPE,DLG_ORDER_NO,USE_YN, GroupL, GroupM, DLG_GROUP) VALUES ' +
                '(@dlgId,@dialogText,@dialogText,\'KO\',@dlgType,@dialogOrderNo,\'Y\', @largeGroup, @middleGroup, 2)';
            var inserTblDlgText = 'INSERT INTO TBL_DLG_TEXT(DLG_ID,CARD_TITLE,CARD_TEXT,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,\'Y\')';
            var insertTblDlgCard = 'INSERT INTO TBL_DLG_CARD(DLG_ID,CARD_TITLE,CARD_SUBTITLE,CARD_TEXT,IMG_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_ORDER_NO,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogSubTitle,@dialogText,@imgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardOrderNo,\'Y\')';
            var insertTblDlgMedia = 'INSERT INTO TBL_DLG_MEDIA(DLG_ID,CARD_TITLE,CARD_TEXT,MEDIA_URL,BTN_1_TYPE,BTN_1_TITLE,BTN_1_CONTEXT,BTN_2_TYPE,BTN_2_TITLE,BTN_2_CONTEXT,BTN_3_TYPE,BTN_3_TITLE,BTN_3_CONTEXT,BTN_4_TYPE,BTN_4_TITLE,BTN_4_CONTEXT,CARD_VALUE,USE_YN) VALUES ' +
                '(@dlgId,@dialogTitle,@dialogText,@mediaImgUrl,@btn1Type,@buttonName1,@buttonContent1,@btn2Type,@buttonName2,@buttonContent2,@btn3Type,@buttonName3,@buttonContent3,@btn4Type,@buttonName4,@buttonContent4,@cardValue,\'Y\')';
            // insertTblScenario
            var insertTblScenario = 'INSERT INTO TBL_SCENARIO_DLG (SCENARIO_NM, SCENARIO_GROUP, DLG_ID, DLG_DEPTH, DLG_ORDER_BY, PARENT_DLG_ID, PARENT_DLG_BTN) VALUES ' + 
                '(@scenarioName, \'\', @dlgId, @dlgDepth, @dlgOrderBy, @parentDlgId, @parentDlgBtn)';

            var largeGroup = array[array.length - 1]["largeGroup"];
            var middleGroup = array[array.length - 1]["middleGroup"];
            var description = array[array.length - 1]["description"];
            
            for (var i = 0; i < (array.length - 1); i++) {
                
                for (var key in array[i]) {
                    console.log("* key : " + key + " value : " + array[i][key]);
                }

                let result1 = await pool.request()
                    .query(selectDlgId)
                let dlgId = result1.recordset;

                let result2 = await pool.request()
                    .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                    .input('dialogText', sql.NVarChar, (array[i]["dialogText"].trim() == '' ? null : array[i]["dialogText"].trim()))
                    .input('dlgType', sql.NVarChar, array[i]["dlgType"])
                    .input('dialogOrderNo', sql.Int, (i + 1))
                    .input('largeGroup', sql.NVarChar, largeGroup)
                    .input('middleGroup', sql.NVarChar, middleGroup)
                    .query(insertTblDlg);
                

                if (array[i]["dlgType"] == "2") {

                    let result3 = await pool.request()
                        .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                        .input('dialogTitle', sql.NVarChar, (array[i]["dialogTitle"].trim() == '' ? null : array[i]["dialogTitle"].trim()))
                        .input('dialogText', sql.NVarChar, (array[i]["dialogText"].trim() == '' ? null : array[i]["dialogText"].trim()))
                        .query(inserTblDlgText);

                } else if (array[i]["dlgType"] == "3") {

                    array[i]["btn1Type"] = (array[i]["cButtonContent1"] != "") ? array[i]["btn1Type"] : "";
                    array[i]["btn2Type"] = (array[i]["cButtonContent2"] != "") ? array[i]["btn2Type"] : "";
                    array[i]["btn3Type"] = (array[i]["cButtonContent3"] != "") ? array[i]["btn3Type"] : "";
                    array[i]["btn4Type"] = (array[i]["cButtonContent4"] != "") ? array[i]["btn4Type"] : "";

                    let result3 = await pool.request()
                        .input('typeDlgId', sql.NVarChar, array[i]["dlgType"])
                        .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                        .input('dialogTitle', sql.NVarChar, array[i]["dialogTitle"])
                        .input('dialogSubTitle', sql.NVarChar, array[i]["dialogSubTitle"])
                        .input('dialogText', sql.NVarChar, array[i]["dialogText"])
                        .input('imgUrl', sql.NVarChar, array[i]["imgUrl"])
                        .input('btn1Type', sql.NVarChar, array[i]["btn1Type"])
                        .input('buttonName1', sql.NVarChar, array[i]["cButtonName1"])
                        .input('buttonContent1', sql.NVarChar, array[i]["cButtonContent1"])
                        .input('btn2Type', sql.NVarChar, array[i]["btn2Type"])
                        .input('buttonName2', sql.NVarChar, array[i]["cButtonName2"])
                        .input('buttonContent2', sql.NVarChar, array[i]["cButtonContent2"])
                        .input('btn3Type', sql.NVarChar, array[i]["btn3Type"])
                        .input('buttonName3', sql.NVarChar, array[i]["cButtonName3"])
                        .input('buttonContent3', sql.NVarChar, array[i]["cButtonContent3"])
                        .input('btn4Type', sql.NVarChar, array[i]["btn4Type"])
                        .input('buttonName4', sql.NVarChar, array[i]["cButtonName4"])
                        .input('buttonContent4', sql.NVarChar, array[i]["cButtonContent4"])
                        .input('cardOrderNo', sql.Int, (i + 1))
                        .query(insertTblDlgCard);
                   

                } else if (array[i]["dlgType"] == "4") {    // media
                   
                    array[i]["btn1Type"] = (array[i]["cButtonContent1"] != "") ? array[i]["btn1Type"] : "";
                    array[i]["btn2Type"] = (array[i]["cButtonContent2"] != "") ? array[i]["btn2Type"] : "";
                    array[i]["btn3Type"] = (array[i]["cButtonContent3"] != "") ? array[i]["btn3Type"] : "";
                    array[i]["btn4Type"] = (array[i]["cButtonContent4"] != "") ? array[i]["btn4Type"] : "";

                    let result3 = await pool.request()
                        .input('typeDlgId', sql.NVarChar, array[i]["dlgType"])
                        .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                        .input('dialogTitle', sql.NVarChar, array[i]["dialogTitle"])
                        .input('dialogText', sql.NVarChar, array[i]["dialogText"])
                        .input('mediaImgUrl', sql.NVarChar, array[i]["imgUrl"])
                        .input('btn1Type', sql.NVarChar, array[i]["btn1Type"])
                        .input('buttonName1', sql.NVarChar, array[i]["cButtonName1"])
                        .input('buttonContent1', sql.NVarChar, array[i]["cButtonContent1"])
                        .input('btn2Type', sql.NVarChar, array[i]["btn2Type"])
                        .input('buttonName2', sql.NVarChar, array[i]["cButtonName2"])
                        .input('buttonContent2', sql.NVarChar, array[i]["cButtonContent2"])
                        .input('btn3Type', sql.NVarChar, array[i]["btn3Type"])
                        .input('buttonName3', sql.NVarChar, array[i]["cButtonName3"])
                        .input('buttonContent3', sql.NVarChar, array[i]["cButtonContent3"])
                        .input('btn4Type', sql.NVarChar, array[i]["btn4Type"])
                        .input('buttonName4', sql.NVarChar, array[i]["cButtonName4"])
                        .input('buttonContent4', sql.NVarChar, array[i]["cButtonContent4"])
                        .input('cardValue', sql.Int, (i + 1))
                        .query(insertTblDlgMedia);

                    tblDlgId.push(dlgId[0].DLG_ID);
                }

                console.log("- scenarioName : "+scenarioName)
                //  INSERT TBL_SCENARIO_DLG
                let result4 = await pool.request()
                    .input('scenarioName', sql.NVarChar, (scenarioName.trim() == '' ? null : scenarioName.trim()))
                    .input('dlgId', sql.Int, dlgId[0].DLG_ID)
                    .input('dlgDepth', sql.Int, (parseInt(array[i]["parentDlgDepth"])+1) )
                    .input('dlgOrderBy', sql.Int, 0)
                    .input('parentDlgId', sql.Int, array[i]["parentDlgId"])
                    .input('parentDlgBtn', sql.Int, array[i]["parentDlgBtn"])
                    .query(insertTblScenario);

                tblDlgId.push(dlgId[0].DLG_ID);
            }
            res.send({ list: tblDlgId });

        } catch (err) {
            console.log(err);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        sql.close();
        console.log(err);
    })
    

});

router.post('/scenarioEditDialog', function (req, res) {
    //console.log('/scenarioEditDialog - START');    
    var data = req.body['data'];
    var array = [];
    var queryText = "";
    var dlgType = "";
    var dlgId = "";

    if (typeof data == "string") {
        console.log("data is string");
        var json = JSON.parse(data);
        console.log(data);
        for (var key in json) {
            //console.log("key : " + key + " value : " + json[key]);
            //array = json[key];
            array[key] = json[key];
        }        
    }  
    console.log(array);
    //console.log('dlgId:'+array["dlgId"]+' | dialogText:'+array["dialogText"]);
    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            var updateDlg = "UPDATE TBL_DLG SET DLG_NAME='"+array['dialogTitle']+"', DLG_DESCRIPTION='"+array['dlg_description']+"', DLG_TYPE='"+array['dlgType']+"', GroupL='"+array['groupL']+"', GroupM='"+array['groupM']+"' " + 
                " WHERE DLG_ID='"+array['dlgId']+"'";

            var updateDlgText = "UPDATE TBL_DLG_TEXT SET " + 
                " CARD_TITLE='"+array['dialogTitle']+"', CARD_TEXT='"+array['dialogText']+"' " + 
                " WHERE DLG_ID='"+array['dlgId']+"'";

            var updateDlgCard = "UPDATE TBL_DLG_CARD SET " + 
                " CARD_TITLE='"+array['dialogTitle']+"', CARD_SUBTITLE='"+array['dialogSubTitle']+"', CARD_TEXT='"+array['dialogText']+"', IMG_URL='"+array['imgUrl']+"'";
                if (array['cButtonName1'] != null) { 
                    updateDlgCard = updateDlgCard + ", BTN_1_TYPE='"+array['btn1Type']+"', BTN_1_TITLE='"+array['cButtonName1']+"', BTN_1_CONTEXT='"+array['cButtonContent1']+"'";
                }
                if (array['cButtonName2'] != null) { 
                    updateDlgCard = updateDlgCard + ", BTN_2_TYPE='"+array['btn2Type']+"', BTN_2_TITLE='"+array['cButtonName2']+"', BTN_2_CONTEXT='"+array['cButtonContent2']+"'"; 
                }
                if (array['cButtonName3'] != null) { 
                    updateDlgCard = updateDlgCard + ", BTN_3_TYPE='"+array['btn3Type']+"', BTN_3_TITLE='"+array['cButtonName3']+"', BTN_3_CONTEXT='"+array['cButtonContent3']+"'";
                }
                if (array['cButtonName4'] != null) { 
                    updateDlgCard = updateDlgCard + ", BTN_4_TYPE='"+array['btn4Type']+"', BTN_4_TITLE='"+array['cButtonName4']+"', BTN_4_CONTEXT='"+array['cButtonContent4']+"'"; 
                } 
                updateDlgCard = updateDlgCard + " WHERE DLG_ID = '"+array['dlgId']+"'";

            var updateDlgMedia = "UPDATE TBL_DLG_MEDIA SET " + 
                " CARD_TITLE='"+array['dialogTitle']+"', CARD_SUBTITLE='"+array['dialogSubTitle']+"', CARD_TEXT='"+array['dialogText']+"', MEDIA_URL=''";
                if (array['cButtonName1'] != null) { 
                    updateDlgMedia = updateDlgMedia + ", BTN_1_TYPE='"+array['btn1Type']+"', BTN_1_TITLE='"+array['cButtonName1']+"', BTN_1_CONTEXT='"+array['cButtonContent1']+"'";
                }
                if (array['cButtonName2'] != null) { 
                    updateDlgMedia = updateDlgMedia + ", BTN_2_TYPE='"+array['btn2Type']+"', BTN_2_TITLE='"+array['cButtonName2']+"', BTN_2_CONTEXT='"+array['cButtonContent2']+"'"; 
                }
                if (array['cButtonName3'] != null) { 
                    updateDlgMedia = updateDlgMedia + ", BTN_3_TYPE='"+array['btn3Type']+"', BTN_3_TITLE='"+array['cButtonName3']+"', BTN_3_CONTEXT='"+array['cButtonContent3']+"'";
                }
                if (array['cButtonName4'] != null) { 
                    updateDlgMedia = updateDlgMedia + ", BTN_4_TYPE='"+array['btn4Type']+"', BTN_4_TITLE='"+array['cButtonName4']+"', BTN_4_CONTEXT='"+array['cButtonContent4']+"'"; 
                } 
                updateDlgMedia = updateDlgMedia + " WHERE DLG_ID='"+array['dlgId']+"'";

            if(array['dlgType'] == '2') {
                console.log('* updateDlgText : ' +  updateDlgText);
                let result1 = await pool.request().query(updateDlgText);

            } else if (array['dlgType'] == '3') {
                console.log('* updateDlgCard : ' +  updateDlgCard);
                let result1 = await pool.request().query(updateDlgCard);
              
            } else if (array['dlgType'] == '4') {
                console.log('* updateDlgMedia : ' +  updateDlgMedia);
                let result1 = await pool.request().query(updateDlgMedia);
            }

            console.log('* updateDlg : ' +  updateDlg);
            let result2 = await pool.request().query(updateDlg);

            if(array['useYn'] == 'N'){  //  미사용 시나리오 처리..
                var updateScenario = "UPDATE TBL_SCENARIO_DLG SET USE_YN='N' WHERE DLG_ID='"+array['dlgId']+"'";
                let result3 = await pool.request().query(updateScenario);
            }

            /*  임의 주석 (dlgType 값 변경시..)
            //  'dlgType' and 'originDlgType' are not the same..
            if(array['dlgType'] != array['originDlgType']) {    
                console.log("* 'dlgType' and 'originDlgType' are not the same");
                var deleteDlgQuery ="";
                if(array['originDlgType'] == '2'){
                    deleteDlgQuery = "DELETE FROM TBL_DLG_TEXT WHERE DLG_ID = '"+array['dlgId']+"'";
                } else if(array['originDlgType'] == '3'){
                    deleteDlgQuery = "DELETE FROM TBL_DLG_CARD WHERE DLG_ID = '"+array['dlgId']+"'";
                } else if(array['originDlgType'] == '4'){
                    deleteDlgQuery = "DELETE FROM TBL_DLG_MEDIA WHERE DLG_ID = '"+array['dlgId']+"'";
                }
                console.log('* deleteDlgQuery : ' +  deleteDlgQuery);
                //let result3 = await pool.request().query(deleteDlgQuery);
            }
            */

        }catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'scenarioEditDialog Error' });
        } finally {
            sql.close();
            res.send({status:200 , message:'Save Success'});
        }
    })()

    sql.on('error', err => {
    })

});

router.post('/scenarioDeleteDialog', function (req, res) {
    //console.log('/scenarioDeleteDialog - START');    
    //var data = req.body['data'];
    var array = [];
    var dlgId = req.body['dlgId'];
    //console.log('/scenarioDeleteDialog - data.dlgId:'+data.dlgId);    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            /*//  TBL_DLG USE_YN
            var updateDlg = "UPDATE TBL_DLG SET USE_YN='N' WHERE DLG_ID='"+dlgId+"'";
            console.log('* updateDlg : ' +  updateDlg);
            let result1 = await pool.request().query(updateDlg);   */
            //  TBL_SCENARIO_DLG USE_YN
            var updateScenario = "UPDATE TBL_SCENARIO_DLG SET USE_YN='N' WHERE DLG_ID='"+dlgId+"'";
            console.log('* updateScenario : ' +  updateScenario);
            let result2 = await pool.request().query(updateScenario);

        }catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'scenarioDeleteDialog Error' });
        } finally {
            sql.close();
            res.send({status:200 , message:'Delete Success'});
        }
    })()
    sql.on('error', err => {
    })
});

router.post('/getScenarioDialogs', function (req, res) {

	var strScenarioName = req.body.strScenarioName;
    console.log("- getScenarioDialogs() - strScenarioName : " + strScenarioName);

    (async () => {
        try {

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            // call SP (sp_scenario)
            //console.log("- sp_scenario START" + req.session.appName + " | " + req.session.dbValue);
            let query = "sp_scenario_select";
            let result1 = await pool.request()
                .input('scenarioNm', req.body.strScenarioName)
                .execute('sp_scenario_select').then(function(recordset) {
                //.query(query, function(err, recordset){
                    if (recordset) {
                        console.log(recordset.recordsets[0]);
                        sql.close();
                    }
                    console.log(recordset.recordsets[0]);
                    res.send({ list: recordset.recordsets[0] });
                    sql.close();
                });
            //console.log(result1);
        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'getScenarioDialogs Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })
});

router.post('/delScenarioDialogs', function (req, res) {
	var strScenarioName = req.body.strScenarioName;
    console.log("- delScenarioDialogs() - strScenarioName : " + strScenarioName);
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            var queryText = "UPDATE TBL_SCENARIO_DLG SET USE_YN='N' WHERE SCENARIO_NM = '"+strScenarioName+"'";
            console.log('* queryText : ' +  queryText);
            let result1 = await pool.request().query(queryText);   
        }catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'delScenarioDialogs Error' });
        } finally {
            sql.close();
            res.send({status:200 , message:'Delete Success'});
        } 
    })()

    sql.on('error', err => {
    })
});


router.post('/getScenarioDlg', function (req, res) {
    var strDlgId = req.body.dlgId;
    var strDlgType = req.body.dlgType;
    console.log("- getScenarioDlg() - strDlgId : " + strDlgId + " | strDlgType : "+strDlgType);

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            //var selectScenario = 'SELECT SCENARIO_SEQ, SCENARIO_NM, SCENARIO_GROUP, DLG_ID, DLG_DEPTH, DLG_ORDER_BY, PARENT_DLG_ID FROM TBL_SCENARIO_DLG WHERE PARENT_DLG_ID=\'' + strDlgId +'\'';
            var selectScenario = 'SELECT COUNT(SCENARIO_SEQ) as CNT FROM TBL_SCENARIO_DLG WHERE PARENT_DLG_ID=\'' + strDlgId +'\'';
            var selectDlgText = 'SELECT TD.DLG_ID, TD.DLG_NAME, TD.DLG_DESCRIPTION, TD.GROUPL, TD.GROUPM, TD.USE_YN, TDT.CARD_TITLE, TDT.CARD_TEXT   ' +
                ' FROM TBL_DLG AS TD, TBL_DLG_TEXT AS TDT ' + 
                ' WHERE TD.DLG_ID=\'' + strDlgId + '\' AND TD.DLG_ID = TDT.DLG_ID ';
            var selectDlgCard = 'SELECT TD.DLG_ID, TD.DLG_NAME, TD.DLG_DESCRIPTION, TD.GROUPL, TD.GROUPM, TD.USE_YN, TDC.CARD_TITLE, TDC.CARD_SUBTITLE, TDC.CARD_TEXT, TDC.IMG_URL, ' + 
                ' TDC.BTN_1_TYPE, TDC.BTN_1_TITLE, TDC.BTN_1_CONTEXT, TDC.BTN_2_TYPE, TDC.BTN_2_TITLE, TDC.BTN_2_CONTEXT, ' + 
                ' TDC.BTN_3_TYPE, TDC.BTN_3_TITLE, TDC.BTN_3_CONTEXT, TDC.BTN_4_TYPE, TDC.BTN_4_TITLE, TDC.BTN_4_CONTEXT ' + 
                ' FROM TBL_DLG AS TD, TBL_DLG_CARD AS TDC ' + 
                ' WHERE TD.DLG_ID=\'' + strDlgId + '\' AND TD.DLG_ID = TDC.DLG_ID ';
            var selectDlgMedia = 'SELECT TD.DLG_ID, TD.DLG_NAME, TD.DLG_DESCRIPTION, TD.GROUPL, TD.GROUPM, TD.USE_YN, TDM.CARD_TITLE, TDM.CARD_TEXT, TDM.MEDIA_URL, ' + 
                ' TDM.BTN_1_TYPE, TDM.BTN_1_TITLE, TDM.BTN_1_CONTEXT, TDM.BTN_2_TYPE, TDM.BTN_2_TITLE, TDM.BTN_2_CONTEXT, ' + 
                ' TDM.BTN_3_TYPE, TDM.BTN_3_TITLE, TDM.BTN_3_CONTEXT, TDM.BTN_4_TYPE, TDM.BTN_4_TITLE, TDM.BTN_4_CONTEXT ' + 
                ' FROM TBL_DLG AS TD, TBL_DLG_MEDIA AS TDM ' + 
                ' WHERE TD.DLG_ID=\'' + strDlgId + '\' AND TD.DLG_ID = TDM.DLG_ID ';
            var selectScenarioChild = 'SELECT * FROM TBL_SCENARIO_DLG WHERE PARENT_DLG_ID=\'' + strDlgId +'\' ORDER BY PARENT_DLG_BTN ASC';
            //var selectScenarioChild = 'SELECT * FROM TBL_SCENARIO_DLG WHERE PARENT_DLG_ID=\'' + strDlgId +'\' AND PARENT_DLG_BTN is not NULL';

            let result0 = await pool.request().query(selectScenario);
            let rowsScenario = result0.recordset[0];
            let rows = result0.recordset;
            var childCnt = 0;
            if (rows[0].CNT != 0) {
                childCnt = rows[0].CNT;
            }
            
            let result1 = await pool.request().query(selectScenarioChild);
            let childRows = result1.recordset;

            if(strDlgType == '2') {
                console.log('* selectDlgText : ' +  selectDlgText);
                let result2 = await pool.request().query(selectDlgText);
                let rows = result2.recordset[0];
                for (var key in rows) {
                    console.log("key : " + key + " value : " + rows[key]);
                }
                res.send({ "rows": rows, "childCnt":childCnt, "childRows":childRows });
            } else if (strDlgType == '3') {
                console.log('* selectDlgCard : ' +  selectDlgCard);
                let result2 = await pool.request().query(selectDlgCard);
                let rows = result2.recordset[0];
                for (var key in rows) {
                    console.log("key : " + key + " value : " + rows[key]);
                }
                res.send({ "rows": rows, "childCnt":childCnt, "childRows":childRows });
            } else if (strDlgType == '4') {
                console.log('* selectDlgMedia : ' +  selectDlgMedia);
                let result2 = await pool.request().query(selectDlgMedia);
                let rows = result2.recordset[0];
                for (var key in rows) {
                    console.log("key : " + key + " value : " + rows[key]);
                }
                res.send({ "rows": rows, "childCnt":childCnt, "childRows":childRows });
            } else {
            
            }

        }catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'getScenarioDlg Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })
});

router.post('/selectScenarioList', function (req, res) {
    //var selectId = req.body.selectId;
   
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            var queryText = "";

            queryText = "SELECT SCENARIO_NM, COUNT(SCENARIO_SEQ) AS SCENARIO_COUNT FROM TBL_SCENARIO_DLG "
            queryText += "WHERE SCENARIO_NM is not null AND USE_YN='Y' GROUP BY SCENARIO_NM";

            let result = await pool.request().query(queryText);
            let rows = result.recordset;

            res.send({ "rows": rows });
        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'selectScenarioList Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        console.log(err);
    })
});

router.post('/selectScenarioInfo', function (req, res) {
    var dlgId = req.body.dlgId;
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            var queryText = "";

            queryText = "SELECT SCENARIO_SEQ, SCENARIO_NM, SCENARIO_GROUP, DLG_ID, DLG_DEPTH, DLG_ORDER_BY, PARENT_DLG_ID FROM TBL_SCENARIO_DLG "
            queryText += "WHERE DLG_ID = '"+dlgId+"'";

            let result = await pool.request().query(queryText);
            let rows = result.recordset;

            res.send({ "rows": rows });
        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'selectScenarioInfo Error' });
        } finally {
            sql.close();
        }

    })()

    sql.on('error', err => {
        console.log(err);
    })
});


router.post('/relationUtterAjax', function (req, res) {
    //var luisId = req.body.luisId;
    

    var luisId;

    var selAppId = req.body.selAppId;
    var selAppList = req.session.selChatInfo.chatbot.appList;
    for (var i=0; i<selAppList.length; i++) {
        if (selAppList[i].APP_ID == selAppId) {
            luisId = selAppList[i].APP_NAME;
        }
    }

    var luisIntent = req.body.luisIntent;
    var selectUtterSeq = req.body.selectUtterSeq;
    
    var entities = req.body.entities;
    //var predictIntent = req.body.predictIntent;

    var dlgId = [];
    dlgId = req.body.dlgId;

    var contextData = [];
    contextData = req.body.contextData;

    if (contextData == undefined) {
        contextData = [];
    }

    var contextDataLength;
    if (typeof contextData === "string") {
        contextDataLength = 1;
    } else {
        contextDataLength = contextData.length
    }

    var queryText = "";
    if (contextDataLength == 0) {
        queryText = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_ID,DLG_API_DEFINE,USE_YN, CONTEXTLABEL) "
            + "VALUES( @luisId, @luisIntent, @entities, @dlgId, 'D', 'Y', 'F' ); \n";
    } else {
        queryText = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_ID,DLG_API_DEFINE,USE_YN, CONTEXTLABEL) "
            + "VALUES( @luisId, @luisIntent, @entities, @dlgId, 'D', 'Y', 'T'); \n";
    }


    var updateQueryText = "";
    var utterArry;
    if (req.body.utters) {
        utterArry = req.body.utters[0];
        utterArry = utterArry.replace("'", "''");
        for (var i = 0; i < (typeof utterArry === "string" ? 1 : utterArry.length); i++) {
            updateQueryText += "UPDATE TBL_QUERY_ANALYSIS_RESULT SET TRAIN_FLAG = 'Y' WHERE QUERY = '" + (typeof utterArry === "string" ? utterArry.replace(" ", "") : utterArry[i]) + "'; \n";
        }
    }


    var updateTblDlg = "UPDATE TBL_DLG SET GroupS = @entities WHERE DLG_ID = @dlgId; \n";

    var selectAppIdQuery = "SELECT CHATBOT_ID, APP_ID, VERSION, APP_NAME,CULTURE, SUBSC_KEY \n";
    selectAppIdQuery += "FROM TBL_LUIS_APP \n";
    selectAppIdQuery += "WHERE CHATBOT_ID = (SELECT CHATBOT_NUM FROM TBL_CHATBOT_APP WHERE CHATBOT_NAME='" + req.session.appName + "')\n";

    var upQuery = "UPDATE TBL_QUERY_ANALYSIS_RESULT SET LUIS_ID = @luisID, LUIS_INTENT = @intetID, LUIS_INTENT_SCORE = '1', RESULT = 'H' "
        + "WHERE QUERY = @Query";

    var inCacheQuery = "INSERT INTO TBL_QUERY_INTENT(QUERY, LUIS_ID, LUIS_INTENT, DLG_ID)\n"
        + "VALUES(@query,@luisId, @intent, @dlgId)";

    var selCacheQuery = "SELECT QUERY, LUIS_ID, LUIS_INTENT, DLG_ID\n"
        + "FROM TBL_QUERY_INTENT\n"
        + "WHERE QUERY = @query\n"
        + "AND LUIS_ID = @luisId\n"
        + "AND LUIS_INTENT = @intent\n"
        + "AND DLG_ID = @dlgID";

    var checkQuery = "SELECT RELATION_ID FROM TBL_DLG_RELATION_LUIS WHERE LUIS_INTENT = @luisIntent AND DLG_ID = @dlgId AND LUIS_ID = @luisId";

    var contextQuery = "INSERT INTO TBL_DLG_RELATION_LUIS(LUIS_ID,LUIS_INTENT,LUIS_ENTITIES,DLG_ID,DLG_API_DEFINE,USE_YN, CONTEXTLABEL, MISSINGENTITIES) "
        + "VALUES( @luisId, @luisIntent, @entities, @dlgId, 'D', 'Y', 'T', @missing_entity ); \n";

    var contextDefineQuery = "INSERT INTO TBL_CONTEXT_DEFINE(INTENT, ENTITIES) "
        + "VALUES( @contextIntent, @contextEntity ); \n";

    var updateTblDlgQuery = "UPDATE TBL_DLG SET GROUPM=@luisIntent WHERE DLG_ID=@dlgId";

    var updateNewUtter = "UPDATE TBL_QNAMNG SET DLG_ID=@dlgId, USE_YN = 'N' WHERE SEQ = @selectUtterSeq";

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1;
            let result2;
            let checkResult;

            /*
            * 이미 학습되어서 디비에 들어간 내용을 다시 학습시키는 것을 방지함.
            * 
            *   
            for(var jjj = 0 ; jjj < (typeof dlgId ==="string" ? 1:dlgId.length); jjj++){
             checkResult = await pool.request()
                 .input('luisId', sql.NVarChar, luisId)
                 .input('luisIntent', sql.NVarChar, luisIntent)
                 .input('dlgId', sql.NVarChar, (typeof dlgId ==="string" ? dlgId:dlgId[jjj]))
                 .query(checkQuery);
 
                 if(checkResult.recordset.length > 0) {
                     return res.send({result:"learned"});
                 }else{
                     //nothing
                 }
            }
          */


            for (var j = 0; j < (typeof dlgId === "string" ? 1 : dlgId.length); j++) {
                if (j === ((typeof dlgId === "string" ? 1 : dlgId.length) - 1)) {
                    queryText += updateQueryText
                }

                if (entities != "" && entities != null) {
                    result1 = await pool.request()
                        .input('luisId', sql.NVarChar, luisId)
                        .input('luisIntent', sql.NVarChar, luisIntent)
                        .input('entities', sql.NVarChar, entities)
                        .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                        .query(queryText);


                    result2 = await pool.request()
                        .input('entities', sql.NVarChar, entities)
                        .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                        .query(updateTblDlg);
                } else {

                    var selCacheResult = await pool.request()
                        .input('query', sql.NVarChar, req.body['utters[]'].replace(" ", ""))
                        .input('luisId', sql.NVarChar, luisId)
                        .input('intent', sql.NVarChar, luisIntent)
                        .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                        .query(selCacheQuery)

                    if (selCacheResult.recordset.length == 0) {
                        /*
                        * entity 가 없어도 TBL_DLG_RELATION_LUIS 에는 insert
                        * entity 가 없으면 TBL_DLG_RELATION_LUIS table 을 보지 않고 TBL_QUERY_INTENT table 에서 정보를 빼온다.
                        * entity 가 없으니까 tbl_dlg 의 groups 를 update 할 필요는 없다.
                        */
                        var regExpData = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;//특수문자
                        var query_ori_data = req.body['utters[]'];
                        var query_data = query_ori_data.replace(regExpData, "");//특수문자 제거
                        query_data = query_data.replace(/(\s*)/g, "");//공백제거
                        var relationLuisResult = await pool.request()
                            .input('luisId', sql.NVarChar, luisId)
                            .input('luisIntent', sql.NVarChar, luisIntent)
                            .input('entities', sql.NVarChar, entities)
                            .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                            .query(queryText);
                        var inCacheResult = await pool.request()
                            //.input('query', sql.NVarChar, req.body['utters[]'].replace(" ",""))
                            .input('query', sql.NVarChar, query_data)
                            .input('luisId', sql.NVarChar, luisId)
                            .input('intent', sql.NVarChar, luisIntent)
                            .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                            .query(inCacheQuery);
                    }
                }
            }
            //context 데이터에 따라서 db insert
            if (contextDataLength == 0) {

            } else {
                var context_dlgid;
                var context_missingEntity;
                var context_defineEntity = "";
                var temp_context;
                var check_array;
                for (var a = 0; a < contextDataLength; a++) {
                    if (typeof contextData === "string") {
                        temp_context = contextData;
                    } else {
                        temp_context = contextData[a];
                    }

                    check_array = temp_context.split('||');
                    context_dlgid = check_array[0];
                    context_missingEntity = check_array[1];

                    context_defineEntity = context_defineEntity + check_array[1] + ":,";

                    var contextResult = await pool.request()
                        .input('luisId', sql.NVarChar, luisId)
                        .input('luisIntent', sql.NVarChar, luisIntent)
                        .input('entities', sql.NVarChar, entities)
                        .input('dlgId', sql.NVarChar, context_dlgid)
                        .input('missing_entity', sql.NVarChar, context_missingEntity)
                        .query(contextQuery);

                    var updateTblDlgResult = await pool.request()
                        .input('luisIntent', sql.NVarChar, luisIntent)
                        .input('dlgId', context_dlgid)
                        .query(updateTblDlgQuery);

                }
                context_defineEntity = context_defineEntity.slice(0, -1);
                var contextDefineResult = await pool.request()
                    .input('contextIntent', sql.NVarChar, luisIntent)
                    .input('contextEntity', context_defineEntity)
                    .query(contextDefineQuery);
                    
               
            }


            if (req.body.utters.length > 0) {
                var selecNoAnswerQry = {
                    selectQry:
                        ` SELECT SEQ
                        FROM TBL_QUERY_ANALYSIS_RESULT, ( 
                                                            SELECT dbo.fn_replace_regex(CUSTOMER_COMMENT_KR)   AS QUERY_KR 
                                                            FROM TBL_HISTORY_QUERY 
                                                            WHERE @findQry = CUSTOMER_COMMENT_KR
                                                            GROUP BY CUSTOMER_COMMENT_KR  ) TBH 
                        WHERE RESULT NOT IN ('H', 'R')  
                        AND QUERY = TBH.QUERY_KR `,
                    updateQry : `
                        UPDATE TBL_QUERY_ANALYSIS_RESULT SET RESULT = 'H' WHERE SEQ = @updateSeq
                    `
                };

                let resultSel1 = await pool.request()
                        .input('findQry', sql.NVarChar, req.body.utters[0])
                        .query(selecNoAnswerQry.selectQry)
                let rows = resultSel1.recordset;
                if (rows.length > 0) {
                    let updateQry1 = await pool.request()
                        .input('updateSeq', sql.NVarChar, rows[0].SEQ)
                        .query(selecNoAnswerQry.updateQry)

                }
            }

            for (var j = 0; j < (typeof dlgId === "string" ? 1 : dlgId.length); j++) {
                var updateQQ = await pool.request()
                    .input('dlgId', sql.NVarChar, (typeof dlgId === "string" ? dlgId : dlgId[j]))
                    .input('selectUtterSeq', sql.NVarChar, selectUtterSeq)
                    .query(updateNewUtter);
                return res.send({ result: true });
            }
            /********************************************* */
            //console.log(result1);
            //console.log(result2);

            /*
            let rows = result1.rowsAffected;

            if(rows[0] == 1) {
                res.send({result:true});
            } else {
                res.send({result:false});
            }
            */

        } catch (err) {
            // ... error checks
            console.log(err);
            return res.send({ result: false });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});
module.exports = router;
