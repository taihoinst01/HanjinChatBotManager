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

$(document).ready(function() {
    dataPick();
    makeUploadTable();

    $('#searchDlgBtn').click(function() {
        makeUploadTable(1);
    });
});

//후기 리스트 출력
var listPageNo = "";
function makeUploadTable(page) {

    var param = getFilterVal(page);
    if (param == false) {
        alert('날짜 형식을 확인해주세요.');
        return false;
    } 
    
    listPageNo = ($('#currentPage').val() == '') ? 1 : page;
    $.ajax({
        type: 'POST',
        data: param,
        url: '/userReport/selectReportList',
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

                //날짜 가공
                var year = [];
                var month = [];
                var day = [];
                var hour =[];
                var minute = [];

                for (var i = 0; i < data.rows.length; i++) {
                    year[i] = data.rows[i].R_WDATE.substring(0,4);
                    month[i] = data.rows[i].R_WDATE.substring(5,7);
                    day[i]= data.rows[i].R_WDATE.substring(8,10);
                    hour[i]= data.rows[i].R_WDATE.substring(11,13);
                    minute[i]= data.rows[i].R_WDATE.substring(14,16);

                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td class="txt_left" style="text-align: center !important;">' + data.rows[i].R_COUNT + ' 점 </td>';
                    tableHtml += '<td class="txt_left">' + data.rows[i].R_COMMENT + '</td>';
                    tableHtml += '<td class="txt_left" style="text-align: center !important;">' + year[i] + '년 ' +  month[i] + '월 ' + day[i] + '일 ' + hour[i] + '시 ' + minute[i] + '분 ' +'</td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#userReportBody').html(tableHtml);

                iCheckBoxTrans();

                //사용자의 appList 출력
                $('#userReportBody').find('tr').eq(0).children().eq(0).trigger('click');

                $('#userReportTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="4" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#userReportBody').html(saveTableHtml);
                $('#userReportTablePaging .pagination').html('');
            }

        }
    });
}

$(document).on('click','#excelDownload',function(){

    var param = getFilterVal(1);
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
        url: '/userReport/selectReportListAll',
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

                    
                    var worksheet = workbook.addWorksheet('ChbotReport Log');

                    //var count = "100";
                    worksheet.columns = [
                        { header: '후기점수', key: 'rCount', width: 10},
                        { header: '후기내용', key: 'rComment', width: 50, style: {alignment: {wrapText: true} }},
                        { header: '후기작성날짜', key: 'rWdate', width: 30},
                    ];

                    var firstRow = worksheet.getRow(1);
                    firstRow.font = { name: 'New Times Roman', family: 4, size: 10, bold: true, color: {argb:'80EF1C1C'} };
                    firstRow.alignment = { vertical: 'middle', horizontal: 'center'};
                    firstRow.height = 20;
                    /*
                    worksheet.autoFilter = {
                        from: 'C1',
                        to: 'I1'
                    }
*/
                    for (var i = 0; i < data.rows.length; i++) {
                        worksheet.addRow({
                            rCount: data.rows[i].R_COUNT
                            , rComment: data.rows[i].R_COMMENT
                            , rWdate: data.rows[i].R_WDATE
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

//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#userReportTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeUploadTable($(this).val());
    }
});

function getFilterVal(page) {

    var filterVal;
    var dateArr = $('#reservation').val().split('-');

        if (dateArr.length == 2) {
            var startDate = $.trim(dateArr[0]);
            var endDate = $.trim(dateArr[1]);

            filterVal = {
                'currentPage': (typeof page!= 'undefined')?page:1,
                'startDate' : startDate, 
                'endDate' : endDate, 
                'selPoint' : $('#selPoint').val(),
            };
        } else {
            return false;
        }
        
    return filterVal;
    
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
        $('input[name=DELETE_SID]').parent().iCheck('check');
        
    }).on('ifUnchecked', function() {
        $('input[name=DELETE_SID]').parent().iCheck('uncheck');
        
    });
}
