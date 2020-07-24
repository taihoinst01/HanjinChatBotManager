

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

    //추가 버튼
    $('#addBtn').click(function() {
        addUser();
    });

    //삭제 버튼
    $('#deleteBtn').click(function() {
        deleteUser();
    });

    //저장 버튼
    $('#saveBtn').click(function() {
        saveUser();
    });
    
    //초기화 버튼
    $('#initBtn').click(function() {
        initUserList();
    });

    //사용여부 버튼
    $('#useYNBtn').click(function() {
        useYNChange();
    });

});



//페이지 버튼 클릭
/*
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        $('#currentPage').val($(this).val());
        makeUserTable();
    }
});
*/
//사용자 명 클릭 수정
var editCellText="";
$(document).on('click','.editable-cell',function(e){

    if($(this).find('input').length > 0){
        
    } else {
        editCellText = $(this).text();
        var inputHtml = '<input type="text" id="editCell" spellcheck="false" spellcheck="false" autocomplete="off" value="' + $(this).text() + '"/>';
        $(this).html(inputHtml);
        $(this).attr('class', 'edit-cell');     

        $(this).children().focus().val('').val(editCellText);
    }
});

//수정 중 셀 범위 밖 클릭 시 저장
$(document).ready(function() {
    $('html').click(function(e) { 
        if ($('.edit-cell').length > 0) {
            if ( !$('.edit-cell, #editCell').has(e.target).length ) { 
                //영역 밖
                var changeVal = $('#editCell').val();
                $('.edit-cell').html(editCellText);
                $('.edit-cell').text(changeVal);
                if (editCellText !== changeVal) {
                    $('.edit-cell').parent().children().eq(0).text('EDIT');
                    $('.edit-cell').parent().find('div').iCheck('check'); 
                }
                $('.edit-cell').attr('class', 'editable-cell');
            } 
        }
    });
});
//수정시 엔터로 저장, esc 취소
$(document).on('keyup','#editCell',function(e){
    if(e.keyCode === 13){
        var changeVal = $('#editCell').val();
        //$('.edit-cell').html(editCellText);
        $('.edit-cell').text(changeVal);
        if (editCellText !== changeVal) {
            $('.edit-cell').parent().children().eq(0).text('EDIT');
            $('.edit-cell').parent().find('div').iCheck('check'); 
        }
        $('.edit-cell').attr('class', 'editable-cell');
    } else if(e.keyCode === 27){
        var changeVal = $('#editCell').val();
        $('.edit-cell').html(editCellText);
        $('.edit-cell').attr('class', 'editable-cell');
    }
});

//유저 테이블 페이지 버튼 클릭
$(document).on('click', '#userTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
       makeUserTable($(this).text());
    }
});

var saveTableHtml = "";
function makeUserTable(newPage) {
    
    var params = {
        'searchName' : $('#searchName').val(),
        'searchId' : $('#searchId').val(),
        //'page' : $('.pagination_wrap').find('.active').val(),
        'page' : newPage,
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/users/selectUserList',
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
                    tableHtml += '<tr><td>' + data.rows[i].SEQ + '</td>';
                    
                    //if(data.rows[i].USER_AUTH=="99"){
                     //   tableHtml += '<td>&nbsp;</td>';
                    //}else{
                        tableHtml += '<td><input type="checkbox" class="flat-red" name="tableCheckBox"></td>';
                        
                    //}

                    tableHtml += '<td>' + data.rows[i].USER_ID + '</td>';
                    if(data.rows[i].USER_AUTH=="99"){
                        tableHtml += '<td>' + data.rows[i].EMP_NM + '</td>';
                        //tableHtml += '<td>' + data.rows[i].HPHONE + '</td>';
                        //tableHtml += '<td>' + data.rows[i].EMAIL + '</td>';
                    }else{
                        tableHtml += '<td class="editable-cell">' + data.rows[i].EMP_NM + '</td>';
                        //tableHtml += '<td class="editable-cell">' + data.rows[i].HPHONE + '</td>';
                        //tableHtml += '<td class="editable-cell">' + data.rows[i].EMAIL + '</td>';
                    }
                    
                    if (data.rows[i].PW_INIT_YN == 'Y') {
                        tableHtml += '<td>' + language.INIT_COMPLETE+ '</td>';
                    } else {
                        tableHtml += '<td><button type="button" class="btn btn_01" name="pwInitBtn"><i class="fa fa-refresh"></i> ' + language.INIT+ '</button></td>';
                    }
                    //tableHtml += '<td>' + '<a href="javascript://" class="" onclick="initPassword(\''+ data.rows[i].USER_ID +'\');">' + language.INIT+ '</a>' + '</td>'
                    tableHtml += '<td>' + data.rows[i].USE_YN + '</td>'
                    //tableHtml += '<td>' + data.rows[i].REG_DT + '</td>'
                    //tableHtml += '<td>' + data.rows[i].REG_ID + '</td>'
                    //tableHtml += '<td>' + data.rows[i].MOD_DT + '</td>'
                    tableHtml += '<td>' + data.rows[i].LAST_LOGIN_DT + '</td>'
                    tableHtml += '<td>' + data.rows[i].LOGIN_FAIL_CNT + '</td>'

                    if(data.rows[i].LOGIN_FAIL_CNT >= 3){
                        tableHtml += '<td><button type="button" class="btn btn_01" name="unlockAccountBtn"><i class="fa lock-open"></i> ' + language.UNLOCK_ACCOUNT_DISTRICTION + '[' + data.rows[i].LOGIN_FAIL_CNT + ']</button></td>';
                    }else{
                        tableHtml += '<td>[0]</td>';
                    }
                    tableHtml += '</tr>';
                }
    
                saveTableHtml = tableHtml;
                $('#tableBodyId').html(tableHtml);
            } else {
                $('#tableBodyId').html('');
            }

            iCheckBoxTrans();
            
            $('#userTablePaging .pagination').html('').append(data.pageList);
           // $('.pagination').html('').append(data.pageList);
            
        }
    });

}

// 비밀번호 초기화 
//function initPassword(userId) {
$(document).on('click', 'button[name=pwInitBtn]', function (e) {
    if (confirm(language['ASK_PW_INIT'])) {
        var userId = $(this).parents('tr').find('td').eq(2).text();
        var userIndex = $('#tableBodyId').children().index($(this).parents('tr'));

        var params = {
            paramUserId: userId
        }
        
        $.ajax({
            type: 'POST',
            data: params,
            url: '/users/inItPassword',
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
                if (data.status == 200) {
                    //alert(data.message);
                    $('#tableBodyId').children().eq(userIndex).children().eq(4).html('').text('초기화완료');

                } else {
                    //alert(data.message);
                }
                $('#procDialog').modal('hide');
                $('#proc_content').html(data.message);
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
                $('#procDialog').modal('show');
            }
        });

    }
});


//사용자 추가
function addUser() {
    var addHtml = "";
    addHtml = '<tr><td>NEW</td><td><input type="checkbox" class="flat-red" name="tableCheckBox"></td>'
    addHtml += '<td><input type="text" name="new_user_id" spellcheck="false" autocomplete="off" value="" /></td>';
    addHtml += '<td><input type="text" name="new_user_name" spellcheck="false" autocomplete="off" value="" /></td> ';
    //addHtml += '<td><input type="text" name="new_hphone" spellcheck="false" autocomplete="off" value="" /></td> ';
    //addHtml += '<td><input type="text" name="new_email" spellcheck="false" autocomplete="off" value="" /></td> ';
    addHtml += '<td colspan="5"></td></tr>'

    $('#tableBodyId').prepend(addHtml);

    iCheckBoxTrans();

    $('#tableBodyId').children().eq(0).find('div').iCheck('check'); 
}

//사용자 리스트 초기화
function initUserList() {

    $('#tableBodyId').html(saveTableHtml);
    iCheckBoxTrans();
    
}

function deleteUser() {
    if ($('tr div[class*=checked]').length < 1) {
        //alert(language['NO_SELECTED_CELL']);
        $('#procDialog').modal('hide');
        $('#proc_content').html(language.NO_SELECTED_CELL);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
        $('#procDialog').modal('show');
    } else {
        $('tr div[class*=checked]').each(function() {
            if ($(this).parent().prev().text() == 'NEW') {
                $(this).parents('tr').remove();
            } else {
                $(this).parent().prev().text('DEL');
                var checkAdmin = $(this).parent().next().text();
            }
            /*
            $('#procDialog').modal('hide');
            $('#proc_content').html(language.IS_DELETE_CONFIRM);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-trash"></i> ' + language.DELETE +'</button><button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
            $('#procDialog').modal('show');
            */
        });
    }
    
}

function useYNChange() {
    if ($('tr div[class*=checked]').length < 1) {
        //alert(language['NO_SELECTED_CELL']);
        $('#procDialog').modal('hide');
        $('#proc_content').html(language.NO_SELECTED_CELL);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
        $('#procDialog').modal('show');
    } else {
        $('tr div[class*=checked]').each(function() {
            $(this).parent().prev().text('USEYN');
            var checkAdmin = $(this).parent().next().text();
        });
    }
    
}

function saveUser() {

    if ($('td>div[class*=checked]').length < 1) {
        $('#procDialog').modal('hide');
        $('#proc_content').html(language.NO_SELECTED_CELL);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
        $('#procDialog').modal('show');
        return;
        //alert(language['NO_SELECTED_CELL']);
        //return;
    }

    var chkEmptyInput = false;
    for (var i=0; i<$('input[name=new_user_id]').length; i++) {
        if ( ($.trim($('input[name=new_user_id]').eq(i).val()) === "") || ($.trim($('input[name=new_user_name]').eq(i).val()) === "") ) {
            chkEmptyInput = true;
            break;
        }
    }
    if (chkEmptyInput) {
        //alert(language['ID_NAME_BE_FILLED']);
        $('#procDialog').modal('hide');
        $('#proc_content').html(language.ID_NAME_BE_FILLED);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
        $('#procDialog').modal('show');
        return;
    }

    if ($('#editCell').length >0 ) {
        var changeVal = $('#editCell').val();
        $('.edit-cell').html(editCellText);
        $('.edit-cell').text(changeVal);
        if (editCellText !== changeVal) {
            $('.edit-cell').parent().children().eq(0).text('EDIT');
        }
        $('.edit-cell').attr('class', 'editable-cell');
    }

    var saveArr = new Array();
    $('#tableBodyId tr').each(function() {
        if ( $(this).find('div').hasClass('checked') ) {
            
            var statusFlag = $(this).children().eq(0).text();
            
            if (statusFlag === 'EDIT') {
                
                var data = new Object() ;
                data.statusFlag = statusFlag;
                data.USER_ID = $(this).children().eq(2).text();
                data.EMP_NM = $(this).children().eq(3).text();
                data.HPHONE = '';//$(this).children().eq(4).text();
                data.EMAIL = '';//$(this).children().eq(5).text();
                //data.HPHONE = $(this).children().eq(4).text();
                //data.EMAIL = $(this).children().eq(5).text();
                saveArr.push(data);

            } else if (statusFlag === 'NEW' ) {
             
                var data = new Object() ;
                data.statusFlag = statusFlag;
                data.USER_ID = $(this).find('input[name=new_user_id]').val();
                data.EMP_NM = $(this).find('input[name=new_user_name]').val();
                data.HPHONE = '';//$(this).children().eq(4).text();
                data.EMAIL = '';//$(this).children().eq(5).text();
                //data.HPHONE = $(this).find('input[name=new_hphone]').val();
                //data.EMAIL = $(this).find('input[name=new_email]').val();
                saveArr.push(data);
            } else if (statusFlag === 'DEL') {

                var data = new Object() ;
                data.statusFlag = statusFlag;
                data.USER_ID = $(this).children().eq(2).text();
                data.EMP_NM = $(this).children().eq(3).text();
                saveArr.push(data);
            } else if (statusFlag === 'USEYN') {
                var useyn_data = $(this).children().eq(7).text();
                var data = new Object() ;
                data.statusFlag = statusFlag;
                data.USER_ID = $(this).children().eq(2).text();
                data.EMP_NM = $(this).children().eq(3).text();
                if(useyn_data=="Y"){
                    data.USE_YN = "N";
                }else{
                    data.USE_YN = "Y";
                }
                saveArr.push(data);
            }


        }
        
    });
    
    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr' : jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/users/saveUserInfo',
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
                //alert(language['REGIST_SUCC']);
                $('#proc_content').html(language.REGIST_SUCC);
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal" onClick="goReloadPage();"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
                $('#procDialog').modal('show');
                //window.location.reload();
            } else {
                $('#proc_content').html(data.message);
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
                $('#procDialog').modal('show');
                //alert(language['It_failed']);
            }
        }
    });
}


//계정 로그이제한 초기화
$(document).on('click', 'button[name=unlockAccountBtn]', function (e) {
    if (confirm("사용자 로그인 제한을 해제하시겠습니까?")) {

        var userID = $(this).parents('tr').find('td').eq(2).text();
        var userIndex = $('#tableBodyId').children().index($(this).parents('tr'));
        var params = {
            'userId': userID
        };

        $.ajax({
            type: 'POST',
            data: params,
            url: '/users/initUserLimit',
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
                if (data.status == 200) {

                    alert(data.message);

                    $('#tableBodyId').children().eq(userIndex).children().eq(8).text('[0]');

                } else {
                    alert(data.message);
                }
            }
        });
    }
});



function goReloadPage(){
    window.location.reload();
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



