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
        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
        res.render("chatbotMng/userReport")
    });

//챗봇후기 리스트 출력
router.post('/selectReportList', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var pageSize = checkNull(req.body.rows, 10);
    var currentPage = checkNull(req.body.currentPage, 1);
    (async () => {
        try {

            var QueryStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY SID ASC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY SID DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         SID, R_COUNT, R_COMMENT, R_WDATE \n" +
                           "          FROM TBL_CHATBOT_USEREPORT \n" +
                           "          WHERE 1=1 \n";
                QueryStr +="  ) tbp WHERE PAGEIDX = @currentPage; \n";            

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
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

module.exports = router;