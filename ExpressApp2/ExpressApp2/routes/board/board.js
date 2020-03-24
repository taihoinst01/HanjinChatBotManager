'use strict';

var express = require('express');
var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var autowayDbConfig = require('../../config/dbConfig').autowayDbConfig;
var dbConnect = require('../../config/dbConnect');
var paging = require('../../config/paging');
var util = require('../../config/util');
//var luisConfig = require('../../config/luisConfig');

const syncClient = require('sync-rest-client');
//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end

var luisUtil = require("../../config/luisUtil");
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    

    (async () => {
        try { 

            var userId = req.session.sid;
            req.session.menu = 'm2';
            //로그인체크
            if (!req.session.sid) {
                res.render( 'board_new' );   
            }
            if (typeof req.query.appName !== 'undefined') {
                req.session.appName = req.query.appName;
                //req.session.subKey = luisConfig.subKey;

                //챗봇에 속한 앱리스트 새션 저장
                var selChatInfo = new Object();
                var chatList = req.session.leftList;
                var appList = req.session.ChatRelationAppList;
                for (var kk=0; kk<chatList.length; kk++) {
                    if (req.query.appName == chatList[kk].CHATBOT_NAME) {
                        var tmpObj = new Object();
                        tmpObj.chatId = chatList[kk].CHATBOT_NUM;
                        tmpObj.chatName = chatList[kk].CHATBOT_NAME;

                        var tmpArr = [];    
                        for (var jj=0; jj<appList.length; jj++) {
                            if (tmpObj.chatId == appList[jj].CHAT_ID) {
                                tmpArr.push(appList[jj]);
                            }
                        }
                        tmpObj.appList = tmpArr;
                        selChatInfo.chatbot = tmpObj;
                        //selAppList.push(tmpObj);
                    }
                }
                
                req.session.selChatAppLength = selChatInfo.chatbot.appList.length;
                req.session.selChatInfo = selChatInfo;
            }
            

            var options = {
                headers: {
                    'Content-Type': 'application/json'
                    //,'Ocp-Apim-Subscription-Key': subKey
                }
            };
            var HOST = req.session.hostURL;
            var subKey = req.session.subKey;
            options.headers['Ocp-Apim-Subscription-Key'] = subKey;
            var selectedAppList = [];
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            //db에서 가져와서 session에 저장
            let getDBIntent_result = await pool.request()
                                                .query("SELECT APP_ID, INTENT, INTENT_ID, REG_ID, REG_DT, MOD_ID, MOD_DT FROM TBL_LUIS_INTENT ORDER BY CASE WHEN INTENT  LIKE '[0-9]%' THEN 3 WHEN INTENT like '[A-Za-z]%' THEN 1 ELSE 2 END, INTENT;");   
            req.session.intentList = getDBIntent_result.recordset;
            
            let getDBEntity_result = await pool.request()
                                                .query("SELECT APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT, MOD_DT FROM TBL_LUIS_ENTITY ORDER BY ENTITY_TYPE, ENTITY_NAME;");        
            req.session.entityList = getDBEntity_result.recordset;

            let getDBEntityChild_result = await pool.request()
                                                .query("SELECT ENTITY_ID, CHILDREN_ID, CHILDREN_NAME, SUB_LIST FROM TBL_LUIS_CHILD_ENTITY ORDER BY ENTITY_ID, CHILDREN_NAME;");              
            req.session.entityChildList = getDBEntityChild_result.recordset;

            res.redirect('/board/dashBoard');


        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.render('error');
        } finally {
            sql.close();
        }
    })()
});

router.get('/dashBoard', function (req, res) {

    var selectChannel = "";
    selectChannel += "  SELECT ISNULL(CHANNEL,'') AS CHANNEL FROM TBL_HISTORY_QUERY \n";
    selectChannel += "   WHERE 1=1 \n";
    selectChannel += "GROUP BY CHANNEL \n";
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        //new sql.ConnectionPool(dbConfig).connect().then(pool => {
        return pool.request().query(selectChannel)
    }).then(result => {
        let rows = result.recordset
        req.session.save(function(){
            res.render('board_new', {   
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



/* GET users listing. */
router.post('/intentScore', function (req, res) {

    //var startDate = req.body.startDate;
    //var endDate = req.body.endDate;
    var selDate = "";
    var startDate = req.body.startDate+" 00:00:00";
    var endDate = req.body.endDate+" 23:59:59";

    var selChannel = req.body.selChannel;
    let currentPageNo = checkNull(req.body.page, 1);

    var selectQuery = "";
    selectQuery += "SELECT tbp.* from ( \n";
    selectQuery += "SELECT  \n";
    selectQuery += "ROW_NUMBER() OVER(ORDER BY LUIS_INTENT DESC) AS NUM, \n";
    selectQuery += "COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n";
    selectQuery += "CEILING((ROW_NUMBER() OVER(ORDER BY LUIS_INTENT DESC))/ convert(numeric , 9)) PAGEIDX, \n";
    selectQuery += "LUIS_INTENT AS intentName, COUNT(*) AS  intentCount FROM TBL_HISTORY_QUERY WITH (INDEX(HISTORY_REGINDEX))\n";
    selectQuery += "WHERE LUIS_INTENT ! = '' \n";
    //selectQuery += "AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') ";
    selectQuery += "AND REG_DATE BETWEEN '" + startDate + "' AND '" + endDate + "' ";
    /*
    if (selDate !== 'allDay') {
        selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    */
    if (selChannel !== 'all') {
        selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
    }

    selectQuery += "GROUP BY LUIS_INTENT ) tbp \n";
    selectQuery += " WHERE 1=1 \n" +
                    " AND PAGEIDX = " + currentPageNo + "; \n";

    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request().query(selectQuery)
    }).then(result => {
        let rows = result.recordset
        res.send({list : rows, pageList : paging.pagination(currentPageNo,rows[0].TOTCNT)});
        sql.close();
    }).catch(err => {
        logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        res.send({ error_code: true, error_message : true})
        sql.close();
    });        
});

router.post('/getScorePanel', function (req, res) {
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    //var selDate = "";
    //var startDate = req.body.startDate+" 00:00:00";
    //var endDate = req.body.endDate+" 23:59:59";
    var selChannel = req.body.selChannel;

    var selectQuery = "";
        selectQuery += "SELECT   COUNT( DISTINCT USER_NUMBER) AS CUSOMER_CNT \n";
        selectQuery += "    , ISNULL(SUM(RESPONSE_TIME)/COUNT(RESPONSE_TIME), 0) AS REPLY_SPEED \n";
        selectQuery += "    , CASE WHEN COUNT(*) != 0 THEN COUNT(*)/COUNT(DISTINCT USER_NUMBER) ELSE 0 END AS USER_QRY_AVG \n";
        
        selectQuery += "    ,  (SELECT CASE WHEN COUNT(*) != 0 THEN ROUND(SUM(C.답변율)/ COUNT(*),2) ELSE 0 END    \n";
        selectQuery += "        FROM ( \n"; 
        selectQuery += "SELECT  ROUND(CAST(B.REPONSECNT AS FLOAT) / CAST(A.TOTALCNT AS FLOAT) * 100,2) AS 답변율, A.CHANNEL AS 채널, A.Dimdate AS REG_DATE \n";
        selectQuery += "FROM ( \n";
        selectQuery += "    SELECT COUNT(*) AS TOTALCNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate \n";
        selectQuery += "    FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B \n";
        //selectQuery += "    WHERE dbo.FN_REPLACE_REGEX(A.CUSTOMER_COMMENT_KR) = B.QUERY  \n";
        selectQuery += "    WHERE A.CUSTOMER_COMMENT_KR = B.QUERY  \n";
        selectQuery += "    GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120)  ) A, \n";
        selectQuery += "( \n";
        selectQuery += "    SELECT COUNT(*) AS REPONSECNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate \n";
        selectQuery += "    FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B \n";
        //selectQuery += "    WHERE dbo.FN_REPLACE_REGEX(A.CUSTOMER_COMMENT_KR) = B.QUERY    \n";
        selectQuery += "    WHERE A.CUSTOMER_COMMENT_KR = B.QUERY    \n";
        selectQuery += "    AND B.RESULT IN ('H')  \n";
        selectQuery += "    GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) ) B \n";
        selectQuery += "    WHERE  A.CHANNEL = B.CHANNEL \n";
        selectQuery += "    AND                A.Dimdate = B.Dimdate \n";
        selectQuery += ") C \n";
        selectQuery += "WHERE 1=1 \n";
        selectQuery += "AND C.REG_DATE  between CONVERT(date, '" + startDate + "') AND CONVERT(date, '" + endDate + "') \n";
        /*
        if (selDate !== 'allDay') {
            selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
        }
        */
        if (selChannel !== 'all') {
            selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
        }
        selectQuery += ") AS CORRECT_QRY \n";
        selectQuery += "    ,  (SELECT CASE WHEN COUNT(*) != 0 THEN ROUND(SUM(C.답변율)/ COUNT(*), 2) ELSE 0 END    \n";
        selectQuery += "        FROM ( \n"; 
        selectQuery += "SELECT  ROUND(CAST(B.REPONSECNT AS FLOAT) / CAST(A.TOTALCNT AS FLOAT) * 100,2) AS 답변율, A.CHANNEL AS CHANNEL, A.Dimdate AS REG_DATE \n";
        selectQuery += "FROM (";
        selectQuery += "    SELECT COUNT(*) AS TOTALCNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate \n";
        selectQuery += "    FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B \n";
        //selectQuery += "    WHERE dbo.FN_REPLACE_REGEX(A.CUSTOMER_COMMENT_KR) = B.QUERY   \n";
        selectQuery += "    WHERE A.CUSTOMER_COMMENT_KR = B.QUERY   \n";
        selectQuery += "    GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120)  ) A, \n";
        selectQuery += "( \n";
        selectQuery += "    SELECT COUNT(*) AS REPONSECNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate \n";
        selectQuery += "    FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B \n";
        //selectQuery += "    WHERE dbo.FN_REPLACE_REGEX(A.CUSTOMER_COMMENT_KR) = B.QUERY    \n";
        selectQuery += "    WHERE A.CUSTOMER_COMMENT_KR = B.QUERY    \n";
        selectQuery += "    AND B.RESULT IN ('S')  \n";
        selectQuery += "    GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) ) B \n";
        selectQuery += "    WHERE  A.CHANNEL = B.CHANNEL \n";
        selectQuery += "    AND                A.Dimdate = B.Dimdate \n";
        selectQuery += ") C \n";
        selectQuery += "WHERE 1=1 \n";
        selectQuery += "AND C.REG_DATE  between CONVERT(date, '" + startDate + "') AND CONVERT(date, '" + endDate + "') \n";
        /*
        if (selDate !== 'allDay') {
            selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
        }
        */
        if (selChannel !== 'all') {
            selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
        }
        selectQuery += ") AS SEARCH_AVG \n";


        selectQuery += "    , ISNULL((SELECT MAX(B.CNT) FROM (SELECT COUNT(*) AS CNT FROM TBL_HISTORY_QUERY WHERE 1=1 ";
        selectQuery += "AND REG_DATE  between CONVERT(date, '" + startDate + "') AND CONVERT(date, '" + endDate + "') \n";
        /*
    if (selDate !== 'allDay') {
        selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    */
    if (selChannel !== 'all') {
        selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
    }
        selectQuery += "  GROUP BY USER_NUMBER ) B), 0) AS MAX_QRY  \n";
        selectQuery += "FROM   TBL_HISTORY_QUERY \n";
        selectQuery += "WHERE  1=1 \n";
        selectQuery += "AND REG_DATE  between CONVERT(date, '" + startDate + "') AND CONVERT(date, '" + endDate + "') \n";
    /*
    if (selDate !== 'allDay') {
        selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    */
    if (selChannel !== 'all') {
        selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
    }
    console.log("panel=="+selectQuery);
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request().query(selectQuery)
        }).then(result => {
            let rows = result.recordset;
            
            res.send({list : rows});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);    
            res.status(500).send({ message: "${err}"})
            sql.close();
        });
});

router.post('/getCountPanel', function (req, res) {
    //var startDate = req.body.startDate;
    //var endDate = req.body.endDate;
    //var selDate = req.body.selDate;
    var selDate = "";
    var startDate = req.body.startDate+" 00:00:00";
    var endDate = req.body.endDate+" 23:59:59";
    var selChannel = req.body.selChannel;

    var selectQuery = `
    SELECT ISNULL(H,0) + ISNULL(D, 0) + ISNULL(E,0) + ISNULL(S,0) AS '총합' 
           , ISNULL(H,0) AS '응답' 
           , ISNULL(D, 0) AS '미응답' 
           , ISNULL(E,0) AS 'ERROR' 
           , ISNULL(S,0) AS 'SMALLTALK' 
      FROM ( 
             SELECT RESULT, COUNT(*) AS CNT 
             FROM TBL_HISTORY_QUERY WITH (INDEX(HISTORY_REGINDEX)) 
             WHERE (1=1) 
             AND REG_DATE BETWEEN @startDate AND @endDate
    `;
    /*
    if (selDate !== 'allDay') {
        selectQuery += "                AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    */
    if (selChannel !== 'all') {
        selectQuery += "                AND	CHANNEL = '" + selChannel + "' \n";
    }
    
    selectQuery += `
             GROUP BY RESULT 
            ) Q 
     PIVOT ( 
             SUM(CNT) FOR RESULT IN ([H],[D],[E],[S]) 
           ) AS X; 
     `;
     
   //console.log("getCountPanel===="+selectQuery);
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request()
                    .input('startDate', sql.NVarChar, startDate)
                    .input('endDate', sql.NVarChar, endDate)
                    .query(selectQuery)
        }).then(result => {
            let rows = result.recordset;
            
            res.send({list : rows});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.status(500).send({ message: "${err}"})
            sql.close();
        });
});

router.post('/getOftQuestion', function (req, res) {
    //var startDate = req.body.startDate;
    //var endDate = req.body.endDate;
    //var selDate = req.body.selDate;
    var selDate = "";
    var startDate = req.body.startDate+" 00:00:00";
    var endDate = req.body.endDate+" 23:59:59";
    var selChannel = req.body.selChannel;

    var selectQuery = "";
   selectQuery += "SELECT TOP 10 한글질문 AS KORQ, 질문수 AS QNUM, 채널 AS CHANNEL, RESULT, INTENT_SCORE, INTENT\n";
    selectQuery += "FROM\n";
    selectQuery += "(      SELECT CUSTOMER_COMMENT_KR AS 한글질문\n";
    selectQuery += "        , 질문수\n";
    selectQuery += "        , CHANNEL AS 채널\n";
    selectQuery += "        , ISNULL(AN.RESULT,'') AS RESULT\n";
    selectQuery += "        , ISNULL(AN.LUIS_INTENT_SCORE,'') AS INTENT_SCORE\n";
    selectQuery += "        , ISNULL(LOWER(RE.LUIS_INTENT),'') AS INTENT\n";
    selectQuery += "      FROM\n";
    selectQuery += "      (\n";
    selectQuery += "         SELECT CUSTOMER_COMMENT_KR, COUNT(*) AS '질문수', CHANNEL\n";
    selectQuery += "           FROM TBL_HISTORY_QUERY WITH (INDEX(HISTORY_REGINDEX))\n";
    selectQuery += "          WHERE 1=1\n";
    selectQuery += "            and REG_DATE  between CONVERT(date, '" + startDate + "') AND CONVERT(date, '" + endDate + "') \n";
    /*
    if (selDate !== 'allDay') {
        selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    */
    if (selChannel !== 'all') {
        selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
    }
    selectQuery += "          GROUP BY CUSTOMER_COMMENT_KR, CHANNEL\n";
    selectQuery += "          ) HI\n";
    selectQuery += "     LEFT OUTER JOIN TBL_QUERY_ANALYSIS_RESULT AN\n";
    selectQuery += "       ON HI.customer_comment_kr = AN.query\n";
    selectQuery += "     LEFT OUTER JOIN (SELECT LUIS_INTENT,MIN(DLG_ID) AS DLG_ID FROM TBL_DLG_RELATION_LUIS GROUP BY LUIS_INTENT) RE\n";
    selectQuery += "       ON AN.LUIS_INTENT = RE.LUIS_INTENT\n";
    selectQuery += "     ) AA\n";
    //selectQuery += "WHERE RESULT <> '' AND RESULT IN ('H')\n";
    //selectQuery += "ORDER BY 질문수 DESC\n";
    selectQuery += "WHERE RESULT='H'\n";
    selectQuery += "AND 질문수 > 1\n";
    selectQuery += "ORDER BY 질문수 DESC\n";

    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request().query(selectQuery)
        }).then(result => {
            let rows = result.recordset;
            res.send({list : rows});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ error_code: true, error_message : true})
            sql.close();
        });
});

router.post('/nodeQuery', function (req, res) {
    //var startDate = req.body.startDate;
    //var endDate = req.body.endDate;
    //var selDate = req.body.selDate;
    var selDate = "";
    var startDate = req.body.startDate+" 00:00:00";
    var endDate = req.body.endDate+" 23:59:59";
    var selChannel = req.body.selChannel;
    var currentPage = checkNull(req.body.page, 1);

    var selectQuery = "SELECT tbp.* from \n" +
                        " (SELECT ROW_NUMBER() OVER(ORDER BY queryDate DESC) AS NUM, \n" +
                        "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                        "         CEILING((ROW_NUMBER() OVER(ORDER BY queryDate DESC))/ convert(numeric ,10)) PAGEIDX, \n" ;
        //selectQuery += "          korQuery, enQuery, queryCnt, queryDate, channel, result, intent_score, intent, entities, textResult, cardResult, cardBtnResult, mediaResult, mediaBtnResult \n";
        selectQuery += "          korQuery, queryCnt, queryDate, channel, result, intent_score, entities \n";
        selectQuery += "          FROM ( \n";
        selectQuery += "              SELECT CUSTOMER_COMMENT_KR AS korQuery \n";
        selectQuery += "                 , 질문수 AS queryCnt \n";
        selectQuery += "                 , dimdate AS queryDate \n";
        selectQuery += "                  , CHANNEL AS channel \n";
        selectQuery += "                  , ISNULL(HI.RESULT,'') AS result \n";
        selectQuery += "                , ISNULL(HI.LUIS_INTENT_SCORE,'') AS intent_score \n";
        //selectQuery += "                , ISNULL(LOWER(HI.LUIS_INTENT),'') AS intent \n";
        selectQuery += "                , ISNULL(HI.LUIS_ENTITIES,'') AS entities \n";
        //selectQuery += "                , ISNULL(TE.CARD_TEXT,'') AS textResult \n";
        //selectQuery += "                , ISNULL(CA.CARD_TITLE,'') AS cardResult \n";
        //selectQuery += "                , ISNULL(CA.BTN_1_CONTEXT,'') AS cardBtnResult \n";
        //selectQuery += "                , ISNULL(ME.CARD_TITLE,'') AS mediaResult \n";
        //selectQuery += "                , ISNULL(ME.BTN_1_CONTEXT,'') AS mediaBtnResult \n";
        selectQuery += "              FROM ( \n";
        
        selectQuery += "                    SELECT A.CUSTOMER_COMMENT_KR AS CUSTOMER_COMMENT_KR \n";
        selectQuery += "                           , COUNT(*) AS 질문수, MAX(REG_DATE) AS Dimdate, CHANNEL \n";
        selectQuery += "                           , B.RESULT AS RESULT \n";
        selectQuery += "                           , MAX(B.LUIS_INTENT_SCORE) AS LUIS_INTENT_SCORE \n";
        selectQuery += "                           , B.LUIS_INTENT AS LUIS_INTENT \n";
        selectQuery += "                           , B.LUIS_ENTITIES AS LUIS_ENTITIES \n";
        selectQuery += "                      FROM TBL_HISTORY_QUERY A WITH (INDEX(HISTORY_REGINDEX)), TBL_QUERY_ANALYSIS_RESULT B--, TBL_DLG_RELATION_LUIS C  \n";
        selectQuery += "                      WHERE 1=1 \n";
        selectQuery += "                        AND  A.CUSTOMER_COMMENT_KR = B.QUERY \n";
        //selectQuery += "                        AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "')  \n";
        selectQuery += "                        AND REG_DATE BETWEEN '" + startDate + "' AND '" + endDate + "'  \n";
        selectQuery += "                      GROUP BY A.CUSTOMER_COMMENT_KR,B.QUERY, A.CHANNEL, B.LUIS_INTENT, B.LUIS_ENTITIES, B.RESULT --,C.DLG_ID, \n";
        selectQuery += "                     \n";       
        selectQuery += "                     \n";
        selectQuery += "                     \n";
        selectQuery += "                     \n";
        selectQuery += "                     \n";

        /*
        selectQuery += "        SELECT A.CUSTOMER_COMMENT_KR AS CUSTOMER_COMMENT_KR, MAX(A.CUSTOMER_COMMENT_EN) AS 영어질문, COUNT(*) AS 질문수, MAX(REG_DATE) AS Dimdate, CHANNEL, \n";
        selectQuery += "            MAX(B.RESULT) AS RESULT, MAX(B.LUIS_INTENT_SCORE) AS LUIS_INTENT_SCORE, B.LUIS_INTENT AS LUIS_INTENT, B.LUIS_ENTITIES AS LUIS_ENTITIES,C.DLG_ID AS DLG_ID   \n";
        selectQuery += "        FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B, TBL_DLG_RELATION_LUIS C \n";
        selectQuery += "        WHERE 1=1 \n";
        selectQuery += "        AND  A.CUSTOMER_COMMENT_KR = B.QUERY \n";
        selectQuery += "        AND  B.LUIS_INTENT = C.LUIS_INTENT \n";
        selectQuery += "        AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') \n";
        selectQuery += "        GROUP BY A.CUSTOMER_COMMENT_KR,B.QUERY, A.CHANNEL, B.LUIS_INTENT, B.LUIS_ENTITIES, C.DLG_ID \n";
        */
        selectQuery += " ) HI \n";
        //selectQuery += " LEFT OUTER JOIN TBL_DLG DL \n";
        //selectQuery += " ON HI.DLG_ID = DL.DLG_ID \n";
        //selectQuery += " LEFT OUTER JOIN TBL_DLG_TEXT TE \n";
        //selectQuery += " ON DL.DLG_ID = TE.DLG_ID \n";
        //selectQuery += " LEFT OUTER JOIN (SELECT DLG_ID, CARD_TEXT, CARD_TITLE, BTN_1_CONTEXT FROM TBL_DLG_CARD WHERE CARD_ORDER_NO = 1) CA \n";
        //selectQuery += " ON DL.DLG_ID = CA.DLG_ID \n";
        //selectQuery += " LEFT OUTER JOIN (SELECT DLG_ID, CARD_TEXT, CARD_TITLE, BTN_1_CONTEXT FROM TBL_DLG_MEDIA) ME \n";
        //selectQuery += " ON DL.DLG_ID = ME.DLG_ID \n";
        selectQuery += " ) AA  WHERE  RESULT = 'D' \n";
        selectQuery += " ) tbp \n";
        selectQuery += " WHERE 1=1 AND PAGEIDX = " + currentPage + "; \n";
        
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request().query(selectQuery)
        }).then(result => {
          let rows = result.recordset
          var rowsCnt = rows.length;
          if(rowsCnt > 0){
            res.send({list : rows, pageList : paging.pagination(currentPage,rows[0].TOTCNT)});
          }else{
            res.send({ list: rows });
          }

          sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ error_code: true, error_message : true})
            sql.close();
        });
});



router.post('/firstQueryBar', function (req, res) {
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    var selChannel = req.body.selChannel;

    var selectQuery =  "";
        selectQuery += "SELECT ISNULL(INTENT,'intent 없음') AS INTENT, COUNT(*) AS INTENT_CNT \n";
        selectQuery += "FROM ( \n";
        selectQuery += "    SELECT distinct history.user_number as 유저아이디 \n";
        selectQuery += "         , history.sid, history.customer_comment_kr as 한글질문 \n";
        selectQuery += "         , history.customer_comment_en as 영어질문 \n";
        selectQuery += "         , history.channel as 채널 \n";
        selectQuery += "         , history.reg_date as 질문등록시간 \n";
        selectQuery += "         , LOWER(analysis.LUIS_INTENT) as INTENT \n";
        selectQuery += "         , analysis.LUIS_ENTITIES as 답변 \n";
        selectQuery += "         , ROUND(CAST(analysis.LUIS_INTENT_SCORE AS FLOAT),2) as 컨피던스 \n";
        //selectQuery += "         , case when history.customer_comment_kr ='Kona의 주요특징' or history.customer_comment_kr ='견적 내기' or history.customer_comment_kr ='시승신청' \n";
        //selectQuery += "                     or history.customer_comment_kr ='나에게 맞는 모델을 추천해줘' then '메뉴' else '대화' end as 메시지구분 \n";
        selectQuery += "         , 날짜 \n";
        selectQuery += "    FROM ( \n";
        selectQuery += "        SELECT  ROW_NUMBER() OVER (PARTITION BY user_number ORDER BY min(sid) asc) AS Row \n";
        selectQuery += "            , user_number \n";
        selectQuery += "            , min(sid) AS sid \n";
        selectQuery += "            , customer_comment_kr \n";
        selectQuery += "            , customer_comment_en \n";
        selectQuery += "            , reg_date \n";
        selectQuery += "            , channel \n";
        selectQuery += "            , CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS 날짜 \n";
        selectQuery += "        FROM    TBL_HISTORY_QUERY A WITH (INDEX(HISTORY_REGINDEX)) \n";
        selectQuery += "        WHERE  1=1 \n";
        selectQuery += "AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') ";
    /*
            if (selDate !== 'allDay') {
                selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
            }
            */
            if (selChannel !== 'all') {
                selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
            }
        selectQuery += "        GROUP BY user_number, customer_comment_kr, customer_comment_en, reg_date, channel \n";
        selectQuery += "    )   AS history INNER join tbl_query_analysis_result as analysis on history.customer_comment_kr = analysis.query  \n";
        selectQuery += "    WHERE history.Row = 1 \n";
        selectQuery += ") A \n";
        selectQuery += "GROUP BY INTENT \n";

        //console.log("firstQueryBar===="+selectQuery);

    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request().query(selectQuery)
        }).then(result => {
            let rows = result.recordset
            res.send({list : rows});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ error_code: true, error_message : true})
            sql.close();
        });
});

router.post('/firstQueryTable', function (req, res) {
    //var startDate = req.body.startDate;
    //var endDate = req.body.endDate;
    //var selDate = req.body.selDate;
    var selDate = "";
    var startDate = req.body.startDate+" 00:00:00";
    var endDate = req.body.endDate+" 23:59:59";
    var selChannel = req.body.selChannel;
    let currentPageNo = checkNull(req.body.page, 1);
    var selectQuery = "";
    
        selectQuery += "SELECT tbp.* from \n";
        selectQuery += " (SELECT ROW_NUMBER() OVER(ORDER BY CUSTOMER_COMMENT_KR DESC) AS NUM, \n";
        selectQuery += "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n";
        selectQuery += "         CEILING((ROW_NUMBER() OVER(ORDER BY CUSTOMER_COMMENT_KR DESC))/ convert(numeric ,6)) PAGEIDX, \n";
        selectQuery += "      CUSTOMER_COMMENT_KR AS koQuestion, 날짜 AS query_date, 채널 AS channel, 질문수 AS query_cnt \n";
        selectQuery += "    , ROUND(CAST(ISNULL(AN.LUIS_INTENT_SCORE,0) AS FLOAT),2) AS intent_score \n";
        selectQuery += "    , ISNULL(LOWER(AN.LUIS_INTENT),'') AS intent_name \n";
        selectQuery += "FROM( \n";
        selectQuery += "    SELECT CUSTOMER_COMMENT_KR,날짜,COUNT(*) AS 질문수,채널 \n";
        selectQuery += "    FROM( \n";
        selectQuery += "        SELECT  ROW_NUMBER() OVER (PARTITION BY USER_NUMBER ORDER BY MIN(SID) ASC) AS ROW \n";
        selectQuery += "            , USER_NUMBER \n";
        selectQuery += "            , MIN(SID) AS SID \n";
        selectQuery += "            , CUSTOMER_COMMENT_KR \n";
        selectQuery += "            , CUSTOMER_COMMENT_EN \n";
        selectQuery += "            , REG_DATE \n";
        selectQuery += "            , CHANNEL AS 채널 \n";
        selectQuery += "            , CONVERT(CHAR(19),CONVERT(DATETIME,REG_DATE),120) AS 날짜 \n";
        selectQuery += "        FROM    TBL_HISTORY_QUERY A WITH (INDEX(HISTORY_REGINDEX)) \n";
        selectQuery += "        WHERE  1=1 \n";
        //selectQuery += "	AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') \n";
        selectQuery += "	AND REG_DATE BETWEEN '" + startDate + "' AND '" + endDate + "' \n";
        /*
        if (selDate !== 'allDay') {
            selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
        }
        */
        if (selChannel !== 'all') {
            selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
        }
        selectQuery += "     GROUP BY USER_NUMBER, CUSTOMER_COMMENT_KR, CUSTOMER_COMMENT_EN, REG_DATE, CHANNEL \n";
        selectQuery += "    ) A \n";
        selectQuery += "    WHERE ROW = 1 \n";
        selectQuery += "    GROUP BY CUSTOMER_COMMENT_KR,날짜,채널 \n";
        selectQuery += ") HI LEFT OUTER JOIN TBL_QUERY_ANALYSIS_RESULT AN ON HI.CUSTOMER_COMMENT_KR = AN.QUERY \n";
        selectQuery += "LEFT OUTER JOIN (SELECT LUIS_INTENT,LUIS_ENTITIES,MIN(DLG_ID) AS DLG_ID FROM TBL_DLG_RELATION_LUIS GROUP BY LUIS_INTENT, LUIS_ENTITIES) RE \n";
        selectQuery += "    ON AN.LUIS_INTENT = RE.LUIS_INTENT \n";
        selectQuery += "    AND AN.LUIS_ENTITIES = RE.LUIS_ENTITIES \n";
        selectQuery += " ) tbp \n";
        selectQuery += " WHERE 1=1 \n";
        selectQuery += " AND PAGEIDX = " + currentPageNo + "; \n";
                       //console.log("firstQueryTable==="+selectQuery);
        dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request().query(selectQuery)
        }).then(result => {
            let rows = result.recordset
            res.send({list : rows, pageList : paging.pagination(currentPageNo,rows[0].TOTCNT)});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ error_code: true, error_message : true})
            sql.close();
        });
});


router.post('/getResponseScore', function (req, res) {
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    var selChannel = req.body.selChannel;
    
    var selectQuery = "";
        selectQuery += "SELECT  ISNULL(AVG(유저별평균답변시간), 0) AS REPLY_AVG \n";
        selectQuery += "	 , ISNULL((SELECT MAX(RESPONSE_TIME) FROM TBL_HISTORY_QUERY  \n";
        selectQuery += " WHERE 1=1  \n";
        selectQuery += "AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') ";
    /*
            if (selDate !== 'allDay') {
                selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
            }
            */
            if (selChannel !== 'all') {
                selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
            }
        selectQuery += "	 ), 0) AS MAX_REPLY \n";
        selectQuery += "	 , ISNULL((SELECT MIN(RESPONSE_TIME) FROM TBL_HISTORY_QUERY WHERE RESPONSE_TIME >0 \n";
        selectQuery += "AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') ";
    /*
            if (selDate !== 'allDay') {
                selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
            }
            */
            if (selChannel !== 'all') {
                selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
            }
        selectQuery += "	 ), 0) AS MIN_REPLY \n";
        selectQuery += "	 , ISNULL(AVG(유저별답변시간합), 0) AS REPLY_SUM \n";
        selectQuery += "FROM ( ";
        selectQuery += "SELECT USER_NUMBER, SUM(RESPONSE_TIME) AS 유저별답변시간합, AVG(RESPONSE_TIME) AS 유저별평균답변시간 \n";
        selectQuery += "  FROM TBL_HISTORY_QUERY  \n";
        selectQuery += " WHERE 1=1  \n";
        selectQuery += "AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') ";
    /*
            if (selDate !== 'allDay') {
                selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
            }
            */
            if (selChannel !== 'all') {
                selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
            }
        selectQuery += "GROUP BY USER_NUMBER \n";
        selectQuery += ") A \n";
    
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
    //new sql.ConnectionPool(dbConfig).connect().then(pool => {
        return pool.request().query(selectQuery)
        }).then(result => {
            let rows = result.recordset
            res.send({list : rows});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ error_code: true, error_message : true})
            sql.close();
        });
});

router.post('/getQueryByEachTime', function (req, res) {
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    var selChannel = req.body.selChannel;
    
    var selectQuery = "";
        selectQuery += "SELECT REPLICATE('0', 2 - LEN(시간)) + 시간 AS TIME ";
        selectQuery += "     , SUM(질문수) AS QUERY_CNT \n";
        selectQuery += "FROM ( \n";
        selectQuery += "	 SELECT USER_NUMBER , datename(hh,reg_date) as 시간, CHANNEL AS 채널 ";
        selectQuery += "	     ,  CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS 날짜, COUNT(*) AS 질문수, CUSTOMER_COMMENT_KR \n";
        selectQuery += "	   FROM TBL_HISTORY_QUERY \n";
        selectQuery += "	  WHERE 1=1 \n";
        selectQuery += "AND CONVERT(date, '" + startDate + "') <= CONVERT(date, REG_DATE)  AND  CONVERT(date, REG_DATE)   <= CONVERT(date, '" + endDate + "') ";
    /*
            if (selDate !== 'allDay') {
                selectQuery += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
            }
            */
            if (selChannel !== 'all') {
                selectQuery += "AND	CHANNEL = '" + selChannel + "' \n";
            }
        selectQuery += "	 GROUP BY USER_NUMBER, datename(hh,reg_date), CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), CUSTOMER_COMMENT_KR \n";
        selectQuery += "	 ) HI \n";
        //selectQuery += "LEFT OUTER JOIN TBL_QUERY_ANALYSIS_RESULT AN \n";
        //selectQuery += "ON HI.CUSTOMER_COMMENT_KR = AN.QUERY \n";
        selectQuery += "GROUP BY (REPLICATE('0', 2 - LEN(시간)) + 시간)  \n";
        selectQuery += "HAVING 1=1 \n";
        selectQuery += "ORDER BY TIME; \n";

    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request().query(selectQuery)
        }).then(result => {
            let rows = result.recordset
            var resultMap = [];
            var k=0;
            for (var i=0; i<24; i++) {
                if (typeof rows[k] !== 'undefined') {
                    if ( Number(rows[k].TIME) === i ) {
                        var obj = {};
                        resultMap[i] = obj[rows[k].TIME] = rows[k].QUERY_CNT;
                        k++
                    } else {
                        var obj = {};
                        resultMap[i] = obj[pad(i, 2)] =  0;
                    }
                } else {
                    for (; i<24; i++) {
                        var obj = {};
                        resultMap[i] = obj[pad(i, 2)] =  0;
                    }
                }
            }
            res.send({list : resultMap});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({ error_code: true, error_message : true})
            sql.close();
        });
});
function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
function checkNull(val, newVal) {
    if (val === "" || typeof val === "undefined" || val === "0") {
        return newVal;
    } else {
        return val;
    }
}

router.post('/getDashboardInfo', function (req, res) {
    var userId = req.session.sid;
    var QueryStr = "";
    (async () => {
        try {
            if(userId=='admin'){
                QueryStr = "SELECT BOARD_ID, BOARD_NM, BOARD_URL FROM TB_BOARD_I ";
            }else{
                QueryStr = "SELECT AA.BOARD_ID, AA.BOARD_NM, AA.BOARD_URL FROM ";
                QueryStr += " TB_BOARD_I AA, TB_BOARD_RELATION BB";
                QueryStr += " WHERE BB.USER_ID='"+userId+"' AND BB.BOARD_ID = AA.BOARD_ID";
            }
            

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
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            
            res.send({
                records: 0,
                rows: null
            });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/getSimulUrlInfo', function (req, res) {

    var getSimulUrlStr = "SELECT ISNULL(" +
    "(SELECT CNF_VALUE FROM TBL_CHATBOT_CONF WHERE CNF_TYPE = 'SIMULATION_URL' AND CNF_NM = '" + req.session.sid + "' AND CHATBOT_NAME = '" + req.session.appName + "'), " +
    "(SELECT CNF_VALUE FROM TBL_CHATBOT_CONF WHERE CNF_TYPE = 'SIMULATION_URL' AND CNF_NM = 'admin' AND CHATBOT_NAME = '" + req.session.appName + "'))  AS SIMUL_URL";
            
    dbConnect.getConnection(sql).then(pool => { 
        return pool.request().query( getSimulUrlStr ) 
    }).then(result => {
        req.session.simul_url = result.recordset[0].SIMUL_URL;
        res.send({status:200 , simul_url:req.session.simul_url});
    }).catch(err => {
        logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            
        sql.close();
    });

});

//AND REG_DATE  between CONVERT(date, @startDate) AND CONVERT(date, @endDate) <-- 이게 원래 CONVERT를 DATE 로 함.
var pannelQry0 = `
SELECT COUNT(DISTINCT A.USER_NUMBER) AS CUSOMER_CNT 
FROM  ( 
    SELECT ISNULL(USER_NUMBER, '') AS USER_NUMBER, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS REG_DATE 
      FROM   TBL_HISTORY_QUERY WITH (INDEX(HISTORY_REGINDEX))
    GROUP BY ISNULL(USER_NUMBER, ''), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) 
  ) A 
 WHERE  1=1  
   AND REG_DATE  between CONVERT(nvarchar(100), @startDate) AND CONVERT(nvarchar(100), @endDate) 
`;

var pannelQry1 = `
SELECT ISNULL(SUM(RESPONSE_TIME)/COUNT(RESPONSE_TIME), 0) AS REPLY_SPEED 
       , CASE WHEN COUNT(*) != 0 THEN COUNT(*)/COUNT(DISTINCT USER_NUMBER) ELSE 0 END AS USER_QRY_AVG 
  FROM   TBL_HISTORY_QUERY WITH (INDEX(HISTORY_REGINDEX))
 WHERE  1=1  
   AND REG_DATE  between CONVERT(nvarchar(100), @startDate) AND CONVERT(nvarchar(100), @endDate) 
`;

var pannelQry2 = `
SELECT CASE WHEN COUNT(*) != 0 THEN ROUND(SUM(C.답변율)/ COUNT(*),2) ELSE 0 END  AS CORRECT_QRY   
  FROM ( 
    SELECT  ROUND(CAST(B.REPONSECNT AS FLOAT) / CAST(A.TOTALCNT AS FLOAT) * 100,2) AS 답변율, A.Dimdate AS REG_DATE 
        FROM ( 
            SELECT COUNT(*) AS TOTALCNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate 
            FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B 
            WHERE A.CUSTOMER_COMMENT_KR = B.QUERY  
            GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120)  ) A, 
            ( 
                SELECT COUNT(*) AS REPONSECNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate 
                    FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B 
                    WHERE A.CUSTOMER_COMMENT_KR = B.QUERY    
                    AND B.RESULT IN ('H')  
                GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME, REG_DATE), 120) 
            ) B 
        WHERE  A.CHANNEL = B.CHANNEL 
        AND                A.Dimdate = B.Dimdate 
        AND A.Dimdate  between CONVERT(nvarchar(100), @startDate) AND CONVERT(nvarchar(100), @endDate) 
    ) C 
 WHERE 1=1 
`;


var pannelQry3 = `
SELECT CASE WHEN COUNT(*) != 0 THEN ROUND(SUM(C.답변율)/ COUNT(*), 2) ELSE 0 END  AS SEARCH_AVG    
  FROM ( 
        SELECT  ROUND(CAST(B.REPONSECNT AS FLOAT) / CAST(A.TOTALCNT AS FLOAT) * 100,2) AS 답변율, A.Dimdate AS REG_DATE 
          FROM (    
                SELECT COUNT(*) AS TOTALCNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate 
                  FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B 
                 WHERE A.CUSTOMER_COMMENT_KR = B.QUERY   
                GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120)  
			   ) A, 
               ( 
                SELECT COUNT(*) AS REPONSECNT, CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120) AS Dimdate 
                  FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B 
                 WHERE A.CUSTOMER_COMMENT_KR = B.QUERY    
                   AND B.RESULT IN ('S')  
                GROUP BY CHANNEL, CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120)
			   ) B 
         WHERE  A.CHANNEL = B.CHANNEL 
           AND A.Dimdate = B.Dimdate 
    ) C 
 WHERE 1=1 
   AND REG_DATE  between CONVERT(nvarchar(100), @startDate) AND CONVERT(nvarchar(100), @endDate) 
`;

router.post('/getScorePanel1', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    //var startDate = req.body.startDate;
    //var endDate = req.body.endDate;
    //var selDate = req.body.selDate;
    var selDate = "";
    var startDate = req.body.startDate+" 00:00:00";
    var endDate = req.body.endDate+" 23:59:59";
    var selChannel = req.body.selChannel;
/*
    if (selDate !== 'allDay') {
        pannelQry0 += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
        pannelQry1 += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    */
    if (selChannel !== 'all') {
        pannelQry0 += "AND	CHANNEL = @selChannel \n";
        pannelQry1 += "AND	CHANNEL = @selChannel \n";
    }

    try {
        (async () => {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
    
            //console.log("intent -" + pp)
            let first_result = await pool.request()
                                .input('startDate', sql.NVarChar, startDate)
                                .input('endDate', sql.NVarChar, endDate)
                                .input('selChannel', sql.NVarChar, selChannel)
                                .query(pannelQry0)
            var result1 = first_result.recordset;
    
            //console.log("intent -" + pp)
            let second_result = await pool.request() 
                                .input('startDate', sql.NVarChar, startDate)
                                .input('endDate', sql.NVarChar, endDate)
                                .input('selChannel', sql.NVarChar, selChannel)
                                .query(pannelQry1);
            var result2 = second_result.recordset;

            let rows1 = result1;
            let rows2 = result2;
            
            res.send({result : true, list1 : rows1, list2 : rows2});
            sql.close();


        })()
    } 
    catch(err) {
        logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
    
        sql.close();
        res.send({result : false});
    }

});

/*
router.post('/getScorePanel22', function (req, res) {
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    var selChannel = req.body.selChannel;

    if (selDate !== 'allDay') {
        pannelQry2 += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    if (selChannel !== 'all') {
        pannelQry2 += "AND	CHANNEL = @selChannel \n";
    }
    //console.log("panel=="+selectQuery);
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request()
                    .input('startDate', sql.NVarChar, startDate)
                    .input('endDate', sql.NVarChar, endDate)
                    .input('selChannel', sql.NVarChar, selChannel)
                    .query(pannelQry2)
        }).then(result => {
            let rows = result.recordset;
            
            res.send({result : true, list : rows});
            sql.close();
        }).catch(err => {
            res.send({result : false});
            sql.close();
        });
});
*/
router.post('/getScorePanel2', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    var selChannel = req.body.selChannel;

        
    var pannelQry2_1 = `
            SELECT COUNT(*) AS TOTALCNT, CHANNEL, LEFT(REG_DATE, 10) AS Dimdate 
              FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B 
             WHERE A.CUSTOMER_COMMENT_KR = B.QUERY  
    `;
    var pannelQry2_2 = `
            SELECT COUNT(*) AS REPONSECNT, CHANNEL, LEFT(REG_DATE, 10) AS Dimdate 
              FROM TBL_HISTORY_QUERY A, TBL_QUERY_ANALYSIS_RESULT B 
             WHERE A.CUSTOMER_COMMENT_KR = B.QUERY    
               AND B.RESULT NOT IN ('D','E')  
    `;

    if (selChannel !== 'all') {
        pannelQry2_1 += "AND	CHANNEL = @selChannel \n";
        pannelQry2_2 += "AND	CHANNEL = @selChannel \n";
    }
    if (selDate !== 'allDay') {
        pannelQry2_1 += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
        pannelQry2_2 += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    } else {
        pannelQry2_1 += "   AND REG_DATE  between CONVERT(date, @startDate) AND CONVERT(date, @endDate) \n \n";
        pannelQry2_2 += "   AND REG_DATE  between CONVERT(date, @startDate) AND CONVERT(date, @endDate) \n \n";
    }
    pannelQry2_1 += "GROUP BY CHANNEL, LEFT(REG_DATE, 10) \n";
    pannelQry2_2 += "GROUP BY CHANNEL, LEFT(REG_DATE, 10) \n";

    var resultAll = [];
    var resultSome = [];

    try {
        (async () => {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
    
            //console.log("intent -" + pp)
            let first_result = await pool.request()
                                .input('startDate', sql.NVarChar, startDate)
                                .input('endDate', sql.NVarChar, endDate)
                                .input('selChannel', sql.NVarChar, selChannel)
                                .query(pannelQry2_1);
            resultAll = first_result.recordset;
    
            //console.log("intent -" + pp)
            let second_result = await pool.request() 
                                .input('startDate', sql.NVarChar, startDate)
                                .input('endDate', sql.NVarChar, endDate)
                                .input('selChannel', sql.NVarChar, selChannel)
                                .query(pannelQry2_2);
            resultSome = second_result.recordset;
            var resultList = [];
            
            for (var i=0; i<resultAll.length; i++) {
                for (var j=0; j<resultSome.length; j++) {
                    if (resultAll[i].CHANNEL == resultSome[j].CHANNEL && resultAll[i].Dimdate == resultSome[j].Dimdate) {
                        var avgVal = Number((resultSome[j].REPONSECNT/resultAll[i].TOTALCNT).toFixed(4));
                        
                        resultList.push(avgVal);
                        break;
                    }
                }
            }
            var sum = resultList.reduce((a, b) => a + b, 0);
            var vagRst = 0;//Number((sum/resultList.length).toFixed(4))*100;
            //var vagRst = Number((sum/resultList.length).toFixed(4))*100;
            sql.close();      
            
            if (resultList.length != 0) {
               vagRst = Number((sum/resultList.length).toFixed(4))*100;
            }
            res.send({result : true, list : vagRst});
        })()
    } 
    catch(err) {
        logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
    
        sql.close();
        res.send({result : false});
    }
});

router.post('/getScorePanel3', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var selDate = req.body.selDate;
    var selChannel = req.body.selChannel;

    if (selDate !== 'allDay') {
        pannelQry3 += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    if (selChannel !== 'all') {
        pannelQry3 += "AND	CHANNEL = @selChannel \n";
    }
    //console.log("panel=="+selectQuery);
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request()
                    .input('startDate', sql.NVarChar, startDate)
                    .input('endDate', sql.NVarChar, endDate)
                    .input('selChannel', sql.NVarChar, selChannel)
                    .query(pannelQry3)
        }).then(result => {
            let rows = result.recordset;
            
            res.send({result : true, list : rows});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        
            res.send({result : false});
            sql.close();
        });
});

router.post('/getScorePanel4', function (req, res) {
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    //var startDate = req.body.startDate;
    //var endDate = req.body.endDate;
    //var selDate = req.body.selDate;
    var selDate = "";
    var startDate = req.body.startDate+" 00:00:00";
    var endDate = req.body.endDate+" 23:59:59";
    var selChannel = req.body.selChannel;
    
    var pannelQry4 = `
    SELECT ISNULL(
        (SELECT MAX(B.CNT) 
        FROM (
                SELECT COUNT(*) AS CNT 
                FROM TBL_HISTORY_QUERY WITH (INDEX(HISTORY_REGINDEX))
                WHERE 1=1 
                    AND REG_DATE BETWEEN @startDate AND @endDate 
    `;
    /*
    if (selDate !== 'allDay') {
        pannelQry4 += "AND CONVERT(int, CONVERT(char(8), CONVERT(DATE,CONVERT(DATETIME,REG_DATE),120), 112)) = CONVERT(VARCHAR, GETDATE(), 112) \n";
    }
    */
    if (selChannel !== 'all') {
        pannelQry4 += "AND	CHANNEL = @selChannel \n";
    }
    pannelQry4 += ` 
        GROUP BY USER_NUMBER 
        ) B 
    ), 0) AS MAX_QRY  
    `;
    console.log("getScorePanel4=="+pannelQry4);
    dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue).then(pool => {
        return pool.request()
                    .input('startDate', sql.NVarChar, startDate)
                    .input('endDate', sql.NVarChar, endDate)
                    .input('selChannel', sql.NVarChar, selChannel)
                    .query(pannelQry4)
        }).then(result => {
            let rows = result.recordset;
            
            res.send({result : true, list : rows});
            sql.close();
        }).catch(err => {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({result : false});
            sql.close();
        });
});

module.exports = router;
