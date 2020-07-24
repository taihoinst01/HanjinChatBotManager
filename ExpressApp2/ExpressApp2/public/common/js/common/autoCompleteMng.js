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
    makeAutoCompleteTable();    
});

$(document).ready(function() {

    //추가 버튼(Master)
    $(document).on("click", "#addAutoCompleteBtn", function() {
        //searchGroupL: $('.currentGroupL').text()
        var CONTENT = $('#CONTENT').val();
        var validation_check = 0;
        if(CONTENT==""||CONTENT==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==1){
            procAutoComplete('NEW');
        }else{
            alert("필수사항이 작성되지 않았습니다.");
            return;
        }        
    });

     //삭제 버튼 confirm
     $('#deleteAutoCompleteBtnModal').click(function() {
        var del_count = $("#DEL_SEQ:checked").length;
         
        if(del_count > 0){
            $('#del_content').html('정말로 삭제하시겠습니까? 복구할 수 없습니다.');
            $('#delete_autocomplete_btn').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button><button type="button" class="btn btn-primary" id="deleteAutoCompleteBtn"><i class="fa fa-edit"></i> Delete</button>');
        }else{
            $('#del_content').html('삭제할 대상은 한 개 이상이어야 합니다.');
            $('#delete_autocomplete_btn').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
        }
        $('#autoCompleteDeleteModal').modal('show');
    });

    //삭제 버튼
    $(document).on("click", "#deleteAutoCompleteBtn", function () {
        procAutoComplete('DEL');
    });

    //수정폼
    $(document).on("click", "#update_autoCompleteForm", function () {
        document.autoCompleteUpdateForm.reset();

        var autocomplete_id = $(this).attr("autocomplete_id");
        var tr = $(this).parent().parent();
        var td = tr.children();
    
        document.autoCompleteUpdateForm.UPDATE_SEQ.value = autocomplete_id;
        document.autoCompleteUpdateForm.UPDATE_CONTENT.value = td.eq(2).text();
        document.autoCompleteUpdateForm.UPDATE_USE_YN.value = td.eq(3).text();

        $('#autoCompleteFormModal').modal('show');
    });

    //수정 버튼
    $(document).on("click", "#updateAutoCompleteBtn", function () {
        var CONTENT = $('#UPDATE_USE_YN').val();
       
        var validation_check = 0;
        if(CONTENT==""||CONTENT==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==1){
            procAutoComplete('UPDATE');
        }else{
            alert("필수사항이 작성되지 않았습니다.");
            return;
        }  
       
    });

});

//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#AutoCompleteTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeAutoCompleteTable($(this).text());
    }
});


function makeAutoCompleteTable(newPage) {
    var saveTableHtml = "";
    var params = {
        'currentPage': newPage,
        'rows': $('td[dir=ltr]').find('select').val()
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/autoCompleteMng/selectAutoCompleteList',
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

            if (data.rows) {

                var tableHtml = "";
                for (var i = 0; i < data.rows.length; i++) {
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="DEL_SEQ" id="DEL_SEQ" value="'+ data.rows[i].SEQ+'"></td>';
                    tableHtml += '<td>' + data.rows[i].CONTENT + '</td>';
                    tableHtml += '<td>' + data.rows[i].USE_YN + '</td>';
                    tableHtml += '<td><button type="button" class="btn btn-default btn-sm" id="update_autoCompleteForm" autocomplete_id="' + data.rows[i].SEQ + '"><i class="fa fa-edit"></i> 수정</button></td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#autoCompleteTableBodyId').html(tableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#autoCompleteTableBodyId').find('tr').eq(0).children().eq(0).trigger('click');

                $('#autoCompleteTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="5" class="text-center">No AutoComplete Data</td></tr>';
                $('#autoCompleteTableBodyId').html(saveTableHtml);
            }

        }
    });
}

function procAutoComplete(procType) {
    var saveArr = new Array();
    var data = new Object();
    if (procType === 'NEW') {
        var data = new Object();
        data.statusFlag = procType;
        data.CONTENT = $('#CONTENT').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {
        $("input[name=DEL_SEQ]:checked").each(function() {
            data.statusFlag = procType;
            data = new Object();
            var test = $(this).val();
            data.DEL_SEQ = test;
            saveArr.push(data);
        });
        saveArr.push(data);
    } else if (procType === 'UPDATE') {
        var data = new Object();
        data.statusFlag = procType;
        data.UPDATE_SEQ = $('#UPDATE_SEQ').val();
        data.CONTENT = $('#UPDATE_CONTENT').val();
        data.USE_YN = $('#UPDATE_USE_YN').val();
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
        url: '/autoCompleteMng/procAutoComplete',
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
        $('input[name=DEL_SEQ]').parent().iCheck('check');
        
    }).on('ifUnchecked', function() {
        $('input[name=DEL_SEQ]').parent().iCheck('uncheck');
        
    });
}