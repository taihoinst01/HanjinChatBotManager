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
    //별 클릭시 이미지변환
    $('.starRev span').click(function(){
        $(this).parent().children('span').removeClass('starOn');
        $(this).addClass('starOn').prevAll('span').addClass('starOn');
        return false;
    });

    //닫기버튼 클릭시 이벤트
    $('.btnClose').click(function(){
        self.close();
        return false;
    });
    
    //전송버튼 클릭시 이벤트
    $('#reportInsertBtn').click(function(){
        var contentsMessage = $("#contentsMessage").val();
        var starCnt = $(".starOn").length;

        if(contentsMessage == "" || contentsMessage == null) {
            alert("고객님의 소중한 의견을 입력해주세요!");
            return false;
        } else {

        }

        var params = {
            'contentsMessage': contentsMessage,
            'starCnt': starCnt
        };
        $.ajax({
            type: 'POST',
            datatype: "JSON",
            data: params,
            url: '/reportInsert/reportInsert',
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
                    alert(language['REGIST_SUCC']);
                    //성공시 현재창을 닫고
                    self.close();
                    //부모창을 reload하여 리스트를 재출력
                    opener.location.reload();               
                } else {
                    alert(language['It_failed']);
                }
            }
        });
    });
});




