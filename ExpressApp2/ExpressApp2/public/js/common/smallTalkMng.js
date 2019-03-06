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
    makeSmallTalkTable();    
});

$(document).ready(function() {
    //삭제 버튼 confirm
    $('#deleteSmallTalkBtnModal').click(function() {
        var del_count = $("#DELETE_ST_SEQ:checked").length;

        if(del_count > 0){
            $('#proc_content').html(language.SmallTalk_DELETE_CONFIRM);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button><button type="button" class="btn btn-primary" id="deleteSmallTalkBtn"><i class="fa fa-edit"></i> '+ language.SmallTalk_Delete +'</button>');
            $('#procSmallTalk').modal('show');
        }else{
            $('#proc_content').html(language.SmallTalk_DELETE_COUNT);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procSmallTalk').modal('show');
            //alert(language.SmallTalk_CANCEL_COUNT);
        }
    });

    //삭제 버튼
    $(document).on("click", "#deleteSmallTalkBtn", function () {
        //cancelSmallTalkProc('DEL');
        smallTalkProc('DEL');
    });

    $('#addSmallTalk').click(function() {
        var validation_result = dialogValidation("NEW");
        if(validation_result=="success"){
            makeAnswerData("NEW");
            smallTalkProc('ADD');
        }else{
            $('#proc_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procSmallTalk').modal('show');
        }
    });

    //삭제 버튼
    $(document).on("click", "#deleteEntities", function () {
        //cancelSmallTalkProc('DEL');
        smallTalkProc('DELENTITIES');
    });

    $('#updateSmallTalk').click(function() {
        
        var validation_result = dialogValidation("UPDATE");
        if(validation_result=="success"){
            makeAnswerData("UPDATE");
            smallTalkProc('UPDATE');
        }else{
            $('#proc_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procSmallTalk').modal('show');
        }
    });

    $('#searchDlgBtn').click(function (e) {
        $('#searchIntentHidden').val($('#searchIntent').val().trim());
        $('#searchQuestionHidden').val($('#searchQuestion').val().trim());
        makeSmallTalkTable(1);
    });

    $('#createSmallTalkBtn').click(function (e) {
        $("#smallTalkForm")[0].reset();
        //window.location.reload();
        $('#smallTalkMngModal').modal('show');
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
            getEntityFromQ(queryText);
            
            $("input[name=s_query]").attr("readonly", false);
        }
    });

    $('.addDialogCancel').click(function(){
        $('#smallTalkForm')[0].reset();
        var inputAnsweryStr = "<div style='margin-top:4px;'><input name='answerValue'  tabindex='1' id='answerValue' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "'>";
        inputAnsweryStr += '<a href="#" name="delAnswerBtn" class="answer_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        $('.answerValDiv').html(inputAnsweryStr);

        $('input[name="s_query"').attr("disabled", false);
        $('#squeryEntity').html("Question Entity");
        $('#s_entity').val();
        $('input[name="s_query"').val("");
    });
});

$(document).on("click", "a[name=delAnswerBtn]", function(e){
    if ($('.answerValDiv  input[name=answerValue]').length < 2) {
        
        $('#proc_content').html(language.SmallTalk_ONE_ITEM);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
        $('#procSmallTalk').modal('show');
        $('.answerValDiv  input[name=answerValue]').eq($('.answerValDiv  input[name=answerValue]').length-1).focus();
        return false;
    } else {
        $(this).parent().remove();
        $('.answerValDiv  input[name=answerValue]').eq($('.answerValDiv  input[name=answerValue]').length-1).focus();
        //dialogValidation('NEW');
        return false;
    }
});

$(document).on("click", "a[name=update_delAnswerBtn]", function(e){
    if ($('.updateAnswerValDiv  input[name=update_answerValue]').length < 2) {
        //alert('1개 이상 입력해야 합니다.');
        $('#proc_content').html(language.SmallTalk_ONE_ITEM);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
        $('#procSmallTalk').modal('show');
        $('.updateAnswerValDiv  input[name=update_answerValue]').eq($('.updateAnswerValDiv  input[name=update_answerValue]').length-1).focus();
        return false;
    } else {
        $(this).parent().remove();
        $('.updateAnswerValDiv  input[name=update_answerValue]').eq($('.updateAnswerValDiv  input[name=update_answerValue]').length-1).focus();
        //dialogValidation('UPDATE');
        return false;
    }
});

//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#smallTalkTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeSmallTalkTable($(this).val());
    }
});

var searchQuestiontText = ""; //페이징시 필요한 검색어 담아두는 변수
var searchIntentText = ""; //페이징시 필요한 검색어 담아두는 변수
var listPageNo = "";
function makeSmallTalkTable(page) {
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
        url: '/smallTalkMng/selectSmallTalkList',
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
                var answerText = "";
                for (var i = 0; i < data.rows.length; i++) {
                    answerText = data.rows[i].S_ANSWER;
                    answerText = answerText.split("$").join("</br>");
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="DELETE_ST_SEQ" id="DELETE_ST_SEQ" value="'+ data.rows[i].SEQ+'"></td>';
                    tableHtml += '<td>' + data.rows[i].ENTITY + '</td>';
                    
                    
                    var s_qry = data.rows[i].S_QUERY.split('"').join("\"");
                    var s_answer = data.rows[i].S_ANSWER.split('"').join("&quot;");
                    
                    s_answer = s_answer.split('&#39;').join("\\&#39;");
                    
                    tableHtml += '<td class="txt_left tex01"><a href="#" onClick="getUpdateSmallTalk(\''+s_qry+'\',\''+s_answer+'\','+data.rows[i].SEQ+',\''+data.rows[i].USE_YN+'\'); return false;">' + data.rows[i].S_QUERY + '</a></td>';
                    tableHtml += '<td class="txt_left">' + answerText + '</td>';
                    tableHtml += '<td>' + data.rows[i].USE_YN + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#smallTalktbody').html(tableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#smallTalktbody').find('tr').eq(0).children().eq(0).trigger('click');

                $('#smallTalkTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="5" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#smallTalktbody').html(saveTableHtml);
                $('#smallTalkTablePaging .pagination').html('');
            }

        }
    });
}

$(document).on("click", "#addAnswerValBtn", function(e){
    var answerLength = $('.answerValDiv  input[name=answerValue]').length+1;
    var inputAnswerStr = "";
    if(answerLength > 3){
        //$('#addAnswerValBtn').attr("disabled", "disabled");
        //$('#addAnswerValBtn').addClass("disable");
    }else{
        inputAnswerStr = "<div style='margin-top:4px;'><input name='answerValue' id='answerValue' tabindex='" + answerLength + "' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "'>";
        inputAnswerStr += '<a href="#" name="delAnswerBtn" class="answer_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        $('.answerValDiv').append(inputAnswerStr);
        $('.answerValDiv  input[name=answerValue]').eq($('.answerValDiv  input[name=answerValue]').length-1).focus();
        //dialogValidation('NEW');
    }
});

$(document).on("click", "#update_addAnswerValBtn", function(e){
    var update_answerLength = $('.updateAnswerValDiv  input[name=update_answerValue]').length;
    var updateAnswerStr = "";
    if(update_answerLength > 2){
        //$('#update_addAnswerValBtn').attr("disabled", "disabled");
        //$('#update_addAnswerValBtn').addClass("disable");
    }else{
        updateAnswerStr = "<div style='margin-top:4px;'><input name='update_answerValue' id='update_answerValue' tabindex='" + update_answerLength + "' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "'>";
        updateAnswerStr += '<a href="#" name="update_delAnswerBtn" class="answer_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        $('.updateAnswerValDiv').append(updateAnswerStr);
        $('.updateAnswerValDiv  input[name=update_answerValue]').eq($('.updateAnswerValDiv  input[name=update_answerValue]').length-1).focus();
        //dialogValidation('UPDATE');
    }
});

function makeAnswerData(type){
    var answerData = "";
    if(type=="NEW"){
        $('.answerValDiv  input[name=answerValue]').each(function() {
            answerData = answerData + $(this).val() + "$";
        });
        answerData = answerData.slice(0, -1);
        $('#s_answer').val(answerData);
    }else{//update
        $('.updateAnswerValDiv  input[name=update_answerValue]').each(function() {
            answerData = answerData + $(this).val() + "$";
        });
        answerData = answerData.slice(0, -1);
        $('#update_s_answer').val(answerData);
    }
}

function getUpdateSmallTalk(utterance, answer, seq, use_yn){
    
    var ori_uttrance = utterance;
    var ori_answer = answer;
    ori_answer = ori_answer.split('\'').join("&#39;");
    var check = ori_answer.indexOf('$');
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

    $('#smallTalkUpdateModal').modal('show');

}

function smallTalkProc(procType) {
    var saveArr = new Array();
    var data = new Object();
    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
    var sQuery = "";

    if(procType=="ADD"){
        $('#s_query').val().replace(/ /g, '');
        sQuery = $('#s_query').val().replace(regExp, "");
        data.statusFlag = procType;
        data.S_QUERY = sQuery;
        data.INTENT = "smalltalk";
        data.S_ANSWER = $('#s_answer').val();
        data.ENTITY = $('#s_entity').val();
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
        url: '/smallTalkMng/smallTalkProc',
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
                $('#procSmallTalk').modal('show');
                //window.location.reload();
            } else {
                //alert(language['It_failed']);
                $('#proc_content').html(language.It_failed);
                $('#footer_button').html('<button type="button" class="btn btn-default" onClick="reloadPage();return false;"><i class="fa fa-times"></i> Close</button>');
                $('#procSmallTalk').modal('show');
            }
        }
    });
}
function reloadPage(){
    //window.location.reload();
    $('#procSmallTalk').modal('hide');
    $('#smallTalkMngModal').modal('hide');
    $('#smallTalkUpdateModal').modal('hide');
    
    //makeSmallTalkTable($('#smallTalkTablePaging .li_paging').val());
    makeSmallTalkTable(listPageNo);
    
    //$('#smallTalkUpdateModal .modal-footer').children().eq(0).trigger('click');
}

function getEntityFromQ(queryText) {
    
    $.ajax({
        url: '/smallTalkMng/getEntityAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'iptUtterance': queryText },

        success: function (result) {          //성공했을 때 함수 인자 값으로 결과 값 나옴
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            var entities = result['entities'];
            //for (var k = 0; k < queryTextArr.length; k++) {
                if (entities[0] != null) {
                    entities[0] = entities[0].split(",");
                } else {
                    entities[0] = [];
                }

                if (result['result'] == true) {
                    var utter = utterHighlight(result.commonEntities[0], queryText);

                    $('input[name="s_query"').val(queryText);
                    $('input[name="s_query"').attr("disabled", true);
                    var inputUttrHtml = '';
                    inputUttrHtml += '<table><tr>';
                    inputUttrHtml += '<td class="txt_left clickUtter">' + utter + '</td>';
                    inputUttrHtml += '<td><a href="#"><span class="fa  fa-trash utterDelete" onclick="return false;"><span class="hc">삭제</span></span></a></td>';
                    inputUttrHtml += '</tr></table>';

                    $('#squeryEntity').html(inputUttrHtml);
                }
            //}
        } //function끝

    }); // ------      ajax 끝-----------------
}

function utterHighlight(entities, utter) {
    var result = utter;
    var entity_data = "";
    var entity_comm = ",";
    if (entities) {
        for (var i = 0; i < entities.length; i++) {
            result = result.replace(entities[i].ENTITY_VALUE, '<span class="highlight">' + entities[i].ENTITY_VALUE + '</span>');
            
            if(i < entities.length){
                
            }else{
                entity_comm = "";
            }
            entity_data = entity_data + entities[i].ENTITY_VALUE + entity_comm;
        }
        entity_data = entity_data.slice(0, -1);
    }
    $('#s_entity').val(entity_data);
    return result;
}

// Utterance 삭제
$(document).on('click', '.utterDelete', function () {

    $('input[name="s_query"').attr("disabled", false);
    $('#squeryEntity').html("Question Entity");
    $('#s_entity').val();
    $('input[name="s_query"').val("");

});

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
        var defineText = $('#s_query').val().trim();
        var valueText = true;
        var result = "false";
        
        $('.answerValDiv  input[name=answerValue]').each(function() {
            if ($(this).val().trim() === "") {
                valueText = false;
                return;
            }
        });

        if(defineText != "" && valueText) {
            //$('#addSmallTalk').removeClass("disable");
            //$('#addSmallTalk').attr("disabled", false);
            result = "success";
        } else {
            //$('#addSmallTalk').attr("disabled", "disabled");
            //$('#addSmallTalk').addClass("disable");
        }

        return result;
    }else{ //update
        //var defineText = $('#update_answerValue').val().trim();
        var valueText = true;
        var result = "false";

        $('.updateAnswerValDiv  input[name=update_answerValue]').each(function() {
            if ($(this).val().trim() === "") {
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