$(document).ready(function () {
    $('.ajaxsend').click(function(){
        // content-type을 설정하고 데이터 송신
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-type', "application/json");

        // 데이터 수신이 완료되면 표시
        xhr.addEventListener('load', function(){
            console.log(xhr.responseText);
            // 문자열 형식으로 변환
            var result = JSON.parse(xhr.responseText);
            // 데이터가 없으면 return 반환
            if(result.result !== 'ok') return;
            // 데이터가 있으면 결과값 표시
            document.querySelector(".serult").innerHTML = result.email;
        });
    })

})

function save(type){
    var urlStr, applyIdStr
    if(type === 'appInsert'){
        urlStr = 'admin/putAddApps';
        applyIdStr = "appInsertForm";
    }

    $.tiAjax({
        type: 'POST',
        applyId: applyIdStr,
        url: urlStr,
        isloading: true,
        success: function(data) {
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
            //console.log(data);
            if(data.appId != undefined && data.appId != null && data.appId != ''){
                $('#addAppClose').click();
                movePage();
            }else{
                alert(data.error.message);
            }
        }
    });
}

//app 등록 시 데이터 유효성 검사
function appValidation(type){
    if(type === 'appInsert'){
        var service = $('#appInsertService').val();
        var name = $('#appInsertName').val();
        var culture = $('#appInsertCulture').val();

        if(service != null && name != "" && culture != null) {
            $('#btnAppInsert').removeClass("disable");
            $('#btnAppInsert').attr("disabled", false);
        } else {
            $('#btnAppInsert').attr("disabled", "disabled");
            $('#btnAppInsert').addClass("disable");
        }
    }else if(type === 'renameApp'){
        var name = $('#reName').val();

        if(name != "") {
            $('#btnRenameApp').removeClass("disable");
            $('#btnRenameApp').attr("disabled", false);
        } else {
            $('#btnRenameApp').attr("disabled", "disabled");
            $('#btnRenameApp').addClass("disable");
        }
    }
}

//Luis app delete
function deleteApp(){
    if ( confirm(  '[' + $('#currentAppName').val()  + ']\n' + $('#deleteAsk').val())) {
        var deleteAppId = $('#deleteAppId').val();
        var params = {'deleteAppId': deleteAppId};
        $.tiAjax({
            type: 'POST',
            data: params,
            url: '/admin/deleteApp',
            isloading: true,
            success: function(data) {
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
                movePage();
            }
        });
    }
}

//Luis app rename
function renameApp(){
    var renameAppId = $('#deleteAppId').val();
    var renameAppName = $('#reName').val();
    var params = {
        'renameAppId': renameAppId,
        'renameAppName': renameAppName
    };
    $.tiAjax({
        type: 'POST',
        data: params,
        url: '/admin/renameApp',
        isloading: true,
        success: function(data) {
            movePage();
        }
    });
}

//페이지 이동
function movePage(){
    location.reload();
}

