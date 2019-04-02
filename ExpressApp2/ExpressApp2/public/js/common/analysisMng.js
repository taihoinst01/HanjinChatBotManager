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
    makeAnalysisTable();    
});

$(document).ready(function() {
    //삭제 버튼 confirm
    $('#deleteAnalysisBtnModal').click(function() {
        var del_count = $("#DELETE_ST_SEQ:checked").length;

        if(del_count > 0){
            $('#proc_content').html(language.SmallTalk_DELETE_CONFIRM);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button><button type="button" class="btn btn-primary" id="deleteAnalysisBtn"><i class="fa fa-edit"></i> '+ language.DELETE +'</button>');
            $('#procAnalysis').modal('show');
        }else{
            $('#proc_content').html(language.SmallTalk_DELETE_COUNT);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procAnalysis').modal('show');
            //alert(language.Analysis_CANCEL_COUNT);
        }
    });

    //삭제 버튼
    $(document).on("click", "#deleteAnalysisBtn", function () {
        //cancelanalysisProc('DEL');
        analysisProc('DEL');
    });

    //nonedlg 버튼 confirm
    $('#noneDlgisBtnModal').click(function() {
        var none_count = $("#DELETE_ST_SEQ:checked").length;

        if(none_count > 0){
            $('#proc_content').html("NONE 처리를 진행하시겠습니까?");
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button><button type="button" class="btn btn-primary" id="noneDlgAnalysisBtn"><i class="fa fa-edit"></i> None DLG 처리</button>');
            $('#procAnalysis').modal('show');
        }else{
            $('#proc_content').html("처리대상은 최소 한개 이상이어야 합니다.");
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> '+ language.CLOSE +'</button>');
            $('#procAnalysis').modal('show');
            //alert(language.Analysis_CANCEL_COUNT);
        }
    });

    //nonedlg 버튼
    $(document).on("click", "#noneDlgAnalysisBtn", function () {
        //cancelanalysisProc('DEL');
        analysisProc('NONE');
    });


    $('#searchDlgBtn').click(function (e) {
        $('#searchIntentHidden').val($('#searchIntent').val().trim());
        $('#searchQuestionHidden').val($('#searchQuestion').val().trim());
        makeAnalysisTable(1);
    });

    $('input[name=searchQuestion]').keypress(function (e) {
        if (e.keyCode == 13) {
            var searchQuestion = $('#searchQuestionHidden').val().trim();
            if (searchQuestion != $('#searchQuestion').val().trim()) {
                $('#searchDlgBtn').trigger('click');
            }
        }
    });

    $('input[name=searchIntent]').keypress(function (e) {
        if (e.keyCode == 13) {
            var searchIntent = $('#searchIntentHidden').val().trim();
            if (searchIntent != $('#searchIntent').val().trim()) {
                $('#searchDlgBtn').trigger('click');
            }
        }
    });

});


$(document).on('click', '#analysisTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeAnalysisTable($(this).val());
    }
});

var searchQuestiontText = ""; //페이징시 필요한 검색어 담아두는 변수
var searchIntentText = ""; //페이징시 필요한 검색어 담아두는 변수
var searchSelectRel = ""; //페이징시 필요한 검색어 담아두는 변수
var listPageNo = "";
function makeAnalysisTable(page) {
    if (page) {
        //$('#currentPage').val(1);
        searchQuestiontText = $('#searchQuestionHidden').val();
        searchIntentText = $('#searchIntentHidden').val();
        searchSelectRel = $('#selResult').val();
    }
    params = {
        'currentPage': ($('#currentPage').val() == '') ? 1 : page,
        'searchQuestiontText': searchQuestiontText,
        'searchIntentText': searchIntentText,
        'searchSelectRel': searchSelectRel
    };
    listPageNo = ($('#currentPage').val() == '') ? 1 : page;
    $.ajax({
        type: 'POST',
        data: params,
        url: '/historyMng/selectAnalysisList',
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
                    tableHtml += '<td class="txt_left tex01">' + data.rows[i].QUERY + '</td>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].LUIS_INTENT + '</td>';
                    tableHtml += '<td>' + data.rows[i].RESULT + '</td>';
                    tableHtml += '<td>' + data.rows[i].UPD_DT + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#analysistbody').html(tableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#analysistbody').find('tr').eq(0).children().eq(0).trigger('click');

                $('#analysisTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="6" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#analysistbody').html(saveTableHtml);
                $('#analysisTablePaging .pagination').html('');
            }

        }
    });
}

function analysisProc(procType) {
    var saveArr = new Array();
    var data = new Object();
    var sQuery = "";

    if(procType=="DEL"){

        $("input[name=DELETE_ST_SEQ]:checked").each(function() {
            data = new Object();
            data.statusFlag = procType;
            data.DELETE_ST_SEQ = "";
            var test = $(this).val();
            data.DELETE_ST_SEQ = test;
            
            saveArr.push(data);
        });   
    }else if(procType=="NONE"){

        $("input[name=DELETE_ST_SEQ]:checked").each(function() {
            data = new Object();
            data.statusFlag = procType;
            data.DELETE_ST_SEQ = "";
            var test = $(this).val();
            data.DELETE_ST_SEQ = test;
            
            saveArr.push(data);
        });
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
        url: '/historyMng/analysisProc',
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
                $('#procAnalysis').modal('show');
                //window.location.reload();
            } else {
                //alert(language['It_failed']);
                $('#proc_content').html(language.It_failed);
                $('#footer_button').html('<button type="button" class="btn btn-default" onClick="reloadPage();return false;"><i class="fa fa-times"></i> Close</button>');
                $('#procAnalysis').modal('show');
            }
        }
    });
}
function reloadPage(){
    $('#procAnalysis').modal('hide');
   
    makeAnalysisTable(listPageNo);
    
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