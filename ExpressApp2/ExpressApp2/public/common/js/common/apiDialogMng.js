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
    makeApiDialogTable();    
});

$(document).ready(function() {
    
    //삭제 버튼 confirm
    $('#deleteApiDialogBtnModal').click(function() {
        var del_count = $("#DELETE_ST_SEQ:checked").length;

        if(del_count > 0){
            $('#proc_content').html(language.SmallTalk_DELETE_CONFIRM);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button><button type="button" class="btn btn-primary" id="deleteApiDialogBtn"><i class="fa fa-trash"></i> '+ language.DELETE +'</button>');
            $('#procApiDialog').modal('show');
        }else{
            $('#proc_content').html(language.SmallTalk_DELETE_COUNT);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procApiDialog').modal('show');
            //alert(language.SmallTalk_CANCEL_COUNT);
        }
    });

    //삭제 버튼
    $(document).on("click", "#deleteApiDialogBtn", function () {
        //cancelapiDialogProc('DEL');
        apiDialogProc('DEL');
    });

    $('#addApiDialog').click(function() {
        var validation_result = dialogValidation("NEW");
        if(validation_result=="success"){
            apiDialogProc('ADD');
        }else{
            $('#proc_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procApiDialog').modal('show');
        }
    });

    $('#updateSmallTalk').click(function() {

        var validation_result = dialogValidation("UPDATE");
        if(validation_result=="success"){
            apiDialogProc('UPDATE');
        }else{
            $('#proc_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procApiDialog').modal('show');
        }
    });

    $('#searchDlgBtn').click(function (e) {
        $('#searchIntentHidden').val($('#searchIntent').val().trim());
        $('#searchQuestionHidden').val($('#searchQuestion').val().trim());
        makeApiDialogTable(1);
    });

    $('#createApiDialogBtn').click(function (e) {
        $("#apiDialogForm")[0].reset();
        $('#apiDialogMngModal').modal('show');
    });

    $('input[name=searchIntent], input[name=searchQuestion]').keypress(function (e) {
        if (e.keyCode == 13) {
            var searchIntent = $('#searchIntentHidden').val().trim();
            var searchQuestion = $('#searchQuestionHidden').val().trim();
            if (searchIntent != $('#searchIntent').val().trim() || searchQuestion != $('#searchQuestion').val().trim()) {
                $('#searchDlgBtn').trigger('click');
            }
        }
    });

    // question 입력
    $('input[name=s_query]').keypress(function (e) {

        if (e.keyCode == 13) {	//	Enter Key
            $('input[name=s_query]').attr('readonly', true);
            var queryText = $(this).val();
            if (queryText.trim() == "" || queryText.trim() == null) {
                $('input[name=s_query]').attr('readonly', false);
                return false;
            }
            
            $("input[name=s_query]").attr("readonly", false);
        }
    });
});

//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#apiDialogTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeApiDialogTable($(this).val());
    }
});

var searchQuestiontText = ""; //페이징시 필요한 검색어 담아두는 변수
var searchIntentText = ""; //페이징시 필요한 검색어 담아두는 변수
var listPageNo = "";
function makeApiDialogTable(page) {
    if (page) {
        //$('#currentPage').val(1);
        searchQuestiontText = $('#searchQuestionHidden').val();
        searchIntentText = $('#searchIntentHidden').val();
    }
    params = {
        'useYn' : $('#smallTalkYn').find('option:selected').val(),
        //'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'currentPage': ($('#currentPage').val() == '') ? 1 : page,
        'searchQuestiontText': searchQuestiontText,
        'searchIntentText': searchIntentText
    };
    listPageNo = ($('#currentPage').val() == '') ? 1 : page;
    $.ajax({
        type: 'POST',
        data: params,
        url: '/qna/selectApiDialogList',
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
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="DELETE_ST_SEQ" id="DELETE_ST_SEQ" value="'+ data.rows[i].SEQ+'"></td>';
                    tableHtml += '<td>' + data.rows[i].API_INTENT + '</td>';
                    //tableHtml += '<td>' + data.rows[i].API_QUERY + '</td>';
                    tableHtml += '<td class="txt_left tex01"><a href="#" onClick="getUpdateApiDialog(\''+data.rows[i].SEQ+',\''+data.rows[i].API_QUERY+'\',\''+data.rows[i].INTENT+'\'); return false;">' + data.rows[i].API_QUERY + '</a></td>';
                    tableHtml += '<td>' + data.rows[i].REG_ID + '</td>';
                    tableHtml += '<td>' + data.rows[i].REG_DT + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#apiDialogtbody').html(tableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#apiDialogtbody').find('tr').eq(0).children().eq(0).trigger('click');

                $('#apiDialogTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="7" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#apiDialogtbody').html(saveTableHtml);
                $('#apiDialogTablePaging .pagination').html('');
            }

        }
    });
}

function getUpdateApiDialog(seq, api_query, api_intent){
    
    var ori_uttrance = api_query;
    var ori_answer = answer;
    ori_answer = ori_answer.split('\'').join("&#39;");
    var check = ori_answer.indexOf('$');
    var ori_intent = intent;
    var updateAnswerStr = "";

    if(check!= -1){
        var answerSplit = ori_answer.split('$');
        for ( var i=0; i< answerSplit.length; i++ ) {
            updateAnswerStr += "<div style='margin-top:4px;'><input name='update_answerValue' id='update_answerValue' tabindex='" + i + "' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' value='" + answerSplit[i] + "'>";
            updateAnswerStr += '<a href="#" name="update_delAnswerBtn" class="answer_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        }
    }else{
        updateAnswerStr += "<div style='margin-top:4px;'><input name='update_answerValue' id='update_answerValue' tabindex='" + i + "' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' value='" + ori_answer + "'>";
        updateAnswerStr += '<a href="#" name="update_delAnswerBtn" class="answer_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
    }
    $('#ori_utterance').text(ori_uttrance);
    $('#update_seq').val(seq);
    $('.updateAnswerValDiv').html(updateAnswerStr);
    $('.updateAnswerValDiv  input[name=update_answerValue]').eq($('.updateAnswerValDiv  input[name=update_answerValue]').length-1).focus();
    $('select[name=useYn]').val(use_yn).prop("selected", true);
    $('select[name=updateSmallTalkIntent]').val(ori_intent).prop("selected", true);
    if(ori_intent != "smalltalk") {
        $("[name=update_answerValue]").attr("disabled", true); //비활성화
    }
    $('#smallTalkUpdateModal').modal('show');

}

function apiDialogProc(procType) {
    var saveArr = new Array();
    var data = new Object();
    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
    var sQuery = "";

    if(procType=="ADD"){
        $('#API_QUERY').val().replace(/ /g, '');
        sQuery = $('#API_QUERY').val().replace(regExp, "");
        data.statusFlag = procType;
        data.API_QUERY = sQuery;
        data.API_INTENT = $('#API_INTENT').val();
        saveArr.push(data);
    }else if(procType=="DEL"){
        //data.statusFlag = procType;
        
        $("input[name=DELETE_ST_SEQ]:checked").each(function() {
            data = new Object();
            data.statusFlag = procType;
            data.DELETE_ST_SEQ = "";
            var test = $(this).val();
            data.DELETE_ST_SEQ = test;
            
            saveArr.push(data);
        });
    }else if(procType=="UPDATE"){
        data = new Object();
        data.statusFlag = procType;
        data.S_ANSWER = $('#update_s_answer').val();
        data.SEQ = $('#update_seq').val();
        data.USE_YN = $('#useYn').val();
        data.INTENT = $('#updateSmallTalkIntent').val();

        saveArr.push(data);
    }else if(procType=="DELENTITIES"){
        data = new Object();
        data.statusFlag = procType;
        data.SEQ = $('#update_seq').val();

        saveArr.push(data);
        
    }else{

    }
    
 
    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/qna/apiDialogProc',
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
                //alert(language['REGIST_SUCC']);
                $('#proc_content').html(language.REGIST_SUCC);
                $('#footer_button').html('<button type="button" class="btn btn-default" onClick="reloadPage();return false;"><i class="fa fa-times"></i> Close</button>');
                $('#procApiDialog').modal('show');
                //window.location.reload();
            } else {
                //alert(language['It_failed']);
                $('#proc_content').html(language.It_failed);
                $('#footer_button').html('<button type="button" class="btn btn-default" onClick="reloadPage();return false;"><i class="fa fa-times"></i> Close</button>');
                $('#procApiDialog').modal('show');
            }
        }
    });
}
function reloadPage(){
    //window.location.reload();
    $('#procApiDialog').modal('hide');
    $('#apiDialogMngModal').modal('hide');
    $('#smallTalkUpdateModal').modal('hide');
    
    //makeApiDialogTable($('#apiDialogTablePaging .li_paging').val());
    makeApiDialogTable(listPageNo);
    
    //$('#smallTalkUpdateModal .modal-footer').children().eq(0).trigger('click');
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
        $('input[name=DELETE_ST_SEQ]').parent().iCheck('check');
        
    }).on('ifUnchecked', function() {
        $('input[name=DELETE_ST_SEQ]').parent().iCheck('uncheck');
        
    });
}

//모달창 입력값에 따른 save 버튼 활성화 처리
function dialogValidation(type){
    if(type=="NEW"){
        var defineText = $('#API_QUERY').val().trim();
        var defineIntent = $('#API_INTENT').val().trim();
        var valueText = true;
        var result = "false";
        
        

        if(defineText != "" && valueText) {
            result = "success";
        } else {
            if(defineIntent != "" && valueText) {
                result = "success";
            }
        }

        return result;
    }else{ //update
        //var defineText = $('#update_answerValue').val().trim();
        var valueText = true;
        var result = "false";

        $('.updateAnswerValDiv  input[name=update_answerValue]').each(function() {
            if (($(this).val().trim() === "" && $("#updateSmallTalkIntent").val() == "smalltalk") || ($(this).val().trim() === "None" && $("#updateSmallTalkIntent").val() == "smalltalk")) {
                valueText = false;
                return;
            }
        });

        if(valueText) {
            result = "success";
        } else {
            //$('#updateSmallTalk').attr("disabled", "disabled");
            //$('#updateSmallTalk').addClass("disable");
        }
        return result;
    }
}

//엑셀 다운로드
$(document).on('click','#excelDownload',function(){

    searchQuestiontText = $('#searchQuestionHidden').val();
    searchIntentText = $('#searchIntentHidden').val();
    params = {
        'useYn' : $('#smallTalkYn').find('option:selected').val(),
        'searchQuestiontText': searchQuestiontText,
        'searchIntentText': searchIntentText
    };

    $.ajax({
        type: 'POST',
        data: params,
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
        url: '/smallTalkMng/selectSmallTalkListAll',
        success: function (data) {
            if (data.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (status) {
                $('#alertMsg').text(language.ALERT_ERROR);
                $('#alertBtnModal').modal('show');
            } else {
                if (data.rows.length > 0) {

                    var filePath = data.fildPath_;
                    var workbook = new ExcelJS.Workbook();
                     
                    workbook.creator = data.appName;
                    workbook.lastModifiedBy = data.userId;
                    workbook.created = new Date();
                    workbook.modified = new Date();
                    workbook.lastPrinted = new Date();

                    
                    var worksheet = workbook.addWorksheet('Summary Tiame Log');

                    //var count = "100";
                    worksheet.columns = [
                        { header: '단어', key: 'entities'},
                        { header: '질문내용', key: 's_question'},
                        { header: '답변', key: 's_answer'},
                        { header: '사용여부', key: 's_useyn'}
                    ];

                    var firstRow = worksheet.getRow(1);
                    firstRow.font = { bold: true };
                    firstRow.alignment = { vertical: 'middle', horizontal: 'center'};
                    firstRow.height = 20;
                    

                    for (var i = 0; i < data.rows.length; i++) {
                        worksheet.addRow({
                            entities: data.rows[i].ENTITY
                            , s_question: data.rows[i].S_QUERY
                            , s_answer: data.rows[i].S_ANSWER
                            , s_useyn: data.rows[i].USE_YN
                        });
                    }

                    var buff = workbook.xlsx.writeBuffer().then(function (data) {
                        var blob = new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
                        saveAs(blob, filePath);
                    });
                }
            }
        }
    });
});