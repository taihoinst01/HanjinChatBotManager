$(document).ready(function(){
    //오른쪽 클릭 방지
    $(document).bind("contextmenu", function(e) {
    return false;
    });
    //f12 방지
    $(document).bind('keydown',function(e){
        if ( e.keyCode == 123 /* F12 */) {
            e.preventDefault();
            e.returnValue = false;
        }
    });
});
//드래그방지 주석
//$(document).bind('selectstart',function() {return false;}); 
//$(document).bind('dragstart',function(){return false;}); 

$(document).ready(function () {

    $('#mLoginId').focus();
  
    $('#sendLoginBtn').click(function () {
        var loginId = $('#mLoginId').val().trim();
        var loginPW = $('#mLoginPass').val().trim();
        if (loginId != '' && loginPW != '') {
            dupleCheck();
        }

    });

    $('#changePwBtn').click(function () {
        location.href="/users/goPwChnge";
    });

    $('#mLoginPass, #mLoginId').keyup(function(e){
        if(e.keyCode == 13) {
            $('#sendLoginBtn').click();
        }
    });
})

//뒤로가기 제어
history.pushState(null, null, location.href);
window.onpopstate = function (event) {
    location.href = document.referrer;
    return false;
    //history.back();
};



function caps_lock(e) {
    var keyCode = 0;
    var shiftKey = false;
    keyCode = e.keyCode;
    shiftKey = e.shiftKey;
    if (((keyCode >= 65 && keyCode <= 90) && !shiftKey)
            || ((keyCode >= 97 && keyCode <= 122) && shiftKey)) {
        show_caps_lock();
        setTimeout("hide_caps_lock()", 3500);
    } else {
        hide_caps_lock();
    }
}

function show_caps_lock() {
    $("#capslock").show();
}

function hide_caps_lock() {
    $("#capslock").hide();
}

function dupleCheck() {
    var loginId = $('#mLoginId').val().trim();
    var params = {
        'mLoginId' : loginId
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/users/dupleLoginCheck',
        
        beforeSend: function () {

            $("#loadingLoginModalMain").modal('show');
        },
        complete: function () {
            $("#loadingLoginModalMain").modal('hide');
        },
        success: function(data) {
            if (data.duple) {
                if ( confirm("같은 계정으로 접속중인 사용자가 있습니다. 로그인 하시겠습니까?") ) {
                    submitLogin('DUPLE_CHECK');
                } else {
                    $("#loadingLoginModalMain").modal('hide');
                    return false;
                }
            }
            else 
            {
                submitLogin();
            }
        }
    });
}

function submitLogin(dupleYn) {
    var loginId = $('#mLoginId').val().trim();
    var loginPW = $('#mLoginPass').val().trim();
    var params = {
        'mLoginId' : loginId,
        'mLoginPass' : loginPW,
        'dupleYn' : dupleYn
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/users/login',
        beforeSend: function () {

            $("#loadingLoginModalMain").modal('show');
        },
        complete: function () {
            $("#loadingLoginModalMain").modal('hide');
        },
        success: function(data) {
            $('body').html(data);
            //console.log(data);
        }
    });
}



