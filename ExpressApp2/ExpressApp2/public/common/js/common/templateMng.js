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
    makeTemplateTable();    
});

$(document).ready(function() {

    //추가 버튼(Master)
    $(document).on("click", "#addTemplateBtn", function() {
        /*
        var HEADER_COLOR = $('#header_color').val();
        var BODY_COLOR = $('#body_color').val();
        var POPHEADER_COLOR = $('#popheader_color').val();
        var BOT_COLOR = $('#bot_color').val();
        var USER_COLOR = $('#user_color').val();
        var ICON_IMG = $('#icon_img').val();
        var BACKGROUND_IMG = $('#background_img').val();
        var validation_check = 0;
        if(HEADER_COLOR==""||HEADER_COLOR==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(BODY_COLOR==""||BODY_COLOR==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(POPHEADER_COLOR==""||POPHEADER_COLOR==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(BOT_COLOR==""||BOT_COLOR==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(USER_COLOR==""||USER_COLOR==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(ICON_IMG==""||ICON_IMG==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(BACKGROUND_IMG==""||BACKGROUND_IMG==null){
            validation_check = validation_check + 0;
        }else{
            validation_check = validation_check + 1;
        }

        if(validation_check==7){
            procTemplate('NEW');
        }else{
            $('#proc_content').html('모든 사항은 필수사항 입니다');
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
            $('#templateModal').modal('show');
            return;
        }     
        */
       procTemplate('NEW');
    });

    $(document).on("click", "#useTemplateeBtn", function () {
        procTemplate("UPDATE_USEYN");
    });

    //삭제 버튼 confirm
    $('#deleteTemplateBtnModal').click(function() {
        var del_count = $("#DEL_SEQ:checked").length;
         
        if(del_count > 0){
            $('#proc_content').html(language.IS_DELETE_CONFIRM);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="deleteTemplateBtn"><i class="fa fa-edit"></i> '+language.DELETE+'</button>');
        }else{
            $('#proc_content').html(language.IS_DELETE_CONDITION);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button>');
        }
        $('#templateModal').modal('show');
    });

    //삭제 버튼
    $(document).on("click", "#deleteTemplateBtn", function () {
        procTemplate('DEL');
    });

    $(document).on("click", "#preview_template", function () {
        var tr = $(this).parent().parent();
        var td = tr.children();
        var header_color = td.eq(2).text().substr(0,7);
        var body_color = td.eq(3).text().substr(0,7);
        var popheader_color = td.eq(4).text().substr(0,7);
        var bot_color = td.eq(5).text().substr(0,7);
        var user_color = td.eq(6).text().substr(0,7);
        var boticon_img = td.eq(7).text();
        var background_img = td.eq(8).text();

        $('#headerColorId').css('background-color', header_color);
        $('#dialogViewWrap').css('background-color', body_color);
        $('#popheaderColorId').css('background-color', popheader_color);
        $('#botColorId').css('background-color', bot_color);
        $('#userColorId').css('background-color', user_color);
        $('#botIconImageId').css('background-image', 'url("' + boticon_img + '")');
        $('#dialogViewWrap').css('background-image', 'url("' + background_img + '")');
        
        $('#templatePreviewModal').modal('show');
    });
});

$(document).on('click', '#templateTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeTemplateTable($(this).text());
    }
});


function makeTemplateTable(newPage) {
    var chatbotName_ = $('#chatbotName').val();
    var saveTableHtml = "";
    var params = {
        'chatbotName' : chatbotName_,
        'currentPage': newPage,
        'rows': $('td[dir=ltr]').find('select').val()
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/templateMng/selectTemplateList',
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
                    
                    tableHtml += '<tr name="userTr"><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="DEL_SEQ" id="DEL_SEQ" value="'+ data.rows[i].SEQ+'"></td>';
                    tableHtml += '<td>' + data.rows[i].HEADER_COLOR + '&nbsp;<span style="background:' + data.rows[i].HEADER_COLOR + '">&nbsp;&nbsp;&nbsp;&nbsp;</span></td>'
                    tableHtml += '<td>' + data.rows[i].BODY_COLOR + '&nbsp;<span style="background:' + data.rows[i].BODY_COLOR + '">&nbsp;&nbsp;&nbsp;&nbsp;</span></td>'
                    tableHtml += '<td>' + data.rows[i].POPHEADER_COLOR + '&nbsp;<span style="background:' + data.rows[i].POPHEADER_COLOR + '">&nbsp;&nbsp;&nbsp;&nbsp;</span></td>'
                    tableHtml += '<td>' + data.rows[i].BOT_COLOR + '&nbsp;<span style="background:' + data.rows[i].BOT_COLOR + '">&nbsp;&nbsp;&nbsp;&nbsp;</span></td>'
                    tableHtml += '<td>' + data.rows[i].USER_COLOR + '&nbsp;<span style="background:' + data.rows[i].USER_COLOR + '">&nbsp;&nbsp;&nbsp;&nbsp;</span></td>'
                    tableHtml += '<td>' + data.rows[i].ICON_IMG + '</td>'
                    tableHtml += '<td>' + data.rows[i].BACKGROUND_IMG + '</td>'
                    tableHtml += '<td><a href="#" onClick="goChangeUseYn(\''+ data.rows[i].SEQ+'\')">' + data.rows[i].USE_YN + '</a></td>'
                    tableHtml += '<td><button type="button" class="btn btn-default btn-sm" id="preview_template" template_id="' + data.rows[i].SEQ + '"><i class="fa fa-edit"></i> '+language.TEMPLATE_PREVIEW+'</button></td>';
                    tableHtml += '<tr>'
                }

                saveTableHtml = tableHtml;
                $('#templateTableBodyId').html(saveTableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#templateTableBodyId').find('tr').eq(0).children().eq(0).trigger('click');

                $('#templateTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="11" class="text-center">No Template Data</td></tr>';
                $('#templateTableBodyId').html(saveTableHtml);
            }

        }
    });
}

var ChangeSeq = "";
function goChangeUseYn(change_seq){
    ChangeSeq = change_seq;
    $('#proc_content').html(language.TEMPLATE_CHOICE_CONFIRM);
    $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button><button type="button" class="btn btn-primary" id="useTemplateeBtn"><i class="fa fa-edit"></i> '+language.YES+'</button>');
    $('#templateModal').modal('show');
    
}

function procTemplate(procType) {
    var saveArr = new Array();

    if (procType === 'NEW') {

        var data = new Object();
        data.statusFlag = procType;
        data.HEADER_COLOR = $('#header_color').val();
        data.BODY_COLOR = $('#body_color').val();
        data.POPHEADER_COLOR = $('#popheader_color').val();
        data.BOT_COLOR = $('#bot_color').val();
        data.USER_COLOR = $('#user_color').val();
        data.ICON_IMG = $('#icon_img').val();
        data.BACKGROUND_IMG = $('#background_img').val();
        data.CHATBOT_NAME = $('#chatbotName').val();
        saveArr.push(data);
    } else if (procType === 'DEL') {
        var data = new Object();
        data.statusFlag = procType;
        //data.DEL_SEQ = $('#DEL_SEQ').val();
        $("input[name=DEL_SEQ]:checked").each(function() {
            var test = $(this).val();
            console.log(test);
            data.DEL_SEQ = test;
        });
        saveArr.push(data);
    } else if (procType === 'UPDATE_USEYN') {
        var data = new Object();
        data.statusFlag = procType;
        data.USEYN_SEQ = ChangeSeq;
        data.CHATBOT_NAME = $('#chatbotName').val();
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
        url: '/templateMng/procTemplate',
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
                ChangeSeq = "";
                //alert(language['REGIST_SUCC']);
                //$('#proc_content').html("요청사항이 진행되었습니다");
                //$('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                //$('#templateModal').modal('show');
                window.location.reload();
            } else {
                ChangeSeq = "";
                //alert(language['It_failed']);
                $('#templateModal').modal('hide');
                $('#proc_content').html(language.It_failed);
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+language.CLOSE+'</button>');
                $('#templateModal').modal('show');
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