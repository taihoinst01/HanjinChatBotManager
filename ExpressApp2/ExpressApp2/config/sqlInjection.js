


module.exports = {

    InjectionCheck: function (value2) {
        var val = value2.split(" ").join("");

        //2018-08-10 임시 주석 -> ' 하나로 제거 
        var str = "',--";
        var str = str.split(",");
        var sz = str.length;
        //sql injection
        var value = val.toLowerCase(); //�빮��->�ҹ��ڷ� ��ȯ
        var isInjection = false;
        /*
        for (var i = 0; i < sz; i++) {
            if ((value.indexOf(str[i], 0) > -1) && (value.indexOf('word', 0) == -1)) {
                isInjection = true;
                break;
            }
        }
        */

        
        //XSS
        if (!isInjection) {
            var strXSS =
                [
                    "database()",
                    ";curl",
                    "config.js",
                    "res.",
                    "res.end(require('fs')",
                    "web.xml",
                    "win.ini",
                    "boot.ini",
                    "$query\\",
                    "\u0000",
                    ";vol",
                    "|wget",
                    "sysmessages--",
                    "|echo",
                    "ls -a1F",
                    "@@hostname",
                    ".schemata",
                    "information_schema",
                    "@im\port'\ja\vasc\ript",
                    "jav&#x09;ascript",
                    "<",
                    '[onmouseover="alert(\'xss\')"]',
                    "url = javascript:",
                    "java\0script",
                    "<script",
                    "/>",
                    "src=",
                    "<marquee>",
                    "[url=javascript",
                    "alert(",
                    "x:expression(", 
                    "href=",
                    ".config",
                    "%00",
                    ";%00",
                    "\system"
                ];
            sz = strXSS.length;

            for (var i = 0; i < sz; i++) {
                if (value.indexOf(strXSS[i], 0) > -1) {
                    isInjection = true;
                    break;
                }
            }
        }
        return isInjection;
    },

    changeAttackKeys : function (inputValue) {
        /*
        <  -> &lt;
        >  -> &gt;
        (  ->  &#40;
        )  ->  &#41;
        "  ->  &quot;
        '  ->  &#39;
        */
        if (typeof inputValue == 'undefined') {
            return inputValue;
        }
        var returnValue = inputValue;
        
        returnValue = returnValue.split("<").join("&lt;");
        returnValue = returnValue.split(">").join("&gt;");
        returnValue = returnValue.split("(").join("&#40;");
        returnValue = returnValue.split(")").join("&#41;");
        returnValue = returnValue.split("\"").join("&quot;");
        returnValue = returnValue.split("'").join("&#39;");
        //var value = val.toLowerCase();  
        
        return returnValue;
    }
    /*,

    InsertDialogChk : function (val, dlgType) {
        
    }
    */
}
/*
module.exports.InjectionCheck = function (val) {

    var str = "select,insert,update,delete,merge,commit,rollback,create,alter,drop,truncate,grant,revoke,union,and, or,--";
    var str = str.split(",");
    var sz = str.length;
    //sql injection
    var value = val.toLowerCase(); //�빮��->�ҹ��ڷ� ��ȯ
    var isInjection = false;
    for (var i = 0; i < sz; i++) {
        if ((value.indexOf(str[i], 0) > -1) && (value.indexOf('word', 0) == -1)) {
            isInjection = true;
            break;
        }
    }
    //XSS
    if (!isInjection) {
        var strXSS =
            [
                "@im\port'\ja\vasc\ript",
                "jav &#x09; ascript",
                "IMG SRC = javascript",
                '[onmouseover = "alert(\'xss\')"]',
                "url = javascript:",
                "java\0script",
                "<script",
                "/>",
                ">",
                "<",
                "src=",
                "<marquee>",
                "[url=javascript",
                "alert(",
                "x:expression(", 
                "href=",
                ".config",
                "\system",
            ];
        sz = strXSS.length;

        for (var i = 0; i < sz; i++) {
            if (value.indexOf(strXSS[i], 0) > -1) {
                isInjection = true;
                break;
            }
        }
    }
    return isInjection;
};
*/