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

//file upload
var formidable = require('formidable');
var fs = require('fs-extra');

const syncClient = require('sync-rest-client');
const appDbConnect = require('../../config/appDbConnect');

//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end

var router = express.Router();

// 파일 업로드 페이지 경로
router.get('/upload', function (req, res, next) {
        logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
        res.render("chatbotMng/uploads")
    });

//파일 업로드 처리    
router.post('/file_upload', function (req, res) {
    var form = new formidable.IncomingForm();
    var fields = [];
    var files = [];
    var fields_array = [];
    var files_array = [];
    var modName ='';
    form.encoding = 'utf-8';
    //파일 경로 가공
    var strArray = __filename.split('routes');
    form.uploadDir = strArray[0].replace(/\\/gi,'/') + 'public/images/uploads'; //저장경로
    form.multiples = true;
    form.keepExtensions = true;
    
    form.on('field', function(field, value){
        fields.push([field, value]);
        fields_array.push(value);
    }).on('file', function(filed,file){
        modName = Date.now() +'_'+ file.name; //동일한 이름의 파일을 업로드시에 중복저장을 막기위한 rename.
        fs.rename(file.path, form.uploadDir + '/' + modName);  

        files.push([filed, file.name]);
        files_array.push([file.name]);
    }).on('end', function(){
        console.log('------------<fields>------------');
        for(var i = 0; i<fields_array.length; i++) {
            console.log('fields['+i+'] :'+fields_array[i]);   
        }
        console.log('------------<files>------------');
        for(var i = 0; i<files_array.length; i++) {
            console.log('files['+i+'] :'+files_array[i]);
            
        }
        console.log('--------------------------------');
    
        var trans_object = 
        {
            'field' : fields_array,
            'file' : files_array
        }
        var oriName = files_array[0]; //원본 파일명
        var InsertmodName = modName;
        console.log(InsertmodName);
        var fiPath = req.headers.origin + '/images/uploads/' + InsertmodName; //파일 URL 경로
        //var fiPath = form.uploadDir+'/'+files_array[0];

        
        (async () => {
            try {
                var insertQueryString = " INSERT INTO TBL_FILE_UPLOAD(ORIGINAL_NAME, MODIFIED_NAME, FILE_PATH) \n";
                    insertQueryString += " VALUES (@originalName, @modifiedName, @filePath ); ";
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                //let pool = await dbConnect.getConnection(sql);
                let result1 = await pool.request()
                    .input('originalName', sql.NVarChar, oriName)
                    .input('modifiedName', sql.NVarChar, InsertmodName)
                    .input('filePath', sql.NVarChar, fiPath)
                    .query(insertQueryString);
     
                //res.send({ status: 200, message: 'insert Success' });
                res.render('chatbotMng/uploads');
            } catch (err) {
                console.log(err);
                res.send({ status: 500, message: 'insert Entity Error' });
            } finally {
                sql.close();
            }
        })()
    
        sql.on('error', err => {
        })
        //res.send(trans_object);

        //초기화
        fields = [];
        files = [];
        fields_array = [];
        files_array = [];
    }).on('error', function(error){
        console.log('[error] error : ' + error);
    });
    form.parse(req, function(error, field, file){
        console.log('[parse()] : ' + error + ', field : '+field+', file : '+file);
        console.log('upload success!');
    })
});


//등록된 파일 리스트 출력
router.post('/selectFileUpload', function (req, res) {
        //logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
        (async () => {
            try {
                var QueryStr = "SELECT SEQ, ORIGINAL_NAME, MODIFIED_NAME, FILE_PATH FROM TBL_FILE_UPLOAD ORDER BY SEQ ASC;";
    
                //let pool = await dbConnect.getConnection(sql);
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                let result = await pool.request().query(QueryStr);
    
                let rows = result.recordset;
    
                var recordList = [];
                for (var i = 0; i < rows.length; i++) {
                    var item = {};
                    item = rows[i];
    
                    recordList.push(item);
                }
    
                if (rows.length > 0) {
                    res.send({
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

module.exports = router;