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

    //검색
    $('#searchBtn').click(function() {
        makeCodeMasterTable();
    });

    //엔터로 검색
    $('#searchType, #searchWord').on('keypress', function(e) {
        if (e.keyCode == 13) makeCodeMasterTable();
    });

    //추가 버튼(Master)
    $(document).on("click", "#addBtn", function() {
        var new_code_id = $('#new_code_id').val();
        var newnew_code_name_code_id = $('#new_code_name').val();
       
        var validation_check = 0;
        if(new_code_id==""||new_code_id==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(newnew_code_name_code_id==""||newnew_code_name_code_id==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==2){
            procCodeMaster('NEW');
        }else{
            alert(language.IS_REQUIRED);
            return;
        }
        
    });

    //추가 버튼(Detail)
    $(document).on("click", "#addDetailBtn", function() {
        procCodeDetail('NEW');
    });

    //수정폼 버튼(master)
    $(document).on("click", "#updateBtn", function() {
        var new_code_id = $('#new_code_id').val();
        var newnew_code_name_code_id = $('#new_code_name').val();
       
        var validation_check = 0;
        if(new_code_id==""||new_code_id==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(newnew_code_name_code_id==""||newnew_code_name_code_id==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==2){
            procCodeMaster('UPDATE');
        }else{
            alert(language.IS_REQUIRED);
            return;
        }
        
    });

    //수정폼 버튼(detail)
    $(document).on("click", "#updateDetailBtn", function() {
        procCodeDetail('UPDATE');
    });

    //삭제 버튼(detail)
    $(document).on("click", "#deleteDetailBtn", function() {
        procCodeDetail('DEL');
    });
});



//페이지 버튼 클릭
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        makeCodeMasterTable();
    }
});

var saveTableHtml = "";
function makeCodeMasterTable() {
    
    var params = {
        'searchType' : $('#searchType').val(),
        'searchWord' : $('#searchWord').val(),
        //'page' : $('.pagination_wrap').find('.active').val(),
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/code/selectCodeMasterList',
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
    
                for (var i=0;i<data.rows.length;i++) { 
                    tableHtml += '<tr><td>1</td>';
                    tableHtml += '<td>' + data.rows[i].CDM_ID + '</td>';
                    tableHtml += '<td>' + data.rows[i].CDM_NM + '</td>';
                    tableHtml += '<td>' + data.rows[i].CDM_EXPL + '</td>';
                    if(data.rows[i].CDM_SEQ==null||data.rows[i].CDM_SEQ==''){
                        tableHtml += '<td></td>';
                    }else{
                        tableHtml += '<td>' + data.rows[i].CDM_SEQ + '</td>';
                    }
        
                    if(data.rows[i].USE_YN=='Y'){
                        tableHtml += '<td>'+language.USE_Y+'</td>';
                    }else{
                        tableHtml += '<td>'+language.USE_N+'</td>';
                    }
                    tableHtml += '<td>';
                    tableHtml += '<button type="button" class="btn btn-default btn-sm" onClick="update_codeMasterForm();"><i class="fa fa-edit"></i> '+language.UPDATE+'</button> <button type="button" class="btn btn-default btn-sm" id="deleteBtn" onClick="del_codeMaster()"><i class="fa fa-trash"></i> '+language.DELETE+'</button> <button type="button" class="btn btn-default btn-sm" onClick="goDetailCode(\''+ data.rows[i].CDM_ID +'\')"><i class="fa fa-info-circle"></i> '+language.CODESET_DETAIL+'</button>';                   
                    tableHtml += '</td></tr>';
                }
    
                saveTableHtml = tableHtml;
                $('#codeMasterTbody').html(tableHtml);
            } else {
                saveTableHtml = '<tr><td colspan="7" class="text-center">No Master Data</td></tr>';
                $('#codeMasterTbody').html(saveTableHtml);
            }

            iCheckBoxTrans();
            
        }
    });

}

var saveDetailTableHtml = "";
function makeCodeDeatilTable() {
    $('#detailCode_Title').html($('#CDM_ID').val()+" 코드 디테일 목록");
    var params = {
        'CDM_ID' : $('#CDM_ID').val(),
        //'page' : $('.pagination_wrap').find('.active').val(),
        'rows' : $('td[dir=ltr]').find('select').val()
    };
   
    $.ajax({
        type: 'POST',
        data: params,
        url: '/code/selectCodeDetailList',
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
    
                for (var i=0;i<data.rows.length;i++) { 
                    tableHtml += '<tr><td>1</td>';
                    tableHtml += '<td>' + data.rows[i].CDM_ID + '</td>';
                    tableHtml += '<td>' + data.rows[i].CD + '</td>';
                    tableHtml += '<td>' + data.rows[i].CD_NM + '</td>';
                    tableHtml += '<td>' + data.rows[i].CD_EXPL + '</td>';
                    tableHtml += '<td>' + data.rows[i].CD_SEQ + '</td>';
        
                    if(data.rows[i].USE_YN=='Y'){
                        tableHtml += '<td>'+language.USE_Y+'</td>';
                    }else{
                        tableHtml += '<td>'+language.USE_N+'</td>';
                    }
                    tableHtml += '<td>' + data.rows[i].STR_1 + '</td>';
                    tableHtml += '<td>' + data.rows[i].STR_2 + '</td>';
                    tableHtml += '<td>' + data.rows[i].STR_3 + '</td>';
                    tableHtml += '<td>';
                    tableHtml += '<button type="button" class="btn btn-default btn-sm" onClick="update_codeDetailForm();"><i class="fa fa-edit"></i> '+language.UPDATE+'</button> <button type="button" class="btn btn-default btn-sm" id="deleteDetailBtn"><i class="fa fa-trash"></i> '+language.DELETE+'</button>';                   
                    tableHtml += '</td></tr>';
                }
                
                saveDetailTableHtml = tableHtml;
                $('#codeDetailTbody').html(tableHtml);
            } else {
                saveDetailTableHtml = '<tr><td colspan="11" class="text-center">No <strong>'+$('#CDM_ID').val()+'</strong> Detail Data</td></tr>';
                $('#codeDetailTbody').html(saveDetailTableHtml);
            }

            iCheckBoxTrans();
            
        }
    });

}


//공통코드 마스터 수정 폼
function update_codeMasterForm(){
    document.codeMasterForm.new_code_id.value = $('#codeMasterTbody').children().children().eq(1).text();
    document.codeMasterForm.new_code_name.value = $('#codeMasterTbody').children().children().eq(2).text();
    document.codeMasterForm.new_code_desc.value = $('#codeMasterTbody').children().children().eq(3).text();
    $("#new_code_id").attr("readonly", true);

    $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="updateBtn"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>');

    $('#codeMasterFormModal').modal('show'); 
}

//공통코드 디테일 수정 폼
function update_codeDetailForm(){
    document.codeDetailForm.CDM_ID.value = $('#codeDetailTbody').children().children().eq(1).text();
    document.codeDetailForm.CD.value = $('#codeDetailTbody').children().children().eq(2).text();
    document.codeDetailForm.CD_NM.value = $('#codeDetailTbody').children().children().eq(3).text();
    document.codeDetailForm.CD_EXPL.value = $('#codeDetailTbody').children().children().eq(4).text();
    document.codeDetailForm.CD_SEQ.value = $('#codeDetailTbody').children().children().eq(5).text();
    //document.codeDetailForm.USE_YN.value = $('#codeDetailTbody').children().children().eq(6).text();
    document.codeDetailForm.STR_1.value = $('#codeDetailTbody').children().children().eq(7).text();
    document.codeDetailForm.STR_2.value = $('#codeDetailTbody').children().children().eq(8).text();
    document.codeDetailForm.STR_3.value = $('#codeDetailTbody').children().children().eq(9).text();
    $("#CDM_ID").attr("readonly", true);

    $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="updateDetailBtn"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>');

    $('#codeDetailFormModal').modal('show'); 
}

//사용자 리스트 초기화
function initCodeMasterList() {

    $('#codeMasterTbody').html(saveTableHtml);
    iCheckBoxTrans();
    
}

function procCodeMaster(procType) {
    var saveArr = new Array();
    if (procType === 'UPDATE') {
                
        var data = new Object() ;
        data.statusFlag = procType;
        data.CODE_ID = $('#new_code_id').val();
        data.CODE_NM = $('#new_code_name').val();
        data.CODE_DESC = $('#new_code_desc').val();
        saveArr.push(data);

    } else if (procType === 'NEW' ) {

        var data = new Object() ;
        data.statusFlag = procType;
        //data.CODE_ID = $(this).find('input[name=code_id]').val();
        //data.CODE_NM = $(this).find('input[name=code_name]').val();
        //data.CODE_DESC = $(this).find('input[name=code_desc]').val();
        data.CODE_ID = $('#new_code_id').val();
        data.CODE_NM = $('#new_code_name').val();
        data.CODE_DESC = $('#new_code_desc').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {

        var data = new Object() ;
        data.statusFlag = procType;
        data.CODE_ID = $('#codeMasterTbody').children().children().eq(1).text();
        data.CODE_NM = $('#codeMasterTbody').children().children().eq(2).text();       
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
        url: '/code/procCodeMaster',
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

function procCodeDetail(procType) {
    var saveArr = new Array();
    if (procType === 'UPDATE') {
                
        var data = new Object() ;
        data.statusFlag = procType;
        data.CDM_ID = $('#CDM_ID').val();
        data.CD = $('#CD').val();
        //data.LANG = $('#LANG').val();
        data.CD_NM = $('#CD_NM').val();
        data.CD_EXPL = $('#CD_EXPL').val();
        data.CD_SEQ = $('#CD_SEQ').val();
        data.STR_1 = $('#STR_1').val();
        data.STR_2 = $('#STR_2').val();
        data.STR_3 = $('#STR_3').val();
        saveArr.push(data);

    } else if (procType === 'NEW' ) {

        var data = new Object() ;
        data.statusFlag = procType;
        
        data.CDM_ID = $('#CDM_ID').val();
        data.CD = $('#CD').val();
        data.LANG = $('#LANG').val();
        data.CD_NM = $('#CD_NM').val();
        data.CD_EXPL = $('#CD_EXPL').val();
        data.CD_SEQ = $('#CD_SEQ').val();
        data.STR_1 = $('#STR_1').val();
        data.STR_2 = $('#STR_2').val();
        data.STR_3 = $('#STR_3').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {

        var data = new Object() ;
        data.statusFlag = procType;
        data.CDM_ID = $('#codeDetailTbody').children().children().eq(1).text();
        data.CD = $('#codeDetailTbody').children().children().eq(2).text(); 
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
        url: '/code/procCodeDetail',
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



