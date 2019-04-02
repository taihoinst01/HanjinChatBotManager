'use strict';
var express = require('express');
var Client = require('node-rest-client').Client;
var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var dbConnect = require('../../config/dbConnect');
var paging = require('../../config/paging');
var util = require('../../config/util');
var Client = require('node-rest-client').Client;
var Excel = require('exceljs');
var appRoot = require('app-root-path').path;

const syncClient = require('sync-rest-client');
const appDbConnect = require('../../config/appDbConnect');
const appSql = require('mssql');
const _excelDir = appRoot + '/ExpressApp2/ExpressApp2/excelDownload/';
//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end

//sql injection 
var injection = require("../../config/sqlInjection");

var router = express.Router();

//템플릿 관리
router.get('/historyList', function (req, res) {

    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
 
    var selectChannel = "";
    selectChannel += "  SELECT ISNULL(CHANNEL,'') AS CHANNEL FROM TBL_HISTORY_QUERY \n";
    selectChannel += "   WHERE 1=1 \n";
    selectChannel += "GROUP BY CHANNEL \n";
    
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_HISTORY_QUERY 테이블 조회 시작');

    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        //new sql.ConnectionPool(dbConfig).connect().then(pool => {
        return pool.request().query(selectChannel)
    }).then(result => {
        let rows = result.recordset

        req.session.channelList = rows;
        req.session.save(function(){
            res.render('chatbotMng/historyList', {   
                //selMenu: req.session.menu,
                //appName: req.session.appName,
                //subKey: req.session.subKey,
                channelList : rows
            });   
        });
        sql.close();
    }).catch(err => {
        logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        
        res.status(500).send({ message: "${err}"})
        sql.close();
    });
});

router.post('/selectHistoryListAll', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');

    var searchQuestion = req.body.searchQuestion;
    var searchUserId = req.body.searchUserId;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    var selMobilePc = req.body.selMobilePc;
    var selResult = req.body.selResult;

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds()
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_'+ pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';

    var fildPath_ = req.session.appName + '_' + req.session.sid + '_' + seedatetime + ".xlsx";
    
    if (chkBoardParams(req.body, req.session.channelList)) {
        logger.info('[에러]history 검색 필터 오류 [id : %s] [url : %s] [error : %s]', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, req.body.toString());
        res.send({ status: "PARAM_ERROR" });
    } else {
        (async () => {
            try {
    
                var QueryStr = "";
                QueryStr += "  SELECT tbx.* \n";
                QueryStr += "    FROM ( \n";
                QueryStr += "           SELECT ROW_NUMBER() OVER(ORDER BY A.SID DESC) AS NUM \n";
                QueryStr += "                  ,COUNT('1') OVER(PARTITION BY '1') AS TOTCNT \n";
                QueryStr += "                  ,CEILING((ROW_NUMBER() OVER(ORDER BY A.SID DESC))/ convert(numeric ,10)) PAGEIDX \n";
                QueryStr += "                  ,A.CUSTOMER_COMMENT_KR, A.CHATBOT_COMMENT_CODE, A.CHANNEL, A.RESULT, A.RESPONSE_TIME, A.USER_ID, A.REG_DATE, A.MOBILE_YN \n";
                QueryStr += "                  ,(CASE RTRIM(A.LUIS_INTENT) WHEN '' THEN 'NONE' \n";
                QueryStr += "                         ELSE ISNULL(A.LUIS_INTENT, 'NONE') END \n";
                QueryStr += "                  ) AS LUIS_INTENT \n";
                QueryStr += "                  ,(CASE RTRIM(A.LUIS_ENTITIES) WHEN '' THEN 'NONE' \n";
                QueryStr += "                         ELSE ISNULL(A.LUIS_ENTITIES, 'NONE') END \n";
                QueryStr += "                  ) AS LUIS_ENTITIES \n";
                QueryStr += "                  ,(CASE RTRIM(A.DLG_ID) WHEN '' THEN 'NONE' \n";
                QueryStr += "                         ELSE ISNULL(A.DLG_ID, 'NONE') END \n";
                QueryStr += "                  ) AS DLG_ID, A.SID, TBL_B.SAME_CNT \n";
                QueryStr += "             FROM TBL_HISTORY_QUERY A, \n";
                QueryStr += "                  ( \n";
                QueryStr += "			         SELECT CUSTOMER_COMMENT_KR AS TRANS_COMMENT, COUNT(CUSTOMER_COMMENT_KR) AS SAME_CNT \n";
                QueryStr += "                  	   FROM TBL_HISTORY_QUERY\n";
                QueryStr += "                  	   WHERE CUSTOMER_COMMENT_KR != '건의사항입력' \n";
                QueryStr += "                  GROUP BY CUSTOMER_COMMENT_KR\n";
                QueryStr += "                  ) TBL_B \n";
                QueryStr += "            WHERE RTRIM(CUSTOMER_COMMENT_KR) != '' \n";
                QueryStr += "              AND A.CUSTOMER_COMMENT_KR = TBL_B.TRANS_COMMENT \n";
                if (searchQuestion !== '') {
                    QueryStr += "     AND TBL_B.TRANS_COMMENT LIKE @searchQuestion \n";
                }

                if (searchUserId !== '') {
                    QueryStr += "     AND USER_ID LIKE @searchUserId \n";
                }
                
                if (selDate == 'today') {
                    QueryStr += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
                } else if (selDate == 'select') {
                    QueryStr += "AND CONVERT(date, @startDate) <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, @endDate) ";
                }
                if (selResult !== 'all') {
                    QueryStr += "AND	RESULT = @selResult \n";
                }
                if (selMobilePc !== 'all') {
                    QueryStr += " AND	MOBILE_YN = @selMobilePc \n";
                }
                QueryStr += "     ) tbx\n";
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_HISTORY_QUERY 테이블 조회 시작');
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                let result1 = await pool.request()
                        .input('searchQuestion', sql.NVarChar, '%' + searchQuestion + '%')
                        .input('searchUserId', sql.NVarChar, '%' + searchUserId + '%')
                        .input('startDate', sql.NVarChar, startDate)
                        .input('endDate', sql.NVarChar, endDate)
                        .input('selMobilePc', sql.NVarChar, selMobilePc)
                        .input('selResult', sql.NVarChar, selResult)
                        .query(QueryStr);
                
                let rows = result1.recordset;
                
                if (rows.length > 0) {
                    res.send({ rows: rows
                            , fildPath_: fildPath_
                            , appName : req.session.appName
                            , userId : req.session.sid
                            , status : true 
                    });
                } else {
                    res.send({
                        rows : [],
                        status : true
                    });
                }
            } catch (err) {
                logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
                res.send({ rows: [], status : false});
            } finally {
                sql.close();
            }
        })()
    }
});






router.post('/selectHistoryList', function (req, res) {

    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var searchQuestion = req.body.searchQuestion;
    var searchUserId = req.body.searchUserId;
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    //var selChannel = req.body.selChannel;
    var selResult = req.body.selResult;
    var selMobilePc = req.body.selMobilePc;
    var currentPage = checkNull(req.body.currentPage, 1);
    
    if (chkBoardParams(req.body, req.session.channelList)) {
        logger.info('[에러]history 검색 필터 오류 [id : %s] [url : %s] [error : %s]', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, req.body.toString());
        res.send({ status: "PARAM_ERROR" });
    } else {
        (async () => {
            try {
    
                var QueryStr = "";
                QueryStr += "  SELECT tbx.* \n";
                QueryStr += "    FROM ( \n";
                QueryStr += "           SELECT ROW_NUMBER() OVER(ORDER BY A.SID DESC) AS NUM \n";
                QueryStr += "                  ,COUNT('1') OVER(PARTITION BY '1') AS TOTCNT \n";
                QueryStr += "                  ,CEILING((ROW_NUMBER() OVER(ORDER BY A.SID DESC))/ convert(numeric ,10)) PAGEIDX \n";
                QueryStr += "                  ,A.CUSTOMER_COMMENT_KR, A.CHATBOT_COMMENT_CODE, A.CHANNEL, A.RESULT, A.RESPONSE_TIME, A.USER_ID, A.REG_DATE, A.MOBILE_YN \n";
                QueryStr += "                  ,(CASE RTRIM(A.LUIS_INTENT) WHEN '' THEN 'NONE' \n";
                QueryStr += "                         ELSE ISNULL(A.LUIS_INTENT, 'NONE') END \n";
                QueryStr += "                  ) AS LUIS_INTENT \n";
                QueryStr += "                  ,(CASE RTRIM(A.LUIS_ENTITIES) WHEN '' THEN 'NONE' \n";
                QueryStr += "                         ELSE ISNULL(A.LUIS_ENTITIES, 'NONE') END \n";
                QueryStr += "                  ) AS LUIS_ENTITIES \n";
                QueryStr += "                  ,(CASE RTRIM(A.DLG_ID) WHEN '' THEN 'NONE' \n";
                QueryStr += "                         ELSE ISNULL(A.DLG_ID, 'NONE') END \n";
                QueryStr += "                  ) AS DLG_ID, A.SID, TBL_B.SAME_CNT \n";
                QueryStr += "             FROM TBL_HISTORY_QUERY A \n";
                QueryStr += "             INNER JOIN  \n";
                QueryStr += "                  ( \n";
                QueryStr += "			         SELECT MAX(SID) AS TRANS_SID, CUSTOMER_COMMENT_KR AS TRANS_COMMENT, COUNT(CUSTOMER_COMMENT_KR) AS SAME_CNT  \n";
                QueryStr += "                  	   FROM TBL_HISTORY_QUERY\n";
                QueryStr += "                  	   WHERE 1 = 1 \n";
                QueryStr += "					     AND ISNULL(USER_ID, '') != '' \n";
                //QueryStr += "					     AND RTRIM(LTRIM(ISNULL(USER_ID, ''))) != '' \n";
                QueryStr += " 					     AND RTRIM(CUSTOMER_COMMENT_KR) != ''  \n";
                if (searchQuestion !== '') {
                    QueryStr += "     AND TBL_B.TRANS_COMMENT LIKE @searchQuestion \n";
                }

                if (searchUserId !== '') {
                    QueryStr += "     AND USER_ID LIKE @searchUserId \n";
                }
                
                if (selDate == 'today') {
                    QueryStr += " AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
                } else if (selDate == 'select') {
                    QueryStr += " AND CONVERT(date, @startDate) <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, @endDate) ";
                }
                if (selResult !== 'all') {
                    QueryStr += " AND	RESULT = @selResult \n";
                }
                if (selMobilePc !== 'all') {
                    QueryStr += " AND	MOBILE_YN = @selMobilePc \n";
                }
                QueryStr += "                  GROUP BY CUSTOMER_COMMENT_KR\n";
                QueryStr += "                   \n";
                QueryStr += "                   \n";
                QueryStr += "                  ) TBL_B \n";
                QueryStr += "				  ON SID = TBL_B.TRANS_SID \n";
                QueryStr += "            WHERE 1=1 \n";
                //QueryStr += "              AND A.CHATBOT_COMMENT_CODE NOT IN ('SAP') \n";
                QueryStr += "     ) tbx\n";
                QueryStr += "  WHERE PAGEIDX = @currentPage\n";
                
                logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_HISTORY_QUERY 테이블 조회 시작');
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                let result1 = await pool.request()
                        .input('searchQuestion', sql.NVarChar, '%' + searchQuestion + '%')
                        .input('searchUserId', sql.NVarChar, '%' + searchUserId + '%')
                        .input('startDate', sql.NVarChar, startDate)
                        .input('endDate', sql.NVarChar, endDate)
                        .input('selMobilePc', sql.NVarChar, selMobilePc)
                        .input('selResult', sql.NVarChar, selResult)
                        .input('currentPage', sql.NVarChar, currentPage)
                        .query(QueryStr);
                
                let rows = result1.recordset;
                
                if (rows.length > 0) {
                    res.send({ rows: rows, pageList: paging.pagination(currentPage, rows[0].TOTCNT), status : true });
                } else {
                    res.send({
                        rows : [],
                        status : true
                    });
                }
            } catch (err) {
                logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
                res.send({ rows: [], status : false}); 
                // ... error checks
            } finally {
                sql.close();
            }
        })()
    }
});


router.post('/selectHistoryDetail', function (req, res) {
    
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var sId = req.body.sId;

    (async () => {
        try {

            var QueryStr = "";
            QueryStr += "  SELECT tbx.* \n";
            QueryStr += "    FROM ( \n";
            QueryStr += "           SELECT ROW_NUMBER() OVER(ORDER BY A.SID DESC) AS NUM \n";
            QueryStr += "                  ,COUNT('1') OVER(PARTITION BY '1') AS TOTCNT \n";
            QueryStr += "                  ,CEILING((ROW_NUMBER() OVER(ORDER BY A.SID DESC))/ convert(numeric ,10)) PAGEIDX \n";
            QueryStr += "                  ,A.CUSTOMER_COMMENT_KR, A.CHATBOT_COMMENT_CODE, A.CHANNEL, A.RESULT, A.RESPONSE_TIME, A.USER_ID, A.REG_DATE \n";
            QueryStr += "                  ,(CASE RTRIM(A.LUIS_INTENT) WHEN '' THEN 'NONE' \n";
            QueryStr += "                         ELSE ISNULL(A.LUIS_INTENT, 'NONE') END \n";
            QueryStr += "                  ) AS LUIS_INTENT \n";
            QueryStr += "                  ,(CASE RTRIM(A.LUIS_ENTITIES) WHEN '' THEN 'NONE' \n";
            QueryStr += "                         ELSE ISNULL(A.LUIS_ENTITIES, 'NONE') END \n";
            QueryStr += "                  ) AS LUIS_ENTITIES \n";
            QueryStr += "                  ,(CASE RTRIM(A.DLG_ID) WHEN '' THEN 'NONE' \n";
            QueryStr += "                         ELSE ISNULL(A.DLG_ID, 'NONE') END \n";
            QueryStr += "                  ) AS DLG_ID, A.SID \n";
            QueryStr += "             FROM TBL_HISTORY_QUERY A, \n";
            QueryStr += "                  ( \n";
            QueryStr += "			         SELECT REPLACE(CUSTOMER_COMMENT_KR, ' ', '') AS TRANS_COMMENT \n";
            QueryStr += "                  	   FROM TBL_HISTORY_QUERY\n";
            QueryStr += "        			  WHERE RTRIM(CUSTOMER_COMMENT_KR) != '' \n";
            QueryStr += "        			    AND SID = @sId \n";
            QueryStr += "                  GROUP BY REPLACE(CUSTOMER_COMMENT_KR, ' ', '')\n";
            QueryStr += "                  ) TBL_B \n";
            QueryStr += "            WHERE RTRIM(CUSTOMER_COMMENT_KR) != '' \n";
            QueryStr += "              AND REPLACE(A.CUSTOMER_COMMENT_KR, ' ', '') = TBL_B.TRANS_COMMENT \n";
            //QueryStr += "              AND A.CHATBOT_COMMENT_CODE NOT IN ('SAP') \n";
            QueryStr += "     ) tbx\n";

            logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_HISTORY_QUERY 테이블 조회 시작');
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
                    .input('sId', sql.NVarChar, sId)
                    .query(QueryStr);

            let rows = result1.recordset;

            if (rows.length > 0) {
                res.send({ rows: rows, status : true });
            } else {
                res.send({
                    rows : [], 
                    status : true 
                });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ rows: [], status : false}); 
            // ... error checks
        } finally {
            sql.close();
        }
    })()


});


function checkNull(val, newVal) {
    if (val === "" || typeof val === "undefined" || val === "0") {
        return newVal;
    } else {
        return val;
    }
}

function is_number(v) {
    var reg = /^(\s|\d)+$/;
    return reg.test(v);
}

//검색 필터 체크
function chkBoardParams(bodyReq, channelList) {
    var startDate = bodyReq.startDate;
    var endDate = bodyReq.endDate;
    var selDate = bodyReq.selDate;
    //var selChannel = bodyReq.selChannel;

    var dataIsOk = false;
    //var chkDate = "SELECT CONVERT(date, '" + startDate + "') AS CHK1, CONVERT(date, '" + endDate + "') AS CHK2";
    try {
        if (selDate == 'select') {
            var dateArr = startDate.split('/');
            if (dateArr.length != 3) {
                dataIsOk = true;
            } else {
                for (var i=0; i<3; i++) {
                    if (!is_number(dateArr[i]*1)) {
                        dataIsOk = true;
                        break;
                    }
                }
            }

            dateArr = endDate.split('/');
            if (dateArr.length != 3) {
                dataIsOk = true;
            } else {
                for (var i=0; i<3; i++) {
                    if (!is_number(dateArr[i]*1)) {
                        dataIsOk = true;
                        break;
                    }
                }
            }
        }

        if (typeof startDate == 'undefined') {
            dataIsOk = true;
        } else if (startDate.trim() == '') {
            dataIsOk = true;
        }
        if (typeof endDate == 'undefined') {
            dataIsOk = true;
        } else if (endDate.trim() == '') {
            dataIsOk = true;
        }
        if (typeof selDate == 'undefined') {
            dataIsOk = true;
        } else {
            var chkSelDate = false;
            if (selDate.trim() == '') {
                chkSelDate = true;
            }
            if (selDate.trim() == 'allDay') {
                chkSelDate = true;
            }
            if (selDate.trim() == 'today') {
                chkSelDate = true;
            }

            if (selDate.trim() == 'select') {
                chkSelDate = true;
            }

            if (!chkSelDate) {
                dataIsOk = true;
            }
        }
/*
        if (typeof selChannel == 'undefined') {
            dataIsOk = true;
        } else if (selChannel.trim() == '') {
            dataIsOk = true;
        } else {
            if (selChannel.trim() == 'all') {

            } else if (channelList.findIndex(x => x.CHANNEL === selChannel) == -1) {
                dataIsOk = true;
            }
        }
*/
        return dataIsOk;
    }
    catch (err) {
        return false;
    }
}

function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

/**
 * Analysis 관리
 */
router.get('/analysisList', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/analysisList');
});

router.post('/selectAnalysisList', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var pageSize = checkNull(req.body.rows, 10);
    var currentPage = checkNull(req.body.currentPage, 1);
    var selResult = req.body.searchSelectRel;

    (async () => {
        try {

            var QueryStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY SEQ DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY SEQ DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         SEQ, QUERY, LUIS_ID, LUIS_INTENT, RESULT, UPD_DT \n" +
                           "          FROM TBL_QUERY_ANALYSIS_RESULT \n" +
                           "          WHERE 1=1 \n";
                        if (req.body.searchQuestiontText !== '') {
                            QueryStr += "AND QUERY like @searchQuestiontText \n";
                        }

                        if (req.body.searchIntentText !== '') {
                            QueryStr += "AND LUIS_INTENT like @searchIntentText \n";
                        }

                        if (selResult == ''||selResult == 'all') {
                            //nothing
                        }else if (selResult == 'NONE_DLG') {
                            QueryStr += " AND	LUIS_INTENT = 'NONE_DLG' \n";
                        }else{
                            QueryStr += " AND	RESULT = @selResult \n";
                        }


                        QueryStr +="  ) tbp WHERE PAGEIDX = @currentPage; \n";

            //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 조회');

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
                    .input('searchQuestiontText', sql.NVarChar, '%' + req.body.searchQuestiontText + '%')
                    .input('searchIntentText', sql.NVarChar, '%' + req.body.searchIntentText + '%')
                    .input('selResult', sql.NVarChar, selResult)
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

router.post('/analysisProc', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    
    var dataArr = JSON.parse(req.body.saveArr);
    var deleteStr = "DELETE FROM TBL_QUERY_ANALYSIS_RESULT WHERE SEQ = @DELETE_ST_SEQ; ";
    var updateStr = "UPDATE TBL_QUERY_ANALYSIS_RESULT SET LUIS_ID='cjEmployeeCB1', LUIS_INTENT='NONE_DLG', LUIS_ENTITIES='NONE', LUIS_INTENT_SCORE=1, RESULT='H', UPD_DT=GETDATE() WHERE SEQ=@DELETE_ST_SEQ;"
    var userId = req.session.sid;
    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            for (var i = 0; i < dataArr.length; i++) {
                if (dataArr[i].statusFlag === 'DEL') {
                    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_QUERY_ANALYSIS_RESULT 테이블 제거 seq:' + dataArr[i].DELETE_ST_SEQ);
                
                    var deleteAnalysis = await pool.request()
                            .input('DELETE_ST_SEQ', sql.NVarChar, injection.changeAttackKeys(dataArr[i].DELETE_ST_SEQ))
                            .query(deleteStr);

                }else if (dataArr[i].statusFlag === 'NONE') {
                    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_QUERY_ANALYSIS_RESULT 테이블 UPDATE seq:' + dataArr[i].DELETE_ST_SEQ);
                
                    var updateAnalysis = await pool.request()
                            .input('DELETE_ST_SEQ', sql.NVarChar, injection.changeAttackKeys(dataArr[i].DELETE_ST_SEQ))
                            .query(updateStr);
                
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

/**
 * summary 관리
 */
router.get('/summaryList', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/summaryList');
});

router.post('/selectSummaryList', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var startDate = req.body.startDate;
    var startTime = req.body.startTime;
    var endDate = req.body.endDate;
    var endTime = req.body.endTime;

    var startDateTime = startDate + " " + startTime;
    var endDateTime = endDate + " " + endTime;

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds()
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_'+ pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';
    var fildPath_ = req.session.appName + '_' + req.session.sid + '_' + seedatetime + ".xlsx";

    (async () => {
        try {

            var QueryStr = "";
            QueryStr = "SELECT	CUSTOMER_COMMENT_KR, \n" +
            "		CHATBOT_COMMENT_CODE,  \n" +
            "		USER_ID,  \n" +
            "		CASE RESULT  \n" +
            "			WHEN 'H'  \n" +
            "				THEN '정상응답'  \n" +
            "			WHEN 'D'  \n" +
            "				THEN '미응답'  \n" +
            "			WHEN 'G'  \n" +
            "				THEN '건의사항'  \n" +
            "			WHEN 'S'  \n" +
            "				THEN '스몰톡'  \n" +
            "			ELSE  \n" +
            "				RESULT  \n" +
            "		END AS RESULT,  \n" +
            "		SUBSTRING(REG_DATE,12,2) + '00-' + (REPLICATE('0',2-LEN(SUBSTRING(REG_DATE,12,2) + 1)) +   \n" +
            "		CONVERT(VARCHAR(2), (SUBSTRING(REG_DATE,12,2) + 1)) + '00') AS REG_DATE_TIME  \n" +
            "FROM TBL_HISTORY_QUERY  \n" +
            "WHERE 1=1  \n" +
            "AND REG_DATE >= '"+startDateTime+"'  \n" +
            "AND REG_DATE < '"+endDateTime+"'  \n" +
            "AND USER_ID IS NOT NULL  \n" +
            "AND USER_ID <> ''  \n" +
            "AND USER_ID NOT IN ('ejnam', 'ep47','sbpark88','lyhaz7','sokang337','srjang','p41044104','parkfaith','tiger820','jmh2244','dbendus','kevin82','eunyeong')  \n" +
            "ORDER BY SID ASC;  \n";
            //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'TBL_SMALLTALK 테이블 조회');

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
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


                res.send({
                    records: recordList.length,
                    total: totCnt,
                    rows: recordList,
                    fildPath_: fildPath_
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

/**
 * summary 관리(시간별)
 */
router.get('/summaryListTime', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/summaryListTime');
});

router.post('/selectSummaryListTime', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var startDate = req.body.startDate;
    var startTime = req.body.startTime;
    var endDate = req.body.endDate;
    var endTime = req.body.endTime;

    var startDateTime = startDate + " " + startTime;
    var endDateTime = endDate + " " + endTime;

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds()
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_'+ pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';
    var fildPath_ = req.session.appName + '_' + req.session.sid + '_' + seedatetime + ".xlsx";

    (async () => {
        try {

            var QueryStr = "";
            QueryStr = "SELECT  \n" +
            "    left(A.DDATE, 4)+'년 '+substring(A.DDATE, 5,2)+'월 '+substring(A.DDATE, 7,2)+'일 '+substring(A.DDATE, 9,2)+'시' AS 'SUMMARY_DATE' \n" +
            "    , SUM(A.H) AS 'RESPONSE_SUCCESS' , SUM(A.D) AS 'RESPONSE_FAIL' , SUM(A.E) AS 'ERROR' , SUM(A.S) AS 'SMALLTALK' \n" +
            "    , SUM(A.Q) AS 'QNA' , SUM(A.Z) AS 'QNA_FAIL' , SUM(A.I) AS 'SAP_INIT' \n" +
            "    , SUM(A.G) AS 'SUGGEST' , SUM(A.B) AS 'BANNEDWORD' , SUM(A.CNT) AS 'TOTAL' \n" +
            "FROM \n" +
            "   ( \n" +
            "    SELECT  \n" +
            "      CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112) + \n" +
            "      LEFT(CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),8),2) DDATE, \n" +
            "      SUM(CASE RESULT WHEN 'H' THEN 1 ELSE 0 END) AS 'H', SUM(CASE RESULT WHEN 'D' THEN 1 ELSE 0 END) AS 'D', \n" +
            "      SUM(CASE RESULT WHEN 'E' THEN 1 ELSE 0 END) AS 'E', SUM(CASE RESULT WHEN 'S' THEN 1 ELSE 0 END) AS 'S', \n" +
            "      SUM(CASE RESULT WHEN 'Q' THEN 1 ELSE 0 END) AS 'Q', SUM(CASE RESULT WHEN 'Z' THEN 1 ELSE 0 END) AS 'Z', \n" +
            "      SUM(CASE RESULT WHEN 'I' THEN 1 ELSE 0 END) AS 'I', SUM(CASE RESULT WHEN 'G' THEN 1 ELSE 0 END) AS 'G', \n" +
            "   SUM(CASE RESULT WHEN 'B' THEN 1 ELSE 0 END) AS 'B', COUNT(*) AS CNT \n" +
            "    FROM TBL_HISTORY_QUERY \n" +
            "    WHERE USER_ID IS NOT NULL and USER_ID <> '' AND USER_ID NOT IN ('ep47','eunyeong','sbpark88','lyhaz7','sokang337','srjang','p41044104','parkfaith','tiger820','jmh2244','dbendus','kevin82','ejnam','eunyeong') \n" +
            "    AND  (REG_DATE > '"+startDateTime+"' AND REG_DATE < '"+endDateTime+"') \n" +
            "    GROUP BY CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112) + LEFT(CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),8),2), RESULT \n" +
            "   ) A \n" +
            "  GROUP BY A.DDATE \n" +
            "  ORDER BY A.DDATE ASC; \n" ;

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = await pool.request()
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


                res.send({
                    records: recordList.length,
                    total: totCnt,
                    rows: recordList,
                    fildPath_: fildPath_
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

/**
 * summary 관리(사용자별)
 */
router.get('/summaryListUser', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/summaryListUser');
});

router.post('/selectSummaryListUser', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var startDate = req.body.startDate;
    var startTime = req.body.startTime;
    var endDate = req.body.endDate;
    var endTime = req.body.endTime;
    var pcMobile = req.body.pcMobile;

    var startDateTime = startDate + " " + startTime;
    var endDateTime = endDate + " " + endTime;

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds()
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_'+ pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';
    var fildPath_ = req.session.appName + '_' + req.session.sid + '_' + seedatetime + ".xlsx";

    (async () => {
        try {

            var userQueryStr = "";
            userQueryStr = "SELECT * FROM  ( \n" +
            " SELECT USER_ID, COUNT(USER_ID) AS Q_CNT FROM TBL_HISTORY_QUERY \n" +
            " WHERE USER_ID IS NOT NULL AND USER_ID <> ''  AND USER_ID NOT IN ('ejnam', 'ep47','sbpark88','lyhaz7','sokang337','srjang','p41044104','parkfaith','tiger820','jmh2244','dbendus','kevin82','eunyeong') \n" +
            " AND  (REG_DATE > '"+startDateTime+"' AND REG_DATE < '"+endDateTime+"') \n" +
            " GROUP BY USER_ID  \n" +
            " ) A ORDER BY A.Q_CNT DESC; \n";

            var pcMobileQueryStr = "";
            pcMobileQueryStr = "SELECT \n" +
            " USER_ID,  COUNT(MOBILE_YN) AS Q_CNT \n" +
            " FROM TBL_HISTORY_QUERY \n" +
            " WHERE USER_ID IS NOT NULL AND USER_ID <> '' AND USER_ID NOT IN ('ejnam', 'ep47','sbpark88','lyhaz7','sokang337','srjang','p41044104','parkfaith','tiger820','jmh2244','dbendus','kevin82','eunyeong') \n" +
            " AND   (REG_DATE > '"+startDateTime+"' AND REG_DATE < '"+endDateTime+"')  AND MOBILE_YN='"+pcMobile+"' \n" +
            " GROUP BY MOBILE_YN, USER_ID; \n" ;

           
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = "";
            if(pcMobile=="NONE"){
                result1 = await pool.request().query(userQueryStr);
            }else{
                result1 = await pool.request().query(pcMobileQueryStr);
            }
            

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


                res.send({
                    records: recordList.length,
                    total: totCnt,
                    rows: recordList,
                    fildPath_: fildPath_
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

/**
 * summary 관리(intent별사용내역날짜)
 */
router.get('/summaryListIntentDate', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/summaryListIntentDate');
});

router.post('/selectSummaryListIntentDate', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var searchDate = req.body.searchDate;
    var pcMobile = req.body.pcMobile;

    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds()
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_'+ pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';
    var fildPath_ = req.session.appName + '_' + req.session.sid + '_' + seedatetime + ".xlsx";

    (async () => {
        try {

            var QueryStr = "";
            QueryStr = "SELECT * FROM ( \n" +
            " SELECT  \n" +
            " CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112) AS 'reg_date', LUIS_INTENT,  COUNT(*) as 'COUNT' \n" +
            " FROM TBL_HISTORY_QUERY \n" +
            " WHERE USER_ID IS NOT NULL  \n" +
            " AND   USER_ID IS NOT NULL and USER_ID <> '' AND USER_ID NOT IN ('ejnam', 'ep47','sbpark88','lyhaz7','sokang337','srjang','p41044104','parkfaith','tiger820','jmh2244','dbendus','kevin82','eunyeong') \n" +
            " AND  CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112)  = '"+searchDate+"' \n" +
            " AND  RESULT = 'H' \n";

            if(pcMobile=="NONE"){
                //nothing
            }else{
                QueryStr += "AND MOBILE_YN='"+pcMobile+"' \n";
            }

            QueryStr  += " GROUP BY CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112), LUIS_INTENT \n" +
            " HAVING 1=1 \n" +
            " ) Z ORDER BY COUNT DESC, LUIS_INTENT ASC; \n";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = "";
            result1 = await pool.request().query(QueryStr);
            
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


                res.send({
                    records: recordList.length,
                    total: totCnt,
                    rows: recordList,
                    fildPath_: fildPath_
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

/**
 * summary 관리(intent분류별)
 */
router.get('/summaryListIntent', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    res.render('chatbotMng/summaryListIntent');
});

router.post('/selectSummaryListIntent', function (req, res) {
    //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var searchDate = req.body.searchDate;
    
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;      // "+ 1" becouse the 1st month is 0
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var secconds = date.getSeconds()
    var seedatetime = year + pad(day, 2) + pad(month, 2) + '_'+ pad(hour, 2) + 'h' + pad(minutes, 2) + 'm' + pad(secconds, 2) + 's';
    var fildPath_ = req.session.appName + '_' + req.session.sid + '_' + seedatetime + ".xlsx";

    (async () => {
        try {

            var QueryStr = "";
            QueryStr = "SELECT  \n" +
            "  A.날짜,  \n" +
            "  A.총무_P + A.총무_M AS 총무_총합,  \n" +
            "  A.총무_P, A.총무_M,  \n" +
            "  A.인사_P + A.인사_M AS 인사_총합, \n" +
            "  A.인사_P, A.인사_M, \n" +
            "  A.재무_P + A.재무_M AS 재무_총합,   \n" +
            "  A.재무_P, A.재무_M, \n" +
            "  A.IT_P + A.IT_M AS IT_총합,  \n" +
            "  A.IT_P, A.IT_M,  \n" +
            "  A.법무_P + A.법무_M AS 법무_총합,  \n" +
            "  A.법무_P, A.법무_M,  \n" +
            "  A.CSV_P + A.CSV_M AS CSV_총합,  \n" +
            "  A.CSV_P, A.CSV_M,  \n" +
            "  A.블로썸파크_P + A.블로썸파크_M AS 블로썸파크_총합, \n" +
            "  A.블로썸파크_P, A.블로썸파크_M,  \n" +
            "  A.총무_P + A.인사_P + A.재무_P + A.IT_P + A.법무_P + A.CSV_P + A.블로썸파크_P + A.총무_M + A.인사_M + A.재무_M + A.IT_M + A.법무_M + A.CSV_M + A.블로썸파크_M AS '총합', \n" +
            "  A.총무_P + A.인사_P + A.재무_P + A.IT_P + A.법무_P + A.CSV_P + A.블로썸파크_P AS '총합_P', \n" +
            "  A.총무_M + A.인사_M + A.재무_M + A.IT_M + A.법무_M + A.CSV_M + A.블로썸파크_M AS '총합_M'  \n" +
            " FROM \n" +
            "  ( \n" +
            "  SELECT  \n" +
            "     CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112) AS '날짜', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,2) = '총무' OR LUIS_INTENT = 'welcome_총무') AND MOBILE_YN='P') THEN 1 ELSE 0 END) AS '총무_P', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,2) = '총무' OR LUIS_INTENT = 'welcome_총무') AND MOBILE_YN='M') THEN 1 ELSE 0 END) AS '총무_M', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = '전사인사' OR LUIS_INTENT = 'welcome_인사') AND MOBILE_YN='P') THEN 1 ELSE 0 END) AS '인사_P', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = '전사인사' OR LUIS_INTENT = 'welcome_인사') AND MOBILE_YN='M') THEN 1 ELSE 0 END) AS '인사_M', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = '전사재무' OR LUIS_INTENT = 'welcome_재무') AND MOBILE_YN='P') THEN 1 ELSE 0 END) AS '재무_P', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = '전사재무' OR LUIS_INTENT = 'welcome_재무') AND MOBILE_YN='M') THEN 1 ELSE 0 END) AS '재무_M', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,2) = 'IT' OR  LEFT(LUIS_INTENT,4) = '전사IT' OR LUIS_INTENT = 'welcome_IT') AND MOBILE_YN='P') THEN 1 ELSE 0 END) AS 'IT_P', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,2) = 'IT' OR  LEFT(LUIS_INTENT,4) = '전사IT' OR LUIS_INTENT = 'welcome_IT') AND MOBILE_YN='M') THEN 1 ELSE 0 END) AS 'IT_M', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = '전사법무' OR LUIS_INTENT = 'welcome_법무') AND MOBILE_YN='P') THEN 1 ELSE 0 END) AS '법무_P', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = '전사법무' OR LUIS_INTENT = 'welcome_법무') AND MOBILE_YN='M') THEN 1 ELSE 0 END) AS '법무_M', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,5) = '전사CSV' OR LUIS_INTENT = 'welcome_CSV') AND MOBILE_YN='P') THEN 1 ELSE 0 END) AS 'CSV_P', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,5) = '전사CSV' OR LUIS_INTENT = 'welcome_CSV') AND MOBILE_YN='M') THEN 1 ELSE 0 END) AS 'CSV_M', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = 'CJBP' OR LUIS_INTENT = 'welcome_블로썸파크') AND MOBILE_YN='P') THEN 1 ELSE 0 END) AS '블로썸파크_P', \n" +
            "     SUM(CASE WHEN ((LEFT(LUIS_INTENT,4) = 'CJBP' OR LUIS_INTENT = 'welcome_블로썸파크') AND MOBILE_YN='M') THEN 1 ELSE 0 END) AS '블로썸파크_M' \n" +
            "  FROM TBL_HISTORY_QUERY \n" +
            "  WHERE USER_ID IS NOT NULL  \n" +
            "  AND  USER_ID <> '' \n" +
            "  AND  USER_ID NOT IN ('ejnam', 'ep47','sbpark88','lyhaz7','sokang337','srjang','p41044104','parkfaith','tiger820','jmh2244','dbendus','kevin82','eunyeong') \n" +
            "  AND  CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112)  > '"+searchDate+"' \n" +
            "  GROUP BY CONVERT(VARCHAR,CONVERT(DATETIME,REG_DATE),112) \n" +
            " ) A; \n";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            let result1 = "";
            result1 = await pool.request().query(QueryStr);
            
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


                res.send({
                    records: recordList.length,
                    total: totCnt,
                    rows: recordList,
                    fildPath_: fildPath_
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


module.exports = router;