

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

    if ($('#beforePageNum').val() != -1 ) {
        $('#currentPage').val($('#beforePageNum').val());
    }
    makeIntentTable();

    //검색 버튼 클릭
    $('#searchBtn').click(function(){
        $('#searchStr').val($('#searchIntentText').val().trim());
        $('#currentPage').val(1);
        makeIntentTable();
    });

    
    //생성 모달 
    $('#createIntentBtn').click(function(){
        //modal초기화
        $('#intentName').val('');
        //$('#modalBodyMain').find('.form-group.entityChildDiv').remove();

        $('#createIntentHiddenBtn').trigger('click');
    });

});

//페이징 클릭
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        $('#currentPage').val($(this).val());
        makeIntentTable();
    }
});

//검색 input 엔터 감지
$(document).on("keypress", "#searchIntentText", function(e){
    if (e.keyCode === 13) {	//	Enter Key
        if ($('#searchIntentText').val().trim() == '' ) {
            if ($('#searchStr').val() != '') {
                $('#searchBtn').trigger('click');
            }
        } else {
            $('#searchBtn').trigger('click');
        }
    }
});

//modal esc 종료
$(document).keyup(function(e) {
    if ($('#create_intent').css('display') == 'block') {
        if (e.which == 27) {
            $('.addIntentModalClose').trigger('click');
        }
    }
});


//intent 삭제 버튼
$(document).on("click", "a[name=delIntentBtn]", function(e){
    
    var intentHiddenName = $(this).parent().find('#intentHiddenName').val();
    var hId = $(this).parent().find('#intentHiddenId').val();
    $('#hId').val(hId);
    $('#hName').val(intentHiddenName);
    $('#confirmTitle').text('인텐트 삭제');
    $('#confirmMsg').text("["+ intentHiddenName + "] 삭제하시겠습니까?");
    $('#confirmBtnModal').modal('show');
});


$(document).on("click", "#confirmBtn", function () {
    var hId = $('#hId').val();
    var hName = $('#hName').val();
    $('#confirmTitle').text('');
    $('#confirmMsg').text("");
    $(this).prev().trigger('click');
    deleteIntent(hName, hId);
    $('#confirmBtn').prev().trigger('click');
});





//인텐트 리스트 출력
function makeIntentTable() {
    var params = {
        'searchIntent' : $('#searchStr').val(),
        'selPage' : $('#currentPage').val(),
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/luis/selectIntentList',
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
            $('#intentListBody').html('');
            $('#pagination').html('');
            var intentBodyHtml = '';
            if(data.intentList.length > 0){
                var rememIndex = -1;
                for(var i = 0; i < data.intentList.length; i++){
                    if ($('#selectIntent').val() != "-1" && data.intentList[i].INTENT == $('#selectIntent').val()) {
                        rememIndex = i;
                    }
                    intentBodyHtml += "<tr>";
                    intentBodyHtml += "<td style='text-align: left; padding-left:1%;'><a href='#' name='selIntent'  onclick='return false;'>" + data.intentList[i].INTENT + "</a></td>";
                    intentBodyHtml += "<td style='text-align: left; padding-left:1.5%;'><span name='intentLabelCnt' style = '' >" + data.intentList[i].UTTER_COUNT + "</span> </td>";
                    intentBodyHtml += "<td style='text-align: right; padding-right:1.5%;'>";
                    intentBodyHtml += "<input type='hidden' id='intentHiddenName' name='intentHiddenName' value='" + data.intentList[i].INTENT + "' />";
                    intentBodyHtml += "<input type='hidden' id='intentHiddenId' name='intentHiddenId' value='" + data.intentList[i].INTENT_ID + "' />";
                    intentBodyHtml += "<a href='#' id='delIntentBtn' name='delIntentBtn' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                    intentBodyHtml += "</td>";
                    intentBodyHtml += "</tr>";
                    
                }
                //<td><a href="#" name="delEntityRow" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></td>
                $('#intentListBody').html(intentBodyHtml);
                $('#pagination').html('').append(data.pageList);


                if (rememIndex != -1) {
                    $('a[name=selIntent]').eq(rememIndex).trigger('click');
                }
            }
        }
    });
}


//인텐트 생성 
function createIntent() {
    if ($('#intentName').val().trim() == '') 
    {
        $('#alertMsg').text('Intent를 입력해야 합니다.');
        $('#alertBtnModal').modal('show');
        //alert("Intent를 입력해야 합니다.");
    } 
    else 
    {
        var params = {
            'intentName' : $('#intentName').val()
        };

        $.ajax({
            type: 'POST',
            timeout: 0,
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
            url: '/luis/createIntent',
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
                if (data.dupleRst) {
                    $('#alertMsg').text("[" + data.existApp + "] 앱에 같은 이름의 인텐트가 존재합니다.");
                    $('#alertBtnModal').modal('show');
                    //alert("[" + data.existApp + "] 앱에 같은 이름의 인텐트가 존재합니다.");
                }
                else if (!data.success) 
                {
                    $('#alertMsg').text(data.message);
                    $('#alertBtnModal').modal('show');
                    //alert(data.message);
                }
                else if (data.error) {
                    $('#alertMsg').text(data.message);
                    $('#alertBtnModal').modal('show');
                    //alert(data.message);
                }
                else 
                {
                    $('#alertMsg').text('생성되었습니다');
                    $('#alertBtnModal').modal('show');
                    $('#chkAfterAlert').val('RELOAD');
                    //alert('생성되었습니다.');
                    //location.reload();
                }
            }
        });
        
    }
}



//인텐트 삭제
function deleteIntent(intentHiddenName, hId) {
    var params = {
        'deleteIntentName' : intentHiddenName,
        'deleteIntentId' : hId
    };
    
    $.ajax({
        type: 'POST',
        timeout: 0,
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
        url: '/luis/deleteIntent',
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
            if(data.error){
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
            }
            else if (data.success) {
                
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                $('#chkAfterAlert').val('RELOAD');
                //alert(data.message);
                //location.reload();
            }
            else {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
            }
        }
    });
}



//move to intent detail page
$(document).on("click", "a[name=selIntent]", function(e){
    var intentName = $(this).parents('tr').find('#intentHiddenName').val();
    var intentId = $(this).parents('tr').find('#intentHiddenId').val();
    var labelCnt = $(this).parents('tr').find('span[name=intentLabelCnt]').text();
    intentDetail(intentName, intentId, labelCnt);
});



//인텐트 선택
function intentDetail(intentName, intentId, labelCnt) {

    var pageNum = $('#currentPage').val();
    var params = {
        'intentName' : intentName,
        'intentId' : intentId,
        'labelCnt' : labelCnt
    };

    $.ajax({
        type: 'POST',
        timeout: 0,
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
        url: '/luis/getUtterInIntent',
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
            if (!data.success) 
            {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
            }
            else if (data.error) {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
            }
            else 
            {
                var intentNameEncoded = encodeURI(encodeURIComponent(intentName));
                if ($('#createQuery').val() != -1) {
                    var createQuery = $('#createQuery').val();
                    location.href = "/luis/intentDetail?intentName=" + intentNameEncoded + "&intentId=" + intentId + "&labelCnt=" + labelCnt + "&pageNum=" + pageNum + "&createQuery=" + createQuery;
                } else {
                    location.href = "/luis/intentDetail?intentName=" + intentNameEncoded + "&intentId=" + intentId + "&labelCnt=" + labelCnt + "&pageNum=" + pageNum;
                }
            }
        }
    });
}



//alert 메세지 초기화
$(document).on("click", "#alertCloseBtn", function () {
    $('#alertMsg').text('');
    var chkMsg = $('#chkAfterAlert').val();
    if (chkMsg != 'NONE') {
        if (chkMsg == 'RELOAD') {
            location.reload();
        }
    }
});


