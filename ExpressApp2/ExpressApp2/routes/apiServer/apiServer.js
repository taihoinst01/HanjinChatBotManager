'use strict';

var express = require('express');

var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var dbConnect = require('../../config/dbConnect');

const appDbConnect = require('../../config/appDbConnect');

var router = express.Router();

//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end


router.get('/getChatSentence', function (req, res) {

    if (req.query.chat_res_code == '976431') {
        (async () => {
            try {
                let pool = await dbConnect.getConnection(sql);
                
                
                var selectQry = "SELECT USER_ID \n"
                selectQry += "          ,EMP_NM \n";
                selectQry += "     FROM TB_USER_M; \n";


                let getSentence = await pool.request().query(selectQry);
                let similarSentence = getSentence.recordset;

                var content = new Object();
                var contentList = [];
                for (var i=0; i<similarSentence.length; i++) {
                    contentList.push(similarSentence[i].USER_ID);
                }
                
                content['statusCode'] = 200;
                content['content'] = contentList;
                return res.json(content);
            }
            catch(e) {
                
                logger.info('[에러]자동완성 api 응답 에러  [url : %s] [내용 : %s]', 'apiServer/getChatSentence',  e.message);
                var apiFail = [
                    {
                        statusCode : 500
                    }
                ]
                return res.json(apiFail);
            }
        })();
    } else {
        var apiFail = [
            {
                statusCode : 401
            }
        ]
        return res.json(apiFail);
    }

});



router.get('/getChatTemplate', function (req, res) {

    if (req.query.chat_name) {
        (async () => {
            try {
                let pool = await dbConnect.getConnection(sql);
                
                var selectQry = "SELECT HEADER_COLOR \n"
                selectQry += "          ,BODY_COLOR \n";
                selectQry += "          ,POPHEADER_COLOR \n";
                selectQry += "          ,BOT_COLOR \n";
                selectQry += "          ,USER_COLOR \n";
                selectQry += "          ,ICON_IMG \n";
                selectQry += "          ,BACKGROUND_IMG \n";
                selectQry += "          ,CHATBOT_NAME \n";
                selectQry += "     FROM TBL_CHATBOT_TEMPLATE \n";
                selectQry += "    WHERE USE_YN = 'Y' \n";
                selectQry += "      AND CHATBOT_NAME = @chatName \n";


                let getSentence = await pool.request()
                        .input('chatName', sql.NVarChar, req.query.chat_name)
                        .query(selectQry);
                let templateResult = getSentence.recordset;

                var content = new Object();
                var contentList = [];

                if (templateResult.length == 0) {
                    content['statusCode'] = 200;
                    content['message'] = "Chatbot does not exist."
                    content['content'] = contentList;
                    return res.json(content);
                } else {
                    for (var i=0; i<templateResult.length; i++) {
                        contentList.push(templateResult[i]);
                        break;
                    }
                    
                    content['statusCode'] = 200;
                    content['content'] = contentList;
                    return res.json(content);
                }
            }
            catch(e) {
                
                logger.info('[에러]챗봇 템플릿 응답 에러  [url : %s] [내용 : %s]', 'apiServer/getChatTemplate',  e.message);
                var apiFail = [
                    {
                        statusCode : 500
                    }
                ]
                return res.json(apiFail);
            }
        })();
    } else {
        var apiFail = [
            {
                statusCode : 403,
                message : "missing parameter"
            }
        ]
        return res.json(apiFail);
    }

});


module.exports = router;
