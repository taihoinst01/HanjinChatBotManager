'use strict';
var express = require('express');
//var multer = require("multer");
//var uploads = multer().single('avatar')
var path = require("path");
var sql = require('mssql');
var Client = require('node-rest-client').Client;
var dbConfig = require('../../config/dbConfig');
var dbConnect = require('../../config/dbConnect');
var paging = require('../../config/paging');
var util = require('../../config/util');
var Client = require('node-rest-client').Client;

//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end

//sql injection 
var injection = require("../../config/sqlInjection");

var router = express.Router();

// API 관리 페이지 경로
router.get('/apiManage', function (req, res, next) {
        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
        res.render("chatbotMng/apiManage")
    });

//api URL 리스트 출력
router.post('/selectApiUrlList', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var pageSize = checkNull(req.body.rows, 10);
    var currentPage = checkNull(req.body.currentPage, 1);
    (async () => {
        try {

            var QueryStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY SID ASC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY SID DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         SID, API_NAME, API_INTENT, API_URL \n" +
                           "          FROM TBL_CHATBOT_API \n" +
                           "          WHERE 1=1 \n";
                        if (req.body.searchApiUrlName !== '') {
                            QueryStr += "AND API_NAME like @searchApiUrlName \n";
                        }

                        if (req.body.searchApiUrlIntent !== '') {
                            QueryStr += "AND API_INTENT like @searchApiUrlIntent \n";
                        }

                        QueryStr +="  ) tbp WHERE PAGEIDX = @currentPage; \n";            

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
            .input('searchApiUrlName', sql.NVarChar, '%' + req.body.searchApiUrlName + '%')
            .input('searchApiUrlIntent', sql.NVarChar, '%' + req.body.searchApiUrlIntent + '%')
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
            console.log(err);
            
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

//api 관리 -> api 검색란에 INTENT목록 전체 가져오기.
router.post('/selectAllApiUrlIntent', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
        var selectAll = "SELECT INTENT FROM TBL_LUIS_INTENT";

        (async () => {
            try {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'FN_SMALLTALK_ENTITY_ORDERBY_ADD 함수 엔티티 조회');
    
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                    let result1 = await pool.request().query(selectAll);
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
                            records : 0,
                            rows : null
                        });
                    }   
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

//api 관리 -> 체크된 항목 삭제 / 신규등록
router.post('/apiUrlProc', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var dataArr = JSON.parse(req.body.saveArr);
    var deleteStr = " DELETE FROM TBL_CHATBOT_API WHERE SID = @DELETE_SID; ";
    var insertStr = " INSERT INTO TBL_CHATBOT_API (API_NAME, API_INTENT, API_URL) " +
                    " VALUES ( @API_NAME, @API_INTENT, @API_URL);";
    var updateStr = "UPDATE TBL_CHATBOT_API SET API_NAME=@API_NAME, API_INTENT=@API_INTENT, API_URL = @API_URL WHERE SID = @UPDATE_SID; ";
    var userId = req.session.sid;
    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            for (var i = 0; i < dataArr.length; i++) {
                if (dataArr[i].statusFlag === 'DEL') {
                    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_API 테이블 제거 sid:' + dataArr[i].DELETE_SID);
                
                    var deleteApiUrl = await pool.request()
                        .input('DELETE_SID', sql.NVarChar, injection.changeAttackKeys(dataArr[i].DELETE_SID))
                        .query(deleteStr);            
                } else if (dataArr[i].statusFlag === 'ADD') {
                   // logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_QUERY_ANALYSIS_RESULT 테이블 등록 sid:' + dataArr[i].DELETE_SID);
                    
                    var insertApiUrl = await pool.request()
                        .input('API_NAME', sql.NVarChar, injection.changeAttackKeys(dataArr[i].NAME))
                        .input('API_INTENT', sql.NVarChar, injection.changeAttackKeys(dataArr[i].INTENT))
                        .input('API_URL', sql.NVarChar, injection.changeAttackKeys(dataArr[i].URL))
                        .query(insertStr);            
                } else if (dataArr[i].statusFlag === 'UPDATE') {
                    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_API 테이블 수정 sid:' + dataArr[i].SID);
                    
                    var updateApiUrl = await pool.request()
                        .input('API_NAME', sql.NVarChar, injection.changeAttackKeys(dataArr[i].NAME))
                        .input('API_INTENT', sql.NVarChar, injection.changeAttackKeys(dataArr[i].INTENT))
                        .input('API_URL', sql.NVarChar, injection.changeAttackKeys(dataArr[i].URL))
                        .input('UPDATE_SID', sql.Int, injection.changeAttackKeys(dataArr[i].SID))
                        .query(updateStr);
                } else{
        
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

module.exports = router;