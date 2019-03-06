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
    selectChatBotEnv();
    getAPIInfo();
});

$(document).ready(function() {
    //수정
    $(document).on("click", "#updateChatBotEnvBtn", function() {
        var TimeLimit = $('#luisTimeLimit').val();
        var ScoreLimit = $("#luisScoreLimitNum").val();
        //var ScoreLimit = $("#luisScoreLimit option:selected").val();
        
        
        var validation_check = 0;
        if(TimeLimit==""||TimeLimit==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(ScoreLimit==""||ScoreLimit==null){
            validation_check = validation_check + 0;
        }else{
            if (ScoreLimit >= 0 && ScoreLimit <= 100) {
                validation_check = validation_check + 1;
            } else {
                validation_check = validation_check + 0;
            }
        }

        if(validation_check==2){
            procChatBotEnv('UPDATE');
        }else{
            $('#proc_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
            $('#chatBotEnvModal').modal('show');
            return;
        }     

       
    });

    $(document).on("click", "#insertAPIInfo", function () {
        var result = "";
        result = APIValidation();
        
        if(result=="success"){
            procChatBotEnv('API');
        }else{
            $('#proc_content').html(language.API_IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#chatBotEnvModal').modal('show');
        }
        
    });
});




function selectChatBotEnv(){
    $("#loadingModal").modal('show');
    var chatbotName_ = $('#chatbotName').val();
    var params = {
        'chatbotName' : chatbotName_,
        'rows': $('td[dir=ltr]').find('select').val()
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/chatBotEnv/selectChatbotEnv',
        success: function (data) {
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
            $("#loadingModal").modal('hide');
            if (data.rows) {
                $('#dbId').text(data.rows[0].USER_NAME);
                $('#dbPassword').text(data.rows[0].PASSWORD);
                $('#dbServer').text(data.rows[0].SERVER);
                $('#dbName').text(data.rows[0].DATABASE_NAME);

                $('#luisTimeLimit').val(data.rows[1].LUIS_TIME_LIMIT);
                //$('#luisScoreLimit').val(data.rows[1].LUIS_SCORE_LIMIT);
                $("#luisScoreLimitNum").val((data.rows[1].LUIS_SCORE_LIMIT*1)*100);
                //$("#luisScoreLimit").val(data.rows[1].LUIS_SCORE_LIMIT).attr("selected", "selected");
            } else {
                $('#dbId').text("");
            }

        }
    });
}

function procChatBotEnv(procType) {
    var saveArr = new Array();

    if (procType === 'UPDATE') {

        var data = new Object();
        data.statusFlag = procType;
        data.LUIS_TIME_LIMIT = $('#luisTimeLimit').val();
        //data.LUIS_SCORE_LIMIT = $('#luisScoreLimit').val();
        var tmpScore = $('#luisScoreLimitNum').val()*1;
        tmpScore = tmpScore*0.01;
        data.LUIS_SCORE_LIMIT = tmpScore;
        saveArr.push(data);
    } else if (procType === 'API') {
        var apiNameData = "";
        var apiUrlData = "";
        $('.apiFormDiv  input[name=api_name]').each(function() {
            apiNameData = apiNameData + $(this).val() + "^";
        });

        $('.apiFormDiv  input[name=api_url]').each(function() {
            apiUrlData = apiUrlData + $(this).val() + "^";
        });

        apiNameData = apiNameData.slice(0, -1);
        apiUrlData = apiUrlData.slice(0, -1);
        var check = apiNameData.includes('^');

        if(check==true){
            var apiNameSplit = apiNameData.split('^');
            var apiUrlSplit = apiUrlData.split('^');
            var api_length = $('.apiFormDiv  input[name=api_name]').length;
            for(var i=0; i<api_length; i++){
                var data = new Object();
                data.statusFlag = procType;
                data.API_NAME = apiNameSplit[i];
                data.API_URL = apiUrlSplit[i];
                saveArr.push(data);
            }
        }else{
            var data = new Object();
            data.statusFlag = procType;
            data.API_NAME = apiNameData;
            data.API_URL = apiUrlData;
            saveArr.push(data);
        }
    }

    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    //return false;
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/chatBotEnv/procChatBotEnv',
        success: function (data) {
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
            if (data.status === 200) {
                $('#proc_content').html(language.REGIST_SUCC);
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal" onClick="reloadPage();"><i class="fa fa-times"></i> Close</button>');
                $('#chatBotEnvModal').modal('show');
            } else {
                $('#proc_content').html(language.It_failed);
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal" onClick="reloadPage();"><i class="fa fa-times"></i> Close</button>');
                $('#chatBotEnvModal').modal('show');
            }
        }
    });
}

function reloadPage(){
    window.location.reload();
}

$(document).on("click", "#addAPIBtn", function(e){
    var apiLength = $('.apiFormDiv  input[name=api_name]').length+1;
    var inputApiStr = "";
    if(apiLength > 10){
        //$('#addAnswerValBtn').attr("disabled", "disabled");
        //$('#addAnswerValBtn').addClass("disable");
    }else{
        inputApiStr = "<div style='margin-top:4px;'>";
        inputApiStr += "<input name='api_name' id='api_name' tabindex='" + apiLength + "' type='text' class='form-control' style=' width:40%;' placeholder='" + language.INSERT_API_NAME + "'>";
        inputApiStr += "&nbsp;<input name='api_url' id='api_url' tabindex='" + apiLength + "' type='text' class='form-control' style=' width:50%;' placeholder='" + language.INSERT_API_URL + "'>";
        inputApiStr += '<a href="#" name="delApiBtn" class="api_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 20px;"></span></a>';
        inputApiStr += "</div>";
        $('.apiFormDiv').append(inputApiStr);
        $('.apiFormDiv  input[name=api_name]').eq($('.apiFormDiv  input[name=api_name]').length-1).focus();
    }
});

$(document).on("click", "a[name=delApiBtn]", function(e){
    if ($('.answerValDiv  input[name=api_name]').length < 2) {
        
        $('#proc_content').html(language.API_1ITEM);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
        $('#chatBotEnvModal').modal('show');
        $('.apiFormDiv  input[name=api_name]').eq($('.apiFormDiv  input[name=api_name]').length-1).focus();
    } else {
        $(this).parent().remove();
        $('.apiFormDiv  input[name=api_name]').eq($('.apiFormDiv  input[name=api_name]').length-1).focus();
        //dialogValidation('NEW');
    }
});

function APIValidation(){
    var apiNameValue = true;
    var apiUrlValue = true;
    var result = "false";
    
    $('.apiFormDiv  input[name=api_name]').each(function() {
        if ($(this).val().trim() === "") {
            apiNameValue = false;
            return;
        }
    });

    $('.apiFormDiv  input[name=api_url]').each(function() {
        if ($(this).val().trim() === "") {
            apiUrlValue = false;
            return;
        }
    });

    if(apiNameValue && apiUrlValue) {
        result = "success";
    } else {

    }

    return result;
}

function getAPIInfo() {
    params = {

    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/chatBotEnv/selectAPIInfo',
        success: function (data) {
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

            if (data.rows) {

                var updateAPIStr = "";
                for (var i = 0; i < data.rows.length; i++) {
                    updateAPIStr += "<div style='margin-top:4px;'>";
                    updateAPIStr += "<input name='api_name' id='api_name' tabindex='" + i + "' type='text' class='form-control' style=' width:40%;' placeholder='" + language.INSERT_API_NAME + "' value='" + data.rows[i].CNF_NM + "'>";
                    updateAPIStr += "&nbsp;<input name='api_url' id='api_url' tabindex='" + i + "' type='text' class='form-control' style=' width:50%;' placeholder='" + language.INSERT_API_URL + "' value='" + data.rows[i].CNF_VALUE + "'>";
                    updateAPIStr += '<a href="#" name="delApiBtn" class="api_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 20px;"></span></a>';
                    updateAPIStr += "</div>";
                }

                $('.apiFormDiv').append(updateAPIStr);
            } else {
                updateAPIStr = "<div style='margin-top:4px;'>";
                updateAPIStr += "<input name='api_name' id='api_name' tabindex=2 type='text' class='form-control' style=' width:40%;' placeholder='" + language.INSERT_API_NAME + "'>";
                updateAPIStr += "&nbsp;<input name='api_url' id='api_url' tabindex=2 type='text' class='form-control' style=' width:50%;' placeholder='" + language.INSERT_API_URL + "'>";
                updateAPIStr += '<a href="#" name="delApiBtn" class="api_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 20px;"></span></a>';
                updateAPIStr += "</div>";

                $('.apiFormDiv').append(updateAPIStr);
            }
        }
    });
}