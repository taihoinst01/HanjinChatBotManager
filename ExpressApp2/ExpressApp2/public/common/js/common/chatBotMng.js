
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
    makeChatBotTable();

    makeChatSelBox();
});

var selBoxHtml = "";
$(document).ready(function() {

    //모달 닫을 때 액션
    $('#addAppMordalId').click(function() {
        $('#appDes').val('');
        $('#appService').html(selBoxHtml);
    });

    //검색
    $('#searchBtn').click(function() {
        makeChatBotTable();
    });

    //엔터로 검색
    $('#searchName, #searchId').on('keypress', function(e) {
        if (e.keyCode == 13) makeChatBotTable();
    });

    //저장
    $('#saveBtn').click(function() {
        saveChatApp();
    });

    //앱리스트 초기화
    $('#initBtn').click(function() {
        fnc_initAppList();
    });
    
});


//유저 테이블 페이지 버튼 클릭
$(document).on('click','#chatTablePaging .li_paging',function(e){
    if(!$(this).hasClass('active')){
        makeChatBotTable($(this).text());
    }
});

//앱 테이블 페이지 버튼 클릭
$(document).on('click','#appTablePaging .li_paging',function(e){
    if(!$(this).hasClass('active')){
        makeAppTable($('#selectChatHiddenId').val(), $(this).text());
    }
});

$(document).on('click', '#chatTableBodyId tr[name=userTr]', function() {
    $('tr[name=userTr]').css("background", '');
    var clicChatId = $(this).children().eq(1).text();
    $('#selectChatHiddenId').val(clicChatId);
    makeAppTable(clicChatId);

    $(this).css("background", "aliceblue");

});

var initAppList;
var initAppCheck;
function makeChatBotTable(newPage) {
    
    var params = {
        'searchName' : $('#searchName').val(),
        'searchId' : $('#searchId').val(),
        'currentPage' : newPage,
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/users/selecChatList',
        beforeSend: function () {

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
        },
        complete: function () {
            //$("#loadingBar").removeClass("in");
            //$("#loadingBar").css("display","none");      
        },
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
           
            if (data.rows) {
                
                var tableHtml = "";
    
                for (var i=0;i<data.rows.length;i++) { 
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].SEQ + '</td>';
                    tableHtml += '<td>' + data.rows[i].CHATBOT_NUM + '</td>'
                    tableHtml += '<td>' + data.rows[i].CHATBOT_NAME + '</td>'
                    tableHtml += '<td>' + data.rows[i].CULTURE + '</td>'
                    tableHtml += '<td>' + data.rows[i].DESCRIPTION + '</td></tr>'
                }
    
                saveTableHtml = tableHtml;
                $('#chatTableBodyId').html(tableHtml);

                //사용자의 appList 출력
                $('#chatTableBodyId').find('tr').eq(0).children().eq(0).trigger('click');

                $('#chatTablePaging .pagination').html('').append(data.pageList);

            } else {
                $('#chatTableBodyId').html('');
                $('#appTableBodyId').html('');
            }
            
        }
    });
}


function makeChatSelBox() {

    $.ajax({
        type: 'POST',
        //data: params,
        url: '/users/selecChatList',
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
           
            if (data.rows) {
                var chatListSelHtml = $.trim($('#appService').html());

                var tableHtml = "";
    
                for (var i=0;i<data.rows.length;i++) { 
                    tableHtml += '<option value="' + data.rows[i].CHATBOT_NUM + '">' + data.rows[i].CHATBOT_NAME + '<!-- service1 --></option>';
                }

                $('#appService').html(chatListSelHtml + tableHtml);
                selBoxHtml = chatListSelHtml + tableHtml;
            }
            
        }
    });
}

function saveApp() {
    if ($('#appService :selected').val() === "-1") {
        alert(language.You_must_choose_a_chatbot);
        return;
    }
    var params = {
        'selApp': $('#appService :selected').val(),
        'selAppName': $('#appService :selected').text(),
        'appDes': $('#appDes').val()
    };
    $.ajax({
        type: 'POST',
        data: params,
        url: '/users/addApp',
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
           
            if (data.message) {
                alert(data.message);
                location.reload();
            } else {
                alert(data.message);
            }
            
        }
    });
}

function makeAppTable(clicChatId, newPage) {
    
    var params = {
        'clicChatId' : clicChatId,
        'currentPage' : newPage,
        'currentPageUser' : $('#chatTablePaging .active').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        beforeSend: function () {

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
        },
        complete: function () {
            $("#loadingBar").removeClass("in");
            $("#loadingBar").css("display","none");      
        },
        url: '/users/selectChatAppList',
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
            initAppList = data.rows;
            initAppCheck = data.checkedApp;
            mkAppRow(data.rows, data.checkedApp);
            
            $('#appTablePaging .pagination').html('').append(data.pageList);
        }
    });
}

//appList table tbody html 생성
function mkAppRow(rows, checkedApp) {

    $('#appTableBodyId').html('');
    var appHtml ="";

    for (var i=0;i<rows.length;i++) { 
        
        appHtml += '<tr><td>' + Number(i+1) + '</td>';
        
        var j=0;
        if (checkedApp.length > 0) {
            for (; j<checkedApp.length; j++) {
                if (rows[i].APP_ID === checkedApp[j].APP_ID) {
                    appHtml += '<td><input type="checkbox" class="flat-red" checked name="tableCheckBox"></td>';
                    break;
                } 
            }
        }
        if (j === checkedApp.length) {
            appHtml += '<td><input type="checkbox" class="flat-red" name="tableCheckBox"></td>';
        }

        appHtml += '<td>' + rows[i].APP_NAME + '</td>';
        appHtml += '<td>' + rows[i].APP_ID + '</td>';
        appHtml += '<td>' + rows[i].OWNER_EMAIL + '</td></tr>';
    }

    $('#appTableBodyId').html(appHtml);

    iCheckBoxTrans();

}


//초기화
function fnc_initAppList() {
    if(confirm(language['ASK_INIT'])) {
        mkAppRow(initAppList, initAppCheck);
    }
}

//저장
function saveChatApp() {

    if (confirm(language['ASK_SAVE'])) {
        var saveArr = new Array();
        $('tr div[class*=checked]').each(function() {
            //var rowId = $(this).parent().parent().attr("id");
            var appId = $(this).parents('tr').children().eq(3).text().trim();
            //추가로 체크한 app, 체크 취소한 app 구분
            var rememberLen = initAppCheck.length;
            for (var i=0; i<rememberLen; i++) {
                if (appId === initAppCheck[i].APP_ID.trim()) {
                    initAppCheck.splice(i,1);
                    break;
                }
            }
            if (rememberLen === initAppCheck.length && typeof appId != "undefined") {
                saveArr.push(appId);
            }
        });    
        
        var rowUser;			
        var chatHiddenId = $("#selectChatHiddenId").val();
    
        for (var i=0; i<$('#chatTableBodyId').find('tr').length; i++) {
            if ($('#chatTableBodyId').find('tr').eq(i).children().eq(1).text() === chatHiddenId) {
                rowUser = i;
                break;
            }
        }
    
        //save
        var jsonsaveArr = JSON.stringify(saveArr);
        var jsoninitAppCheck = JSON.stringify(initAppCheck);
        var params = {
            'chatId' : chatHiddenId,
            'saveData' : jsonsaveArr,
            'removeData' : jsoninitAppCheck,
        };
        $.ajax({
            type: 'POST',
            datatype: "JSON",
            data: params,
            url: '/users/updateChatAppList',
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
                if (data.status === 200) {
                    //window.location.reload();
                    alert(language['REGIST_SUCC']);
                    $('#chatTableBodyId').find('tr').eq(rowUser).children().eq(1).trigger('click');
                } else {
                    alert(language['It_failed']);
                }
            }
        });
    }
}


function iCheckBoxTrans() {
    $('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({
        checkboxClass: 'icheckbox_minimal-blue',
        radioClass   : 'iradio_minimal-blue'
    })
    //Red color scheme for iCheck
    $('input[type="checkbox"].minimal-red, input[type="radio"].minimal-red').iCheck({
        checkboxClass: 'icheckbox_minimal-red',
        radioClass   : 'iradio_minimal-red'
    })
    //Flat red color scheme for iCheck
    $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass   : 'iradio_flat-green'
    })

    $('#check-all').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass   : 'iradio_flat-green'
    }).on('ifChecked', function(event) {
        $('input[name=tableCheckBox]').parent().iCheck('check');
        
    }).on('ifUnchecked', function() {
        $('input[name=tableCheckBox]').parent().iCheck('uncheck');
        
    });
}







