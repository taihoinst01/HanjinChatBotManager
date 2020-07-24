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

var params = "";
$(document).ready(function() {
    $('#searchDlgBtn').click(function (e) {
        makeSummaryIntentTable();
    });

});


function makeSummaryIntentTable() {
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
        url: '/historyMng/selectSummaryListIntent',
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
                    tableHtml += '<td>' + data.rows[i].날짜 + '</td>';
                    tableHtml += '<td>' + data.rows[i].총무_총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].총무_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].총무_M + '</td>';
                    tableHtml += '<td>' + data.rows[i].인사_총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].인사_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].인사_M + '</td>';
                    tableHtml += '<td>' + data.rows[i].재무_총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].재무_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].재무_M + '</td>';
                    tableHtml += '<td>' + data.rows[i].IT_총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].IT_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].IT_M + '</td>';
                    tableHtml += '<td>' + data.rows[i].법무_총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].법무_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].법무_M + '</td>';
                    tableHtml += '<td>' + data.rows[i].CSV_총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].CSV_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].CSV_M + '</td>';
                    tableHtml += '<td>' + data.rows[i].블로썸파크_총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].블로썸파크_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].블로썸파크_M + '</td>';
                    tableHtml += '<td>' + data.rows[i].총합 + '</td>';
                    tableHtml += '<td>' + data.rows[i].총합_P + '</td>';
                    tableHtml += '<td>' + data.rows[i].총합_M + '</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#summarytbody').html(tableHtml);
                $('#totCnt').text(totCnt);

            } else {
                saveTableHtml = '<tr><td colspan="25" class="text-center">'+language.NO_DATA+'</td></tr>';
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
        url: '/historyMng/selectSummaryListIntent',
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

                    
                    var worksheet = workbook.addWorksheet('Summary Intent Log');

                    //var count = "100";
                    worksheet.columns = [
                        { header: '날짜', key: '날짜'},
                        { header: '총무_총합', key: '총무_총합'},
                        { header: '총무_P', key: '총무_P'},
                        { header: '총무_M', key: '총무_M'},
                        { header: '인사_총합', key: '인사_총합'},
                        { header: '인사_P', key: '인사_P'},
                        { header: '인사_M', key: '인사_M'},
                        { header: '재무_총합', key: '재무_총합'},
                        { header: '재무_P', key: '재무_P'},
                        { header: '재무_M', key: '재무_M'},
                        { header: 'IT_총합', key: 'IT_총합'},
                        { header: 'IT_P', key: 'IT_P'},
                        { header: 'IT_M', key: 'IT_M'},
                        { header: '법무_총합', key: '법무_총합'},
                        { header: '법무_P', key: '법무_P'},
                        { header: '법무_M', key: '법무_M'},
                        { header: 'CSV_총합', key: 'CSV_총합'},
                        { header: 'CSV_P', key: 'CSV_P'},
                        { header: 'CSV_M', key: 'CSV_M'},
                        { header: '블로썸파크_총합', key: '블로썸파크_총합'},
                        { header: '블로썸파크_P', key: '블로썸파크_P'},
                        { header: '블로썸파크_M', key: '블로썸파크_M'},
                        { header: '총합', key: '총합'},
                        { header: '총합_P', key: '총합_P'},
                        { header: '총합_M', key: '총합_M'}
                    ];

                    var firstRow = worksheet.getRow(1);
                    firstRow.font = { bold: true };
                    firstRow.alignment = { vertical: 'middle', horizontal: 'center'};
                    firstRow.height = 20;
                    

                    for (var i = 0; i < data.rows.length; i++) {
                        worksheet.addRow({
                            날짜: data.rows[i].날짜
                            , 총무_총합: data.rows[i].총무_총합
                            , 총무_P: data.rows[i].총무_P
                            , 총무_M: data.rows[i].총무_M
                            , 인사_총합: data.rows[i].인사_총합
                            , 인사_P: data.rows[i].인사_P
                            , 인사_M: data.rows[i].인사_M
                            , 재무_총합: data.rows[i].재무_총합
                            , 재무_P: data.rows[i].재무_P
                            , 재무_M: data.rows[i].재무_M
                            , 재무_총합: data.rows[i].재무_총합
                            , 재무_P: data.rows[i].재무_P
                            , 재무_M: data.rows[i].재무_M
                            , IT_총합: data.rows[i].IT_총합
                            , IT_P: data.rows[i].IT_P
                            , IT_M: data.rows[i].IT_M
                            , 법무_총합: data.rows[i].법무_총합
                            , 법무_P: data.rows[i].법무_P
                            , 법무_M: data.rows[i].법무_M
                            , CSV_총합: data.rows[i].CSV_총합
                            , CSV_P: data.rows[i].CSV_P
                            , CSV_M: data.rows[i].CSV_M
                            , 블로썸파크_총합: data.rows[i].블로썸파크_총합
                            , 블로썸파크_P: data.rows[i].블로썸파크_P
                            , 블로썸파크_M: data.rows[i].블로썸파크_M
                            , 총합: data.rows[i].총합
                            , 총합_P: data.rows[i].총합_P
                            , 총합_M: data.rows[i].총합_M
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