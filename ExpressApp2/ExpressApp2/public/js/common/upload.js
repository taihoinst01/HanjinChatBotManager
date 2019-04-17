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

//파일 업로드관련 validation
function fileUploadValidation(fileName) {
    if(fileName == "" || fileName == null){ //파일을 선택안했을시 발생 event
        alert("파일을 다시 선택하세요!");
        return;
    }
}
//파일 업로드
function InsertFileUpload() {
    var fileValue = $("#imgFileUpload").val().split("\\");
    var fileName = fileValue[fileValue.length-1]; // 파일명
    var fileURL = window.location.protocol + "//" + window.location.host //파일URL 경로
    //+ "/" + window.location.pathname;
    //validation check
    fileUploadValidation(fileName);

    $('#fileUploadForm').submit();

}

//파일 리스트 출력
function makeUploadTable() {
    params = {
        'open' : 1
    };
    $.ajax({
        type: 'POST',
        data: params,
        url: '/upload/selectFileUpload',
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
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].SEQ + '</td>';
                    tableHtml += '<td>' + data.rows[i].ORIGINAL_NAME + '</td>';
                    tableHtml += '<td><p id="fileUrl' + i + '">' + data.rows[i].FILE_PATH + '</p></td>';
                    tableHtml += '<td><button type="button" onclick=copyToClipboard("#fileUrl' + i + '") ><i class="fa fa-search"></i>copy</button></td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#uploadbody').html(tableHtml);

            } else {
                saveTableHtml = '<tr><td colspan="4" class="text-center">'+language.NO_DATA+'</td></tr>';
                $('#uploadbody').html(saveTableHtml);
            }

        }
    });
}

//텍스트 복사버튼
function copyToClipboard(element) {
    var $temp = $("<input>");
      $("body").append($temp);
      $temp.val($(element).text()).select();
    document.execCommand("copy");
      $temp.remove();
    alert("copy complete"); 
}

