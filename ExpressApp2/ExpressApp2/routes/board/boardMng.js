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

//대시보드 항목관리
router.get('/boardMng', function (req, res) {  
    res.render('boardMng/boardMng');
});

router.get('/boardUserMng', function (req, res) {  
    res.render('boardMng/boardUserMng');
});

router.post('/selectDashboardItemList', function (req, res) {

    (async () => {
        try {
            var QueryStr = "SELECT BOARD_ID, BOARD_NM, BOARD_URL, BOARD_EXPL, REG_DT";
            QueryStr += " FROM TB_BOARD_I";


            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};
                item = rows[i];


                recordList.push(item);
            }

            if (rows.length > 0) {
                res.send({
                    records: recordList.length,
                    rows: recordList
                });

            } else {
                res.send({
                    records: 0,
                    rows: null
                });
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

router.post('/procBoardItem', function (req, res) {  
    var boardItemArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateStr = "";
    var deleteStr = "";
    var userId = req.session.sid;
    
    for (var i=0; i<boardItemArr.length; i++) {
        if (boardItemArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TB_BOARD_I (BOARD_ID, BOARD_NM, BOARD_URL, BOARD_EXPL, REG_ID, REG_DT) " + 
                       "VALUES ( ";
            saveStr += " '" + boardItemArr[i].BOARD_ID  + "', '" + boardItemArr[i].BOARD_NM  + "', '" + boardItemArr[i].BOARD_URL  + "', ";
            saveStr += " '" + boardItemArr[i].BOARD_EXPL  + "', '" + userId  + "', GETDATE()); ";
        } else if (boardItemArr[i].statusFlag === 'UPDATE') {
            updateStr += "UPDATE TB_BOARD_I SET ";
            updateStr += "BOARD_NM = '" + boardItemArr[i].BOARD_NM  + "', BOARD_URL = '" + boardItemArr[i].BOARD_URL + "', ";
            updateStr += "BOARD_EXPL = '" + boardItemArr[i].BOARD_EXPL  + "', ";
            updateStr += "MOD_ID = '" + userId  + "', MOD_DT = GETDATE() ";
            updateStr += "WHERE BOARD_ID = '" + boardItemArr[i].BOARD_ID + "'; ";
        } else { //DEL
            deleteStr += "DELETE FROM TB_BOARD_I WHERE BOARD_ID = '" + boardItemArr[i].BOARD_ID + "'; ";
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveStr !== "") {
                let insertCodeDetail = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateCodeDetail = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteCodeDetail = await pool.request().query(deleteStr);
            }

            res.send({status:200 , message:'Save Success'});
            
        } catch (err) {
            console.log(err);
            res.send({status:500 , message:'Save Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/selectUserList', function (req, res) {

    let sortIdx = checkNull(req.body.sort, "USER_ID") + " " + checkNull(req.body.order, "ASC");
    let pageSize = checkNull(req.body.rows, 10);
    let currentPageNo = checkNull(req.body.page, 1);

    let searchName = checkNull(req.body.searchName, null);
    let searchId = checkNull(req.body.searchId, null);

    (async () => {
        try {

            var QueryStr = "SELECT TBZ.* ,(TOT_CNT - SEQ + 1) AS NO \n" +
                "  FROM (SELECT TBY.* \n" +
                "          FROM (SELECT ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") AS SEQ, \n" +
                "                       COUNT('1') OVER(PARTITION BY '1') AS TOT_CNT, \n" +
                "                       CEILING(ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") / CONVERT( NUMERIC, " + pageSize + " ) ) PAGEIDX, \n" +
                "                       TBX.* \n" +
                "                  FROM ( \n" +
                "                         SELECT \n" +
                "                              A.EMP_NUM      AS EMP_NUM \n" +
                "                            , ISNULL(A.USER_ID, ' ')      AS USER_ID \n" +
                //"                            , ISNULL(A.SCRT_NUM, ' ')     AS SCRT_NUM " +
                "                            , ISNULL(A.EMP_NM, ' ')       AS EMP_NM \n" +
                "                            , ISNULL(A.EMP_ENGNM, ' ')    AS EMP_ENGNM \n" +
                "                            , ISNULL(A.EMAIL, ' ')        AS EMAIL \n" +
                "                            , ISNULL(A.M_P_NUM_1, ' ')    AS M_P_NUM_1 \n" +
                "                            , ISNULL(A.M_P_NUM_2, ' ')    AS M_P_NUM_2 \n" +
                "                            , ISNULL(A.M_P_NUM_3, ' ')    AS M_P_NUM_3 \n" +
                "                            , ISNULL(A.USE_YN, ' ')       AS USE_YN \n" +
                "                            , ISNULL(CONVERT(NVARCHAR(10), A.REG_DT, 120), ' ') AS REG_DT \n" +
                "                            , ISNULL(A.REG_ID, ' ')       AS REG_ID " +
                "                            , ISNULL(CONVERT(NVARCHAR(10), A.MOD_DT, 120), ' ') AS MOD_DT \n" +
                "                            , ISNULL(A.MOD_ID, ' ')       AS MOD_ID \n" +
                "                            , ISNULL(A.LOGIN_FAIL_CNT, 0)      AS LOGIN_FAIL_CNT \n" +
                "                            , ISNULL(CONVERT(NVARCHAR, A.LAST_LOGIN_DT, 120), ' ')  AS LAST_LOGIN_DT \n" +
                "                            , ISNULL(CONVERT(NVARCHAR, A.LOGIN_FAIL_DT, 120), ' ')  AS LOGIN_FAIL_DT \n" +
                "                            , USER_AUTH  AS USER_AUTH \n" +
                "                            , (SELECT AUTHGRP_M_NM FROM TB_AUTHGRP_M WHERE AUTH_LEVEL = A.USER_AUTH) AS AUTH_NM \n" +
                "                         FROM TB_USER_M A \n" +
                "                         WHERE 1 = 1 \n" +
                "					      AND A.USE_YN = 'Y' \n";

            if (searchName) {
                QueryStr += "					      AND A.EMP_NM like '%" + searchName + "%' \n";
            }
            if (searchId) {
                QueryStr += "					      AND A.USER_ID like '%" + searchId + "%' \n";
            }
            QueryStr += "                       ) TBX \n" +
                "               ) TBY \n" +
                "       ) TBZ \n" +
                " WHERE PAGEIDX = " + currentPageNo + " \n" +
                "ORDER BY " + sortIdx + " \n";

            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

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
                    totCnt = checkNull(recordList[0].TOT_CNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOT_CNT, 10) + 1);


                res.send({
                    records: recordList.length,
                    total: getTotalPageCount,
                    pageList: paging.pagination(currentPageNo, rows[0].TOT_CNT), //page : checkNull(currentPageNo, 1),
                    rows: recordList
                });

            } else {
                //res.send({ list: result });
                res.send({
                    records : 0,
                    rows : null
                });
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

function checkNull(val, newVal) {
    if (val === "" || typeof val === "undefined" || val === "0") {
        return newVal;
    } else {
        return val;
    }
}

router.post('/selectUserBoardList', function (req, res) {
    
    let userId = checkNull(req.body.userId, '');
    var currentPage = checkNull(req.body.currentPage, 1);
    var currentPageUser = checkNull(req.body.currentPageUser, 1);
    var selectBoardItemListStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY BOARD_NM DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY BOARD_NM DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         BOARD_ID, BOARD_NM, BOARD_URL, BOARD_EXPL \n" +
                           "          FROM TB_BOARD_I ) tbp \n" +
                           " WHERE 1=1 \n" +
                           "   AND PAGEIDX = " + currentPage + "; \n";

    var UserBoardItemListStr = "SELECT tbp.* from \n" +
                         "   (SELECT ROW_NUMBER() OVER(ORDER BY USER_ID DESC) AS NUM, \n" +
                         "           COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                         "           CEILING((ROW_NUMBER() OVER(ORDER BY USER_ID DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                        "            BOARD_ID \n" +
                        "       FROM TB_BOARD_RELATION \n" +
                        "      WHERE 1=1 \n" +
                        "        AND USER_ID = '" + userId + "') tbp  \n" + 
                        " WHERE 1=1;  \n";
                        //"   AND PAGEIDX = " + currentPage + "; \n";        

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let boardItemList = await pool.request().query(selectBoardItemListStr);
            let rows = boardItemList.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                recordList.push(item);
            }

            let userBoardItemList = await pool.request().query(UserBoardItemListStr);
            let rows2 = userBoardItemList.recordset;

            var checkedApp = [];
            for(var i = 0; i < rows2.length; i++){
                for (var j=0; j < recordList.length; j++) {
                    if (rows2[i].BOARD_ID === recordList[j].BOARD_ID) {
                        var item = {};
                        item = rows2[i];
                        checkedApp.push(item);
                        break;
                    }
                }
                
            }

            res.send({
                records : recordList.length,
                rows : recordList,
                checkedApp : checkedApp,
                pageList : paging.pagination(currentPage,rows[0].TOTCNT)
            });
            
        } catch (err) {
            console.log(err);
            res.send({status:500 , message:'app Load Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
})

router.post('/updateBoardItemList', function (req, res) {
    let userId = req.body.userId;
    let saveData = JSON.parse(checkNull(req.body.saveData, ''));
    let removeData = JSON.parse(checkNull(req.body.removeData, ''));
    var saveDataStr = "";
    var removeDataStr = "";
    var loginId = req.session.sid;

    for (var i=0; i<saveData.length; i++) {
        saveDataStr += "INSERT INTO TB_BOARD_RELATION(USER_ID, BOARD_ID, REG_ID, REG_DT) " +
                    " VALUES ('" + userId + "', '" + saveData[i] + "', '" + loginId + "', GETDATE()); \n";    
    }
    
    for (var i=0; i<removeData.length; i++) {
        removeDataStr += "DELETE FROM TB_BOARD_RELATION \n" +
                    "      WHERE 1=1 \n" +
                    "        AND BOARD_ID = '" + removeData[i].BOARD_ID + "' \n" +
                    "        AND USER_ID = '" + userId + "'; \n";     
    }           
                   
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveData.length > 0) {
                let appList = await pool.request().query(saveDataStr);
            }
            
            if (removeData.length > 0) {
                let userAppList = await pool.request().query(removeDataStr);
            }

            res.send({status:200 , message:'Update Success'});
            
        } catch (err) {
            console.log(err);
            res.send({status:500 , message:'Update Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
    
})

module.exports = router;