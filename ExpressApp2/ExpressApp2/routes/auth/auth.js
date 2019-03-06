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

//권한관리 그룹관리
router.get('/authMasterMng', function (req, res) {  
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');	
    res.render('authMng/authMasterMng');
});

router.post('/selectAuthGrpList', function (req, res) {

    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');	
    let sortIdx = checkNull(req.body.sort, "AUTHGRP_M_ID") + " " + checkNull(req.body.order, "ASC");
    let pageSize = checkNull(req.body.rows, 10);
    let currentPageNo = checkNull(req.body.page, 1);
    
    let searchType = checkNull(req.body.searchType, null);
    let searchWord = checkNull(req.body.searchWord, null);

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
                            "                              A.AUTHGRP_M_ID \n" +
                            "                            , A.AUTHGRP_M_NM \n" +
                            "                            , A.DESCR \n" +
                            "                            , A.AUTH_LEVEL \n" +
                            "                            , REG_ID \n" +
                            "                            , CONVERT(NVARCHAR(10), REG_DT,120) AS REG_DT \n" +
                            "                            , MOD_ID \n" +
                            "                            , CONVERT(NVARCHAR(10), MOD_DT,120) AS MOD_DT \n" +
                            "                            , DEL_ID \n" +
                            "                            , CONVERT(NVARCHAR(10), DEL_DT,120) AS DEL_DT \n" +
                            "                         FROM TB_AUTHGRP_M A \n" +
                            "                         WHERE 1 = 1 \n";
                            if(searchWord==""||searchWord==null){
                
                            }else{
                                if (searchType=="AUTHGRP_M_ID") {
                                    QueryStr += "AND A.AUTHGRP_M_ID LIKE '%" + searchWord + "%' \n";
                                }
                
                                if (searchType=="AUTHGRP_M_NM") {
                                    QueryStr += "AND A.AUTHGRP_M_NM LIKE N'%" + searchWord + "%' \n";
                                }
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
                res.send({
                    records : 0,
                    rows : null
                });
            }
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            
            res.send({
                records : 0,
                rows : null
            });
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

/*
* 권한관리 저장,수정,삭제
*/
router.post('/procAuthMaster', function (req, res) {  
    logger.info('[알림] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, 'router 시작');
    var authMasterArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateStr = "";
    var deleteStr = "";
    var userId = req.session.sid;
    
    for (var i=0; i<authMasterArr.length; i++) {
        if (authMasterArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TB_AUTHGRP_M (AUTHGRP_M_ID, AUTHGRP_M_NM, DESCR, AUTH_LEVEL, REG_ID, REG_DT, MOD_ID, MOD_DT) " + 
                       "VALUES ( ";
            saveStr += " '" + authMasterArr[i].AUTHGRP_M_ID  + "', N'" + authMasterArr[i].AUTHGRP_M_NM  + "', N'" + authMasterArr[i].DESCR  + "', ";
            saveStr += " '" + authMasterArr[i].AUTH_LEVEL  + "', '" + userId  + "', GETDATE(), ";
            saveStr += " '" + userId  + "', GETDATE()); ";
        } else if (authMasterArr[i].statusFlag === 'UPDATE') {
            updateStr += "UPDATE TB_AUTHGRP_M SET ";
            updateStr += "AUTHGRP_M_NM = N'" + authMasterArr[i].AUTHGRP_M_NM  + "', DESCR = N'" + authMasterArr[i].DESCR + "', ";
            updateStr += "AUTH_LEVEL = '" + authMasterArr[i].AUTH_LEVEL  + "', ";
            updateStr += "MOD_ID = '" + userId  + "', MOD_DT = GETDATE() ";
            updateStr += "WHERE AUTHGRP_M_ID = '" + authMasterArr[i].AUTHGRP_M_ID + "'; ";
        } else { //DEL
            deleteStr += "DELETE FROM TB_AUTHGRP_M WHERE AUTHGRP_M_ID = '" + authMasterArr[i].AUTHGRP_M_ID + "'; ";
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveStr !== "") {
                let insertCodeDetail = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateCodeDetail = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteCodeDetail = await pool.request().query(deleteStr);
            }

            res.send({status:200 , message:'Save Success'});
            
        } catch (err) {
            logger.info('[에러] [id : %s] [url : %s] [내용 : %s] ', req.session.sid, req.originalUrl.indexOf("?")>0?req.originalUrl.split("?")[0]:req.originalUrl, err.message);
            res.send({status:500 , message:'Save Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

module.exports = router;