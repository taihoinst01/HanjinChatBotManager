
var dbConfig = {
    /*
    user: 'sa',
    password: '1234',
    server: 'localhost\\SQLEXPRESS',
    database: 'cjEmployeeManager',
    */
    user: 'hanjinadmin',
    password: 'qwer!asdF',
    server: 'hanjindb.database.windows.net',
    database: 'HanjinChatBotManager',
    connectionTimeout : 10000,
    requestTimeout : 30000,
    options: {
        encrypt: true
    },
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 35000
    }
};
 
module.exports = { dbConfig }