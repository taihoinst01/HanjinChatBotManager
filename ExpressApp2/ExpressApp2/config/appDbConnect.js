
var appPool = null;
var rememberConfig = null;
var dbInfo = {
    options: {
        encrypt: true
    }
};
module.exports = {

    getAppConnection : function (sql, appName, dbList) {
        if (rememberConfig === appName) {
            if (appPool) return appPool;
        } else {
            rememberConfig = appName;
        }

        //if (appPool) return appPool;
        var conn;//= new sql.ConnectionPool(dbConfig);
        var dbObj;
        if (dbList) {
            for (var i=0; i< dbList.length; i++) {
                if (appName === dbList[i].APP_NAME) {
                    dbObj = dbList[i];
                    break;
                }
            }
        }
        if (typeof dbObj === 'object') {
            dbInfo.user = dbObj.USER_NAME;
            dbInfo.password = dbObj.PASSWORD;
            dbInfo.server = dbObj.SERVER;
            dbInfo.database = dbObj.DATABASE_NAME;
            conn = new sql.ConnectionPool(dbInfo);
        }

        var close_conn = conn.close;
        conn.close = function(){
            appPool = null;
            close_conn.apply(conn, arguments);
        }

        return appPool = conn.connect()
            .then(function(){ return conn; })
            .catch(function(err){
                appPool = null;
                return Promise.reject(err);
            });
    }
}