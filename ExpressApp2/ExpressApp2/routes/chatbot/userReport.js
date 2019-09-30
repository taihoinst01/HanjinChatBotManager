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
router.get('/userReport', function (req, res, next) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?") > 0 ? req.originalUrl.split("?")[0] : req.originalUrl, 'router 시작');
    res.render("chatbotMng/userReport")
});

//챗봇후기 리스트 출력
router.post('/selectReportList', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var currentPage = checkNull(req.body.currentPage, 1);
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selPoint = req.body.selPoint;
    (async () => {
        try {

            var QueryStr = "SELECT tbp.* from \n" +
                " (SELECT ROW_NUMBER() OVER(ORDER BY SID ASC) AS NUM, \n" +
                "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n" +
                "         CEILING((ROW_NUMBER() OVER(ORDER BY SID DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                "         SID, R_COUNT, R_COMMENT, R_WDATE \n" +
                "          FROM TBL_CHATBOT_USEREPORT \n" +
                "          WHERE 1=1 \n";
            QueryStr += "AND CONVERT(date, @startDate) <= CONVERT(date, R_WDATE)  AND  CONVERT(date, R_WDATE)   <= CONVERT(date, @endDate) ";
            if (selPoint !== 'all') {
                QueryStr += "AND	R_COUNT = @selPoint \n";
            }
            QueryStr += "  ) tbp WHERE PAGEIDX = @currentPage; \n";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
                .input('currentPage', sql.NVarChar, currentPage)
                .input('startDate', sql.NVarChar, startDate)
                .input('endDate', sql.NVarChar, endDate)
                .input('selPoint', sql.NVarChar, selPoint)
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
                    records: 0,
                    rows: null
                });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?") > 0 ? req.originalUrl.split("?")[0] : req.originalUrl, err.message);
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

router.post('/selectReportListAll', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var currentPage = checkNull(req.body.currentPage, 1);
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selPoint = req.body.selPoint;

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds();
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_' + pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';
    var fildPath_ = req.session.appName + '_Chatbot Report_' + req.session.sid + '_' + seedatetime + ".xlsx";

    (async () => {
        try {

            var QueryStr = "SELECT SID, R_COUNT, R_COMMENT, R_WDATE \n" +
                "FROM TBL_CHATBOT_USEREPORT \n" +
                "WHERE 1=1 \n";
            QueryStr += "AND CONVERT(date, @startDate) <= CONVERT(date, R_WDATE)  AND  CONVERT(date, R_WDATE)   <= CONVERT(date, @endDate) ";
            if (selPoint !== 'all') {
                QueryStr += "AND	R_COUNT = @selPoint \n";
            }
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
                .input('startDate', sql.NVarChar, startDate)
                .input('endDate', sql.NVarChar, endDate)
                .input('selPoint', sql.NVarChar, selPoint)
                .query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};
                item = rows[i];

                recordList.push(item);
            }

            if (rows.length > 0) {
                res.send({
                    rows: rows
                    , fildPath_: fildPath_
                    , appName: req.session.appName
                    , userId: req.session.sid
                    , status: true
                });
            } else {
                res.send({
                    rows: [],
                    status: true
                });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?") > 0 ? req.originalUrl.split("?")[0] : req.originalUrl, err.message);
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

function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

module.exports = router;