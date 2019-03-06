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

var router = express.Router();

router.get('/menuMng', function (req, res) {
    res.render('menuMng/menuMng');
});

router.post('/procMenu', function (req, res) {
    var menuArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateStr = "";
    var deleteStr = "";
    var userId = req.session.sid;

    for (var i = 0; i < menuArr.length; i++) {
        if (menuArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TB_MENU (MENU_ID, MENU_NM, MENU_URL, MENU_EXPL, MENU_PARENT_ID, MENU_SEQ, MENU_AUTH, MENU_STYLE, REG_ID, REG_DT) " +
                "VALUES ( ";
            saveStr += " '" + menuArr[i].MENU_ID + "', '" + menuArr[i].MENU_NM + "', '" + menuArr[i].MENU_URL + "', ";
            saveStr += " '" + menuArr[i].MENU_EXPL + "', '" + menuArr[i].MENU_PARENT_ID + "', '" + menuArr[i].MENU_SEQ + "', ";
            saveStr += " '" + menuArr[i].MENU_AUTH + "', '" + menuArr[i].MENU_STYLE + "','" + userId + "', GETDATE()); ";
        } else if (menuArr[i].statusFlag === 'UPDATE') {
            updateStr += "UPDATE TB_MENU SET ";
            updateStr += "MENU_NM = '" + menuArr[i].MENU_NM + "', MENU_URL = '" + menuArr[i].MENU_URL + "', ";
            updateStr += "MENU_EXPL = '" + menuArr[i].MENU_EXPL + "', MENU_PARENT_ID = '" + menuArr[i].MENU_PARENT_ID + "', ";
            updateStr += "MENU_SEQ = '" + menuArr[i].MENU_SEQ + "', MENU_AUTH = '" + menuArr[i].MENU_AUTH + "', MENU_STYLE = '" + menuArr[i].MENU_STYLE + "', ";
            updateStr += "MOD_ID = '" + userId + "', MOD_DT = GETDATE() ";
            updateStr += "WHERE MENU_ID = '" + menuArr[i].MENU_ID + "'; ";
        } else { //DEL
            deleteStr += "DELETE FROM TB_MENU WHERE MENU_ID = '" + menuArr[i].MENU_ID + "'; ";
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveStr !== "") {
                let insertMenu = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateMenu = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteMenu = await pool.request().query(deleteStr);
            }

            res.send({ status: 200, message: 'Save Success' });

        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'Save Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/selectMenuList', function (req, res) {

    (async () => {
        try {

            //var QueryStr = "SELECT  A.MENU_ID, A.MENU_NM, A.MENU_URL, A.MENU_EXPL, A.MENU_PARENT_ID, A.MENU_SEQ, A.MENU_AUTH, A.REG_ID, A.REG_DT";
            //QueryStr += " FROM TB_MENU A WHERE 1 = 1";
            //QueryStr += " ORDER BY A.REG_DT";

            var QueryStr = "WITH MENUCTE(MENU_ID, MENU_PARENT_ID, MENU_NM, MENU_URL, MENU_EXPL, MENU_SEQ, MENU_AUTH, MENU_STYLE, MENU_LEVEL)";
            QueryStr += " AS (";
            QueryStr += " SELECT MENU_ID, MENU_PARENT_ID, MENU_NM, MENU_URL, MENU_EXPL, MENU_SEQ, MENU_AUTH, MENU_STYLE, 0 FROM TB_MENU WHERE MENU_PARENT_ID = 'ROOT'";
            QueryStr += " UNION ALL";
            QueryStr += " SELECT AA.MENU_ID, AA.MENU_PARENT_ID, AA.MENU_NM, AA.MENU_URL, AA.MENU_EXPL, AA.MENU_SEQ, AA.MENU_AUTH, AA.MENU_STYLE, BB.MENU_LEVEL+1";
            QueryStr += " FROM TB_MENU AS AA INNER JOIN MENUCTE AS BB";
            QueryStr += " ON AA.MENU_PARENT_ID = BB.MENU_ID";
            QueryStr += " ) SELECT MENU_ID, MENU_PARENT_ID, MENU_NM, (SELECT MENU_NM FROM TB_MENU WHERE MENU_ID = MENUCTE.MENU_PARENT_ID) AS MENU_PARENT_NM";
            QueryStr += " , MENU_URL, MENU_EXPL, MENU_SEQ, MENU_AUTH, MENU_STYLE, MENU_LEVEL FROM MENUCTE ORDER BY MENU_SEQ, MENU_LEVEL";


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

router.post('/getParentMenu', function (req, res) {

    (async () => {
        try {
            var QueryStr = "SELECT  MENU_ID, MENU_NM FROM TB_MENU A WHERE MENU_PARENT_ID='ROOT' ORDER BY REG_DT ";

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

router.post('/childDataCnt', function (req, res) {
    var menuArr = JSON.parse(req.body.saveArr);
    var checkStr = "";

    for (var i = 0; i < menuArr.length; i++) {
        checkStr += "SELECT COUNT(*) AS CHECK_CNT FROM TB_MENU WHERE MENU_PARENT_ID = '" + menuArr[i].MENU_ID + "'; ";
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(checkStr);

            let rows = result1.recordset;

           
            var checkCnt = rows[0].CHECK_CNT;
            
            if(checkCnt > 0) {
                res.send({ status: 'EXIST' });
            }else{
                res.send({ status: 'NONE' });
            }
            

        } catch (err) {
            console.log(err);
            res.send({ status: 'NONE' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

module.exports = router;