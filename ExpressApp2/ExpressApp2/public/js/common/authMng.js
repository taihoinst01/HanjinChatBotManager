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
    makeAuthTable();
});

$(document).ready(function() {
    //검색
    $('#searchBtn').click(function() {
        makeAuthTable();
    });

    //엔터로 검색
    $('#searchType, #searchWord').on('keypress', function(e) {
        if (e.keyCode == 13) makeAuthTable();
    });

    //추가 버튼(Master)
    $(document).on("click", "#addAuthGrpBtn", function() {
        
        var AUTHGRP_M_NM = $('#AUTHGRP_M_NM').val();
       
        var validation_check = 0;
        if(AUTHGRP_M_NM==""||AUTHGRP_M_NM==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==1){
            procAuthMaster('NEW');
        }else{
            alert(language.IS_REQUIRED);
            return;
        }  
    });

    //수정폼
    $(document).on("click", "#update_authForm", function () {
        document.authMasterForm.reset();

        var auth_id = $(this).attr("auth_id");
        var auth_level = $(this).attr("auth_level");
        var tr = $(this).parent().parent();
        var td = tr.children();
    
        document.authMasterForm.AUTHGRP_M_ID.value = auth_id;
        document.authMasterForm.AUTHGRP_M_NM.value = td.eq(0).text();
        //document.authMasterForm.AUTH_LEVEL.value = td.eq(1).text();
        document.authMasterForm.AUTH_LEVEL.value = auth_level;
        document.authMasterForm.DESCR.value = td.eq(2).text();

        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="updateAuthBtn"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>');

        $('#authMasterFormModal').modal('show');
    });

    //수정 버튼
    $(document).on("click", "#updateAuthBtn", function () {
        var AUTHGRP_M_NM = $('#AUTHGRP_M_NM').val();
       
        var validation_check = 0;
        if(AUTHGRP_M_NM==""||AUTHGRP_M_NM==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==1){
            procAuthMaster('UPDATE');
        }else{
            alert(language.IS_REQUIRED);
            return;
        }  
       
    });

    //삭제폼
    $(document).on("click", "#delete_authForm", function () {
        var auth_id = $(this).attr("auth_id");
        
        document.authDeleteForm.reset();
        document.authDeleteForm.DELETE_AUTH_ID.value = auth_id;
        $('#authDeleteModal').modal('show');
    });

    //삭제 버튼
    $(document).on("click", "#deleteAuthBtn", function () {
        procAuthMaster('DEL');
    });
    
});

//페이지 버튼 클릭
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        makeAuthTable();
    }
});

var saveTableHtml = "";
function makeAuthTable() {
    
    var params = {
        'searchType' : $('#searchType').val(),
        'searchWord' : $('#searchId').val(),
        'page' : $('.pagination_wrap').find('.active').val(),
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/auth/selectAuthGrpList',
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
           
            if (data.records > 0) {
                
                var tableHtml = "";
                var authLevel_text = "";
                //var authLevel_code = ""
                for (var i=0;i<data.rows.length;i++) {
                    eval('authLevel_text = language.AUTH_'+data.rows[i].AUTH_LEVEL);
                    tableHtml += '<tr>';
                    tableHtml += '<td class="editable-cell">' + data.rows[i].AUTHGRP_M_NM + '</td>'
                    //tableHtml += '<td>' + data.rows[i].AUTH_LEVEL + '</td>'
                    tableHtml += '<td>' + authLevel_text + '</td>'
                    tableHtml += '<td>' + data.rows[i].DESCR + '</td>'
                    tableHtml += '<td>' + data.rows[i].REG_DT + '</td>'
                    tableHtml += '<td>' + data.rows[i].MOD_DT + '</td>'
                    tableHtml += '<td>';
                    //tableHtml += '<button type="button" class="btn btn-default btn-sm" id="update_authForm" auth_id="' + data.rows[i].AUTHGRP_M_ID + '"><i class="fa fa-edit"></i> '+language.UPDATE+'</button> <button type="button" class="btn btn-default btn-sm" id="delete_authForm" auth_id="' + data.rows[i].AUTHGRP_M_ID + '"><i class="fa fa-trash"></i> 삭제</button>';
                    tableHtml += '<button type="button" class="btn btn-default btn-sm" id="update_authForm" auth_level="' + data.rows[i].AUTH_LEVEL + '" auth_id="' + data.rows[i].AUTHGRP_M_ID + '"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>';
                    tableHtml += '</td></tr>';
                }
    
                saveTableHtml = tableHtml;
                $('#authMasterTbody').html(tableHtml);
            } else {
                saveTableHtml = '<tr><td colspan="6" class="text-center">No AuthGroup Data</td></tr>';
                $('#authMasterTbody').html(saveTableHtml);
            }

            iCheckBoxTrans();
            
            $('.pagination').html('').append(data.pageList);
            
        }
    });

}

function procAuthMaster(procType) {
    var saveArr = new Array();
    if (procType === 'UPDATE') {
                
        var data = new Object() ;
        data.statusFlag = procType;
        data.AUTHGRP_M_ID = $('#AUTHGRP_M_ID').val();
        data.AUTHGRP_M_NM = $('#AUTHGRP_M_NM').val();
        data.DESCR = $('#DESCR').val();
        data.AUTH_LEVEL = $('#AUTH_LEVEL').val();
        saveArr.push(data);

    } else if (procType === 'NEW' ) {
        var data = new Object() ;
        data.statusFlag = procType;
        var authId = makeAuthId();

        data.AUTHGRP_M_ID = authId;
        data.AUTHGRP_M_NM = $('#AUTHGRP_M_NM').val();
        data.DESCR = $('#DESCR').val();
        data.AUTH_LEVEL = $('#AUTH_LEVEL').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {
        var data = new Object();
        data.statusFlag = procType;
        data.AUTHGRP_M_ID = $('#DELETE_AUTH_ID').val();
        data.AUTHGRP_M_NM = "SAMPLE";
        saveArr.push(data);
    }
    
    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr' : jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/auth/procAuthMaster',
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


function makeAuthId() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 20;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
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