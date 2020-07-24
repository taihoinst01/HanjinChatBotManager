var language;
(function($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function(data) {
            language= data.lang;
            getIntentList();
        }
    });
})(jQuery);

$(document).ready(function () {
    answerIntentListAjax(1);
    getIntentList();

    $('#searchBtn').click(function (e) {
        answerIntentListAjax(1);
    });
})


var searchQuestiontText = ""; //페이징시 필요한 검색어 담아두는 변수
var searchIntentText = ""; //페이징시 필요한 검색어 담아두는 변수
var listPageNo = "";
function answerIntentListAjax(page){

    if (page) {
        //$('#currentPage').val(1);
        searchQuestiontText = $('#searchQuestion').val();
        searchIntentText = $('#searchIntent').val();
    }
 
    params = {
        'currentPage': ($('#currentPage').val() == '') ? 1 : page,
        'searchQuestiontText': searchQuestiontText,
        'searchIntentText': searchIntentText
    };
    listPageNo = ($('#currentPage').val() == '') ? 1 : page;
    $.ajax({
        type: 'POST',
        data: params,
        url: '/qna/selectAnswerIntentList',
        isloading: true,
        success: function(data) {
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
            $('#noAnswerContents').html('');
            var item = '';

            if (data.rows) {

                var tableHtml = "";
                var saveTableHtml = "";
                for (var i = 0; i < data.rows.length; i++) {
                    
                    tableHtml += '<tr><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].QUERY + '</td>';
                    tableHtml += '<td><a href="#" class="dashLink" name="queryLink"  onclick="return false;" style="font-size:12px" updateQuery="' + data.rows[i].QUERY + '">' + data.rows[i].LUIS_INTENT + '</a></td>';
                    tableHtml += '</tr>';
                   
                }
                //tableHtml += '</tr>';

                saveTableHtml = tableHtml;
                
                if (saveTableHtml == "") {
                    saveTableHtml = '<tr><td colspan="5" class="text-center">No Data</td></tr>';
                }
                $('#answerIntentListbody').html(saveTableHtml);

                //사용자의 appList 출력
                $('#answerIntentListbody').find('tr').eq(0).children().eq(0).trigger('click');

                $('#answerIntentTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="5" class="text-center">No Data</td></tr>';
                $('#answerIntentListbody').html(saveTableHtml);
                $('#answerIntentTablePaging .pagination').html('');
            }
            
        }
    });
}

$(document).on('click', '#answerIntentTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        answerIntentListAjax($(this).val());
    }
});



$(document).on('click','a[name=queryLink]',function(e){


    var sWidth = window.innerWidth;
    var sHeight = window.innerHeight;

    var oWidth = $('.entityValDiv').width();
    var oHeight = $('.entityValDiv').height();

    // 레이어가 나타날 위치를 셋팅한다.
    var divLeft = e.clientX;
    var divTop = e.clientY;

    // 레이어가 화면 크기를 벗어나면 위치를 바꾸어 배치한다.
    if( divLeft + oWidth > sWidth ) divLeft -= oWidth;
    if( divTop + oHeight > sHeight ) divTop -= oHeight;

    // 레이어 위치를 바꾸었더니 상단기준점(0,0) 밖으로 벗어난다면 상단기준점(0,0)에 배치하자.
    if( divLeft < 0 ) divLeft = 0;
    if( divTop < 0 ) divTop = 0;

    
    
    var selQuery = $(this).text();
    var updateQuery = $(this).attr("updateQuery");
    $('#selQry').val(selQuery);
    $('#updateQuery').val(updateQuery);
    $('#intentListSelect').html(selectHtml);

    var selectWidth = $('#intentListSelect').css('width');
    $('#intentListSelect').parent().css('width', selectWidth);
    $('#intentListSelect').parent().parent().css('width', selectWidth);
    $('.entityValDiv').css({
        "top": divTop,
        "left": divLeft,
        "width" : selectWidth + 10,
        "position": "absolute"
        
    }).show();
});

$(document).keyup(function(e) {
    if (e.keyCode == 27) { // escape key maps to keycode `27`
        if ($('.entityValDiv').css('display')=='block') {
            $('.entityValDiv').hide();
        }
   }
});

$(document).mouseup(function(e) {
    if ($('.entityValDiv').css('display') != 'none') {

        var container = $('.entityValDiv, #alertBtnModal');
        if (container.has(e.target).length === 0 && !container.is(e.target)) {
            $('.entityValDiv').hide();//.css('display', 'none');
        }
    }
})

$(document).on('click','#changeIntentBtn',function(e){

    var saveArr = new Array();
    var data = new Object();
 
    var selVal = $('#intentListSelect').val();
    var selText = $('#intentListSelect option:selected').text();
    var selQry = $('#selQry').val();
    var updateQuery = $('#updateQuery').val();
    data.selVal = selVal;
    data.selText = selText;//intent
    data.selQry = updateQuery;//질문
    

    saveArr.push(data);
    
    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };

    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/qna/answerIntentUpdate',
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
                $('#footer_button').html('<button type="button" class="btn btn-default" onClick="reloadPage();return false;"><i class="fa fa-times"></i> Close</button>');
                $('#procModal').modal('show');
            } else {
                $('#proc_content').html(language.It_failed);
                $('#footer_button').html('<button type="button" class="btn btn-default" onClick="reloadPage();return false;"><i class="fa fa-times"></i> Close</button>');
                $('#procModal').modal('show');
            }
        }
    });
});

var selectHtml = '';
function getIntentList() {
    $.ajax({
        type: 'POST',
        url : '/qna/selectIntentApp',
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
                htmlStr += "<option value='NONE'>" + language.SELECT + "</option>";
                for (var i=0; i<intentList.length; i++) {
                    htmlStr += "<option value='" + intentList[i].APP_ID + "'>" + intentList[i].INTENT + "</option>";
                    /*
                    if (i==0) {
                        htmlStr += "<option value='NONE'>" + language.SELECT + "</option>";
                    } else {
                        htmlStr += "<option value='" + intentList[i].APP_ID + "'>" + intentList[i].INTENT + "</option>";
                    }
                    */
                }
                
                $('#intentListSelect').html(htmlStr);
                selectHtml = htmlStr;
            }
            
        }
    });
}

function reloadPage(){
    $('#procModal').modal('hide');
    answerIntentListAjax(1);
}