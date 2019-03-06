$(document).ready(function () {
    var pageUrl = $(location).attr('pathname');
    //console.log("pageUrl=="+pageUrl);
    //console.log("url : "+$(location).attr('protocol')+"//"+$(location).attr('host')+""+$(location).attr('pathname')+""+$(location).attr('search'));
    makeUserMenu(pageUrl);

    $(document).on("click", "#noPermission", function () {
        //$(location).attr('href', list);
        location.href = '/list';
    });
});

function makeUserMenu(pageUrl){
    var saveArr = new Array();
    var data = new Object();
    data.MENU_URL = pageUrl;
    saveArr.push(data);

    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    $.ajax({
        type: 'POST',
        data: params,
        url: '/menu/checkMenuAuth',
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

            if (data.status == "FAIL") {
            //메뉴접근 불가
            console.log("메뉴접근 불가");
                $("#noPermissionModal").modal('show');
            } else {
                console.log("메뉴접근 가능");
            }
        }
    });
}