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
    
    getIntentList();
    openModalBox("#create_dlg");
    
});


var deleteInsertFormData = "";
function openModalBox(target) {

    deleteInsertForm = "<div class='btn_wrap deleteInsertFormDiv' style='clear:both;' >" +
        "<button type='button' class='btn btn-default deleteInsertForm'><i class='fa fa-trash'></i> 대화상자삭제</button></div>"

    if (target == "#create_dlg") {
        $(".insertForm form").append($(".textLayout").clone(true));
        $(".insertForm form").append(deleteInsertForm);

        $(".insertForm .textLayout").css("display", "block");
       
    }

}

var selectHtml = '';
function getIntentList() {

    $.ajax({
        type: 'POST',
        url : '/qna/selectNewIntentList',
        isloading : true,
        success: function(data){
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
            if (data.result) {
                var htmlStr = '';
                var intentList = data.intentList;
                if(intentList.length==0){
                    htmlStr += "<option value=''>" + language.SELECT + "</option>";
                }else{
                    htmlStr += "<option value=''>" + language.SELECT + "</option>";
                    for (var i=0; i<intentList.length; i++) {
                        htmlStr += "<option value='" + intentList[i].APP_ID + "&"+intentList[i].INTENT+"'>" + intentList[i].INTENT + "</option>";
                    }
                }

                $('#intentListSelect').html(htmlStr);
                selectHtml = htmlStr;
            }
            
        }
    });
}

function createNewQna() {
    $('#loadingModalMain').modal('show');
    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;
    var startQuestion = $('#description').val();
    var selectIntent = $('#intentListSelect').val();

    if(startQuestion.trim()==""){
        alert(language.IS_REQUIRED);
        exit = true;
        return false;
    }

    if (exit) return;

    if(selectIntent.trim()==""){
        alert(language.IS_REQUIRED);
        exit = true;
        return false;
    }

    if (exit) return;

    //$('.insertForm input[name=dialogText]').each(function (index) {
    $('.insertForm textarea[name=dialogText]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.You_must_enter_the_dialog_text);
            exit = true;
            return false;
        }
    });

    if (exit) return;

    //dialogText textarea 값 치환
    var temp = $("#dialogText").val();
    temp = temp.replace(/(?:\r\n|\r|\n)/g, '/n');
    $("#dialogText").val(temp);

    $('.insertForm input[name=mediaImgUrl]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.ImageURL_must_be_entered);
            exit = true;
            return false;
        }
    });

    if (exit) return;


    for (var i = 0; i < idx; i++) {
        var tmp = $("form[name=dialogLayout]").eq(i).serializeArray();
        var object = {};
        var carouselArr = [];
        var objectCarousel = {};
        if (tmp[0].value === "3") {
            var btnTypeCount = 1;
            var cButtonContentCount = 1;
            var cButtonNameCount = 1;
            for (var j = 1; j < tmp.length; j++) {
                if (tmp[j].name == 'btnType') {
                    tmp[j].name = 'btn' + (btnTypeCount++) + 'Type';
                    if (btnTypeCount == 5) {
                        btnTypeCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonContent') {
                    tmp[j].name = 'cButtonContent' + (cButtonContentCount++);
                    if (cButtonContentCount == 5) {
                        cButtonContentCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonContentM') {
                    tmp[j].name = 'cButtonContentM' + (cButtonContentCount++);
                    if (cButtonContentCount == 5) {
                        cButtonContentCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonName') {
                    tmp[j].name = 'cButtonName' + (cButtonNameCount++);
                    if (cButtonNameCount == 5) {
                        cButtonNameCount = 1;
                    }
                }

                if (typeof objectCarousel[tmp[j].name] !== "undefined") {
                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    btnTypeCount = 1;
                    cButtonContentCount = 1;
                    cButtonNameCount = 1;
                }

                if (j === tmp.length - 1) {
                    object[tmp[0].name] = tmp[0].value;
                    objectCarousel[tmp[j].name] = tmp[j].value;

                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    break;
                }
                object[tmp[0].name] = tmp[0].value;
                objectCarousel[tmp[j].name] = tmp[j].value;
            }
            //carouselArr.push(objectCarousel);
            object['carouselArr'] = carouselArr;
        } else if (tmp[0].value === "4") {

            var btnTypeCount = 1;
            var mButtonContentCount = 1;
            var mButtonNameCount = 1;

            for (var j = 0; j < tmp.length; j++) {

                if (tmp[j].name == 'btnType') {
                    tmp[j].name = 'btn' + (btnTypeCount++) + 'Type';
                }
                if (tmp[j].name == 'mButtonContent') {
                    tmp[j].name = 'mButtonContent' + (mButtonContentCount++);

                }
                if (tmp[j].name == 'mButtonName') {
                    tmp[j].name = 'mButtonName' + (mButtonNameCount++);
                }

                object[tmp[j].name] = tmp[j].value;
            }

        } else {
            for (var j = 0; j < tmp.length; j++) {
                object[tmp[j].name] = tmp[j].value;
            }
        }

        array[i] = JSON.stringify(object);//JSON.stringify(tmp);//tmp.substring(1, tmp.length-2);
    }
    //JSON.stringify($("form[name=appInsertForm]").serializeObject());
    array[array.length] = JSON.stringify($("form[name=appInsertForm]").serializeObject());//JSON.stringify($("form[name=appInsertForm]"));

    $.ajax({
        url: '/qna/newQna',
        dataType: 'json',
        type: 'POST',
        data: { 'data': array, 'startQuestion': startQuestion, 'selectIntent': selectIntent },
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
            $('#loadingModalMain').modal('hide');
            $('#proc_content').html("등록되었습니다. 질문답변목록에서 확인하세요");
            $('#footer_button').html('<button type="button" class="btn btn-default" onClick="goQnaList()"><i class="fa fa-times"></i> Close</button>');
            $('#procDialog').modal('show');
        }

    });
}

function goQnaList(){
    location.href = "/qna/qnaList";
    return false;
}