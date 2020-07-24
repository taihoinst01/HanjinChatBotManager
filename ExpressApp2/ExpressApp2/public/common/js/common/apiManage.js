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

var searchDate = "";
var pcMobile = "";
var params = "";

$(document).ready(function() {
    makeUploadTable();
    selectAllApiUrlIntent();

    //검색 버튼 클릭시 이벤트
    $('#searchApiUrlBtn').click(function (e) {
        $('#searchApiUrlNameHidden').val($('#searchApiName').val().trim());
        $('#searchApiUrlIntentHidden').val($('#searchApiUrlIntent').val().trim());
        makeUploadTable(1);
    });

    //삭제 버튼 클릭 시 이벤트
    $('#deleteApiUrlBtnModal').click(function() {
        var del_count = $("#DELETE_SID:checked").length;

        if(del_count > 0){
            $('#proc_content').html(language.ApiUrl_DELETE_CONFIRM);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button><button type="button" class="btn btn-primary" id="deleteApiUrlBtn"><i class="fa fa-edit"></i> '+ language.DELETE +'</button>');
            $('#procApiUrl').modal('show');
        }else{
            $('#proc_content').html(language.ApiUrl_DELETE_COUNT);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procApiUrl').modal('show');
            //alert(language.Analysis_CANCEL_COUNT);
        }
    });
    //삭제 modal창에서 삭제 버튼 클릭 시 이벤트
    $(document).on("click", "#deleteApiUrlBtn", function () {
        apiUrlProc('DEL');
    });

    //등록 버튼 클릭 시 이벤트
    $('#createApiUrlBtn').click(function (e) {
        $("#apiUrlForm")[0].reset();
        $('#apiUrlModal').modal('show');
    });
    //등록 modal창에서 저장 버튼 클릭 시 이벤트
    $('#addApiUrl').click(function() {
        var validation_result = dialogValidation("NEW");
        if(validation_result=="success"){
            makeApiUrlData("NEW");
            apiUrlProc('ADD');
        }else{
            $('#proc_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procApiUrl').modal('show');
        }
    });

    //수정 modal창에서 수정 버튼 클릭 시 이벤트
    $('#updateApiUrlBtn').click(function() {

        var validation_result = dialogValidation("UPDATE");
        if(validation_result=="success"){
            //makeApiUrlData("UPDATE");
            apiUrlProc('UPDATE');
        }else{
            $('#proc_content').html(language.IS_REQUIRED);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procApiUrl').modal('show');
        }
    });
});

//api URL 리스트 출력
var searchApiUrlName = ""; //페이징시 필요한 검색어(NAME) 담아두는 변수
var searchApiUrlIntent = ""; //페이징시 필요한 검색어(INTENT) 담아두는 변수
var listPageNo = "";
function makeUploadTable(page) {
    if (page) {
        //$('#currentPage').val(1);
        searchApiUrlName = $('#searchApiUrlNameHidden').val();
        if($('#searchApiUrlIntentHidden').val() == 'ALL'){
            searchApiUrlIntent = "";
        }else{
            searchApiUrlIntent = $('#searchApiUrlIntentHidden').val();
        }
    }
    params = {
        'currentPage': ($('#currentPage').val() == '') ? 1 : page,
        'searchApiUrlName': searchApiUrlName,
        'searchApiUrlIntent': searchApiUrlIntent,
    };
    console.log(params);
    listPageNo = ($('#currentPage').val() == '') ? 1 : page;
    $.ajax({
        type: 'POST',
        data: params,
        url: '/apiManage/selectApiUrlList',
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
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="DELETE_SID" id="DELETE_SID" value="'+ data.rows[i].SID+'"></td>';
                    tableHtml += '<td class="txt_left tex01"><a onClick="getUpdateApiUrl('+data.rows[i].NUM+','+data.rows[i].SID+',\''+data.rows[i].API_NAME+'\',\''+data.rows[i].API_INTENT+'\',\''+data.rows[i].API_URL+'\',\''+data.rows[i].API_KORNAME+'\'); return false;">' + data.rows[i].API_NAME + '</a></td>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].API_KORNAME + '</td>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].API_INTENT + '</td>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].API_URL + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#apiUrlBody').html(tableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#apiUrlBody').find('tr').eq(0).children().eq(0).trigger('click');

                $('#apiUrlTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="6" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#apiUrlBody').html(saveTableHtml);
                $('#apiUrlTablePaging .pagination').html('');
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
        $('input[name=DELETE_SID]').parent().iCheck('check');
        
    }).on('ifUnchecked', function() {
        $('input[name=DELETE_SID]').parent().iCheck('uncheck');
        
    });
}

//api URL Intent 전체목록 가져오기
function selectAllApiUrlIntent(){
    params = {
        'data' : 1
    };
    $.ajax({
        type: 'POST',
        data: params,
        url: '/apiManage/selectAllApiUrlIntent',
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
                var searchApiUrlIntent = document.getElementById("searchApiUrlIntent");
                var insertApiUrlIntent = document.getElementById("insertApiUrlIntent");
                var updateApiUrlIntent = document.getElementById("ori_apiIntent");

                for (i = 0; i < data.rows.length; i++){
                    //api URL 등록시
                    var insertAllIntentOption = document.createElement("option");        
                    insertAllIntentOption.text = data.rows[i].INTENT;
                    insertAllIntentOption.value = data.rows[i].INTENT;                    
                    insertApiUrlIntent.options.add(insertAllIntentOption);

                    //api URL 검색시
                    var selectAllIntentOption = document.createElement("option");        
                    selectAllIntentOption.text = data.rows[i].INTENT;
                    selectAllIntentOption.value = data.rows[i].INTENT;                    
                    searchApiUrlIntent.options.add(selectAllIntentOption);

                    //api URL 수정시
                    var updateAllIntentOption = document.createElement("option");        
                    updateAllIntentOption.text = data.rows[i].INTENT;
                    updateAllIntentOption.value = data.rows[i].INTENT;                    
                    updateApiUrlIntent.options.add(updateAllIntentOption);

                }
            } else {

            }
        }
    });
}

//등록,삭제 이벤트
function apiUrlProc(procType) {
    var saveArr = new Array();
    var data = new Object();
    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
    var sQuery = "";
    var api_korName ="";

    if (procType=="DEL"){
        $("input[name=DELETE_SID]:checked").each(function() {
            data = new Object();
            data.statusFlag = procType;
            data.DELETE_SID = "";
            var selectApiSid = $(this).val();
            data.DELETE_SID = selectApiSid;
            
            saveArr.push(data);
        });   
    } else if(procType=="ADD"){
        $('#api_name').val().replace(/ /g, '');
        sQuery = $('#api_name').val().replace(regExp, "");
        api_korName = $('#api_korName').val().replace(regExp, "");
        data.statusFlag = procType;
        data.NAME = sQuery;
        data.API_KORNAME = api_korName;
        data.INTENT = $('#insertApiUrlIntent').val();
        data.URL = $('#api_url').val();
        saveArr.push(data);
    } else if(procType=="UPDATE"){
        data = new Object();
        data.statusFlag = procType;
        data.SID = $('#ori_apiSid').val();
        data.NAME = $('#ori_apiName').val();
        data.API_KORNAME = $('#ori_apiKorName').val();
        data.INTENT = $('#ori_apiIntent').val();
        data.URL = $('#ori_apiUrl').val();

        saveArr.push(data);
    } else{

    }
 
    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/apiManage/apiUrlProc',
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
                $('#procApiUrl').modal('show');
            } else {
                //alert(language['It_failed']);
                $('#proc_content').html(language.It_failed);
                $('#footer_button').html('<button type="button" class="btn btn-default" onClick="reloadPage();return false;"><i class="fa fa-times"></i> Close</button>');
                $('#procApiUrl').modal('show');
            }
        }
    });
}
function reloadPage(){
    $('#procApiUrl').modal('hide');
    $('#apiUrlModal').modal('hide');
    $('#apiUrlUpdateModal').modal('hide');

    makeUploadTable(listPageNo);
}

//모달창 입력값에 따른 save 버튼 활성화 처리
function dialogValidation(type){
    if(type=="NEW"){
        var apiNameText = $('#api_name').val().trim();
        var apiKorNameText = $('#api_korName').val().trim();
        var apiUrlText = $('#apiUrlValue').val().trim();
        var valueText = true;
        var result = "false";

        if(apiNameText != "" && apiKorNameText != "" && apiUrlText != "" && valueText) {
            //$('#addSmallTalk').removeClass("disable");
            //$('#addSmallTalk').attr("disabled", false);
            result = "success";
        } else {
            //$('#addSmallTalk').attr("disabled", "disabled");
            //$('#addSmallTalk').addClass("disable");
        }

        return result;
    }else{ //type=="UPDATE" 
        var valueText = true;
        var result = "false";

        //수정 모달창에서 name값이 미입력일 경우
        $('#ori_apiName').each(function() {
            if ($(this).val().trim() === "") {
                valueText = false;
                return;
            }
        });

        //수정 모달창에서 korName값이 미입력일 경우
        $('#ori_apiKorName').each(function() {
            if ($(this).val().trim() === "") {
                valueText = false;
                return;
            }
        });

        //수정 모달창에서 url값이 미입력일 경우
        $('#ori_apiUrl').each(function() {
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

//API URL 등록, 수정 관련 이벤트
function makeApiUrlData(type){
    var apiUrlData = "";
    if(type=="NEW"){
        $('.apiUrlValDiv  input[name=apiUrlValue]').each(function() {
            apiUrlData = apiUrlData + $(this).val() + "$";
        });
        apiUrlData = apiUrlData.slice(0, -1);
        $('#api_url').val(apiUrlData);
    }else{//update
        // $('.updateApiUrlValDiv  input[name=update_answerValue]').each(function() {
        //     apiUrlData = apiUrlData + $(this).val() + "$";
        // });
        // apiUrlData = apiUrlData.slice(0, -1);
        // $('#update_s_answer').val(apiUrlData);
    }
}

//api name 클릭시 발생되는 수정 모달창 이벤트
function getUpdateApiUrl(apiNum, apiSid, apiName, apiIntent, apiUrl, apiKorName){
    
    var ori_apiNum = apiNum;
    var ori_apiSid = apiSid;
    var ori_apiName = apiName;
    var ori_apiIntent = apiIntent;
    var ori_apiUrl = apiUrl;
    var ori_apiKorName = apiKorName;

    $('#ori_apiName').val(ori_apiName);
    $('#ori_apiSid').val(ori_apiSid);
    $('select[name=ori_apiIntent]').val(ori_apiIntent).prop("selected", true);
    $('#ori_apiUrl').val(ori_apiUrl);
    $('#ori_apiKorName').val(ori_apiKorName);

    $('#apiUrlUpdateModal').modal('show');
}

//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#apiUrlTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeUploadTable($(this).val());
    }
});