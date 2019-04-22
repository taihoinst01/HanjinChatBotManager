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
    var fileNameChk = true;
    if(fileName == "" || fileName == null){ //파일을 선택안했을시 발생 event
        alert("파일을 다시 선택하세요!");
        fileNameChk = false;
    }else{
        fileNameChk = imageFileCheck(fileName);
    }
    return fileNameChk;
}
//파일 업로드
function InsertFileUpload() {
    var fileValue = $("#imgFileUpload").val().split("\\");
    var fileName = fileValue[fileValue.length-1]; // 파일명
    //var fileURL = window.location.protocol + "//" + window.location.host //파일URL 경로
    //+ "/" + window.location.pathname;

    //validation check
    if(fileUploadValidation(fileName)){
        $('#fileUploadForm').submit();
    }
}

// //파일 업로드 시 이미지 확장자 validation
/*
 function chk_file_type(obj) {
     
     var file_kind = obj.value.lastIndexOf('.');
     var file_name = obj.value.substring(file_kind+1,obj.length);
     var file_type = file_name.toLowerCase();
     
     var check_file_type=new Array();​
   
     check_file_type=['jpg','gif','png','jpeg','bmp'];
   
     if(check_file_type.indexOf(file_type)==-1){
      alert('이미지 파일만 선택할 수 있습니다.');
      var parent_Obj=obj.parentNode
      var node=parent_Obj.replaceChild(obj.cloneNode(true),obj);
      return false;
     }else{
         return true;
     }
 }
*/
 function imageFileCheck(fileName){
    var filePath = fileName;
    var allowedExtensions = /(\.jpg|\.JPG|\.jpeg|\.JPEG|\.png|\.PNG|\.GIF|\.gif)$/i;
    if(!allowedExtensions.exec(filePath)){
        alert('Please upload file having extensions .jpeg/.jpg/.png/.gif only.');
        fileInput.value = '';
        return false;
    }else{
        return true;
    }
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
                    tableHtml += '<tr><td>' + data.rows[i].SEQ + '</td>';
                    tableHtml += '<td name="uploadFileView">' + data.rows[i].ORIGINAL_NAME + '</td>';
                    tableHtml += '<td>' + data.rows[i].MODIFIED_NAME + '</td>';
                    tableHtml += '<td>';
                    tableHtml += '<p id="fileUrl' + i + '">' + data.rows[i].FILE_PATH + '</p>';
                    tableHtml += '<input type="hidden" name="viewFile" id="viewFile" value="'+ data.rows[i].FILE_PATH +'">';
                    tableHtml += '</td>';
                    tableHtml += '<td><button type="button" onclick=copyToClipboard("#fileUrl' + i + '") class="btn btn-default"><i class="fa fa-search"></i> Copy</button></td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#uploadbody').html(tableHtml);

            } else {
                saveTableHtml = '<tr><td colspan="5" class="text-center">'+language.NO_DATA+'</td></tr>';
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

$(document).on('mouseover', 'td[name=uploadFileView]', function (e) {
    var viewFile = $(this).parent().find('input[name=viewFile]').val();
    var viewFileHtml = '<img src="'+viewFile+'" width="300px">';
    var sWidth = window.innerWidth;
    var sHeight = window.innerHeight;

    var oWidth = $('.popupLayer').width();
    var oHeight = $('.popupLayer').height();

    // 레이어가 나타날 위치를 셋팅한다.
    var divLeft = e.clientX + 10;
    var divTop = e.clientY + 5;

    // 레이어가 화면 크기를 벗어나면 위치를 바꾸어 배치한다.
    if( divLeft + oWidth > sWidth ) divLeft -= oWidth;
    if( divTop + oHeight > sHeight ) divTop -= oHeight;

    // 레이어 위치를 바꾸었더니 상단기준점(0,0) 밖으로 벗어난다면 상단기준점(0,0)에 배치하자.
    if( divLeft < 0 ) divLeft = 0;
    if( divTop < 0 ) divTop = 0;


    $('#viewFileHtml').html(viewFileHtml);
    $('#imageInfo').css({
        "top": divTop,
        "left": divLeft,
        "position": "absolute"
    }).show();
});


$(document).on('mouseout', 'td[name=uploadFileView]', function (e) {
    $('#viewFileHtml').text('');
    $('#imageInfo').hide();
});