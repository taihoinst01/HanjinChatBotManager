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

//템플릿 관리
router.get('/templateMng', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/templateMng');
});

router.post('/selectTemplateList', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
     
    var pageSize = checkNull(req.body.rows, 10);
    var currentPage = checkNull(req.body.currentPage, 1);
    var chatbotName = req.body.chatbotName;

    (async () => {
        try {

            var QueryStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY SEQ DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY SEQ DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         SEQ, HEADER_COLOR, BODY_COLOR, POPHEADER_COLOR, BOT_COLOR, USER_COLOR, ICON_IMG, BACKGROUND_IMG, CHATBOT_NAME, REG_DT, USE_YN \n" +
                           "          FROM TBL_CHATBOT_TEMPLATE ) tbp \n" +
                           " WHERE CHATBOT_NAME = '"+chatbotName+ "' \n" +
                           "   AND PAGEIDX = " + currentPage + "; \n";

            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_TEMPLATE 테이블 조회 시작');

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

router.post('/procTemplate', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var dataArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateAllStr = "";
    var updateStr = "";
    var deleteStr = "";
    var userId = req.session.sid;

    for (var i = 0; i < dataArr.length; i++) {
        if (dataArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TBL_CHATBOT_TEMPLATE (HEADER_COLOR, BODY_COLOR, POPHEADER_COLOR, BOT_COLOR, USER_COLOR, ICON_IMG, BACKGROUND_IMG, CHATBOT_NAME, REG_DT, USE_YN) " +
                "VALUES (";
            saveStr += " '" + dataArr[i].HEADER_COLOR + "', '" + dataArr[i].BODY_COLOR + "', '" + dataArr[i].POPHEADER_COLOR + "', '" + dataArr[i].BOT_COLOR + "', '" + dataArr[i].USER_COLOR + "', '" + dataArr[i].ICON_IMG + "', '" + dataArr[i].BACKGROUND_IMG + "', '" + dataArr[i].CHATBOT_NAME + "', GETDATE() , 'N');";
        } else if (dataArr[i].statusFlag === 'UPDATE_USEYN') {
            updateAllStr += "UPDATE TBL_CHATBOT_TEMPLATE SET USE_YN ='N' WHERE CHATBOT_NAME = '" + dataArr[i].CHATBOT_NAME + "';";
            updateStr += "UPDATE TBL_CHATBOT_TEMPLATE SET USE_YN ='Y' WHERE SEQ = '" + dataArr[i].USEYN_SEQ + "'; ";
        } else { //DEL
            deleteStr += "DELETE FROM TBL_CHATBOT_TEMPLATE WHERE SEQ = '" + dataArr[i].DEL_SEQ + "'; ";
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveStr !== "") {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_TEMPLATE 테이블 추가');
                let insertTemplate = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_TEMPLATE 테이블 수정1');
                let updateTemplateAll = await pool.request().query(updateAllStr);
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_TEMPLATE 테이블 수정2');
                let updateTemplate = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_TEMPLATE 테이블 삭제');
                let deleteBannedWord = await pool.request().query(deleteStr);
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