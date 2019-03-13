var crypto = require('crypto');

module.exports = {

    getSaltCode: async function () {
        var aa = (await crypto.randomBytes(64)).toString('base64');
        return aa;
    },

    getPassWord: function (inputPass, salt) {
        var key =  crypto.pbkdf2Sync(inputPass, salt, 518, 64, 'sha512');
        return key.toString('hex');
    }
}