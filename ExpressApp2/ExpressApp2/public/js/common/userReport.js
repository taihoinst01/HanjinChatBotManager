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
});

//후기 리스트 출력
var searchApiUrlName = ""; //페이징시 필요한 검색어(NAME) 담아두는 변수
var searchApiUrlIntent = ""; //페이징시 필요한 검색어(INTENT) 담아두는 변수
var listPageNo = "";
function makeUploadTable(page) {
    params = {
        'currentPage': ($('#currentPage').val() == '') ? 1 : page,
    };
    console.log(params);
    listPageNo = ($('#currentPage').val() == '') ? 1 : page;
    $.ajax({
        type: 'POST',
        data: params,
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
                for (var i = 0; i < data.rows.length; i++) {
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td class="txt_left" style="text-align: center !important;">' + data.rows[i].R_COUNT + ' 점 </td>';
                    tableHtml += '<td class="txt_left" style="text-align: center !important;">' + data.rows[i].R_COMMENT + '</td>';
                    tableHtml += '<td class="txt_left" style="text-align: center !important;">' + data.rows[i].R_WDATE + '</td>';
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

//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#userReportTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeUploadTable($(this).val());
    }
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
        $('input[name=DELETE_SID]').parent().iCheck('check');
        
    }).on('ifUnchecked', function() {
        $('input[name=DELETE_SID]').parent().iCheck('uncheck');
        
    });
}
