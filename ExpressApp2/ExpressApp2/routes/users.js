'use strict';
var express = require('express');
var crypto = require('crypto');
var sql = require('mssql');
var Client = require('node-rest-client').Client;
var dbConfig = require('../config/dbConfig').dbConfig;
var dbConnect = require('../config/dbConnect');
var paging = require('../config/paging');
var router = express.Router();


var i18n = require("i18n");

//log start
var Logger = require("../config/logConfig");
var logger = Logger.CreateLogger();
//log end
/*
var key = 'taiho123!@#$';
var initPW = '1234';
//기본 암호화 pw 
const cipher = crypto.createCipher('aes192', key);
let basePW = cipher.update(initPW, 'utf8', 'base64'); 
basePW = cipher.final('base64'); 
*/


//암호화
var pwConfig = require('../config/passConfig');

//로그인 제한 횟수
const loginLimitCnt = 3;

var loginSelQry = ` 
SELECT USER_ID 
       , SCRT_NUM 
       , SCRT_SALT 
       , ISNULL(PW_INIT_YN, 'N') AS PW_INIT_YN 
       , ISNULL(LAST_LOGIN_IP, 'NONE') AS LAST_LOGIN_IP 
       , ISNULL(CONVERT(char(19), LAST_LOGIN_DT, 120), 'NONE') AS LAST_LOGIN_DT2 
       , DATEDIFF ( day , ISNULL(LAST_LOGIN_DT, DATEADD(hh, 9, GETDATE()) ), DATEADD(hh, 9, GETDATE()) ) AS LAST_LOGIN_DT 
       , ISNULL(LOGIN_IP, 'NONE') AS LOGIN_IP 
       , ISNULL(LOGIN_FAIL_CNT, 0) AS LOGIN_FAIL_CNT 
       , DATEDIFF ( mi , ISNULL(LOGIN_FAIL_DT, DATEADD(hh, 9, GETDATE()) ), DATEADD(hh, 9, GETDATE()) ) AS LOGIN_FAIL_DT 
       , DATEDIFF ( day  , ISNULL(LAST_SCRT_DT, DATEADD(hh, 9, GETDATE()) ), DATEADD(hh, 9, GETDATE()) ) AS LAST_SCRT_DT
       , DATEDIFF ( hour  , ISNULL(LAST_SCRT_DT, DATEADD(hh, 9, GETDATE()) ), DATEADD(hh, 9, GETDATE()) ) AS LAST_SCRT_DT_HH
       , ISNULL(LOGIN_YN, 'N') AS LOGIN_YN 
       , ISNULL(USER_AUTH, '0') AS USER_AUTH 
       
       , ISNULL(SCRT_NUM_FIRST, '0') AS SCRT_NUM_FIRST 
       , ISNULL(SCRT_SALT_FIRST, '0') AS SCRT_SALT_FIRST 
       , ISNULL(SCRT_NUM_SECOND, '0') AS SCRT_NUM_SECOND 
       , ISNULL(SCRT_SALT_SECOND, '0') AS SCRT_SALT_SECOND 
       , ISNULL(SCRT_NUM_THIRD, '0') AS SCRT_NUM_THIRD 
       , ISNULL(SCRT_SALT_THIRD, '0') AS SCRT_SALT_THIRD 
       
  FROM TB_USER_M 
 WHERE USER_ID = @userId 
   AND USE_YN = 'Y';
`;

var insertUserLoginHistoryQry = ` 
INSERT INTO TBL_USER_HISTORY (USERID, LOGIN_TIME, USERIP, LOGIN_STATUS) 
VALUES (@userId, DATEADD(hh, 9, GETDATE()), @loginIp, 'LOGIN');
`; 

var insertUserLogoutHistoryQry = ` 
INSERT INTO TBL_USER_HISTORY (USERID, LOGIN_TIME, LOGOUT_TIME, USERIP, LOGIN_STATUS) 
VALUES (@userId 
     , ( SELECT LOGIN_TIME FROM ( 
                                  SELECT ROW_NUMBER() OVER(ORDER BY TBL_A.LOGIN_TIME DESC) AS NUM, TBL_A.LOGIN_TIME 
                                    FROM (SELECT LOGIN_TIME FROM TBL_USER_HISTORY WHERE LOGIN_STATUS='LOGIN' AND USERID=@userId ) TBL_A 
                                ) TBL_B 
          WHERE TBL_B.NUM = 1 
       ) 
     , DATEADD(hh, 9, GETDATE()) 
     , @loginIp 
     , 'LOGOUT');
`; 

//const HOST = 'https://westus.api.cognitive.microsoft.com'; // Luis api host
/* GET users listing. */
router.get('/', function (req, res) {
    
    if (!req.session.sid) {
        res.cookie('i18n', 'ko', { maxAge: 900000, httpOnly: true });
        res.render('login');   
    } else {
        res.redirect("/list");
    }
    //res.send('respond with a resource');
    
});

router.get('/goPwChnge', function (req, res) {
    
    res.render('passwordChng', {
        changeId: 'NONE',
    });
    //res.send('respond with a resource');
});
router.post('/dupleLoginCheck', function (req, res) {  
    var userId = req.body.mLoginId;

    var sessionObjList = req.sessionStore.sessions;

    var isLoggedIn = false;
    for (var key in sessionObjList) {
        var userObj = JSON.parse(sessionObjList[key]);
        if (userObj.sid) {
            if (userId == userObj.sid) {
                //delete sessionObjList[key]; 
                /*
                userObj.sid = 'DUPLE_LOGIN_Y___'; 
                userObj.dupleLogin = "DUPLE_Y";
                JSON.stringify(userObj)
                sessionObjList[key] = JSON.stringify(userObj); 
                //sessionObjList[key] = undefined;
                */
                var dateNow = new Date();
                var timeDiff = dateNow.getTime() > Date.parse(userObj.cookie.expires);
                if (timeDiff) {
                    delete sessionObjList[key];
                } else {
                    isLoggedIn = true;
                }
                //isLoggedIn = true;
                break;
            } else {
                continue
            }
        }
    }

    if (isLoggedIn) {
        res.send({
            'duple' : true
        });
    } else {
        res.send({
            'duple' : false
        });
    }
});

router.post('/login', function (req, res) {  
    //req.session.sid = req.body.mLoginId;

    var userId = req.body.mLoginId;
    var userPw = req.body.mLoginPass;
    var dupleYn = req.body.dupleYn;
    var dupleLoginIp = "NONE";
    var isLoggedIn = false;
    if (typeof dupleYn != 'undefined') {
        var sessionObjList = req.sessionStore.sessions;
        for (var key in sessionObjList) {
            var userObj = JSON.parse(sessionObjList[key]);
            if (userObj.sid) {
                if (userId == userObj.sid) {
                    //delete sessionObjList[key]; 
                    userObj.sid = '___DUPLE_LOGIN_Y___'; 
                    //userObj.dupleLogin = "DUPLE_Y";
                    
                    if (userObj.userInfo) {
                        dupleLoginIp = userObj.userInfo.LAST_LOGIN_IP
                    }

                    sessionObjList[key] = JSON.stringify(userObj); 
                    isLoggedIn = true;
                    //sessionObjList[key] = undefined;
                    break;
                } else {
                    continue
                }
            }
        }
    }

    
    //암호화
    /*
    var cipher = crypto.createCipher('aes192', key);
    cipher.update('1234', 'utf8', 'base64');
    var cipheredOutput = cipher.final('base64');
    console.log(cipheredOutput);
    */

    var initLoginFailCntQry = `
    UPDATE TB_USER_M SET LOGIN_FAIL_CNT = 0 WHERE USER_ID = @userId;
    `

    var updateLoginFailCntQry = ` 
    UPDATE TB_USER_M SET LOGIN_FAIL_CNT = (ISNULL(LOGIN_FAIL_CNT, 0) + 1), LOGIN_FAIL_DT = DATEADD(hh, 9, GETDATE())  WHERE USER_ID = @userId;
    `;

    var selectLuisInfoQry = `
    SELECT CNF_TYPE, CNF_VALUE 
      FROM TBL_CHATBOT_CONF 
     WHERE CNF_TYPE = 'LUIS_SUBSCRIPTION' 
        OR CNF_TYPE = 'HOST_URL';
    `;

    var updateUserLoginQry = `
    UPDATE TB_USER_M 
       SET LAST_LOGIN_DT = DATEADD(hh, 9, GETDATE()), LOGIN_YN = 'Y', LOGIN_SID = @loginSid, LOGIN_FAIL_CNT = 0, LAST_LOGIN_IP = @loginIp 
     WHERE USER_ID = @userId;
    `; 


    try {
        (async () => {
            let pool = await dbConnect.getAppConnection(sql);

            if (isLoggedIn) {
                let dupleLogout = await pool.request()
                                .input('userId', sql.NVarChar, userId)
                                .input('loginIp', sql.NVarChar, dupleLoginIp)
                                .query(insertUserLogoutHistoryQry);
                logger.info('[알림]중복 로그인-로그아웃 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '중복로그인-기존사용자 로그아웃');
            }




            let loginUserRst = await pool.request()
                                            .input('userId', sql.NVarChar, userId)
                                            .query(loginSelQry)

            let userInfo = loginUserRst.recordset;

            if(userInfo.length > 0 && userInfo[0].USER_ID != null && userInfo[0].USER_ID == userId) {
                //사용자 있음
                
            } else {
                //사용자 없음
                logger.info('[알림]로그인 실패  [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '로그인 아이디 없음');
                res.send('<script>alert("' + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL + '");location.href="/";</script>');
                return false;
            }

            //비밀번호 확인
            var userPwConverted = pwConfig.getPassWord(userPw, userInfo[0].SCRT_SALT);
            if (userInfo[0].SCRT_NUM != userPwConverted) {
                //비밀번호 다름 -실패카운트 추가
                
                var failCntRemain = parseInt(userInfo[0].LOGIN_FAIL_CNT);
                failCntRemain++;
                logger.info('[알림]로그인 실패  [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '로그인 실패 횟수 : [' + (failCntRemain) + ']' );
                
                let loginUserRst = await pool.request()
                    .input('userId', sql.NVarChar, userId)
                    .query(updateLoginFailCntQry)

                
                res.send('<script>alert("' + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL + '");location.href="/";</script>');
                return false;
            } 
            //------비밀번호 일치------//
            if (parseInt(userInfo[0].LOGIN_FAIL_CNT) >= loginLimitCnt) {
                //로그인실패 3회 사용자 로그인 제한 설정 
                var failDate = parseInt(userInfo[0].LOGIN_FAIL_DT);
                if (failDate <= 60) {
                    //1시간 안됨 
                    var alertStr = i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL_TIME
                        + (60 - failDate)
                        + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL_TIME_REMAIN;

                        
                    logger.info('[알림]로그인 실패  [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '로그인 제한 사용자 로그인 시도' );
                
                    res.send('<script>alert("' + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL + '");location.href="/";</script>');
                    return false;
                } else {
                    let loginUserRst = await pool.request()
                                                    .input('userId', sql.NVarChar, userId)
                                                    .query(initLoginFailCntQry)
                    
                    //한시간 돼서 접속 가능합니다. 다시로그인해주세요
                    //res.send('<script>alert("' + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL_END + '");location.href="/";</script>');
                }
            }

            //ip 체크  
            /*
            var userLoginIP = "";
            userLoginIP = req.headers['x-forwarded-for']
                || req.connection.remoteAddress
                || req.socket.remoteAddress
                || req.connection.socket.remoteAddress;
            */
            var userLoginIP = "";
            /*
            if (req.headers['x-forwarded-for']) {
                userLoginIP = req.headers['x-forwarded-for'].split(",")[0];
            } else if (req.connection && req.connection.remoteAddress) {
                userLoginIP = req.connection.remoteAddress;
            } else {
                userLoginIP = req.ip;
            }
            if (userLoginIP != "") {
                var tmpIp = userLoginIP.split(':');
                userLoginIP = tmpIp[tmpIp.length - 1];
            */

            var os = require('os'),
            interfaces = os.networkInterfaces(),
            address,
            addresses = [],
            i,
            l,
            interfaceId,
            interfaceArray;

            for (interfaceId in interfaces) {
                if (interfaces.hasOwnProperty(interfaceId)) {
                    interfaceArray = interfaces[interfaceId];
                    l = interfaceArray.length;

                    for (i = 0; i < l; i += 1) {

                        address = interfaceArray[i];

                        if (address.family === 'IPv4' && !address.internal) {
                            addresses.push(address.address);
                        }
                    }
                }
            }
            userLoginIP = addresses[0];

            if (userLoginIP != "") {
                var tmpIp = userLoginIP.split(':');
                userLoginIP = tmpIp[tmpIp.length - 1];

                /*
                if ((userLoginIP != userInfo[0].LOGIN_IP && userInfo[0].LOGIN_IP_YN != 'N') ) {
                    logger.info('미등록 IP에서 로그인 시도 [id : %s] [url : %s]', userId, 'users/login');
                    res.send('<script>alert("' + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL + '");location.href="/";</script>');
                    return false;
                }
                */

            } else {
                logger.info('[알림]로그인 실패  [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비정상 IP에서 로그인 시도 제한 사용자 로그인 시도' );
                
                res.send('<script>alert("' + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL + '");location.href="/";</script>');
                return false;
            }
            //ip 체크 end

            if (parseInt(userInfo[0].LAST_SCRT_DT) >= 61) {
                //미 로그인 날짜 지남
                logger.info('[알림]로그인 실패  [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비밀번호 변경 60일 지난 사용자 로그인 - 비밀번호변경페이지' );
                res.render('passwordChng', {
                    changeId: userId,
                });
                return false;
            }
            if (userInfo[0].PW_INIT_YN == 'Y') {
                //비밀번호 초기화->변경 페이지
                logger.info('[알림]로그인 실패  [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비밀번호 초기화 사용자 로그인 - 비밀번호변경페이지' );
                res.render('passwordChng', {
                    changeId: userId,
                });
                return false;
            }

            //-----로그인 성공 처리-----

            var beforeLoginIp = userInfo[0].LAST_LOGIN_IP;
            req.session.sid = userId;
            req.session.sAuth = userInfo[0].USER_AUTH;
            userInfo[0].LAST_LOGIN_IP = userLoginIP;
            req.session.userInfo = userInfo[0];
            
            let luisInfoRst = await pool.request()
                    .query(selectLuisInfoQry)
            let subsList = luisInfoRst.recordset;
            
            if (subsList.length > 0) {
                //req.session.subsKey = subsList[0].CNF_VALUE;
                req.session.subKey = subsList.find((item, idx) => {return item.CNF_TYPE === 'LUIS_SUBSCRIPTION'}).CNF_VALUE;
                req.session.subsKey = req.session.subKey;
                req.session.hostURL = subsList.find((item, idx) => {return item.CNF_TYPE === 'HOST_URL'}).CNF_VALUE;
                var tmpArr = [];
                tmpArr.push(subsList.find((item, idx) => {return item.CNF_TYPE === 'LUIS_SUBSCRIPTION'}));
                req.session.subsKeyList = tmpArr;
            }

            let userLoginRst = await pool.request()
                    .input('loginSid', sql.NVarChar, req.sessionID)
                    .input('loginIp', sql.NVarChar, userLoginIP)
                    .input('userId', sql.NVarChar, userId)
                    .query(updateUserLoginQry)
            
            let userLoginHistoryRst = await pool.request()
                    .input('userId', sql.NVarChar, userId)
                    .input('loginIp', sql.NVarChar, userLoginIP)
                    .query(insertUserLoginHistoryQry)


            var logStr = "로그인 IP : " + userLoginIP;
            logger.info('[알림]로그인 성공  [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, logStr);
                
            req.session.save(function(){
                res.send('<script>alert("최근 접속 시간 : ' + userInfo[0].LAST_LOGIN_DT2 + ', 최근 접속 IP : ' + beforeLoginIp + '");location.href="/";</script>');
            });
        })()
        
    } catch(err) {
        logger.info('[에러] 로그인 실패 [id : %s] [url : %s] [내용 : %s] ', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        res.send('<script>alert("' + i18n.getCatalog()[res.locals.languageNow].ALERT_LOGIN_FAIL + '");location.href="/";</script>');
    } finally {
        sql.close();
    }
});

router.get('/logout', function (req, res) { 
    
    var logoutID = !req.session.sid?"NONE":req.session.sid;
    var loginIp = !req.session.userInfo?"NONE":req.session.userInfo.LAST_LOGIN_IP;

    var sessionObjList = req.sessionStore.sessions;
    var isLoggedIn = false;
    for (var key in sessionObjList) {
        if (req.sessionID == key) {
            delete sessionObjList[key];
        } else {
            
            var userObj = JSON.parse(sessionObjList[key]);
            /*
            var dateBefore = userObj.cookie.expires.splie('T');
            var date1 = dateBefore[0].split('-');
            var date2 = dateBefore[1].split(':');
            var yy = date1[0]*1;
            var MM = date1[1]*1;
            var dd = date1[2]*1;
            var hh = date2[0]*1;
            var mm = date2[1]*1;
            var ss = date2[2].split('.')[0]*1;
            var sessionNow = new Date(yy, MM-1, dd,);
            */
            var dateNow = new Date();
            var timeDiff = dateNow.getTime() > Date.parse(userObj.cookie.expires);
            if (timeDiff) {
                delete sessionObjList[key];
            }
        }
    }
    try {
        (async () => {
            req.session.destroy(function (err) { 
                if (logoutID == 'NONE') {
                    res.redirect('/');
                    return false;
                }
                if (err) {  
                    logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', logoutID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err);
                    res.redirect('/');
                } else { 
                    if (logoutID == '___DUPLE_LOGIN_Y___') {
                        res.clearCookie('sid');
                        res.redirect('/');
                    } else {
                        dbConnect.getConnection(sql).then(pool => {
                        return pool.request()
                        .input('userId', sql.NVarChar, logoutID)
                        .input('loginIp', sql.NVarChar, loginIp)
                        .query(insertUserLogoutHistoryQry)

                        }).then(result => {
                            logger.info('[알림]로그아웃 [id : %s] [url : %s] [내용 : %s]', logoutID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '로그아웃 성공');
                            res.clearCookie('sid');
                            res.redirect('/');

                            //res.clearCookie('connect.sid', {path: '/'});
                            //res.clearCookie('i18n', {path: '/'});
                        });
                    }
                    
                    /*
                    var pool = await dbConnect.getAppConnection(sql);
                    let userLoginHistoryRst = await pool.request()
                                .input('userId', sql.NVarChar, logoutID)
                                .input('loginIp', sql.NVarChar, req.session.userInfo.LAST_LOGIN_IP)
                                .query(insertUserLogoutHistoryQry)

                    
                    logger.info('[알림]로그아웃 [id : %s] [url : %s] [내용 : %s]', logoutID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '로그아웃 성공');
                    res.clearCookie('sid');
                    res.redirect('/');
                    */
                }
            }); 
        })()
    } catch(err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', logoutID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.redirect('/');
    } finally {
    }
//------------------------------------------------------------------------------------------------
/*
    var logoutId = req.session.sid;
    req.session.destroy(function (err) {
        if (err) {
            //console.log(err);
            logger.info('[에러]로그아웃 [id : %s] [url : %s] [message : %s]', logoutId, 'users/logout', err);
        } else {
            dbConnect.getConnection(sql).then(pool => {
                return pool.request()
                    .input('userSessionID', sql.NVarChar, req.sessionID)
                    .input('userId', sql.NVarChar, logoutId)
                    .query("UPDATE TB_USER_M SET LOGIN_YN = (CASE WHEN LOGIN_SID = @userSessionID THEN 'N' ELSE LOGIN_YN END ), LOGIN_SID = (CASE WHEN LOGIN_SID = @userSessionID THEN 'NOTLOGIN' ELSE LOGIN_SID END )  WHERE USER_ID = @userId;");
                
            }).then(result => {
                logger.info('로그아웃 [id : %s] [url : %s]', logoutId, 'users/logout');
                res.clearCookie('sid');
                res.redirect('/');
            });
            //update [TB_USER_M] set LOGIN_SID = (case when LOGIN_SID = 'NOTLOGIN' then LOGIN_SID + 'aa' else 'NOTLOGIN' end ) where user_id='dyyoo' 
        }
    });

*/



	
});

router.get('/userMng', function (req, res) {  
    res.render('userMng');
});

router.post('/selectUserList', function (req, res) {

    let sortIdx = checkNull(req.body.sort, "USER_ID") + " " + checkNull(req.body.order, "ASC");
    let pageSize = checkNull(req.body.rows, 10);
    let currentPageNo = checkNull(req.body.page, 1);
    
    let searchName = checkNull(req.body.searchName, null);
    let searchId = checkNull(req.body.searchId, null);

    (async () => {
        try {
            var adminId = req.session.sid;
            logger.info('[알림] 사용자목록조회 [관리자id : %s]  [url : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
         
            var QueryStr =  "SELECT TBZ.* ,(TOT_CNT - SEQ + 1) AS NO \n" +
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
                            "                            , ISNULL(A.HPHONE, ' ')        AS HPHONE \n" +
                            "                            , ISNULL(A.M_P_NUM_1, ' ')    AS M_P_NUM_1 \n" +
                            "                            , ISNULL(A.M_P_NUM_2, ' ')    AS M_P_NUM_2 \n" +
                            "                            , ISNULL(A.M_P_NUM_3, ' ')    AS M_P_NUM_3 \n" +
                            "                            , ISNULL(A.USE_YN, ' ')       AS USE_YN \n" +
                            "                            , ISNULL(CONVERT(NVARCHAR(10), A.REG_DT, 120), ' ') AS REG_DT \n" +
                            "                            , ISNULL(A.REG_ID, ' ')       AS REG_ID " +
                            "                            , ISNULL(CONVERT(NVARCHAR(10), A.MOD_DT, 120), ' ') AS MOD_DT \n" +
                            "                            , ISNULL(A.MOD_ID, ' ')       AS MOD_ID \n" +
                            "                            , ISNULL(A.USER_AUTH, ' ')       AS USER_AUTH \n" +
                            "                            , ISNULL(PW_INIT_YN, 'N')  AS PW_INIT_YN  \n" + 
                            "                            , ISNULL(A.LOGIN_FAIL_CNT, 0)      AS LOGIN_FAIL_CNT \n" +
                            "                            , ISNULL(CONVERT(NVARCHAR, A.LAST_LOGIN_DT, 120), ' ')  AS LAST_LOGIN_DT \n" +
                            "                            , ISNULL(CONVERT(NVARCHAR, A.LOGIN_FAIL_DT, 120), ' ')  AS LOGIN_FAIL_DT \n" +
                            "                         FROM TB_USER_M A \n" +
                            "                         WHERE 1 = 1 \n";
                            //"					      AND A.USE_YN = 'Y' \n"; 

            if (searchName) {
                QueryStr += "					      AND A.EMP_NM like '%" + searchName + "%' \n";
            }
            if (searchId) {
                QueryStr += "					      AND A.USER_ID like '%" + searchId + "%' \n";
            }
            QueryStr +=     "                       ) TBX \n" +
                            "               ) TBY \n" +
                            "       ) TBZ \n" +
                            " WHERE PAGEIDX = " + currentPageNo + " \n" +
                            "ORDER BY " + sortIdx + " \n";
            
            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                

                recordList.push(item);
            }


            if(rows.length > 0){

                var totCnt = 0;
                if (recordList.length > 0)
                    totCnt = checkNull(recordList[0].TOT_CNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOT_CNT, 10) + 1);


                res.send({
                    records : recordList.length,
                    total : getTotalPageCount,
                    pageList : paging.pagination(currentPageNo,rows[0].TOT_CNT), //page : checkNull(currentPageNo, 1),
                    rows : recordList
                });

            }else{
                //res.send({list : result});
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

router.post('/saveUserInfo', function (req, res) {  
            
    

    (async () => {
        try {

            
            var userArr = JSON.parse(req.body.saveArr);
            var saveStr = "";
            var updateStr = "";
            var deleteStr = "";
            var useYnStr = "";

            var initPWQry = "SELECT TOP 1 CNF_VALUE FROM TBL_CHATBOT_CONF WHERE CNF_TYPE = 'CHAT_MNG_INIT_PW'"

            
            //관리자권한
            var adminId = req.session.sid;
            var chkAdminAuthStr = "SELECT USER_ID, ISNULL(USER_AUTH, '0') AS USER_AUTH \n";
            chkAdminAuthStr +=    "  FROM TB_USER_M \n";
            chkAdminAuthStr +=    " WHERE USER_ID = @userId ";

            let pool = await dbConnect.getConnection(sql);
            let getUserAuth = await pool.request()
                .input('userId', sql.NVarChar, req.session.sid)
                .query(chkAdminAuthStr);
            var getUserAuthRow = getUserAuth.recordset;
            logger.info('[알림] 관리자 권한 조회 [관리자id : %s]  [url : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);

            var userAuthYN = '0';
            if (getUserAuthRow.length > 0) {
                userAuthYN = getUserAuthRow[0].USER_AUTH;
                logger.info('[알림] 관리자 권한 조회 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userAuthYN, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            } else {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '계정 정보가 없습니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }

            if (userAuthYN < 99) {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한이 없는 사용자 접근입니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }  
            //--관리자권한

            //두연작업

            var initPw = "";
            let initPwQry = await pool.request().query(initPWQry);
            var getUserInitRow = initPwQry.recordset;
            if (getUserInitRow.length > 0) {
                initPw = getUserInitRow[0].CNF_VALUE;
            } else {
                res.send({status:500 , message:'등록된 초기화 비밀번호가 없습니다. 설정해주세요.'});
                return;
            }

            
            var newSalt = await pwConfig.getSaltCode();
            let basePW = pwConfig.getPassWord(initPw, newSalt);

            var isMe = false;
            for (var i=0; i<userArr.length; i++) { 
                if (userArr[i].statusFlag === 'NEW') {
                } else if (userArr[i].statusFlag === 'EDIT') {
                } else if (userArr[i].statusFlag === 'USEYN') { 
                    if (userArr[i].USER_ID == adminId) { isMe = true;}
                } else { //DEL
                    if (userArr[i].USER_ID == adminId) { isMe = true;}
                }
            }
            if (isMe) {
                
                logger.info('[알림] 본인 계정 제거 및 사용여부 변경 제한 [관리자id : %s] [대상id : %s] [url : %s]', adminId, adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            
                res.send({status:500 , message:'본인의 계정은 삭제 및 사용여부 수정을 할 수 없습니다.'});
                return false;
            }


            for (var i=0; i<userArr.length; i++) {
                if (userArr[i].statusFlag === 'NEW') {
                    saveStr = "INSERT INTO TB_USER_M (EMP_NUM, USER_ID, SCRT_NUM, SCRT_SALT, EMP_NM, HPHONE, EMAIL, USE_YN, USER_AUTH, PW_INIT_YN, LAST_SCRT_DT) " + 
                               "VALUES ( (SELECT MAX(EMP_NUM)+1 FROM TB_USER_M), ";
                    saveStr += " @USER_ID, @basePW,  @newSalt, @EMP_NM, @HPHONE, @EMAIL, 'Y', 77, 'Y', DATEADD(hh, -25+9, GETDATE())); ";
                    
                    let insertUser = await pool.request()
                            .input('USER_ID', sql.NVarChar, userArr[i].USER_ID)
                            .input('basePW', sql.NVarChar, basePW)
                            .input('newSalt', sql.NVarChar, newSalt)
                            .input('EMP_NM', sql.NVarChar, userArr[i].EMP_NM)
                            .input('HPHONE', sql.NVarChar, userArr[i].HPHONE)
                            .input('EMAIL', sql.NVarChar, userArr[i].EMAIL)
                            .query(saveStr);
                            
                    logger.info('[알림] 사용자생성 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userArr[i].USER_ID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            
                } else if (userArr[i].statusFlag === 'EDIT') {
                    updateStr = "UPDATE TB_USER_M SET EMP_NM = @EMP_NM, HPHONE = @HPHONE, EMAIL = @EMAIL WHERE USER_ID = @USER_ID; ";
                
                    
                    let updateUser = await pool.request()
                            .input('EMP_NM', sql.NVarChar, userArr[i].EMP_NM)
                            .input('HPHONE', sql.NVarChar, userArr[i].HPHONE)
                            .input('EMAIL', sql.NVarChar, userArr[i].EMAIL)
                            .input('USER_ID', sql.NVarChar, userArr[i].USER_ID)
                            .query(updateStr);

                    logger.info('[알림] 사용자수정 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userArr[i].USER_ID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            
                } else if (userArr[i].statusFlag === 'USEYN') {
                    useYnStr = "UPDATE TB_USER_M SET USE_YN = @USE_YN WHERE USER_ID = @USER_ID AND EMP_NM = @EMP_NM; ";
                
                    let useYnUser = await pool.request()
                            .input('USE_YN', sql.NVarChar, userArr[i].USE_YN)
                            .input('USER_ID', sql.NVarChar, userArr[i].USER_ID)
                            .input('EMP_NM', sql.NVarChar, userArr[i].EMP_NM)
                            .query(useYnStr);

                    logger.info('[알림] 사용자 계정 사용 여부 수정 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userArr[i].USER_ID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            
                } else { //DEL
                    deleteStr = "DELETE FROM TB_USER_M WHERE USER_ID = @USER_ID AND EMP_NM = @EMP_NM; ";
 
                    let deleteUser = await pool.request()
                            .input('USER_ID', sql.NVarChar, userArr[i].USER_ID)
                            .input('EMP_NM', sql.NVarChar, userArr[i].EMP_NM)
                            .query(deleteStr);
                    
                    //  DELETE FROM TBL_USER_RELATION_APP  WHERE USER_ID = @userId

                    var deleteUserAppStr = "DELETE FROM TBL_USER_RELATION_APP  WHERE USER_ID = @userId; ";
 
                    let deleteUserApp = await pool.request()
                            .input('userId', sql.NVarChar, userArr[i].USER_ID)
                            .query(deleteUserAppStr);

                    logger.info('[알림] 사용자 계정 삭제 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userArr[i].USER_ID, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            
                }
            }

            /*
            if (saveStr !== "") {
                let insertUser = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateUser = await pool.request().query(updateStr);
            }
            if (useYnStr !== "") {
                let useYnUser = await pool.request().query(useYnStr);
            }
            if (deleteStr !== "") {
                let deleteUser = await pool.request().query(deleteStr);
            }
            */
            res.send({status:200 , message:'Save Success'});
            
        } catch (err) {
            logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({status:500 , message:'에러가 발생했습니다. 로그를 확인해 주세요.'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});
router.post('/inItPassword', function (req, res) {

    var initPWStr = "SELECT TOP 1 CNF_VALUE FROM TBL_CHATBOT_CONF WHERE CNF_TYPE = 'CHAT_MNG_INIT_PW'"

    var adminId = req.session.sid;
    var userId = req.body.paramUserId;
    //basePW
    (async () => {
        try {
            var chkAdminAuthStr = "SELECT USER_ID, ISNULL(USER_AUTH, '0') AS USER_AUTH \n";
            chkAdminAuthStr +=    "  FROM TB_USER_M \n";
            chkAdminAuthStr +=    " WHERE USER_ID = @userId ";

            let pool = await dbConnect.getConnection(sql);
            let getUserAuth = await pool.request()
                .input('userId', sql.NVarChar, req.session.sid)
                .query(chkAdminAuthStr);
            var getUserAuthRow = getUserAuth.recordset;
            logger.info('사용자 비밀번호 초기화 전 관리자 권한 조회 [관리자id : %s]  [url : %s]', adminId, 'users/inItPassword');

            var userAuthYN = '0';
            if (getUserAuthRow.length > 0) {
                userAuthYN = getUserAuthRow[0].USER_AUTH;
                logger.info('사용자 비밀번호 초기화 전 관리자 권한 조회 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userAuthYN, 'users/saveUserInfo');
            } else {
                logger.info('[에러]사용자 비밀번호 초기화 전 [관리자id : %s] [url : %s] [error : %s]', adminId, 'users/saveUserInfo', '계정 정보가 없습니다.');
                res.send({ status: 400, message: 'failed' });
                return;
            }

            if (userAuthYN < 99) {
                logger.info('[에러]사용자 비밀번호 초기화 전 [관리자id : %s] [url : %s] [error : %s]', adminId, 'users/inItPassword', '관리자 권한이 없는 사용자 접근입니다.');
                res.send({ status: 400, message: 'failed' });
                return;
            } else {
                let initRst = await pool.request().query(initPWStr);
                
                var getUserInitRow = initRst.recordset;
                if (getUserInitRow.length > 0) {

                    var initPW = getUserInitRow[0].CNF_VALUE; 
                    var newSalt = await pwConfig.getSaltCode();
                    let basePW = pwConfig.getPassWord(initPW, newSalt);
                    
                    //var initStr = "UPDATE TB_USER_M SET SCRT_NUM = '" + basePW + "', SCRT_SALT = '" + newSalt + "', PW_INIT_YN='Y' WHERE USER_ID = '" + userId + "'; ";

                    var initStr = "UPDATE TB_USER_M SET LAST_SCRT_DT = DATEADD(hh, -25+9, GETDATE()), SCRT_NUM = @basePW, SCRT_SALT = @newSalt, PW_INIT_YN='Y' WHERE USER_ID = @userId; ";
                    let initPwRst = await pool.request() 
                            .input('basePW', sql.NVarChar, basePW)
                            .input('newSalt', sql.NVarChar, newSalt)
                            .input('userId', sql.NVarChar, userId)
                            .query(initStr);
    
                    logger.info('사용자 비밀번호 초기화 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userId, 'users/inItPassword');
                    res.send({status:200 , message:'Init Success'});
                } else {
                    res.send({status:500 , message:'등록된 초기화 비밀번호가 없습니다. 설정해주세요.'});
                }
                
            }
        } catch (err) {
            logger.info('[에러]사용자 비밀번호 초기화 [관리자id : %s] [대상id : %s] [url : %s] [error : %s]', adminId, userId, 'users/inItPassword', err);
            res.send({status:500 , message:'Init Error'});
        } finally {
            sql.close();
        }
    })()

});

//
router.get('/userAuthMng', function (req, res) {  
    res.render('userAuthMng');
});

router.post('/selectUserAppList', function (req, res) {
    
    let userId = checkNull(req.body.userId, '');
    var currentPage = checkNull(req.body.currentPage, 1);
    var currentPageUser = checkNull(req.body.currentPageUser, 1);
    var selectAppListStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY CHATBOT_NAME DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY CHATBOT_NAME DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         CHATBOT_NUM, CHATBOT_NAME, CULTURE, DESCRIPTION, APP_COLOR \n" +
                           "          FROM TBL_CHATBOT_APP ) tbp \n" +
                           " WHERE 1=1 \n" +
                           "   AND PAGEIDX = " + currentPage + "; \n";

    var UserAppListStr = "SELECT tbp.* from \n" +
                         "   (SELECT ROW_NUMBER() OVER(ORDER BY USER_ID DESC) AS NUM, \n" +
                         "           COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                         "           CEILING((ROW_NUMBER() OVER(ORDER BY USER_ID DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                        "            APP_ID \n" +
                        "       FROM TBL_USER_RELATION_APP \n" +
                        "      WHERE 1=1 \n" +
                        "        AND USER_ID = @userId) tbp  \n" + 
                        " WHERE 1=1;  \n";
                        //"   AND PAGEIDX = " + currentPage + "; \n";                  
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let appList = await pool.request().query(selectAppListStr);
            let rows = appList.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                recordList.push(item);
            }

            let userAppList = await pool.request()
                    .input('userId', sql.NVarChar, userId)
                    .query(UserAppListStr);
            let rows2 = userAppList.recordset;

            var checkedApp = [];
            for(var i = 0; i < rows2.length; i++){
                for (var j=0; j < recordList.length; j++) {
                    if (Number(rows2[i].APP_ID) === recordList[j].CHATBOT_NUM) {
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

router.post('/updateUserAppList', function (req, res) {
    let userId = req.body.userId;
    let saveData = JSON.parse(checkNull(req.body.saveData, ''));
    let removeData = JSON.parse(checkNull(req.body.removeData, ''));
    var saveDataStr = "";
    var removeDataStr = "";

    for (var i=0; i<saveData.length; i++) {
        saveDataStr += "INSERT INTO TBL_USER_RELATION_APP(USER_ID, APP_ID, CHAT_ID) " +
                    "     VALUES ('" + userId + "', " + saveData[i] + ", " + saveData[i] + "); \n";    
    }
    
    for (var i=0; i<removeData.length; i++) {
        removeDataStr += "DELETE FROM TBL_USER_RELATION_APP \n" +
                    "      WHERE 1=1 \n" +
                    "        AND CHAT_ID = " + removeData[i].APP_ID + " \n" +
                    "        AND USER_ID = '" + userId + "'; \n";     
    }
                        
                   
    (async () => {
        try {
            //관리자권한
            var adminId = req.session.sid;
            var chkAdminAuthStr = "SELECT USER_ID, ISNULL(USER_AUTH, '0') AS USER_AUTH \n";
            chkAdminAuthStr +=    "  FROM TB_USER_M \n";
            chkAdminAuthStr +=    " WHERE USER_ID = @userId ";

            let pool = await dbConnect.getConnection(sql);
            let getUserAuth = await pool.request()
                .input('userId', sql.NVarChar, req.session.sid)
                .query(chkAdminAuthStr);
            var getUserAuthRow = getUserAuth.recordset;
            logger.info('[알림] 관리자 권한 조회 [관리자id : %s]  [url : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);

            var userAuthYN = '0';
            if (getUserAuthRow.length > 0) {
                userAuthYN = getUserAuthRow[0].USER_AUTH;
                logger.info('[알림] 관리자 권한 조회 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userAuthYN, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            } else {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '계정 정보가 없습니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }

            if (userAuthYN < 99) {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한이 없는 사용자 접근입니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }  
            //--관리자권한
            
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

router.get('/chatBotMng', function (req, res) {  
    res.render('chatBotMng');
});

router.post('/selecChatList', function (req, res) {

    let pageSize = checkNull(req.body.rows, 10);
    let currentPageNo = checkNull(req.body.page, 1);
    
    let searchName = checkNull(req.body.searchName, null);
    let sortIdx = "CHATBOT_NAME";
    (async () => {
        try {
         
            var QueryStr =  "SELECT TBZ.* ,(TOT_CNT - SEQ + 1) AS NO \n" +
                            "  FROM (SELECT TBY.* \n" +
                            "          FROM (SELECT ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") AS SEQ, \n" +
                            "                       COUNT('1') OVER(PARTITION BY '1') AS TOT_CNT, \n" +
                            "                       CEILING(ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") / CONVERT( NUMERIC, " + pageSize + " ) ) PAGEIDX, \n" +
                            "                       TBX.* \n" +
                            "                  FROM ( \n" +
                            "                         SELECT \n" +
                            "                              A.CHATBOT_NUM      AS CHATBOT_NUM, \n" +
                            "                              A.CHATBOT_NAME      AS CHATBOT_NAME, \n" +
                            "                              A.CULTURE      AS CULTURE, \n" +
                            "                              A.DESCRIPTION      AS DESCRIPTION, \n" +
                            "                              A.APP_COLOR      AS APP_COLOR \n" +
                            "                         FROM TBL_CHATBOT_APP A \n" +
                            "                         WHERE 1 = 1 \n" ;

            if (searchName) {
                QueryStr += "					      AND A.CHATBOT_NAME like '%" + searchName + "%' \n";
            }
            QueryStr +=     "                       ) TBX \n" +
                            "               ) TBY \n" +
                            "       ) TBZ \n" +
                            " WHERE PAGEIDX = " + currentPageNo + " \n";
            
            
            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                

                recordList.push(item);
            }


            if(rows.length > 0){

                var totCnt = 0;
                if (recordList.length > 0)
                    totCnt = checkNull(recordList[0].TOT_CNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOT_CNT, 10) + 1);


                res.send({
                    records : recordList.length,
                    total : getTotalPageCount,
                    pageList : paging.pagination(currentPageNo,rows[0].TOT_CNT), //page : checkNull(currentPageNo, 1),
                    rows : recordList
                });

            }else{
                //res.send({list : result});
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

router.post('/selectChatAppList', function (req, res) {
    
    let chatId = checkNull(req.body.clicChatId, '');
    var currentPage = checkNull(req.body.currentPage, 1);
    var currentPageUser = checkNull(req.body.currentPageUser, 1);
    var selectAppListStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY APP_NAME DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY APP_NAME DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         APP_NAME, APP_ID,  LEFT(OWNER_EMAIL, CHARINDEX('@', OWNER_EMAIL)-1) OWNER_EMAIL, CHATBOT_ID \n" +
                           "          FROM TBL_LUIS_APP ) tbp \n" +
                           " WHERE 1=1 \n" +
                           "   AND PAGEIDX = " + currentPage + "; \n";

    var UserAppListStr = " SELECT  CHAT_ID, APP_ID \n" +
                         "   FROM TBL_CHAT_RELATION_APP  \n" +
                         "  WHERE 1=1  \n"  +
                         "    AND CHAT_ID = " + chatId + "  \n";          
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let appList = await pool.request().query(selectAppListStr);
            let rows = appList.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                recordList.push(item);
            }

            let userAppList = await pool.request().query(UserAppListStr);
            let rows2 = userAppList.recordset;

            var checkedApp = [];

            if (rows2.length > 0) {
                for(var i = 0; i < rows2.length; i++){
                    if(rows2[i].APP_ID==null){
                        //nothing
                    }else{
                        for (var j=0; j < recordList.length; j++) {
                            if (rows2[i].APP_ID.trim() === recordList[j].APP_ID.trim()) {
                                var item = {};
                                rows2[i].APP_ID = rows2[i].APP_ID.trim();
                                item = rows2[i];
                                checkedApp.push(item);
                                break;
                            }
                        }
                    }
                }
            } else {

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

router.post('/updateChatAppList', function (req, res) {
    let chatId = req.body.chatId.trim();
    let saveData = JSON.parse(checkNull(req.body.saveData, ''));
    let removeData = JSON.parse(checkNull(req.body.removeData, ''));
    var saveDataStr = "";
    var removeDataStr = "";
    var nullDeleteStr = "";
    var nullDeleteCnt = 0;

    for (var i=0; i<saveData.length; i++) {
        saveDataStr += "INSERT INTO TBL_CHAT_RELATION_APP(CHAT_ID, APP_ID) " +
                    "     VALUES (" + chatId + ", '" + saveData[i] + "'); \n";    
        nullDeleteCnt++;
    }
    
    for (var i=0; i<removeData.length; i++) {
        removeDataStr += "DELETE FROM TBL_CHAT_RELATION_APP \n" +
                    "      WHERE 1=1 \n" +
                    "        AND CHAT_ID = " + chatId + " \n" +
                    "        AND APP_ID = '" + removeData[i].APP_ID.trim() + "'; \n ";     
        
        //removeDataStr += " UPDATE TBL_LUIS_APP SET CHATBOT_ID = NULL WHERE APP_ID = '" + removeData[i].APP_ID.trim() + "'; \n" ;
    }
    nullDeleteStr += "DELETE FROM TBL_CHAT_RELATION_APP WHERE APP_ID IS NULL; \n" ;                   
                   
    (async () => {
        try {
            //관리자권한
            var adminId = req.session.sid;
            var chkAdminAuthStr = "SELECT USER_ID, ISNULL(USER_AUTH, '0') AS USER_AUTH \n";
            chkAdminAuthStr +=    "  FROM TB_USER_M \n";
            chkAdminAuthStr +=    " WHERE USER_ID = @userId ";

            let pool = await dbConnect.getConnection(sql);
            let getUserAuth = await pool.request()
                .input('userId', sql.NVarChar, req.session.sid)
                .query(chkAdminAuthStr);
            var getUserAuthRow = getUserAuth.recordset;
            logger.info('[알림] 관리자 권한 조회 [관리자id : %s]  [url : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);

            var userAuthYN = '0';
            if (getUserAuthRow.length > 0) {
                userAuthYN = getUserAuthRow[0].USER_AUTH;
                logger.info('[알림] 관리자 권한 조회 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userAuthYN, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            } else {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '계정 정보가 없습니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }

            if (userAuthYN < 99) {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한이 없는 사용자 접근입니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }  
            //--관리자권한

            if (saveData.length > 0) {
                let appList = await pool.request().query(saveDataStr);
            }
            
            if (removeData.length > 0) {
                let userAppList = await pool.request().query(removeDataStr);
            }

            if (nullDeleteCnt > 0) {
                nullDeleteCnt = 0;
                let nullDelete = await pool.request().query(nullDeleteStr);
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

router.get('/apiSetting', function (req, res) {
    res.render('apiSetting');
})

router.post('/selectApiList', function (req, res) {
    res.locals.selMenu = req.session.selMenu = 'm1';
    
    let sortIdx = checkNull(req.body.sort, "USER_ID") + " " + checkNull(req.body.order, "ASC");
    let pageSize = checkNull(req.body.rows, 10);
    let currentPageNo = checkNull(req.body.page, 1);
    
    let searchId = checkNull(req.body.searchId, null);

    var selectAppListStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY API_ID DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY API_ID DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         API_SEQ, API_ID AS API_ID_HIDDEN, API_ID,  API_URL, API_DESC, USE_YN \n" +
                            "     FROM TBL_URL ) tbp \n" +
                            " WHERE 1=1 \n" +
                            " AND   USE_YN='Y' \n";
    if (searchId) {
        selectAppListStr +="   AND API_ID like '%" + searchId + "%' \n";
    }          
    selectAppListStr +=  "ORDER BY API_SEQ ASC, API_ID ASC; \n";
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let appList = await pool.request().query(selectAppListStr);
            let rows = appList.recordset;


            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                recordList.push(item);
            }

            res.send({
                records : recordList.length,
                rows : recordList,
                pageList : paging.pagination(currentPageNo,rows[0].TOTCNT)
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

router.post('/saveApiInfo', function(req, res){
    var apiArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateStr = "";
    var deleteStr = "";

    for (var i=0; i<apiArr.length; i++) {
        if (apiArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TBL_URL (API_ID, API_URL, API_DESC) ";
            saveStr += "VALUES ('" + apiArr[i].API_ID  + "', '" + apiArr[i].API_URL  + "', '" + apiArr[i].API_DESC  + "'); ";
        } else if (apiArr[i].statusFlag === 'EDIT') {
            updateStr += "UPDATE TBL_URL SET API_ID = '" + apiArr[i].API_ID  + "', "
                                        +  " API_URL = '" + apiArr[i].API_URL  + "', "
                                        +  " API_DESC = '" + apiArr[i].API_DESC   + "' "
                      +  "WHERE API_SEQ = '" + apiArr[i].API_SEQ + "'; ";
        } else { //DEL
            deleteStr += "UPDATE TBL_URL SET USE_YN = 'N' WHERE API_SEQ = '" + apiArr[i].API_SEQ + "'; ";
        }
    }

    (async () => {
        try {
            //관리자권한
            var adminId = req.session.sid;
            var chkAdminAuthStr = "SELECT USER_ID, ISNULL(USER_AUTH, '0') AS USER_AUTH \n";
            chkAdminAuthStr +=    "  FROM TB_USER_M \n";
            chkAdminAuthStr +=    " WHERE USER_ID = @userId ";

            let pool = await dbConnect.getConnection(sql);
            let getUserAuth = await pool.request()
                .input('userId', sql.NVarChar, req.session.sid)
                .query(chkAdminAuthStr);
            var getUserAuthRow = getUserAuth.recordset;
            logger.info('[알림] 관리자 권한 조회 [관리자id : %s]  [url : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);

            var userAuthYN = '0';
            if (getUserAuthRow.length > 0) {
                userAuthYN = getUserAuthRow[0].USER_AUTH;
                logger.info('[알림] 관리자 권한 조회 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userAuthYN, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            } else {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '계정 정보가 없습니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }

            if (userAuthYN < 99) {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한이 없는 사용자 접근입니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }  
            //--관리자권한
            if (saveStr !== "") {
                let insertUser = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateUser = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteUser = await pool.request().query(deleteStr);
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


router.get('/addApp', function (req, res) {
    res.render('addApp');
});
/*
router.post('/selecChatList', function (req, res) {

    var selectAppListStr =  " SELECT CHATBOT_NUM, CHATBOT_NAME, CULTURE, DESCRIPTION, APP_COLOR \n" + 
                            " FROM TBL_CHATBOT_APP \n" +
                            " WHERE 1=1 \n" +
                            " ORDER BY CHATBOT_NAME DESC, CULTURE DESC; \n";
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let appList = await pool.request().query(selectAppListStr);
            let rows = appList.recordset;


            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                recordList.push(item);
            }

            res.send({
                rows : recordList
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
*/

router.post('/addApp', function (req, res) {

    var chatNum = req.body.selApp;
    var chatName = req.body.selAppName;
    var appDes = checkNull(req.body.appDes, ' ');
    var getApplist = "SELECT APP_NAME, CULTURE, SUBSC_KEY FROM TBL_LUIS_APP WHERE CHATBOT_ID = " + chatNum + ";";
    var HOST = req.session.hostURL;
    
    (async () => {
        try {
            //관리자권한
            var adminId = req.session.sid;
            var chkAdminAuthStr = "SELECT USER_ID, ISNULL(USER_AUTH, '0') AS USER_AUTH \n";
            chkAdminAuthStr +=    "  FROM TB_USER_M \n";
            chkAdminAuthStr +=    " WHERE USER_ID = @userId ";

            let pool = await dbConnect.getConnection(sql);
            let getUserAuth = await pool.request()
                .input('userId', sql.NVarChar, req.session.sid)
                .query(chkAdminAuthStr);
            var getUserAuthRow = getUserAuth.recordset;
            logger.info('[알림] 관리자 권한 조회 [관리자id : %s]  [url : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);

            var userAuthYN = '0';
            if (getUserAuthRow.length > 0) {
                userAuthYN = getUserAuthRow[0].USER_AUTH;
                logger.info('[알림] 관리자 권한 조회 [관리자id : %s] [대상id : %s] [url : %s]', adminId, userAuthYN, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
            } else {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '계정 정보가 없습니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }

            if (userAuthYN < 99) {
                logger.info('[에러] [관리자id : %s] [url : %s] [error : %s]', adminId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한이 없는 사용자 접근입니다.');
                res.send({status:500 , message:'Update Error'});
                return false;
            }  
            //--관리자권한
            let rows = await pool.request().query(getApplist);

            var appNames = rows.recordset;
            var appName = appNames[0].APP_NAME.split("_")[0] + "_" + appNames[0].APP_NAME.split("_")[1] + "_" + pad(appNames.length+1, 2);
            var appCulture = appNames[0].CULTURE;

            var selSubKey = appNames[0].SUBSC_KEY;

            var client = new Client();
            
            var options = {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': selSubKey
                },
                data: {
                    'name': appName,
                    'description': appDes,
                    'culture': appCulture
                }
            };
            try{
                client.post( HOST + '/luis/api/v2.0/apps/', options, function (data, response) {
                    //console.log(data); // app id값
                    
                    if(response.statusCode == 201){ // 등록 성공

                        var createAppId = data;

                        var client = new Client();
                            var options = {
                                headers: {
                                    'Ocp-Apim-Subscription-Key': selSubKey//subKey
                                }
                            };

                            client.get( HOST + '/luis/api/v2.0/apps/' + createAppId, options, function (data, response) {

                                var appInfo = data;
                                var appStr = "";
                                appStr += "INSERT INTO TBL_LUIS_APP (APP_NUM, SUBSC_KEY, APP_ID, VERSION, APP_NAME, OWNER_EMAIL, REG_DT, CULTURE, DESCRIPTION) \n";
                                appStr += "VALUES ((SELECT isNULL(MAX(APP_NUM),0) FROM TBL_LUIS_APP)+1, '" + selSubKey + "', '" + appInfo.id + "', \n" +
                                            " '" + appInfo.activeVersion + "', '" + appInfo.name + "', '" + appInfo.ownerEmail + "', \n" +
                                            " convert(VARCHAR(33), '" + appInfo.createdDateTime + "', 126), '" + appInfo.culture + "', '" + appInfo.description + "'); \n";

                                appStr += "INSERT INTO TBL_CHAT_RELATION_APP(CHAT_ID, APP_ID) \n";
                                appStr += "VALUES(" + chatNum + ", '" + appInfo.id + "'); \n";

                                dbConnect.getConnection(sql).then(pool => {
                                    //new sql.ConnectionPool(dbConfig).connect().then(pool => {
                                    return pool.request().query(appStr)
                                }).then(result => {
                                    let rows = result.recordset;

                                    var insertQry = "INSERT INTO TBL_CHATBOT_CONF (CNF_TYPE, CNF_NM, CNF_VALUE, ORDER_NO) \n" +
                                                    "VALUES ('LUIS_APP_ID', '" + appInfo.name + "', '" + appInfo.id + "', (SELECT MAX(ORDER_NO)+1 FROM TBL_CHATBOT_CONF WHERE CNF_TYPE='LUIS_APP_ID')); "
                                    dbConnect.getAppConnection(sql, chatName, req.session.dbValue).then(pool => {
                                        //new sql.ConnectionPool(dbConfig).connect().then(pool => {
                                        return pool.request().query(insertQry) 
                                    }).then(result => {
                                        let rows = result.recordset;

                                        res.send({ message:'Save Success'});
                                        sql.close();
                                    }).catch(err => {
                                        console.log(err);
                                        sql.close();
                                    });
                                }).catch(err => {
                                    console.log(err);
                                    sql.close();
                                });
                                
                                
                                //res.send({ resultId:response.statusCode, createAppId:createAppId,  message:'Save Success'});
                        });

                        
                        
                    }else{
                        res.send({ message:'Save failed'});
                    }
                });
            }catch(e){
                console.log(e);
            }
            
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
})


router.post('/resetTimeOut', function (req, res) {

    res.send({status:200});
})

router.post('/getAppSelValues', function (req, res) {
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveStr !== "") {
                let insertUser = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateUser = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteUser = await pool.request().query(deleteStr);
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
})

function validateUserInfo(userId, changePw) {
    var pwMinLength = 4;    //문자4개 이상 아이디랑 일치하면 제한, 4자리 반복문자 숫자 제한
    var pwLength = changePw.length;
    var loopLength = pwLength-pwMinLength;   
    
    if (pwLength < 8) {
        logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비밀번호 8자 미만' );
        return false;    //비밀번호 8자 미만
    }
    for (var i=0; i<=loopLength; i++ ) {

        var subPw = changePw.substring(i, pwMinLength + i);
        if (userId.indexOf(subPw) != -1) {
            logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비밀번호와 아이디가 4자 일치' );
            return false;    //비밀번호와 아이디가 4자 일치
        }
    }

    var chkContinuous = false;
    for (var i=0; i<=loopLength; i++ ) {
        var sameNum = 0;
        for (var j=0; j<pwMinLength-1; j++) {
            if (changePw[j]==changePw[j+1]) {
                sameNum++;
            }
            if (sameNum == pwMinLength-1) {
                chkContinuous = true;
            }
        }
        if (chkContinuous) {break;}
    }
    if (chkContinuous) {
        logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비밀번호에 연속 4개 일치하는 문자,숫자' );
        return false;    //비밀번호에 연속 4개 일치하는 문자,숫자
    }

    return true;  
}

function fn_passWordChk(inputPW, userId, req) {
    var pw = inputPW;
    
    if (typeof pw != "undefined") {
        var sumChk = 0;
        var num = pw.search(/[0-9]/g);
        var engSmall = pw.search(/[a-z]/ig);
        var engBig = pw.search(/[A-Z]/ig);
        var spe = pw.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);

        if (num>0) {
            sumChk++;
        }
        if (engSmall>=0 || engBig >=0) {
            sumChk++;
        }
        /*
        if (engBig > 0) {
            sumChk++;
        }
        */
        if (spe>=0) {
            sumChk++;
        }

        if (pw.length < 8 || pw.length >= 20) {
            logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비밀번호는 8자 이상 20자 이하로 입력하지 않음' );
            return 'false';
        }

        if (sumChk < 3) {
            logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '비밀번호가 영문 대소문자, 숫자, 특수문자중 3가지 이상 있지 않음' );
            return 'false';
        }
        return 'true';
    }

}
router.post('/changePW', function (req, res) {

    if (req.body.err) {
        res.redirect("/users/error");
        return;
    }
    
    var getOriginalPw = req.body.originalPw;

    var userId = req.body.changeId;
    var userPw = req.body.changePw1;

    if (!validateUserInfo(userId, userPw) && !fn_passWordChk(userPw, userId, req)) {
        res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CHNG_FAIL});
        return false;
    }

    //let chngPw = encryption(userPw);
    (async () => {
        try {
            //두연작업
            let pool = await dbConnect.getConnection(sql);
            let loginUserRst = await pool.request()
                                            .input('userId', sql.NVarChar, userId)
                                            .query(loginSelQry) 
            var userInfoArr = loginUserRst.recordset;
            if(userInfoArr.length > 0  ) {
                //사용자 있음
                //비밀번호 변경 시간 1일 안지날 경우
                var failDate = parseInt(userInfoArr[0].LAST_SCRT_DT_HH);
                if (failDate <= 24) {
                    logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '마지막 비밀번호 변경 후 24시간이 지나지 않음' );
                    res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CHNG_FAIL});
                    return false;
                }
            } else {
                logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '조회된 아이디 없음' );
                res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CHNG_FAIL});
                return false;
            }
            var userInfo = userInfoArr[0];
            
            var originalPw = pwConfig.getPassWord(getOriginalPw, userInfo.SCRT_SALT);
            var firstPwBefore = pwConfig.getPassWord(userPw, userInfo.SCRT_SALT_FIRST);
            var secondPwBefore = pwConfig.getPassWord(userPw, userInfo.SCRT_SALT_SECOND);
            var thirdPwBefore = pwConfig.getPassWord(userPw, userInfo.SCRT_SALT_THIRD);

            if (originalPw != userInfo.SCRT_NUM) {//ALERT_CHNG_FAIL  //ALERT_CHNG_SUCCESS
                logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '잘못된 기존 비밀번호 입력' );
                res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CHNG_FAIL});
                return false;
            }

            if (firstPwBefore == userInfo.SCRT_NUM_FIRST) {//ALERT_CHNG_FAIL  //ALERT_CHNG_SUCCESS
                logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '이전 첫번째 비밀번호와 일치' );
                res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CANT_CHANGE_SAME_PW});
                return false;
            }
            if (secondPwBefore == userInfo.SCRT_NUM_SECOND) {//ALERT_CHNG_FAIL  //ALERT_CHNG_SUCCESS
                logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '이전 두번째 비밀번호와 일치' );
                res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CANT_CHANGE_SAME_PW});
                return false;
            }
            if (thirdPwBefore == userInfo.SCRT_NUM_THIRD) {//ALERT_CHNG_FAIL  //ALERT_CHNG_SUCCESS
                logger.info('[알림]비밀번호 변경 실패 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '이전 세번째 비밀번호와 일치' );
                res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CANT_CHANGE_SAME_PW});
                return false;
            }
//작업중


            var newSalt = await pwConfig.getSaltCode();
            let chngPw = pwConfig.getPassWord(userPw, newSalt);

            var QueryStr = `
            UPDATE TB_USER_M 
            SET  PW_INIT_YN = 'N'  
               , SCRT_NUM_THIRD = SCRT_NUM_SECOND 
               , SCRT_NUM_SECOND = SCRT_NUM_FIRST 
               , SCRT_NUM_FIRST = SCRT_NUM 

               , SCRT_SALT_THIRD = SCRT_SALT_SECOND 
               , SCRT_SALT_SECOND = SCRT_SALT_FIRST 
               , SCRT_SALT_FIRST = SCRT_SALT  

               , LAST_SCRT_DT = DATEADD(hh, 9, GETDATE()) 

               , SCRT_NUM = @chngPw 
               , SCRT_SALT = @newSalt 
            WHERE USER_ID = @userId; 
            `; // "UPDATE TB_USER_M SET SCRT_NUM = @chngPw, SCRT_SALT = @newSalt, PW_INIT_YN = 'N' WHERE USER_ID = @userId;";

            let result1 = await pool.request()
                .input('chngPw', sql.NVarChar, chngPw)
                .input('newSalt', sql.NVarChar, newSalt)
                .input('userId', sql.NVarChar, userId)
                .query(QueryStr);

            logger.info('[알림]비밀번호 변경 [id : %s] [url : %s] [내용 : %s]', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '성공' );
            res.send({result:true , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CHNG_SUCCESS});
    
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CHNG_FAIL});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
        res.send({result:false , message: i18n.getCatalog()[res.locals.languageNow].ALERT_CHNG_FAIL});
    })
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




/*
router.post('/', function (req, res) {
    let sortIdx = checkNull(req.body.sort, "USER_ID") + " " + checkNull(req.body.order, "ASC");
    let pageSize = checkNull(req.body.rows, 10);
    let currentPageNo = checkNull(req.body.page, 1);
    
    let searchName = checkNull(req.body.searchName, null);
    let searchId = checkNull(req.body.searchId, null);

    (async () => {
        try {
         
            var QueryStr =  "SELECT TBZ.* ,(TOT_CNT - SEQ + 1) AS NO " +
                            "  FROM (SELECT TBY.* " +
                            "          FROM (SELECT ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") AS SEQ, " +
                            "                       COUNT('1') OVER(PARTITION BY '1') AS TOT_CNT, " +
                            "                       CEILING(ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") / CONVERT( NUMERIC, " + pageSize + " ) ) PAGEIDX, " +
                            "                       TBX.*" +
                            "                  FROM ( " +
                            "                         SELECT " +
                            "                              A.EMP_NUM      AS EMP_NUM " +
                            "                            , A.USER_ID      AS USER_ID_HIDDEN " +
                            "                            , A.USER_ID      AS USER_ID " +
                            "                            , A.SCRT_NUM     AS SCRT_NUM " +
                            "                            , A.EMP_NM       AS EMP_NM " +
                            "                            , A.EMP_ENGNM    AS EMP_ENGNM " +
                            "                            , A.EMAIL        AS EMAIL " +
                            "                            , A.M_P_NUM_1    AS M_P_NUM_1 " +
                            "                            , A.M_P_NUM_2    AS M_P_NUM_2 " +
                            "                            , A.M_P_NUM_3    AS M_P_NUM_3 " +
                            "                            , A.USE_YN       AS USE_YN " +
                            "                            , CONVERT(NVARCHAR(10), A.REG_DT, 120) AS REG_DT " +
                            "                            , A.REG_ID       AS REG_ID " +
                            "                            , CONVERT(NVARCHAR(10), A.MOD_DT, 120) AS MOD_DT " +
                            "                            , A.MOD_ID       AS MOD_ID " +
                            "                            , A.LOGIN_FAIL_CNT      AS LOGIN_FAIL_CNT " +
                            "                            , CONVERT(NVARCHAR, A.LAST_LOGIN_DT, 120)  AS LAST_LOGIN_DT " +
                            "                            , CONVERT(NVARCHAR, A.LOGIN_FAIL_DT, 120)  AS LOGIN_FAIL_DT " +
                            "                         FROM TB_USER_M A " +
                            "                         WHERE 1 = 1 " +
                            "					      AND A.USE_YN = 'Y' "; 

            if (searchName) {
                QueryStr += "					      AND A.EMP_NM like '%" + searchName + "%' ";
            }
            if (searchId) {
                QueryStr += "					      AND A.USER_ID like '%" + searchId + "%' ";
            }
            QueryStr +=     "                       ) TBX " +
                            "               ) TBY " +
                            "       ) TBZ" +
                            " WHERE PAGEIDX = " + currentPageNo + " " +
                            "ORDER BY " + sortIdx + " ";
            
            
            let pool = await sql.connect(dbConfig)
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};

                item = rows[i];
                

                recordList.push(item);
            }


            if(rows.length > 0){

                var totCnt = 0;
                if (recordList.length > 0)
                    totCnt = checkNull(recordList[0].TOT_CNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOT_CNT, 10) + 1);


                res.send({
                    records : recordList.length,
                    total : getTotalPageCount,
                    page : checkNull(currentPageNo, 1),
                    rows : recordList
                });

            }else{
                res.send({list : result});
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
*/

router.post('/selectUserHistoryList', function (req, res) {
    
    var currentPageNo = req.body.currentPage;
    var loginStatus = req.body.loginStatus;
    var userId = req.session.sid;
    (async () => {
        try {
         
            var QueryStr =  `
                SELECT SEQ, USERID, CONVERT(CHAR(23), LOGIN_TIME, 21) AS LOGIN_TIME, CONVERT(CHAR(23), LOGOUT_TIME, 21) AS LOGOUT_TIME, USERIP, LOGIN_STATUS 
                  FROM TBL_USER_HISTORY 
                 WHERE USERID = @userId 
                   AND  LOGIN_STATUS LIKE (CASE WHEN 'ALL' = @loginStatus THEN '%%' WHEN 'LOGIN' = @loginStatus THEN '%LOGIN%' ELSE '%LOGOUT%' END) 
                ORDER BY LOGIN_TIME DESC;
            `;
            
            let pool = await dbConnect.getConnection(sql);userId
            let result1 = await pool.request()
                                .input('userId', sql.NVarChar, userId)
                                .input('loginStatus', sql.NVarChar, loginStatus)
                                .query(QueryStr);

            let rows = result1.recordset;

            if(rows.length > 0){
                var listLength = rows.length;
                var pageStartInex = 0;
                if ((currentPageNo-1)*10 > listLength) {
                    rows = rows.splice(0, listLength<11?listLength:10);
                }
                else {
                    rows = rows.splice((currentPageNo-1)*10, 10);
                }
                res.send({userHistoryList : rows, pageList : paging.pagination(currentPageNo, listLength)});
            } else {
                res.send({userHistoryList : rows});
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()


});



router.post('/initUserLimit', function (req, res) {
    let userId = checkNull(req.body.userId, -1);

    var adminId = req.session.sid;
    var userInfo = req.session.userInfo;
    if (userId == -1) {
        logger.info('[에러] [id : %s] [대상id : %s] [url : %s] [내용 : %s] ', adminId, 'NONE', req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '사용자 로그인제한 해제 실패');
        res.send({
            status: 400,
            message: i18n.getCatalog()[res.locals.languageNow].It_failed
        });
    } else if (typeof userInfo == "undefined") {
        logger.info('[에러] [id : %s] [대상id : %s] [url : %s] [내용 : %s] ', adminId, userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한 정보 X1');
        res.send({
            status: 400,
            message: i18n.getCatalog()[res.locals.languageNow].It_failed
        });
    } else {
        (async () => {
            try {
                if (typeof userInfo.USER_AUTH == "undefined") {
                    logger.info('[에러] [id : %s] [대상id : %s] [url : %s] [내용 : %s] ', adminId, userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한 정보 X2');
                    res.send({
                        status: 400,
                        message: i18n.getCatalog()[res.locals.languageNow].It_failed
                    });
                    return false;
                } 
                var userAuth = userInfo.USER_AUTH;

                if (userAuth*1 < 99) {
                    logger.info('[에러] [id : %s] [대상id : %s] [url : %s] [내용 : %s] ', adminId, userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, '관리자 권한 99미만');
                    res.send({
                        status: 400,
                        message: i18n.getCatalog()[res.locals.languageNow].It_failed
                    });
                    return false;
                } 

                var QueryStr = "UPDATE TB_USER_M SET LOGIN_FAIL_CNT = 0 WHERE USER_ID = @userId;";
                    
                let pool = await dbConnect.getConnection(sql);
                let result1 = await pool.request()
                        .input('userId', sql.NVarChar, userId)
                        .query(QueryStr);

                logger.info('[알림]로그인 실패 횟수 초기화 성공  [id : %s] [대상id : %s] [url : %s] ', adminId, userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl);
                res.send({
                    status: 200,
                    message: i18n.getCatalog()[res.locals.languageNow].SUCCESS
                });
                
            } catch (err) {
                logger.info('[에러] [id : %s] [대상id : %s] [url : %s] [내용 : %s] ', adminId, userId, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
                res.send({
                    status: 400,
                    message: i18n.getCatalog()[res.locals.languageNow].It_failed
                });
            } finally {
                sql.close();
            }
        })()
    }

});

router.get('/dupleLogin', function (req, res) {
    res.send('<script>alert("' + i18n.getCatalog()[i18n.getLocale(req)].ALERT_OTHER_USER_LOGIN_WITH_SAME_ID + '");location.href="/users/logout";</script>');
});


router.get('/timeOut', function (req, res) {
    res.send('<script>alert("' + i18n.getCatalog()[i18n.getLocale(req)].ALERT_LOGOUT + '");location.href="/users/logout";</script>');
});

router.get('/error', function (req, res) {
    if (req.session.sid) {
        res.render('error');
    } else {
        var userId = req.session.sid;
        res.render('error');
    }
});



module.exports = router;
