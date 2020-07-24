

//가장 먼저 실행.
var language;
;(function($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function(data) {
            language= data.lang;
        }
    });

})(jQuery);

$(document).ready(function() {
    var keyString = $('#subKeys').val();
    $('#keyString').text(keyString);
    

    $('#spellFlag').val('off');

    endPointUrl();

    //검색 버튼 클릭
    // $('#searchBtn').click(function(){
    //     $('#searchStr').val($('#searchIntentText').val().trim());
    //     $('#currentPage').val(1);
    //     makeIntentTable();
    // });

    
    //생성 모달 
    // $('#createIntentBtn').click(function(){
        
    //     $('#intentName').val('');
    //     //$('#modalBodyMain').find('.form-group.entityChildDiv').remove();

    //     $('#createIntentHiddenBtn').trigger('click');
    // });

    // verbose flag, spell flag
    $('input').on('ifToggled', function(){
        if($(this).prop('checked') == true) {
            // $(this).parents().addClass("checked");
            // $(this).prop('checked', true);
            if($(this).prop('id') == 'verboseFlag') {
                $('#verboseFlag').val("on");
            } else if($(this).prop('id') == 'spellFlag') {
                $('#modal-backdrop').show();
                $('#spellFlag').val("on");
            }
        } else {
            if($(this).prop('id') == 'verboseFlag') {
                $('#verboseFlag').val("off");
            } else if($(this).prop('id') == 'spellFlag') {
                $('#spellFlag').val("off");
            }
        }

        endPointUrl();
    });

    // spell checker 체크박스 주의사항 메세지
    $('#prompt-btn-row').click(function(){
        $('#modal-backdrop').hide();
    });

    // publish btn 
    $('#publishBtn').click(function(){
        $.ajax({
            url: "publishExecution",
            type: "post"
            , timeout: 0
            , beforeSend: function () {

                var width = 0;
                var height = 0;
                var left = 0;
                var top = 0;

                width = 50;
                height = 50;

                top = ( $(window).height() - height ) / 2 + $(window).scrollTop();
                left = ( $(window).width() - width ) / 2 + $(window).scrollLeft();

                $("#loadingBar").addClass("in");
                $("#loadingImg").css({position:'absolute'}).css({left:left,top:top});
                $("#loadingBar").css("display","block");
            }
            , complete: function () {
                $("#loadingBar").removeClass("in");
                $("#loadingBar").css("display","none");      
            }
        }).done(function(data) {
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
            console.log(data)
            if (data.result === 400) {
                $('#trainResultTag').text(data.message);
                //alert(data.message);
            } else if (data.result === 401) {
                $('#trainResultTag').text(data.message);
                //alert(data.message);
            } else if (data.result === 402) {
                $('#trainResultTag').text("Luis App의 공간이 없습니다. 관리자에게 문의하여 Luis App을 만들어야 합니다.");
            } else { //200
                var result = data.resultValue;
                // alert("학습을 완료하였습니다.");
                //$('#trainResultTag').text($('#successHidden').val() + " : " + result.sucCnt + "  " + $('#failHidden').val() + " : " + result.failCnt);
                //alert("성공 : " + result.sucCnt + "실패 : " + result.failCnt);
                $('#trainBtnHidden').trigger('click');
            }
        })

    });

    // Resources and Keys Add Key Button
    $('#addKey').click(function(){
        alert("UPDATE 준비중..");
    });

});

// TimeZone
function timezone(val) {
    var num = parseFloat(val) * 60;
    $('#timeZone').val(num);
    $('#timezoneInbox').val(val);

    endPointUrl();
}

// 엔드포인트 슬롯
function endpointSlot(val) {
    if(val == 'false'){
        $('#isStaging').val("false");
    }else{
        $('#isStaging').val("true");
    }

    endPointUrl();
}

function verboseflag(val) {
    $('#verboseFlag').val(val);
    $('.verboseflagCheckbox').attr("checked", val);

    endPointUrl();
}

// 엔드포인트 URL
function endPointUrl() {
    var endPointUrl = $('#host').val();
    var appId = $('#appId').val();
    var subKey = $('#subKeys').val();

    var isStaging = $('#isStaging').val();
    var timeZone = $('#timeZone').val();
    var verboseFlag = $('#verboseFlag').val();
    var spellFlag = $('#spellFlag').val();
    var staging = "";
    var verbose = "";
    var spellCheck = "";

    if(isStaging == 'true'){
        staging = "&staging="+isStaging;
    }

    if(verboseFlag == 'on'){
        verbose = "&verbose=true";
    }

    if(spellFlag == 'on'){
        spellCheck = "&spellCheck=true&bing-spell-check-subscription-key={YOUR_BING_KEY_HERE}"
    }

    endPointUrl = endPointUrl
        + "/luis/v2.0/apps/"
        + appId
        + "?subscription-key="+subKey
        + spellCheck
        + staging
        + verbose
        + "&timezoneOffset=" + timeZone
        + "&q=";

    $('#endPointUrl').attr("href", endPointUrl);
    $('#endPointUrl').text(endPointUrl);
}

// Regions Radio Box
function radioRegions(t) {
    if($(t).next().text() == "North America Regions") {
        $('#temp1').show();
        $('#temp2').hide();
    } else {
        $('#temp2').show();
        $('#temp1').hide();
    }
}