
//가장 먼저 실행.
var language;
; (function ($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function (data) {
            language = data.lang;
        }
    });
})(jQuery);

$(document).ready(function () {
    makeUserTable();
});

$(document).ready(function () {

    //검색
    $('#searchBtn').click(function () {
        makeUserTable();
    });

    //엔터로 검색
    $('#searchName, #searchId').on('keypress', function (e) {
        if (e.keyCode == 13) makeUserTable();
    });

    //수정폼
    $(document).on("click", "#update_authForm", function () {
        document.userAuthForm.reset();
        getAuthList();

        var user_id = $(this).attr("user_id");
        var tr = $(this).parent().parent();
        var td = tr.children();

        document.userAuthForm.USER_ID.value = user_id;

        $('#S_USER_ID').html(user_id);
        $('#USER_AUTH').html(td.eq(3).text());

        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="updateAuthBtn"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>');

        $('#authUpdateFormModal').modal('show');
    });

    //수정 버튼
    $(document).on("click", "#updateAuthBtn", function () {
        updateUserAuth();
    });

});


//유저 테이블 페이지 버튼 클릭
$(document).on('click', '#userTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeUserTable($(this).text());
    }
});


function makeUserTable(newPage) {

    var params = {
        'searchName': $('#searchName').val(),
        'searchId': $('#searchId').val(),
        //'currentPage': newPage,
        'page': newPage,
        'rows': $('td[dir=ltr]').find('select').val()
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/user/selectUserList',
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
            var tableHtml = "";
            if (data.rows) {

                
                var s_auth_name = "";
                for (var i = 0; i < data.rows.length; i++) {
                    if (data.rows[i].AUTH_NM == "" || data.rows[i].AUTH_NM == null) {
                        s_auth_name = language.AUTHUSER_;
                    } else {
                        s_auth_name = data.rows[i].AUTH_NM;
                    }
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].SEQ + '</td>';
                    tableHtml += '<td>' + data.rows[i].USER_ID + '</td>'
                    tableHtml += '<td>' + data.rows[i].EMP_NM + '</td>'
                    //tableHtml += '<td>' + data.rows[i].EMAIL + '</td>'
                    //tableHtml += '<td>' + data.rows[i].HPHONE + '</td>'
                    tableHtml += '<td>' + s_auth_name + '</td>'
                    tableHtml += '<td><button type="button" class="btn btn-default btn-sm" id="update_authForm" user_id="' + data.rows[i].USER_ID + '"><i class="fa fa-edit"></i> '+language.UPDATE+'</button></td></tr>'
                }

                saveTableHtml = tableHtml;
                $('#userTableBodyId').html(tableHtml);

                //사용자의 appList 출력
                $('#userTableBodyId').find('tr').eq(0).children().eq(0).trigger('click');

                $('#userTablePaging .pagination').html('').append(data.pageList);

            } else {
                tableHtml += '<tr><td colspan="7">' + language.NO_DATA + '</td></tr>';
                $('#userTableBodyId').html(tableHtml);
                $('#appTableBodyId').html('');
            }

        }
    });
}

//상위 메뉴 검색
function getAuthList() {
    var select_menu = "";
    $.ajax({
        type: 'POST',
        url: '/user/getAuthList',
        isloading: true,
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
            if (data.records > 0) {
                select_menu = "<option value=''>"+language.CHOOSE_AUTH+"</option>"
                for (var i = 0; i < data.rows.length; i++) {
                    select_menu += '<option value="' + data.rows[i].AUTH_LEVEL + '">' + data.rows[i].AUTHGRP_M_NM + '</option>';
                }
            } else {
                select_menu = "<option value=''>"+language.CHOOSE_AUTH+"</option>"
            }
            $('#UPDATE_USER_AUTH').html(select_menu);
        }
    });
}

function updateUserAuth() {
    var saveArr = new Array();
    var data = new Object();

    data.USER_ID = $('#USER_ID').val();
    data.AUTH_LEVEL = $('#UPDATE_USER_AUTH').val();
    saveArr.push(data);

    if ($('#UPDATE_USER_AUTH').val()=="") {
        alert("권한을 선택하세요.");
        return false;
    }

    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/user/updateUserAuth',
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
            console.log(data);
            if (data.status === 200) {
                alert(language['REGIST_SUCC']);
                window.location.reload();
            } else {
                alert(language['It_failed']);
            }
        }
    });
}

function iCheckBoxTrans() {
    $('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({
        checkboxClass: 'icheckbox_minimal-blue',
        radioClass: 'iradio_minimal-blue'
    })
    //Red color scheme for iCheck
    $('input[type="checkbox"].minimal-red, input[type="radio"].minimal-red').iCheck({
        checkboxClass: 'icheckbox_minimal-red',
        radioClass: 'iradio_minimal-red'
    })
    //Flat red color scheme for iCheck
    $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green'
    })

    $('#check-all').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green'
    }).on('ifChecked', function (event) {
        $('input[name=tableCheckBox]').parent().iCheck('check');

    }).on('ifUnchecked', function () {
        $('input[name=tableCheckBox]').parent().iCheck('uncheck');

    });
}







