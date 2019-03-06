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
    dataPick();

    makeHistoryTable(1);    
});
//엑셀 다운로드
$(document).on('click','#excelDownload',function(){

    var saveTableHtml = "";
    var param = getFilterVal();
    if (param == false) {
        alert('날짜 형식을 확인해주세요.');
        return false;
    } 

    $.ajax({
        type: 'POST',
        data: param,
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
        url: '/historyMng/selectHistoryListAll',
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

                    
                    var worksheet = workbook.addWorksheet('History Log');

                    //var count = "100";
                    worksheet.columns = [
                        { header: '번호', key: 'num', width: 7, style: {numFmt: "0000"}},
                        { header: '질문 내용', key: 'question', width: 40, style: {alignment: {wrapText: true} }},
                        { header: '중복 갯수', key: 'overlapCount', width: 14},
                        { header: '사용자ID', key: 'user', width: 20},
                        { header: 'Device유형', key: 'mobilePc', width: 20},
                        { header: '답변 시간', key: 'resultTime', width: 10 },
                        { header: '날짜', key: 'date', width: 25 },
                        { header: '의도', key: 'intent', width: 25, style: {alignment: {wrapText: true} } },
                        { header: '단어', key: 'text', width: 25, style: {alignment: {wrapText: true} } },
                        { header: '답변 아이디', key: 'id', width: 15 }
                    ];

                    var firstRow = worksheet.getRow(1);
                    firstRow.font = { name: 'New Times Roman', family: 4, size: 10, bold: true, color: {argb:'80EF1C1C'} };
                    firstRow.alignment = { vertical: 'middle', horizontal: 'center'};
                    firstRow.height = 20;
                    worksheet.autoFilter = {
                        from: 'C1',
                        to: 'I1'
                    }

                    for (var i = 0; i < data.rows.length; i++) {
                        worksheet.addRow({
                            num: data.rows[i].NUM
                            , question: data.rows[i].CUSTOMER_COMMENT_KR
                            , overlapCount: data.rows[i].SAME_CNT
                            , user: data.rows[i].USER_ID
                            , mobilePc: data.rows[i].MOBILE_YN
                            , resultTime: data.rows[i].RESPONSE_TIME
                            , date: data.rows[i].REG_DATE
                            , intent: data.rows[i].LUIS_INTENT
                            , text: data.rows[i].LUIS_ENTITIES
                            , id: data.rows[i].DLG_ID
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

$(document).ready(function() {

    $('#searchDlgBtn').click(function() {
        var searchInputStr = $('#searchQuestion').val().trim();
        $('#searchStr').val(searchInputStr);
        makeHistoryTable(1);
    });
});

$(document).on('click', '#historyTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        var currPage = $(this).val();
        makeHistoryTable(currPage);
    }
});

$(document).on("change", "#selDate", function () {
    if ($(this).val() == 'select') {
        $('#datePickerDiv').show(200);//.stop().animate({ 'display': 'block'}, 500);
    } else {
        $('#datePickerDiv').hide(200);//.stop().animate({ 'display': 'none'}, 500);
    }
});

function getFilterVal(page) {

    var searchQuestion = $('#searchStr').val();
    var searchUserId = $('#searchUserId').val();

    var filterVal;
    if ($('#datePickerDiv').css('display') == 'none') {
        filterVal = {
            'searchQuestion' : searchQuestion,
            'searchUserId' : searchUserId,
            'currentPage': (typeof page!= 'undefined')?page:1,
            'startDate' : 'ALL', 
            'endDate' : 'ALL', 
            'selDate' : $('#selDate').val(),
            //'selChannel' : $('#selChannel').val(),
            'selResult' : $('#selResult').val(),
            'selMobilePc' : $('#selMobilePc').val(),
        };
    } else {
        
        var dateArr = $('#reservation').val().split('-');

        if (dateArr.length == 2) {
            var startDate = $.trim(dateArr[0]);
            var endDate = $.trim(dateArr[1]);

            filterVal = {
                'searchQuestion' : searchQuestion,
                'searchUserId' : searchUserId,
                'currentPage': (typeof page!= 'undefined')?page:1,
                'startDate' : startDate, 
                'endDate' : endDate, 
                'selDate' : $('#selDate').val(),
                //'selChannel' : $('#selChannel').val(),
                'selResult' : $('#selResult').val(),
                'selMobilePc' : $('#selMobilePc').val(),
            };
        } else {
            return false;
        }
    }
        
    return filterVal;
    
}


function makeHistoryTable(newPage) {
    var saveTableHtml = "";
    var param = getFilterVal(newPage);
    if (param == false) {
        alert('날짜 형식을 확인해주세요.');
        return false;
    } 

    $.ajax({
        type: 'POST',
        data: param,
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
        url: '/historyMng/selectHistoryList',
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
            if (status) {
                $('#alertMsg').text(language.ALERT_ERROR);
                $('#alertBtnModal').modal('show');
            } else {
                if (data.rows.length > 0) {

                    var tableHtml = "";
                    var resultText = "";
                    var userIdText = "";
                    var mobilePcText = "";
                    var intentText = "";
                    for (var i = 0; i < data.rows.length; i++) {
                        if(data.rows[i].RESULT=="H"){
                            resultText = language.ANSWER_OK;
                        }else if(data.rows[i].RESULT=="D"){
                            resultText = language.ANSWER_NO;
                        }else if(data.rows[i].RESULT=="F"){
                            resultText = language.ANSWER_SUGGEST;
                        }else if(data.rows[i].RESULT=="E"){
                            resultText = "Error";
                        }else if(data.rows[i].RESULT=="Q"&&data.rows[i].LUIS_INTENT=="SAP"){
                            resultText = language.ANSWER_OK;
                        }else if(data.rows[i].RESULT=="Q"&&data.rows[i].LUIS_INTENT=="NONE"){
                            resultText = language.ANSWER_NO;
                        }else if(data.rows[i].RESULT=="I"){
                            resultText = language.SAPPASSWORDINIT;
                        }else{
                            resultText = "";
                        }

                        if(data.rows[i].USER_ID=="null"||data.rows[i].USER_ID=="NULL"){
                            userIdText = "";
                        }else if(data.rows[i].USER_ID==""||data.rows[i].USER_ID==null){
                            userIdText = "";
                        }else{
                            var checkUserId = data.rows[i].USER_ID.replace(/(\s*)/g,"");
                            if(checkUserId=="A"){
                                userIdText = "";
                            }else{
                                userIdText = data.rows[i].USER_ID;
                            }
                        }

                        if(data.rows[i].MOBILE_YN=="M"){
                            mobilePcText = "Mobile"
                        }else if(data.rows[i].MOBILE_YN=="P"){
                            mobilePcText = "PC"
                        }else{
                            mobilePcText = "NONE";
                        }

                        if(data.rows[i].LUIS_INTENT=="NONE"||data.rows[i].LUIS_INTENT==null){
                            if(data.rows[i].CHATBOT_COMMENT_CODE==""||data.rows[i].CHATBOT_COMMENT_CODE=="NONE"){
                                intentText = "NONE";
                            }else{
                                intentText = data.rows[i].CHATBOT_COMMENT_CODE;
                            }
                        }else{
                            intentText = data.rows[i].LUIS_INTENT;
                        }
                        
                        tableHtml += '<tr name="userTr">';
                        tableHtml += '<td>' + data.rows[i].NUM + '</td>';
                        tableHtml += '<td style="text-align: left; padding-left:1%;"><a href="#" onClick="getHistoryDetail(' + data.rows[i].SID + '); return false;" >'+ data.rows[i].CUSTOMER_COMMENT_KR + '</a></td>';
                        tableHtml += '<td>' + userIdText + '</td>';
                        tableHtml += '<td>' + data.rows[i].SAME_CNT + '</td>';
                        //tableHtml += '<td>' + data.rows[i].CHATBOT_COMMENT_CODE + '</td>';
                        tableHtml += '<td>' + mobilePcText + '</td>';
                        tableHtml += '<td>' + resultText + '</td>';
                        tableHtml += '<td>' + data.rows[i].RESPONSE_TIME + '</td>';
                        tableHtml += '<td>' + data.rows[i].REG_DATE + '</td>';
                        //tableHtml += '<td>' + data.rows[i].LUIS_INTENT + '</td>';
                        tableHtml += '<td>' + intentText + '</td>';
                        tableHtml += '<td>' + data.rows[i].LUIS_ENTITIES + '</td>';
                        tableHtml += '<td>' + data.rows[i].DLG_ID + '</td>';
                        tableHtml += '</tr>';
                    }
    
                    saveTableHtml = tableHtml;
                    $('#historyBody').html(saveTableHtml);
    
                    iCheckBoxTrans();
    
                    $('#historyTablePaging').html('').append(data.pageList);
    
                } else {
                    saveTableHtml = '<tr><td colspan="11" class="text-center">No Data</td></tr>';
                    $('#historyBody').html(saveTableHtml);
                    $('#historyTablePaging').html('');
                }
            }
        }
    });
}

function getHistoryDetail(sId) {

    var params = {
        'sId': sId,
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/historyMng/selectHistoryDetail',
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
        data: params,
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
            
            if (status) {
                $('#alertMsg').text(language.ALERT_ERROR);
                $('#alertBtnModal').modal('show');
            } else {
                if (data.rows.length > 0) {

                    var tableHtml = "";
                    var resultText = "";
                    var userIdText = "";
                    var intentText = "";
                    for (var i = 0; i < data.rows.length; i++) {

                        if(data.rows[i].RESULT=="H"){
                            resultText = language.ANSWER_OK;
                        }else if(data.rows[i].RESULT=="D"){
                            resultText = language.ANSWER_NO;
                        }else if(data.rows[i].RESULT=="F"){
                            resultText = language.ANSWER_SUGGEST;
                        }else{
                            resultText = "";
                        }

                        if(data.rows[i].USER_ID=="null"||data.rows[i].USER_ID=="NULL"){
                            userIdText = "";
                        }else if(data.rows[i].USER_ID==""||data.rows[i].USER_ID==null){
                            userIdText = "";
                        }else{
                            var checkUserId = data.rows[i].USER_ID.replace(/(\s*)/g,"");
                            if(checkUserId=="A"){
                                userIdText = "";
                            }else{
                                userIdText = data.rows[i].USER_ID;
                            }
                        }

                        if(data.rows[i].LUIS_INTENT=="NONE"||data.rows[i].LUIS_INTENT==null){
                            if(data.rows[i].CHATBOT_COMMENT_CODE==""||data.rows[i].CHATBOT_COMMENT_CODE=="NONE"){
                                intentText = "NONE";
                            }else{
                                intentText = data.rows[i].CHATBOT_COMMENT_CODE;
                            }
                        }else{
                            intentText = data.rows[i].LUIS_INTENT;
                        }

                        
                        tableHtml += '<tr name="userTr"><td>' + data.rows[i].NUM + '</td>';
                        tableHtml += '<td style="text-align: left; padding-left:1%;">'+ data.rows[i].CUSTOMER_COMMENT_KR + '</td>'
                        tableHtml += '<td>' + userIdText + '</td>';
                        tableHtml += '<td>' + data.rows[i].CHATBOT_COMMENT_CODE + '</td>'
                        tableHtml += '<td>' + resultText + '</td>'
                        tableHtml += '<td>' + data.rows[i].RESPONSE_TIME + '</td>'
                        tableHtml += '<td>' + data.rows[i].REG_DATE + '</td>'
                        tableHtml += '<td>' + intentText + '</td>'
                        tableHtml += '<td>' + data.rows[i].LUIS_ENTITIES + '</td>'
                        tableHtml += '<td>' + data.rows[i].DLG_ID + '</td>'
                        tableHtml += '</tr>'
                    }
    
                    saveTableHtml = tableHtml;
                    $('#historyModalBody').html(saveTableHtml);
    
                    iCheckBoxTrans();
    
                    $('#similarQform').modal('show');
    
                } else {
                    saveTableHtml = '<tr><td colspan="11" class="text-center">No Data</td></tr>';
                    $('#historyModalBody').html(saveTableHtml);
                }
            }
        }
    });
}

function dataPick() {
    $('.select2').select2()

    //Datemask dd/mm/yyyy
    $('#datemask').inputmask('dd/mm/yyyy', { 'placeholder': 'dd/mm/yyyy' })
    //Datemask2 mm/dd/yyyy
    $('#datemask2').inputmask('mm/dd/yyyy', { 'placeholder': 'mm/dd/yyyy' })
    //Money Euro
    $('[data-mask]').inputmask()

    //Date range picker
    $('#reservation').daterangepicker({ maxDate: new Date() })
    //Date range picker with time picker
    $('#reservationtime').daterangepicker({ timePicker: true, timePickerIncrement: 30, format: 'MM/DD/YYYY h:mm A' })
    //Date range as a button
    $('#daterange-btn').daterangepicker(
        {
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            startDate: moment().subtract(29, 'days'),
            endDate: moment()
        },
        function (start, end) {
            $('#daterange-btn span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
        }
    )


    //Date picker
    $('#datepicker').datepicker({
        autoclose: true,
        maxDate: new Date()
    })
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