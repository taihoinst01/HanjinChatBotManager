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
        makeSummaryTimeTable();
    });

});


function makeSummaryTimeTable() {
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
        url: '/historyMng/selectSummaryListTime',
        success: function (data) {
            if (data.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }

            if (data.rows) {

                var tableHtml = "";
                var totCnt = data.rows.length;
                
                for (var i = 0; i < data.rows.length; i++) {
                    tableHtml += '<tr>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].SUMMARY_DATE + '</td>';
                    tableHtml += '<td>' + data.rows[i].RESPONSE_SUCCESS + '</td>';
                    tableHtml += '<td>' + data.rows[i].RESPONSE_FAIL + '</td>';
                    tableHtml += '<td>' + data.rows[i].ERROR + '</td>';
                    tableHtml += '<td>' + data.rows[i].SMALLTALK + '</td>';
                    tableHtml += '<td>' + data.rows[i].QNA + '</td>';
                    tableHtml += '<td>' + data.rows[i].QNA_FAIL + '</td>';
                    tableHtml += '<td>' + data.rows[i].SAP_INIT + '</td>';
                    tableHtml += '<td>' + data.rows[i].SUGGEST + '</td>';
                    tableHtml += '<td>' + data.rows[i].BANNEDWORD + '</td>';
                    tableHtml += '<td>' + data.rows[i].TOTAL + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#summarytbody').html(tableHtml);
                $('#totCnt').text(totCnt);

            } else {
                saveTableHtml = '<tr><td colspan="11" class="text-center">'+language.NO_DATA+'</td></tr>';
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
        url: '/historyMng/selectSummaryListTime',
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
                        { header: '일시', key: 'SUMMARY_DATE'},
                        { header: '응답', key: 'RESPONSE_SUCCESS'},
                        { header: '미응답', key: 'RESPONSE_FAIL'},
                        { header: 'ERROR', key: 'ERROR'},
                        { header: 'SMALLTALK', key: 'SMALLTALK'},
                        { header: '용어사전', key: 'QNA'},
                        { header: '용어사전실패', key: 'QNA_FAIL'},
                        { header: 'SAP 초기화', key: 'SAP_INIT'},
                        { header: '건의사항', key: 'SUGGEST'},
                        { header: '비속어', key: 'BANNEDWORD'},
                        { header: '총합', key: 'TOTAL'}
                    ];

                    var firstRow = worksheet.getRow(1);
                    firstRow.font = { bold: true };
                    firstRow.alignment = { vertical: 'middle', horizontal: 'center'};
                    firstRow.height = 20;
                    

                    for (var i = 0; i < data.rows.length; i++) {
                        worksheet.addRow({
                            SUMMARY_DATE: data.rows[i].SUMMARY_DATE
                            , RESPONSE_SUCCESS: data.rows[i].RESPONSE_SUCCESS
                            , RESPONSE_FAIL: data.rows[i].RESPONSE_FAIL
                            , ERROR: data.rows[i].ERROR
                            , SMALLTALK: data.rows[i].SMALLTALK
                            , QNA: data.rows[i].QNA
                            , QNA_FAIL: data.rows[i].QNA_FAIL
                            , SAP_INIT: data.rows[i].SAP_INIT
                            , SUGGEST: data.rows[i].SUGGEST
                            , BANNEDWORD: data.rows[i].BANNEDWORD
                            , TOTAL: data.rows[i].TOTAL
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