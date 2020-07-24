
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
    makeUserTable();
});

$(document).ready(function() {

    //검색
    $('#searchBtn').click(function() {
        makeUserTable();
    });

    //엔터로 검색
    $('#searchName, #searchId').on('keypress', function(e) {
        if (e.keyCode == 13) makeUserTable();
    });

    //저장
    $('#saveBtn').click(function() {
        saveUserBoardItemApp();
    });

    //앱리스트 초기화
    $('#initBtn').click(function() {
        fnc_initAppList();
    });
    
});


//유저 테이블 페이지 버튼 클릭
$(document).on('click','#userTablePaging .li_paging',function(e){
    if(!$(this).hasClass('active')){
        makeUserTable($(this).text());
    }
});

//대시보드 항목 테이블 페이지 버튼 클릭
$(document).on('click','#boardItemTablePaging .li_paging',function(e){
    if(!$(this).hasClass('active')){
        makeBoardItemTable($('#selectUserHiddenId').val(), $(this).text());
    }
});

$(document).on('click', '#userTableBodyId tr[name=userTr]', function() {
    $('tr[name=userTr]').css("background", '');
    var clickUserId = $(this).children().eq(1).text();
    $('#selectUserHiddenId').val(clickUserId);
    makeBoardItemTable(clickUserId);

    $(this).css("background", "aliceblue");

});

var initAppList;
var initAppCheck;
function makeUserTable(newPage) {
    
    var params = {
        'searchName' : $('#searchName').val(),
        'searchId' : $('#searchId').val(),
        //'currentPage' : newPage,
        'page' : newPage,
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/boardMng/selectUserList',
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
                    tableHtml += '<td>' + data.rows[i].USER_ID + '</td>'
                    tableHtml += '<td>' + data.rows[i].EMP_NM + '</td>'
                    tableHtml += '<td>' + data.rows[i].EMAIL + '</td></tr>'
                }
    
                saveTableHtml = tableHtml;
                $('#userTableBodyId').html(tableHtml);

                //사용자의 appList 출력
                $('#userTableBodyId').find('tr').eq(0).children().eq(0).trigger('click');

                $('#userTablePaging .pagination').html('').append(data.pageList);

            } else {
                $('#userTableBodyId').html('');
                $('#boardItemTableBodyId').html('');
            }
            
        }
    });
}

function makeBoardItemTable(userId, newPage) {
    
    var params = {
        'userId' : userId,
        'currentPage' : newPage,
        'currentPageUser' : $('#userTablePaging .active').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/boardMng/selectUserBoardList',
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
            mkBoardItemRow(data.rows, data.checkedApp);
            
            $('#boardItemTablePaging .pagination').html('').append(data.pageList);
        }
    });
}

//appList table tbody html 생성
function mkBoardItemRow(rows, checkedApp) {

    $('#boardItemTableBodyId').html('');
    var appHtml ="";

    for (var i=0;i<rows.length;i++) { 
        
        appHtml += '<tr><td>' + Number(i+1) + '</td>';
        
        var j=0;
        for (var j=0; j<checkedApp.length; j++) {
            if (rows[i].BOARD_ID === checkedApp[j].BOARD_ID) {
                appHtml += '<td><input type="checkbox" class="flat-red" checked name="tableCheckBox"></td>';
                break;
            } 
        }
        if (j === checkedApp.length) {
            appHtml += '<td><input type="checkbox" class="flat-red" name="tableCheckBox"></td>';
        }

        appHtml += '<td class="text-left">' + rows[i].BOARD_NM + '</td>';
        appHtml += '<td class="text-left">' + rows[i].BOARD_EXPL + '</td>';
        appHtml += '<td><input type="hidden" value="' + rows[i].BOARD_ID + '" /></td></tr>';
    }

    $('#boardItemTableBodyId').html(appHtml);

    iCheckBoxTrans();

}


//초기화
function fnc_initAppList() {
    if(confirm(language['ASK_INIT'])) {
        mkBoardItemRow(initAppList, initAppCheck);
    }
}

//저장
function saveUserBoardItemApp() {

    if (confirm(language['ASK_SAVE'])) {
        var saveArr = new Array();
        $('tr div[class*=checked]').each(function() {
            //var rowId = $(this).parent().parent().attr("id");
            var BOARD_ID = $(this).parents('tr').children().eq(4).find('input').val();
            //추가로 체크한 app, 체크 취소한 app 구분
            var rememberLen = initAppCheck.length;
            for (var i=0; i<rememberLen; i++) {
                if (BOARD_ID === initAppCheck[i].BOARD_ID) {
                    initAppCheck.splice(i,1);
                    break;
                }
            }
            if (rememberLen === initAppCheck.length && typeof BOARD_ID != "undefined") {
                saveArr.push(BOARD_ID);
            }
        });    
        
        var rowUser;			
        var userId = $("#selectUserHiddenId").val();
    
        for (var i=0; i<$('#userTableBodyId').find('tr').length; i++) {
            if ($('#userTableBodyId').find('tr').eq(i).children().eq(1).text() === userId) {
                rowUser = i;
                break;
            }
        }
    
        //save
        var jsonsaveArr = JSON.stringify(saveArr);
        var jsoninitAppCheck = JSON.stringify(initAppCheck);
        var params = {
            'userId' : userId,
            'saveData' : jsonsaveArr,
            'removeData' : jsoninitAppCheck,
        };
        $.ajax({
            type: 'POST',
            datatype: "JSON",
            data: params,
            url: '/boardMng/updateBoardItemList',
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
                    $('#userTableBodyId').find('tr').eq(rowUser).children().eq(1).trigger('click');
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