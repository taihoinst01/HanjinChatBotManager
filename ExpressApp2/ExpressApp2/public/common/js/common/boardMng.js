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
    makeBoardItemTable();
});

$(document).ready(function() {
    //추가 버튼(Master)
    $(document).on("click", "#addBoardItemBtn", function() {
        //searchGroupL: $('.currentGroupL').text()
        var BOARD_NM = $('#BOARD_NM').val();
        var BOARD_URL = $('#BOARD_URL').val();
        var validation_check = 0;
        if(BOARD_NM==""||BOARD_NM==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(BOARD_URL==""||BOARD_URL==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==2){
            procBoardItemMaster('NEW');
        }else{
            alert(language.IS_REQUIRED);
            return;
        }        
    });

    //수정폼
    $(document).on("click", "#update_boardItemForm", function () {
        document.boardItemForm.reset();

        var BOARD_ID = $(this).attr("BOARD_ID");
        var tr = $(this).parent().parent();
        var td = tr.children();
    
        document.boardItemForm.BOARD_ID.value = BOARD_ID;
        document.boardItemForm.BOARD_NM.value = td.eq(1).text();
        document.boardItemForm.BOARD_URL.value = td.eq(2).text();
        document.boardItemForm.BOARD_EXPL.value = td.eq(3).text();

        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="updateBoardItem"><i class="fa fa-edit"></i> '+language.UPDATE+'</button>');

        $('#boardItemFormModal').modal('show');
    });

    //수정 버튼
    $(document).on("click", "#updateBoardItem", function () {
        var BOARD_NM = $('#BOARD_NM').val();
        var BOARD_URL = $('#BOARD_URL').val();
        var validation_check = 0;
        if(BOARD_NM==""||BOARD_NM==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(BOARD_URL==""||BOARD_URL==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==2){
            procBoardItemMaster('UPDATE');
        }else{
            alert(language.IS_REQUIRED);
            return;
        }       
    });

    //삭제폼
    $(document).on("click", "#delete_boardItemForm", function () {
        var BOARD_ID = $(this).attr("BOARD_ID");
        
        document.boardItemDeleteForm.reset();
        document.boardItemDeleteForm.DELETE_BOARD_ID.value = BOARD_ID;
        $('#boardItemDeleteModal').modal('show');
    });

    //삭제 버튼
    $(document).on("click", "#deleteBoardItemBtn", function () {
        procBoardItemMaster('DEL');
    });
    
});

var saveTableHtml = "";
function makeBoardItemTable() {
    
    var params = {
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/boardMng/selectDashboardItemList',
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
                    tableHtml += '<tr>';
                    tableHtml += '<td>' + data.rows[i].BOARD_ID + '</td>'
                    tableHtml += '<td>' + data.rows[i].BOARD_NM + '</td>'
                    tableHtml += '<td>' + data.rows[i].BOARD_URL + '</td>'
                    tableHtml += '<td>' + data.rows[i].BOARD_EXPL + '</td>'
                    tableHtml += '<td>' + data.rows[i].REG_DT + '</td>'
                    tableHtml += '<td>';
                    tableHtml += '<button type="button" class="btn btn-default btn-sm" id="update_boardItemForm" board_id="' + data.rows[i].BOARD_ID + '"><i class="fa fa-edit"></i> '+language.UPDATE+'</button> <button type="button" class="btn btn-default btn-sm" id="delete_boardItemForm" board_id="' + data.rows[i].BOARD_ID + '"><i class="fa fa-trash"></i> '+language.DELETE+'</button>';
                    tableHtml += '</td></tr>';
                }
    
                saveTableHtml = tableHtml;
                $('#dashBoardItemTbody').html(tableHtml);
            } else {
                saveTableHtml = '<tr><td colspan="6" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#dashBoardItemTbody').html(saveTableHtml);
            }
            
        }
    });

}

function procBoardItemMaster(procType) {
    var saveArr = new Array();
    if (procType === 'UPDATE') {
                
        var data = new Object() ;
        data.statusFlag = procType;
        data.BOARD_ID = $('#BOARD_ID').val();
        data.BOARD_NM = $('#BOARD_NM').val();
        data.BOARD_EXPL = $('#BOARD_EXPL').val();
        data.BOARD_URL = $('#BOARD_URL').val();
        saveArr.push(data);

    } else if (procType === 'NEW' ) {
        var data = new Object() ;
        data.statusFlag = procType;
        var BOARD_ID = makeBoardId();

        data.BOARD_ID = BOARD_ID;
        data.BOARD_NM = $('#BOARD_NM').val();
        data.BOARD_EXPL = $('#BOARD_EXPL').val();
        data.BOARD_URL = $('#BOARD_URL').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {
        var data = new Object();
        data.statusFlag = procType;
        data.BOARD_ID = $('#DELETE_BOARD_ID').val();
        data.BOARD_NM = "SAMPLE";
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
        url: '/boardMng/procBoardItem',
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

function makeBoardId() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 20;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
}