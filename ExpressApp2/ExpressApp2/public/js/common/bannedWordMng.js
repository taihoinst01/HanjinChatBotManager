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
    makeBannedWordTable();    
});

$(document).ready(function() {

    //검색
    $('#searchBtn').click(function() {
        makeBannedWordTable();
    });

    //엔터로 검색
    $('#searchName, #searchId').on('keypress', function(e) {
        if (e.keyCode == 13) makeBannedWordTable();
    });

    //추가 버튼(Master)
    $(document).on("click", "#addBannedWordBtn", function() {
        //searchGroupL: $('.currentGroupL').text()
        var BANNED_WORD = $('#BANNED_WORD').val();
        var BANNED_WORD_TYPE = $('#BANNED_WORD_TYPE').val();
        var validation_check = 0;
        if(BANNED_WORD==""||BANNED_WORD==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(BANNED_WORD_TYPE==""||BANNED_WORD_TYPE==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==2){
            procBandWord('NEW');
        }else{
            //alert("필수사항이 작성되지 않았습니다.");
            //return;
            $('#del_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
            $('#bannedWordDeleteModal').modal('show');
        }        
    });

     //삭제 버튼 confirm
     $('#deleteBannedWordBtnModal').click(function() {
        var del_count = $("#DEL_SEQ:checked").length;
         
        if(del_count > 0){
            $('#del_content').html(language.IS_DELETE_CONFIRM);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="deleteBannedWordBtn"><i class="fa fa-edit"></i> '+language.DELETE+'</button>');
        }else{
            $('#del_content').html(language.IS_DELETE_CONDITION);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button>');
        }
        $('#bannedWordDeleteModal').modal('show');
    });

    //삭제 버튼
    $(document).on("click", "#deleteBannedWordBtn", function () {
        procBandWord('DEL');
    });

});


//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#bannedWordTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeBannedWordTable($(this).val());
    }
});


function makeBannedWordTable(newPage) {

    var params = {
        'currentPage': newPage,
        'rows': $('td[dir=ltr]').find('select').val()
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/bannedWordMng/selectBannedWordList',
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
                var bannedWordTypeText = "";
                for (var i = 0; i < data.rows.length; i++) {
                    if(data.rows[i].BANNED_WORD_TYPE=="3"){
                        bannedWordTypeText = "비속어";
                    }else if(data.rows[i].BANNED_WORD_TYPE=="4"){
                        bannedWordTypeText = "금칙어";
                    }else{
                        bannedWordTypeText = "none";
                    }
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="DEL_SEQ" id="DEL_SEQ" value="'+ data.rows[i].SEQ+'"></td>';
                    tableHtml += '<td>' + data.rows[i].BANNED_WORD + '</td>'
                    tableHtml += '<td>' + bannedWordTypeText + '</td><tr>'
                }

                saveTableHtml = tableHtml;
                $('#bannedWordTableBodyId').html(tableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#bannedWordTableBodyId').find('tr').eq(0).children().eq(0).trigger('click');

                $('#bannedWordTablePaging .pagination').html('').append(data.pageList);

            } else {
                $('#bannedWordTableBodyId').html('');
            }

        }
    });
}

function procBandWord(procType) {
    var saveArr = new Array();
    var data = new Object();

    if (procType === 'NEW') {

        var data = new Object();
        data.statusFlag = procType;
        data.BANNED_WORD = $('#BANNED_WORD').val();
        data.BANNED_WORD_TYPE = $('#BANNED_WORD_TYPE').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {
        $("input[name=DEL_SEQ]:checked").each(function() {
            data.statusFlag = procType;
            data = new Object();
            var test = $(this).val();
            console.log(test);
            data.DEL_SEQ = test;
            saveArr.push(data);
        });
    }

    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/bannedWordMng/procBandWord',
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