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

var startDate = "";
var startTime = "";
var endDate = "";
var endTime = "";
var params = "";
$(document).ready(function() {
    $('#searchDlgBtn').click(function (e) {
        makeSummaryTable();
    });

});


function makeSummaryTable() {
    startDate = $('#startDate').val();
    startTime = $('#startTime').val();
    endDate = $('#endDate').val();
    endTime = $('#endTime').val();

    var paramsCheck = 1;
    if(startDate==""||startTime==""){
        paramsCheck = 0;
    }

    if(endDate==""||endTime==""){
        paramsCheck = 0;
    }

    if(paramsCheck==0){
        alert("모든 검색조건은 필수사항입니다.");
        return false;
    }

    params = {
        'startDate': startDate,
        'startTime': startTime,
        'endDate': endDate,
        'endTime': endTime,
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/historyMng/selectSummaryList',
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
                var totCnt = data.rows.length;
                
                for (var i = 0; i < data.rows.length; i++) {
                    tableHtml += '<tr>';
                    tableHtml += '<td class="txt_left tex01">' + data.rows[i].CUSTOMER_COMMENT_KR + '</td>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].CHATBOT_COMMENT_CODE + '</td>';
                    tableHtml += '<td>' + data.rows[i].USER_ID + '</td>';
                    tableHtml += '<td>' + data.rows[i].RESULT + '</td>';
                    tableHtml += '<td>' + data.rows[i].REG_DATE_TIME + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#summarytbody').html(tableHtml);
                $('#totCnt').text(totCnt);

            } else {
                saveTableHtml = '<tr><td colspan="5" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#summarytbody').html(saveTableHtml);
            }

        }
    });
}

//엑셀 다운로드
$(document).on('click','#excelDownload',function(){

    startDate = $('#startDate').val();
    startTime = $('#startTime').val();
    endDate = $('#endDate').val();
    endTime = $('#endTime').val();

    var paramsCheck = 1;
    if(startDate==""||startTime==""){
        paramsCheck = 0;
    }

    if(endDate==""||endTime==""){
        paramsCheck = 0;
    }

    if(paramsCheck==0){
        alert("모든 검색조건은 필수사항입니다.");
        return false;
    }

    params = {
        'startDate': startDate,
        'startTime': startTime,
        'endDate': endDate,
        'endTime': endTime,
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
        url: '/historyMng/selectSummaryList',
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

                    
                    var worksheet = workbook.addWorksheet('Summary Log');

                    //var count = "100";
                    worksheet.columns = [
                        { header: 'Customner Comment', key: 'comment', width: 100},
                        { header: 'LUIS Intent', key: 'intent', width: 30},
                        { header: 'User ID', key: 'user', width: 20},
                        { header: 'Result', key: 'result', width: 20}
                    ];

                    var firstRow = worksheet.getRow(1);
                    firstRow.font = { name: 'New Times Roman', family: 4, size: 10, bold: true, color: {argb:'80EF1C1C'} };
                    firstRow.alignment = { vertical: 'middle', horizontal: 'center'};
                    firstRow.height = 20;
                    

                    for (var i = 0; i < data.rows.length; i++) {
                        worksheet.addRow({
                            comment: data.rows[i].CUSTOMER_COMMENT_KR
                            , intent: data.rows[i].CHATBOT_COMMENT_CODE
                            , user: data.rows[i].USER_ID
                            , result: data.rows[i].RESULT
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