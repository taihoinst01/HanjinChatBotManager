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
    makeChatbotTable();
});

$(document).ready(function() {
    //저장
    $('#saveBtn').click(function() {
        saveChatBotMenuItemApp();
    });

    //앱리스트 초기화
    $('#initBtn').click(function() {
        fnc_initAppList();
    });
});

$(document).on('click', '#chatbotTableBodyId tr[name=chatBotTr]', function() {
    $('tr[name=chatBotTr]').css("background", '');
    var clickChatbotNum = $(this).children().eq(0).text();
    $('#selectChatbotHiddenNum').val(clickChatbotNum);
    makeMenuTable(clickChatbotNum);

    $(this).css("background", "aliceblue");

});

var initAppMenuList;
var initAppMenuCheck;
function makeChatbotTable() {
    var params = {
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/menu/selectChatBotInfo',
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
                var tableHtmlApp = "";
    
                for (var i=0;i<data.rows.length;i++) { 
                    tableHtml += '<tr style="cursor:pointer" name="chatBotTr"><td>' + data.rows[i].CHATBOT_NUM + '</td>';
                    tableHtml += '<td>' + data.rows[i].CHATBOT_NAME + '</td>'
                    tableHtml += '<td>' + data.rows[i].DESCRIPTION + '</td>'
                    tableHtml += '</tr>'
                }
    
                saveTableHtml = tableHtml;
                $('#chatbotTableBodyId').html(tableHtml);

                //사용자의 appList 출력
                $('#chatbotTableBodyId').find('tr').eq(0).children().eq(0).trigger('click');

            } else {
                tableHtml += '<tr><td colspan="3">' + language.NO_DATA + '</td></tr>';
                tableHtmlApp += '<tr><td colspan="5">' + language.NO_DATA + '</td></tr>';
                $('#chatbotTableBodyId').html(tableHtml);
                $('#menuTableBodyId').html(tableHtmlApp);
            }
            
        }
    });
}


function makeMenuTable(chatbotNum) {
    
    var params = {
        'chatbotNum' : chatbotNum
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/menu/selectMappingMenuList',
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
            initAppMenuList = data.rows;
            initAppMenuCheck = data.checkedAppMenu;
            
            mkMenuRow(data.rows, data.checkedAppMenu);
        }
    });
}

function mkMenuRow(rows, checkedAppMenu) {
    
    $('#menuTableBodyId').html('');
    var appHtml ="";

    for (var i=0;i<rows.length;i++) { 
        
        appHtml += '<tr><td>' + Number(i+1) + '</td>';
        
        
        for (var j=0; j<checkedAppMenu.length; j++) {
            if (rows[i].MENU_ID === checkedAppMenu[j].MENU_ID) {
                appHtml += '<td><input type="checkbox" class="flat-red" checked name="tableCheckBox"></td>';
                break;
            } 
        }
        if (j === checkedAppMenu.length) {
            appHtml += '<td><input type="checkbox" class="flat-red" name="tableCheckBox"></td>';
        }

        appHtml += '<td class="text-left">' + rows[i].MENU_NM + '</td>';
        appHtml += '<td class="text-left">' + rows[i].MENU_URL + '</td>';
        appHtml += '<td><input type="hidden" value="' + rows[i].MENU_ID + '" /></td></tr>';
    }
    
    $('#menuTableBodyId').html(appHtml);

    iCheckBoxTrans();

}

function saveChatBotMenuItemApp() {

    if (confirm(language['ASK_SAVE'])) {
        var saveArr = new Array();
        $('tr div[class*=checked]').each(function() {
            //var rowId = $(this).parent().parent().attr("id");
            var MENU_ID = $(this).parents('tr').children().eq(4).find('input').val();
            alert("MENU_ID==="+MENU_ID);
            //추가로 체크한 app, 체크 취소한 app 구분
            var rememberLen = initAppMenuCheck.length;
            for (var i=0; i<rememberLen; i++) {
                if (MENU_ID === initAppMenuCheck[i].MENU_ID) {
                    initAppMenuCheck.splice(i,1);
                    break;
                }
            }
            if (rememberLen === initAppMenuCheck.length && typeof MENU_ID != "undefined") {
                saveArr.push(MENU_ID);
            }
        });    
        
        var rowChatbot;			
        var chatbotNum = $("#selectChatbotHiddenNum").val();
    
        for (var i=0; i<$('#chatbotTableBodyId').find('tr').length; i++) {
            if ($('#chatbotTableBodyId').find('tr').eq(i).children().eq(0).text() === chatbotNum) {
                rowChatbot = i;
                break;
            }
        }
    
        //save
        var jsonsaveArr = JSON.stringify(saveArr);
        var jsoninitAppCheck = JSON.stringify(initAppMenuCheck);
        var params = {
            'chatbotNum' : chatbotNum,
            'saveData' : jsonsaveArr,
            'removeData' : jsoninitAppCheck,
        };
        $.ajax({
            type: 'POST',
            datatype: "JSON",
            data: params,
            url: '/menu/updateChatbotMenuItemList',
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
                    $('#chatbotTableBodyId').find('tr').eq(rowChatbot).children().eq(1).trigger('click');
                } else {
                    alert(language['It_failed']);
                }
            }
        });
    }
    

}


//초기화
function fnc_initAppList() {
    if(confirm(language['ASK_INIT'])) {
        mkMenuRow(initAppMenuList, initAppMenuCheck);
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