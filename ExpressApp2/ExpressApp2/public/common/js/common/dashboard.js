

$(document).ready(function () {
    var appName = getParameters('appName')
    $.ajax({
        url: '/board/getCounts',
        dataType: 'json',
        type: 'POST',
        data: {'appName':appName},
        success: function(result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (typeof result != 'undefined') {
                $('#spanIntentsCount').html(result.INTENT_CNT);
                $('#spanEntitiesCount').html(result.ENTITY_CNT);
                $('#spanUtteranceCount').html(result.DLG_CNT);
            }
        }
    });

    getEndpointHistory ();

})

var getParameters = function (paramName) {
    // 리턴값을 위한 변수 선언
    var returnValue;

    // 현재 URL 가져오기
    var url = location.href;

    // get 파라미터 값을 가져올 수 있는 ? 를 기점으로 slice 한 후 split 으로 나눔
    var parameters = (url.slice(url.indexOf('?') + 1, url.length)).split('&');

    // 나누어진 값의 비교를 통해 paramName 으로 요청된 데이터의 값만 return
    for (var i = 0; i < parameters.length; i++) {
        var varName = parameters[i].split('=')[0];
        if (varName.toUpperCase() == paramName.toUpperCase()) {
            returnValue = parameters[i].split('=')[1];
            return decodeURIComponent(returnValue);
        }
    }
};


function getEndpointHistory () {
    var appId = getParameters('sId');
    var subKey = $('#subKey').val();
    var date = getIsoDate();

    var params = {
        // These are optional request parameters. They are set to their default values.  //$.param(params)
        "timezoneOffset": "0",
        "verbose": "false",
        "spellCheck": "false",
        "staging": "false",
    };
    //"https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/" + pApp.getId() + "/versions/" + pApp.getVersionId() + "/stats/endpointhitshistory"
    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/" + appId + "/versions/0.1/stats/endpointhitshistory?from=" 
            + date.fromDate + "&to=" + date.toDate,
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subKey);
        },
        type: "GET",
        // The request body may be empty for a GET request
        data: "{body}",
    })
    .done(function(data) {
        if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
            alert($('#dupleMassage').val());
            location.href = '/users/logout';
        }
        // Display a popup containing the top intent
        //alert("Detected the following intent: " + data.topScoringIntent.intent);
        console.log(data);
    })
    .fail(function() {
        alert("error");
    });
}


function getIsoDate() {
    var dt = new Date();
    // 월을 구하고 1만큼 증가

    var mnth = dt .getUTCMonth(); 
    mnth++;

    var day = dt.getUTCDate();
    if(day < 10) {
        day = "0"+day;
    }

    var fromDay = dt.getUTCDate()-7;
    if(fromDay < 10) {
        fromDay = "0"+fromDay;
    }

    var yr = dt.getUTCFullYear();
    var hrs = dt.getUTCHours();

    if(hrs < 10) { 
        hrs = "0"+hrs;
    }

    var min = dt.getUTCMinutes();

    if(min < 10) {
        min = "0"+min;
    }

    var sec = dt.getUTCSeconds();

    if(sec < 10) {
        sec = "0"+sec
    };

    var toDate = yr+"-"+mnth+"-"+day+"T"+hrs+":"+min+":"+secs+"Z";
    var fromDate = yr+"-"+mnth+"-"+fromDay+"T"+hrs+":"+min+":"+secs+"Z";
    var date = [toDate, fromDate];
    return date;
}