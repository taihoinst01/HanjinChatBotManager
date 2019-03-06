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
    $('#searchDlgBtn').click(function (e) {
        makeSummaryIntentDateTable();
    });

});


function makeSummaryIntentDateTable() {
    searchDate = $('#searchDate').val();
    pcMobile = $('#pcMobile').val();

    var paramsCheck = 1;
    if(searchDate==""){
        paramsCheck = 0;
    }

    if(paramsCheck==0){
        alert("검색조건 중 일자는 필수조건입니다");
        return false;
    }

    params = {
        'searchDate': searchDate,
        'pcMobile': pcMobile,
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/historyMng/selectSummaryListIntentDate',
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
                    tableHtml += '<td class="txt_left">' + data.rows[i].reg_date + '</td>';
                    tableHtml += '<td>' + data.rows[i].LUIS_INTENT + '</td>';
                    tableHtml += '<td>' + data.rows[i].COUNT + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#summarytbody').html(tableHtml);
                $('#totCnt').text(totCnt);

            } else {
                saveTableHtml = '<tr><td colspan="3" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#summarytbody').html(saveTableHtml);
            }

        }
    });
}

//엑셀 다운로드
$(document).on('click','#excelDownload',function(){

    searchDate = $('#searchDate').val();
    
    var paramsCheck = 1;
    if(searchDate==""){
        paramsCheck = 0;
    }

    if(paramsCheck==0){
        alert("검색조건 중 일자는 필수조건입니다");
        return false;
    }

    params = {
        'searchDate': searchDate,
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
        url: '/historyMng/selectSummaryListIntentDate',
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

                    
                    var worksheet = workbook.addWorksheet('Summary Intent Date Log');

                    //var count = "100";
                    worksheet.columns = [
                        { header: 'reg_date', key: 'reg_date'},
                        { header: 'LUIS_INTENT', key: 'LUIS_INTENT'},
                        { header: 'COUNT', key: 'COUNT'}
                    ];

                    var firstRow = worksheet.getRow(1);
                    firstRow.font = { bold: true };
                    firstRow.alignment = { vertical: 'middle', horizontal: 'center'};
                    firstRow.height = 20;
                    

                    for (var i = 0; i < data.rows.length; i++) {
                        worksheet.addRow({
                            reg_date: data.rows[i].reg_date
                            , LUIS_INTENT: data.rows[i].LUIS_INTENT
                            , COUNT: data.rows[i].COUNT
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