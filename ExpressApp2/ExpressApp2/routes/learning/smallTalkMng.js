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

//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end


//sql injection 
var injection = require("../../config/sqlInjection");

var router = express.Router();

router.get('/smallTalkMng', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('smallTalkMng');
});

router.get('/smallTalkEntity', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('smallTalkEntity');
});

router.post('/selectSmallTalkList', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var pageSize = checkNull(req.body.rows, 10);
    var currentPage = checkNull(req.body.currentPage, 1);
    
    (async () => {
        try {

            var QueryStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY SEQ DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY SEQ DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         SEQ, S_QUERY, INTENT, ENTITY, S_ANSWER, USE_YN \n" +
                           "          FROM TBL_SMALLTALK \n" +
                           "          WHERE 1=1 \n";
                        if (req.body.useYn != 'ALL') {
                            QueryStr += "AND USE_YN = @useYn \n";
                        }
                        if (req.body.searchQuestiontText !== '') {
                            QueryStr += "AND S_QUERY like @searchQuestiontText \n";
                        }

                        if (req.body.searchIntentText !== '') {
                            QueryStr += "AND ENTITY like @searchIntentText \n";
                        }
                        QueryStr +="  ) tbp WHERE PAGEIDX = @currentPage; \n";

            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 조회');

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
                    .input('useYn', sql.NVarChar, req.body.useYn)
                    .input('searchQuestiontText', sql.NVarChar, '%' + req.body.searchQuestiontText + '%')
                    .input('searchIntentText', sql.NVarChar, '%' + req.body.searchIntentText + '%')
                    .input('currentPage', sql.NVarChar, currentPage)
                    .query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};
                item = rows[i];


                recordList.push(item);
            }


            if (rows.length > 0) {

                var totCnt = 0;
                if (recordList.length > 0)
                    totCnt = checkNull(recordList[0].TOTCNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOTCNT, 10) + 1);


                res.send({
                    records: recordList.length,
                    total: getTotalPageCount,
                    pageList: paging.pagination(currentPage, rows[0].TOTCNT), //page : checkNull(currentPageNo, 1),
                    rows: recordList
                });

            } else {
                res.send({
                    records : 0,
                    rows : null
                });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })


});


function checkNull(val, newVal) {
    if (val === "" || typeof val === "undefined" || val === "0") {
        return newVal;
    } else {
        return val;
    }
}

router.post('/smallTalkProc', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    
    var dataArr = JSON.parse(req.body.saveArr);
    var insertStr = "INSERT INTO TBL_SMALLTALK (S_QUERY, INTENT, ENTITY, S_ANSWER, DLG_TYPE, REG_DT) " +
                    " VALUES ( @S_QUERY, @INTENT, @ENTITY, @S_ANSWER,'2',GETDATE());";
    var deleteStr = "DELETE FROM TBL_SMALLTALK WHERE SEQ = @DELETE_ST_SEQ; ";
    var updateStr = "UPDATE TBL_SMALLTALK SET S_ANSWER=@S_ANSWER, USE_YN=@USE_YN WHERE SEQ = @SEQ; ";
    var deleteEntities = "UPDATE TBL_SMALLTALK SET ENTITY='' WHERE SEQ = @SEQ; ";
    var userId = req.session.sid;
    /*
    for (var i = 0; i < dataArr.length; i++) {

        if (dataArr[i].statusFlag === 'ADD') {
            insertStr += "INSERT INTO TBL_SMALLTALK (S_QUERY, INTENT, ENTITY, S_ANSWER, DLG_TYPE, REG_DT) " +
            "VALUES (";
            insertStr += " '" + dataArr[i].S_QUERY + "', '" + dataArr[i].INTENT + "', '" + dataArr[i].ENTITY + "', '" + dataArr[i].S_ANSWER + "','2',GETDATE());";
        }else if (dataArr[i].statusFlag === 'DEL') {
            deleteStr += "DELETE FROM TBL_SMALLTALK WHERE SEQ = '" + dataArr[i].DELETE_ST_SEQ + "'; ";
        }else if (dataArr[i].statusFlag === 'UPDATE') {
            deleteStr += "UPDATE TBL_SMALLTALK SET S_ANSWER='" + dataArr[i].S_ANSWER + "', USE_YN='" + dataArr[i].USE_YN + "' WHERE SEQ = '" + dataArr[i].SEQ + "'; ";
        }else{

        }
    }
    */

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            for (var i = 0; i < dataArr.length; i++) {
        
                if (dataArr[i].statusFlag === 'ADD') {
                    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 저장');
                
                    var insertSmallTalk= await pool.request()
                            .input('S_QUERY', sql.NVarChar, injection.changeAttackKeys(dataArr[i].S_QUERY))
                            .input('INTENT', sql.NVarChar, injection.changeAttackKeys(dataArr[i].INTENT))
                            .input('ENTITY', sql.NVarChar, injection.changeAttackKeys(dataArr[i].ENTITY))
                            .input('S_ANSWER', sql.NVarChar, injection.changeAttackKeys(dataArr[i].S_ANSWER))
                            .query(insertStr);

                }else if (dataArr[i].statusFlag === 'DEL') {
                    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 제거 seq:' + dataArr[i].DELETE_ST_SEQ);
                
                    var deleteSmallTalk = await pool.request()
                            .input('DELETE_ST_SEQ', sql.NVarChar, injection.changeAttackKeys(dataArr[i].DELETE_ST_SEQ))
                            .query(deleteStr);
                
                }else if (dataArr[i].statusFlag === 'UPDATE') {
                    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 수정 seq:' + dataArr[i].SEQ);
                
                    var updateSmallTalk = await pool.request()
                            .input('S_ANSWER', sql.NVarChar, injection.changeAttackKeys(dataArr[i].S_ANSWER))
                            .input('USE_YN', sql.NVarChar, injection.changeAttackKeys(dataArr[i].USE_YN))
                            .input('SEQ', sql.NVarChar, injection.changeAttackKeys(dataArr[i].SEQ))
                            .query(updateStr);
                }else if (dataArr[i].statusFlag === 'DELENTITIES') {
                    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 수정 seq:' + dataArr[i].SEQ);
                
                    var deleteEntitiesRes = await pool.request()
                            .input('SEQ', sql.NVarChar, injection.changeAttackKeys(dataArr[i].SEQ))
                            .query(deleteEntities);
                }else{
        
                }
            }
            res.send({ status: 200, message: 'Save Success' });

        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ status: 500, message: 'Save Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/getEntityAjax', function (req, res, next) {

    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작'); 
				
    var iptUtterance = req.body.iptUtterance;
    var entitiesArr = [];
    var commonEntitiesArr = [];

    (async () => {
        try {
            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'FN_SMALLTALK_ENTITY_ORDERBY_ADD 함수 엔티티 조회');

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

                var iptUtterTmp = iptUtterance;
                let result1 = await pool.request()
                    .input('iptUtterance', sql.NVarChar, iptUtterTmp)
                    .query('SELECT RESULT FROM FN_SMALLTALK_ENTITY_ORDERBY_ADD(@iptUtterance)')

                let rows = result1.recordset;

                if (rows[0]['RESULT'] != '') {
                    var entities = rows[0]['RESULT'];
                    var entityArr = entities.split(',');

                    var queryString2 = "SELECT ENTITY_VALUE,ENTITY FROM TBL_SMALLTALK_ENTITY_DEFINE WHERE ENTITY IN (";
                    for (var j = 0; j < entityArr.length; j++) {
                        queryString2 += "'";
                        queryString2 += entityArr[j];
                        queryString2 += "'";
                        queryString2 += (j != entityArr.length - 1) ? "," : "";
                    }
                    queryString2 += ")";


                    let result3 = await pool.request()
                        //.input('entities', sql.NVarChar, entitiesVal)
                        .query(queryString2)
                    


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
                    entitiesArr.push(entities);
                    commonEntitiesArr.push(commonEntities);

                } else {
                    entitiesArr.push(null);
                    commonEntitiesArr.push(null);

                }
            //}

            res.send({ result: true, entities: entitiesArr, commonEntities: commonEntitiesArr });

        } catch (err) {
            // ... error checks
	    logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })

});

/*
* entity mng
*/
router.post('/entities', function (req, res) {

    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작'); 
				
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
                + "                                 FROM TBL_SMALLTALK_ENTITY_DEFINE b \n"
                + "                                WHERE b.entity = a.entity FOR XML PATH('') ),1,1,'[') AS entity_value  \n"
                + "                  FROM TBL_SMALLTALK_ENTITY_DEFINE a \n"
                + "                 WHERE API_GROUP != 'OCR TEST' \n"
                + "              GROUP BY entity, API_GROUP) TBL_SMALLTALK_ENTITY_DEFINE \n"
                + "         ) tbp \n"
                + "WHERE PAGEIDX = @currentPage; \n"
                				
	        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK_ENTITY_DEFINE 테이블 조회');

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).query(entitiesQueryString);

            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var entitiyValue = rows[i].entity_value;
                var entity = rows[i].entity;

                item.ENTITY_VALUE = entitiyValue;
                item.ENTITY = entity;

                result.push(item);
            }
            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT) });
            } else {
                res.send({ list: result });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/deleteEntity', function (req, res) {

    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작'); 
		
    var delEntityDefine = req.body.delEntityDefine;
    
    (async () => {
        try {

	        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK_ENTITY_DEFINE 테이블 삭제 ENTITY: ' + delEntityDefine);
            //var deleteAppStr = "DELETE FROM TBL_SMALLTALK_ENTITY_DEFINE WHERE ENTITY = '" + delEntityDefine + "'; \n";

            var deleteAppStr = "DELETE FROM TBL_SMALLTALK_ENTITY_DEFINE WHERE ENTITY = @delEntityDefine; \n";


            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let result1 = await pool.request()
                            .input('delEntityDefine', sql.NVarChar, delEntityDefine)
                            .query(deleteAppStr);

            res.send({ status: 200, message: 'delete Entity Success' });
            
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
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
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작'); 

    var entityList = req.body;
    var entityTemp = [];
    if (entityList.entityDefine) {
        var tmpObj = new Object();
        tmpObj.entityDefine = entityList.entityDefine;
        tmpObj.entityValue = entityList.entityValue;
        entityTemp.push(tmpObj);
        entityList = entityTemp;
    }
    //var entityList = JSON.parse(req.body.entityObj);
    (async () => {
        try {
            var entityInputStr = "";
            /*
            entityInputStr += " SELECT COUNT(*) as count FROM TBL_SMALLTALK_ENTITY_DEFINE \n";
            entityInputStr += "  WHERE 1=1 \n";
            entityInputStr += "    AND ENTITY = '" + entityList[0].entityDefine + "' \n";
            entityInputStr += "    AND ( ";
            for (var i = 0; i < entityList.length; i++) {
                if (i !== 0) { entityInputStr += "     OR " }
                entityInputStr += "ENTITY_VALUE = '" + entityList[i].entityValue + "' \n";
            }
            entityInputStr += "); \n";
            */
            entityInputStr += " SELECT COUNT(*) as count FROM TBL_SMALLTALK_ENTITY_DEFINE \n";
            entityInputStr += "  WHERE 1=1 \n";
            entityInputStr += "    AND ENTITY = @entityDefine \n";
            entityInputStr += "    AND ( ";
            
            for (var i = 0; i < entityList.length; i++) {
                if (i !== 0) { entityInputStr += "     OR " }
                entityInputStr += "ENTITY_VALUE = '" + entityList[i].entityValue + "' \n";
            }
            entityInputStr += "); \n";

	        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK_ENTITY_DEFINE 테이블 추가');
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            let result0 = await pool.request()
            .input('entityDefine', sql.NVarChar, entityList[0].entityDefine) 
            .query(entityInputStr);
           
            let rows = result0.recordset;

            if (rows[0].count == 0) {

                for (var i = 0; i < entityList.length; i++) {
                    var entityInputStr = "";
                    entityInputStr += " INSERT INTO TBL_SMALLTALK_ENTITY_DEFINE(ENTITY, ENTITY_VALUE, API_GROUP) \n";
                    entityInputStr += " VALUES (@entityDefine, @entityValue, 'COMMON'); ";

                    var result1 = await pool.request()
                            .input('entityDefine', sql.NVarChar, entityList[i].entityDefine) 
                            .input('entityValue', sql.NVarChar, entityList[i].entityValue) 
                            .query(entityInputStr);
                }


                res.send({ status: 200, message: 'insert Success' });
            } else {
                res.send({ status: 'Duplicate', message: 'Duplicate entities exist' });
            }

        } catch (err) { 
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
    })

});

//엔티티 수정
router.post('/updateEntity', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작'); 

    var entity = req.body.entityDefine;
    var updEntityValue = req.body.entityValue;
    var oriEntityValue = [];
    var insertValue = [];
    var deleteValue = [];
    var intentInfo = [];
    var entityCheck = false;
/*
    var appName = req.session.appName;
    var subsKey = req.session.subsKey;

    var options = {
        headers: {
            'Ocp-Apim-Subscription-Key': subsKey
        }
    };

    var client = new Client();
*/
    var selEntityQuery = "SELECT ENTITY_VALUE, ENTITY \n";
    selEntityQuery += "FROM TBL_SMALLTALK_ENTITY_DEFINE\n";
    selEntityQuery += "WHERE ENTITY = @entity";

    var delEntityQuery = "DELETE FROM TBL_SMALLTALK_ENTITY_DEFINE WHERE ENTITY_VALUE = @entityValue";

    var insertEntityQuery = "INSERT INTO TBL_SMALLTALK_ENTITY_DEFINE(ENTITY_VALUE,ENTITY,API_GROUP)\n";
    insertEntityQuery += "VALUES(@entityValue, @entity,'COMMON')";

    (async () => {
        try {
            let appPool = await appDbConnect.getAppConnection(appSql, req.session.appName, req.session.dbValue);

	        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK_ENTITY_DEFINE 테이블 수정');
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

            if (insertValue.length > 0 || deleteValue.length > 0) {
                for (var i = 0; i < insertValue.length; i++) {

                    let insertEntity = await appPool.request()
                                .input('entityValue', sql.NVarChar, insertValue[i])
                                .input('entity', sql.NVarChar, entity)
                                .query(insertEntityQuery);
                            break;
                }

                for (var delNum = 0; delNum < deleteValue.length; delNum++) {
                    let delEntity = await appPool.request()
                                    .input('entityValue', sql.NVarChar, deleteValue[delNum])
                                    .query(delEntityQuery);
                }
            }
            res.send({ status: 200 });
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
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
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작'); 

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
                + "                      FROM TBL_SMALLTALK_ENTITY_DEFINE b \n"
                + "                     WHERE b.entity = a.entity \n "
                + "                       AND b.API_GROUP = a.API_GROUP FOR XML PATH('') ),1,1,'[') AS entity_value \n"
                + "      FROM TBL_SMALLTALK_ENTITY_DEFINE a \n"
                + "     WHERE API_GROUP != 'OCR TEST' \n"
                + "       AND (entity like @searchEntities or entity_value like @searchEntities) \n"
                + "  GROUP BY entity, API_GROUP) a \n"
                + "      ) tbp  \n"
                + "WHERE PAGEIDX = 1 \n";

            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK_ENTITY_DEFINE 테이블 조회');
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request().input('currentPage', sql.Int, currentPage).input('searchEntities', sql.NVarChar, '%' + searchEntities + '%').query(entitiesQueryString);

            let rows = result1.recordset;

            var result = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};

                var entitiyValue = rows[i].entity_value;
                var entity = rows[i].entity;

                item.ENTITY_VALUE = entitiyValue;
                item.ENTITY = entity;

                result.push(item);
            }
            if (rows.length > 0) {
                res.send({ list: result, pageList: paging.pagination(currentPage, rows[0].TOTCNT) });
            } else {
                res.send({ list: result });
            }
        } catch (err) { 
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/selectSmallTalkListAll', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds();
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_'+ pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';

    var fildPath_ = req.session.appName + '_' + req.session.sid + '_' + seedatetime + ".xlsx";
    
    (async () => {
        try {

            var QueryStr = " SELECT SEQ, S_QUERY, INTENT, ENTITY, S_ANSWER, USE_YN \n" +
                           " FROM TBL_SMALLTALK \n" +
                           " WHERE 1=1 \n";
                        if (req.body.useYn != 'ALL') {
                            QueryStr += "AND USE_YN = @useYn \n";
                        }
                        if (req.body.searchQuestiontText !== '') {
                            QueryStr += "AND S_QUERY like @searchQuestiontText \n";
                        }

                        if (req.body.searchIntentText !== '') {
                            QueryStr += "AND ENTITY like @searchIntentText \n";
                        }

            //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 조회');

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
                    .input('useYn', sql.NVarChar, req.body.useYn)
                    .input('searchQuestiontText', sql.NVarChar, '%' + req.body.searchQuestiontText + '%')
                    .input('searchIntentText', sql.NVarChar, '%' + req.body.searchIntentText + '%')
                    .query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};
                item = rows[i];


                recordList.push(item);
            }


            if (rows.length > 0) {

                var totCnt = 0;
                if (recordList.length > 0)
                    totCnt = checkNull(recordList[0].TOTCNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOTCNT, 10) + 1);


                res.send({
                    records: recordList.length,
                    total: getTotalPageCount,
                    fildPath_: fildPath_,
                    rows: recordList
                });

            } else {
                res.send({
                    records : 0,
                    rows : null
                });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })


});

function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

module.exports = router;