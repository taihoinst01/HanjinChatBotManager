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

var router = express.Router();

//챗봇 환경관리
router.get('/chatbotEnv', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/chatbotEnv');
});

router.post('/selectChatbotEnv', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var chatbotName = req.body.chatbotName;

    (async () => {
        try {



            var chatBotDbStr = "SELECT \n" +
                           " USER_NAME, PASSWORD, SERVER, DATABASE_NAME \n" +
                           " FROM TBL_DB_CONFIG \n" +
                           " WHERE APP_NAME = @chatbotName; \n";
            var chatBotLuisStr = "SELECT TOP 1 \n" +
                            " (SELECT CNF_VALUE FROM TBL_CHATBOT_CONF WHERE CNF_TYPE='LUIS_TIME_LIMIT') AS LUIS_TIME_LIMIT, \n" +
                            " (SELECT CNF_VALUE FROM TBL_CHATBOT_CONF WHERE CNF_TYPE='LUIS_SCORE_LIMIT') AS LUIS_SCORE_LIMIT \n" +
                            " FROM TBL_CHATBOT_CONF; \n";

            let db_pool = await dbConnect.getConnection(sql);
            let db_result = await db_pool.request()
                    .input('chatbotName', sql.NVarChar, chatbotName)
                    .query(chatBotDbStr);

            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_DB_CONFIG 테이블 조회 시작');
            let luis_pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_CONF 테이블 조회 시작');
            let luis_result = await luis_pool.request().query(chatBotLuisStr);

            let db_rows = db_result.recordset;
            let luis_rows = luis_result.recordset;

            var recordList = [];
            var db_recordList = [];
            var luis_recordList = [];
            for (var i = 0; i < db_rows.length; i++) {
                var db_item = {};
                db_item = db_rows[i];
                db_recordList.push(db_item);
            }

            for (var j = 0; j < luis_rows.length; j++) {
                var luis_item = {};
                luis_item = luis_rows[j];
                luis_recordList.push(luis_item);
            }

            recordList = db_recordList.concat(luis_recordList);
            if (recordList.length > 0) {

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

router.post('/procChatBotEnv', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var dataArr = JSON.parse(req.body.saveArr);
    var updateTimeLimit = "";
    var updateScoreLimit = "";
    var deleteAPIInfoQry = "";
    var insertAPIInfoQry = "";
    var orderNo = 0;
    var userId = req.session.sid;

    for (var i = 0; i < dataArr.length; i++) {
        if (dataArr[i].statusFlag === 'UPDATE') {
            updateTimeLimit += "UPDATE TBL_CHATBOT_CONF SET CNF_VALUE="+dataArr[i].LUIS_TIME_LIMIT+" WHERE CNF_TYPE = 'LUIS_TIME_LIMIT'; ";
            updateScoreLimit += "UPDATE TBL_CHATBOT_CONF SET CNF_VALUE="+dataArr[i].LUIS_SCORE_LIMIT+" WHERE CNF_TYPE = 'LUIS_SCORE_LIMIT'; ";
        }else if (dataArr[i].statusFlag === 'API') {
            if(i==0){
                deleteAPIInfoQry += "DELETE FROM TBL_CHATBOT_CONF WHERE CNF_TYPE='API'; ";
            }else{
                //미실행
            }
            orderNo = i + 1;
            insertAPIInfoQry += "INSERT INTO TBL_CHATBOT_CONF (CNF_TYPE, CNF_NM, CNF_VALUE, ORDER_NO) VALUES ( ";
            insertAPIInfoQry += " 'API','" + dataArr[i].API_NAME + "', '" + dataArr[i].API_URL + "', " + orderNo + ");";
        } else { //DEL
            
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            if (updateTimeLimit !== "") {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_CONF 테이블 수정1');
                let updateTimeLimitP = await pool.request()
                .query(updateTimeLimit);
            }
            if (updateScoreLimit !== "") {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_CONF 테이블 수정2');
                let updateBannedWordP = await pool.request().query(updateScoreLimit);
            }

            if (deleteAPIInfoQry !== "") {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_CONF 테이블 삭제');
                let deleteAPIInfo = await pool.request().query(deleteAPIInfoQry);
            }

            if (insertAPIInfoQry !== "") {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_CONF 테이블 추가');
                let insertAPIInfo = await pool.request().query(insertAPIInfoQry);
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

router.post('/selectAPIInfo', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
   
    (async () => {
        try {

            var QueryStr = "SELECT CNF_NM, CNF_VALUE, ORDER_NO FROM TBL_CHATBOT_CONF WHERE CNF_TYPE ='API';";

            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_CONF 테이블 api 조회');
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
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
                    records : 0,
                    rows : null
                });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })


});



module.exports = router;