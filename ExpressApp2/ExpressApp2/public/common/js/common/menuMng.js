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
    makeMenuTable();
});

var updateAuth = -1;
var deleteCheck = "";
var updateMenuStyle = "USER";
$(document).ready(function () {
    //추가 버튼(Master)
    $(document).on("click", "#addMenuBtn", function () {
        //getMenu();
        //document.menuForm.reset();
        var MENU_NM = $('#MENU_NM').val();
        var MENU_URL = $('#MENU_URL').val();
        var MENU_AUTH = $('#MENU_AUTH').val();
        var validation_check = 0;
        if(MENU_NM==""||MENU_NM==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1; 
        } 

        if(MENU_URL==""||MENU_URL==null){ 
            validation_check = validation_check + 0; 
        }else{ 
            validation_check = validation_check + 1; 
        } 

        if(MENU_AUTH==""||MENU_AUTH==null){ 
            validation_check = validation_check + 0; 
        }else{ 
            validation_check = validation_check + 1; 
        } 

        if(validation_check==3){ 
            procMenuMaster('NEW'); 
        }else{ 
            alert(language.IS_REQUIRED); 
            return; 
        }        
    });

    //수정폼
    $(document).on("click", "#update_menuForm", function () {
        
        document.menuForm.reset();
        var menu_id = $(this).attr("menu_id");
        var tr = $(this).parent().parent();
        var td = tr.children();
        
        document.menuForm.MENU_ID.value = menu_id;
        document.menuForm.MENU_NM.value = td.eq(0).text();
        document.menuForm.MENU_URL.value = td.eq(1).text();
        document.menuForm.MENU_AUTH.value = td.eq(6).find('input[name=hiddenAuthVal]').val();
        updateAuth = td.eq(6).find('input[name=hiddenAuthVal]').val();
        updateMenuStyle = td.eq(6).find('input[name=hiddenMenuStyleVal]').val();
        getMenu();
        getMenuStyle();
        
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="updateMenuBtn"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>');

        $('#menuFormModal').modal('show');
    });

    //수정 버튼
    $(document).on("click", "#updateMenuBtn", function () {
        var MENU_NM = $('#MENU_NM').val();
        var MENU_URL = $('#MENU_URL').val();
        var MENU_AUTH = $('#MENU_AUTH').val();

        var validation_check = 0;
        if(MENU_NM==""||MENU_NM==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(MENU_URL==""||MENU_URL==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(MENU_AUTH==""||MENU_AUTH==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==3){
            procMenuMaster('UPDATE');
        }else{
            alert(language.IS_REQUIRED);
            return;
        }       
        
    });

    //삭제폼
    $(document).on("click", "#delete_menuForm", function () {
        var menu_id = $(this).attr("menu_id");
        document.menuForm.reset();
        document.menuDeleteForm.DELETE_MENU_ID.value = menu_id;
        $('#menuDeleteModal').modal('show');
    });

    //삭제 버튼
    $(document).on("click", "#deleteMenuBtn", function () {
        procMenuMaster('DEL');
    });


});

//페이지 버튼 클릭
$(document).on('click', '.li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeAuthTable();
    }
});

function makeMenuTable() {

    var params = {
        'rows': $('td[dir=ltr]').find('select').val()
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/menu/selectMenuList',
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

                var tableHtml = "";
                for (var i = 0; i < data.rows.length; i++) {
                    tableHtml += '<tr><td>' + data.rows[i].MENU_NM + '</td>'
                    tableHtml += '<td>' + data.rows[i].MENU_URL + '</td>'
                    tableHtml += '<td>' + data.rows[i].AUTHGRP_M_NM + '</td>'
                    tableHtml += '<td>' + data.rows[i].MOD_ID + '</td>'
                    tableHtml += '<td>' + data.rows[i].MOD_DT + '</td>'
                    tableHtml += '<td>' + data.rows[i].MENU_STYLE + '</td>'
                    tableHtml += '<td>';
                    tableHtml += '<input type="hidden" name="hiddenAuthVal" value="' + data.rows[i].MENU_AUTH + '"/>'
                    tableHtml += '<input type="hidden" name="hiddenMenuStyleVal" value="' + data.rows[i].MENU_STYLE + '"/>'
                    tableHtml += '<button type="button" class="btn btn-default btn-sm" id="update_menuForm" menu_id="' + data.rows[i].MENU_ID + '"><i class="fa fa-edit"></i> '+language.UPDATE+'</button> <button type="button" class="btn btn-default btn-sm" id="delete_menuForm" menu_id="' + data.rows[i].MENU_ID + '"><i class="fa fa-trash"></i> '+language.DELETE+'</button>';
                    tableHtml += '</td></tr>';
                }

                saveTableHtml = tableHtml;
                $('#menuTbody').html(tableHtml);
            } else {
                saveTableHtml = '<tr><td colspan="7" class="text-center">No Menu Data</td></tr>';
                $('#menuTbody').html(saveTableHtml);
            }
        }
    });

}

function procMenuMaster(procType) {
    var saveArr = new Array();
    if (procType === 'UPDATE') {

        var data = new Object();
        data.statusFlag = procType;
        data.MENU_ID = $('#MENU_ID').val();
        data.MENU_NM = $('#MENU_NM').val();
        data.MENU_URL = $('#MENU_URL').val();
        data.MENU_AUTH = $('#MENU_AUTH').val();
        data.MENU_STYLE = $('#MENU_STYLE').val();
        saveArr.push(data);

    } else if (procType === 'NEW') {

        var data = new Object();
        data.statusFlag = procType;
        var menuId = makeMenuId();
        //data.MENU_ID = $('#MENU_ID').val();
        data.MENU_ID = menuId;
        data.MENU_NM = $('#MENU_NM').val();
        data.MENU_URL = $('#MENU_URL').val();
        data.MENU_AUTH = $('#MENU_AUTH').val();
        data.MENU_STYLE = $('#MENU_STYLE').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {
        var data = new Object();
        data.statusFlag = procType;
        data.MENU_ID = $('#DELETE_MENU_ID').val();
        data.MENU_NM = "SAMPLE";
        saveArr.push(data);
    }

    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/menu/procMenu',
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
                alert(language['REGIST_SUCC']);
                window.location.reload();
            } else {
                alert(language['It_failed']);
            }
        }
    });
}

function makeMenuId() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 15;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
}

//상위 메뉴 검색
function getMenu() {
    var select_menu = "";
    $.ajax({
        type: 'POST',
        url: '/menu/selectMenuAuthList',
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
                //var authVal = $('#MENU_AUTH').val();
                select_menu = "<option value='' >"+language.CHOOSE_AUTH+"</option>"
                for (var i = 0; i < data.rows.length; i++) {
                    if (updateAuth == data.rows[i].AUTH_LEVEL) {
                        select_menu += '<option value="' + data.rows[i].AUTH_LEVEL + '" selected >' + data.rows[i].AUTHGRP_M_NM + '</option>';
                    } else {
                        select_menu += '<option value="' + data.rows[i].AUTH_LEVEL + '">' + data.rows[i].AUTHGRP_M_NM + '</option>';
                    }
                }
            } else {
                select_menu = "<option value='' selected>"+language.CHOOSE_AUTH+"</option>"
            }
            $('#MENU_AUTH').html(select_menu);

            
            //$('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="updateMenuBtn"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>');

            //$('#menuFormModal').modal('show');
        }
    });
}

function getMenuStyle() {
    var select_menuStyle = "";
    
    if(updateMenuStyle=="ADMIN"){
        select_menuStyle = "<option value=''>"+language.CHOOSE_MENUSTYLE+"</option>";
        select_menuStyle += '<option value="ADMIN" selected >ADMIN</option>';
        select_menuStyle += '<option value="USER">USER</option>';
    }else if(updateMenuStyle=="USER"){
        select_menuStyle = "<option value=''>"+language.CHOOSE_MENUSTYLE+"</option>";
        select_menuStyle += '<option value="ADMIN">ADMIN</option>';
        select_menuStyle += '<option value="USER" selected>USER</option>';
    }else{
        select_menuStyle = "<option value='' selected>"+language.CHOOSE_MENUSTYLE+"</option>";
        select_menuStyle += '<option value="ADMIN">ADMIN</option>';
        select_menuStyle += '<option value="USER">USER</option>';
    }
    $('#MENU_STYLE').html(select_menuStyle);

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