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

//챗봇후기 관리 페이지 경로
router.get('/reportInsert', function (req, res, next) {
        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
        res.render("chatbotMng/reportInsert")
    });

//후기등록 -> 후기 저장
router.post('/reportInsert', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var contentsMessage = req.body.contentsMessage;
    var starCnt = req.body.starCnt;
    var insertReport = " INSERT INTO TBL_CHATBOT_USEREPORT (R_COUNT, R_COMMENT, R_WDATE ) " +
                    " VALUES ( @R_COUNT, @R_COMMENT, getdate());";
    var userId = req.session.sid;
    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

                if ( (contentsMessage != "" && contentsMessage != null) && starCnt > 0) {
                    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_CHATBOT_USEREPORT 테이블 추가' );
                
                    var insertStr = await pool.request()
                        .input('R_COUNT', sql.Int, injection.changeAttackKeys(starCnt))
                        .input('R_COMMENT', sql.NVarChar, injection.changeAttackKeys(contentsMessage))
                        .query(insertReport);            
                } else{
        
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