


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
    makeApiTable();
});

$(document).ready(function() {

    //검색
    $('#searchBtn').click(function() {
        makeApiTable();
    });

    //엔터로 검색
    $('#searchInput, #searchId').on('keypress', function(e) {
        if (e.keyCode == 13) makeApiTable();
    });

    //추가 버튼
    $('#addBtn').click(function() {
        addApi();
    });

    //삭제 버튼
    $('#deleteBtn').click(function() {
        deleteApi();
    });

    //저장 버튼
    $('#saveBtn').click(function() {
        saveApi();
    });
    
    //초기화 버튼
    $('#initBtn').click(function() {
        initApiList();
    });

});



//페이지 버튼 클릭
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        makeApiTable();
    }
});

//사용자 명 클릭 수정
var editCellText="";
$(document).on('click','.editable-cell',function(e){

    if($(this).find('input').length > 0){
        
    } else {
        editCellText = $(this).text();
        var inputHtml = '<input type="text" id="editCell" spellcheck="false" autocomplete="off" value="' + $(this).text() + '" style="width:80%"/>';
        $(this).html(inputHtml);
        $(this).attr('class', 'edit-cell');     

        $(this).children().focus().val('').val(editCellText);
    }
});

//수정 중 셀 범위 밖 클릭 시 저장
$(document).ready(function() {
    $('html').click(function(e) { 
        if ($('.edit-cell').length > 0) {
            if ( !$('#editCell').parent().has(e.target).length ) { 
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

var saveTableHtml = "";
function makeApiTable() {
    var params = {
        'searchId' : $('#searchInput').val(),
        'page' : $('.pagination_wrap').find('.active').val(),
        'rows' : $('td[dir=ltr]').find('select').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/users/selectApiList',
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
                    tableHtml += '<tr><td>' + data.rows[i].API_SEQ + '</td>';
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="tableCheckBox"></td>';
                    tableHtml += '<td class="editable-cell">' + data.rows[i].API_ID + '</td>'
                    tableHtml += '<td class="editable-cell">' + data.rows[i].API_URL + '</td>'
                    tableHtml += '<td class="editable-cell">' + data.rows[i].API_DESC + '</td>'
                    tableHtml += '<td><input type="hidden" value="' + data.rows[i].API_SEQ + '" /></td></tr>';
                }
    
                saveTableHtml = tableHtml;
                $('#tableBodyId').html(tableHtml);
            } else {
                $('#tableBodyId').html('');
            }

            iCheckBoxTrans();
            
            $('.pagination').html('').append(data.pageList);
            
        }
    });
    

}

// 비밀번호 초기화 
function initPassword(userId) {
    if (confirm(language['ASK_PW_INIT'])) {
        var params = {
            paramUserId: userId
        }
        
        $.ajax({
            data: params,
            url: '/users/inItPassword',
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
                alert(data.message);
            }
        });
        
    }
}

//사용자 추가
function addApi() {
    var addHtml = "";
    addHtml += '<tr><td>NEW</td>';
    addHtml += '<td><input type="checkbox" class="flat-red" name="tableCheckBox" ></td>'
    addHtml += '<td><input type="text" name="new_Api_id" spellcheck="false" autocomplete="off" value="" style="width:80%"/></td>';
    addHtml += '<td><input type="text" name="new_Api_url" spellcheck="false" autocomplete="off" value="" style="width:80%"/></td> ';
    addHtml += '<td><input type="text" name="new_Api_desc" spellcheck="false" autocomplete="off" value="" style="width:80%"/></td> '
    addHtml += '<td></td></tr>';
    $('#tableBodyId').prepend(addHtml);

    iCheckBoxTrans();

    $('#tableBodyId').children().eq(0).find('div').iCheck('check'); 
}

//사용자 리스트 초기화
function initApiList() {
    if(confirm(language['ASK_INIT'])) {
        $('#tableBodyId').html(saveTableHtml);
        iCheckBoxTrans();
    }
    
}

function deleteApi() {
    if ($('tr div[class*=checked]').length < 1) {
        alert(language['NO_SELECTED_CELL']);
    } else {
        $('tr div[class*=checked]').each(function() {
            $(this).parent().prev().text('DEL');
        });
    }
    
}

function saveApi() {

    if ($('td>div[class*=checked]').length < 1) {
        alert("저장할 API를 선택하세요.");
        return;
    }
    if (confirm(language['ASK_SAVE'])) {
        var chkEmptyInput = false;
        for (var i=0; i<$('input[name=new_Api_id]').length; i++) {
            if ( ($.trim($('input[name=new_user_id]').eq(i).val()) === "") || ($.trim($('input[name=new_Api_url]').eq(i).val()) === "") 
                    || ($.trim($('input[name=new_Api_desc]').eq(i).val()) === "")) {
                chkEmptyInput = true;
                break;
            }
        }
        if (chkEmptyInput) {
            alert(language['INPUT_API_INFO']);
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
                    data.API_ID = $(this).children().eq(2).text();
                    data.API_URL = $(this).children().eq(3).text();
                    data.API_DESC = $(this).children().eq(4).text();
                    data.API_SEQ = $(this).children().eq(5).children().val();
                    saveArr.push(data);

                } else if (statusFlag === 'NEW' ) {

                    var data = new Object() ;
                    data.statusFlag = statusFlag;
                    data.API_ID = $(this).children().eq(2).text();
                    data.API_URL = $(this).children().eq(3).text();
                    data.API_DESC = $(this).children().eq(4).text();
                    saveArr.push(data);
                } else if (statusFlag === 'DEL') {

                    var data = new Object() ;
                    data.statusFlag = statusFlag;
                    data.API_ID = $(this).children().eq(2).text();
                    data.API_URL = $(this).children().eq(3).text();
                    data.API_DESC = $(this).children().eq(4).text();
                    data.API_SEQ = $(this).children().eq(5).children().val();
                    saveArr.push(data);
                }
            }
            
        });

        //save
        var jsonData = JSON.stringify(saveArr);
        var params = {
            'saveArr' : jsonData
        };
        $.ajax({
            type: 'POST',
            datatype: "JSON",
            data: params,
            url: '/users/saveApiInfo',
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



