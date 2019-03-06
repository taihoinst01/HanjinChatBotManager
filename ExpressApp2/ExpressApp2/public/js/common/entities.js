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


$(document).ready(function(){

    entitiesAjax();

    //엔티티 추가 모달 초기 설정
    dialogValidation();
    //엔티티추가 모달 selectbox 설정
    selectApiGroup();
    //** 모달창 */
    //다이얼로그 생성 모달 닫는 이벤트(초기화)
    $(".js-modal-close").click(function() {
        $('html').css({'overflow': 'auto', 'height': '100%'}); //scroll hidden 해제
        //$('#element').off('scroll touchmove mousewheel'); // 터치무브 및 마우스휠 스크롤 가능

        $('#btnAddDlg').attr("disabled", "disabled");
        $('#btnAddDlg').addClass("disable");
        $('#layoutBackground').hide();
    });

    $('.addDialogCancel').click(function(){
        $('#appInsertForm')[0].reset();
        var inputEntityStr = "<div style='margin-top:4px;'><input name='entityValue'  tabindex='1' id='entityValue' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' onkeyup='dialogValidation();'>";
        inputEntityStr += '<a href="#" name="delEntityBtn" class="entity_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        $('.entityValDiv').html(inputEntityStr);
    });
    //** 모달창 끝 */

    //생성버튼클릭시 다른div hidden
    $('#entities').click(function() {
        $('.cancelEntityValueBtn').trigger('click');
        //엔티티 추가 모달 초기 설정
        dialogValidation();
        //$('.close').trigger('click')
        setTimeout(function (){
            $('#create_dlg').find("input:visible:first").focus();
            //$('#entityDefine').focus();
        }, 500);
    });


});

//entity 추가 start --
$(document).on("click", "#addEntityValBtn", function(e){

    if ($('#update_dlg').css('display') === 'none') {

        var entityLength = $('.entityValDiv  input[name=entityValue]').length+1;
        inputEntityStr = "<div style='margin-top:4px;'><input name='entityValue' id='entityValue' tabindex='" + entityLength + "' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' onkeyup='dialogValidation();'>";
        inputEntityStr += '<a href="#" name="delEntityBtn" class="entity_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        $('.entityValDiv').append(inputEntityStr);
        $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length-1).focus();
        dialogValidation();
    } else {

        var entityLength = $('.updateEntityValDiv  input[name=entityValue]').length+1;
        inputEntityStr = "<div style='margin-top:4px;'><input name='entityValue' id='entityValue' tabindex='" + entityLength + "' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' onkeyup='dialogValidation();'>";
        inputEntityStr += '<a href="#" name="delEntityBtn" class="entity_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        $('.updateEntityValDiv').append(inputEntityStr);
        $('.updateEntityValDiv  input[name=entityValue]').eq($('.updateEntityValDiv  input[name=entityValue]').length-1).focus();
    }
});

$(document).on("click", "a[name=delEntityBtn]", function(e){
    if ($('#update_dlg').css('display') === 'none') {
        if ($('.entityValDiv  input[name=entityValue]').length < 2) {
            alert('1개 이상 입력해야 합니다.');
            $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length-1).focus();
        } else {
            $(this).parent().remove();
            $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length-1).focus();
            dialogValidation();
        }
    } else {
        if ($('.updateEntityValDiv  input[name=entityValue]').length < 2) {
            alert('1개 이상 입력해야 합니다.');
            $('.updateEntityValDiv  input[name=entityValue]').eq($('.updateEntityValDiv  input[name=entityValue]').length-1).focus();
        } else {
            $(this).parent().remove();
            $('.updateEntityValDiv  input[name=entityValue]').eq($('.updateEntityValDiv  input[name=entityValue]').length-1).focus();
        }
    }
});

$(document).on("keypress", ".modal-body input[name=entityValue]", function(e){
    if (e.keyCode === 13) {	//	Enter Key
        //var inputIndex = $('.entityValDiv  input[name=entityValue]').index($(this));
        $('#addEntityValBtn').trigger('click');
        if ($('#update_dlg').css('display') === 'none') {
            $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length-1).focus();
        } else {
            $('.updateEntityValDiv  input[name=entityValue]').eq($('.updateEntityValDiv  input[name=entityValue]').length-1).focus();
        }
    }
});
//entity 추가 end --

$(document).on("click", ".more", function(e){
    if($(e.target).hasClass('more')){
        //$(this).next().css('visibility') === 'visible'
        $('.board').hide();
        $('.board').eq(  $('.board').index($(this).parent().children(":last"))  ).show();
        $('.fl.close').addClass('more').removeClass('close');  

        $('.board input[name=entityValue]').val('');

        $(e.target).addClass('close').removeClass('more');
        $(e.target).parent().find(".board").css('visibility', 'visible');
        $(e.target).parent().find(".board input[name=entityValue]").focus();
     }
});

$(document).on("keyup", ".board input[name=entityValue]", function(e){
    if (e.keyCode === 27) {	//	Enter Key
        $(this).parents('.board').prev().trigger('click');
    }
});

$(document).on("click", ".close", function(e){
    if($(e.target).hasClass('close')){
        $(e.target).addClass('more').removeClass('close');  
        $(e.target).parent().find(".board").css('visibility', 'hidden');
        $('.board input[name=entityValue]').val('');
     }
});

$(document).on("click", ".cancelEntityValueBtn", function(e){
    $(e.target).parent().parent().parent().parent().parent().find(".close").addClass('more').removeClass('close');
    $(e.target).parent().parent().parent().parent().parent().find(".board").css('visibility', 'hidden');
});


//엔티티 삭제
var delEntityDefine = "";
$(document).on("click", "a[name=delEntityRow]", function(e){
    delEntityDefine = $(this).parents('tr').children().first().text().trim();
    $('#proc_content').html('선택된 정보를 삭제하시겠습니까? 복구할 수 없습니다.');
    $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button><button type="button" class="btn btn-primary" id="deleteEntityBtn" onClick="goDeleteEntity();"><i class="fa fa-trash"></i> Delete</button>');
    $('#procEntity').modal('show');
});

function goDeleteEntity(){
    $.ajax({
        url: '/learning/deleteEntity',
        dataType: 'json',
        type: 'POST',
        timeout: 0,
        beforeSend: function () {
            $('#deleteEntity').modal('hide');
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
        data: {'delEntityDefine': delEntityDefine},
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
            if(data.status == 200){
                //alert(language.SUCCESS);
                $('#proc_content').html("삭제되었습니다");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
                searchEntities();
            } else {
                //alert(language.It_failed);
                $('#proc_content').html("삭제에 실패되었습니다");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
            }
        }
    });
}

//기존 entity 값 저장
var originalEntityVal = {};
$(document).on("click", "a[name=editEntityTag]", function(e){

    originalEntityVal.entityDefine = $(this).text().trim();
    originalEntityVal.api_group = $(this).parents('tr').find('td:last').text().trim();
    
    var entityValArr = [];

    var allEntities = $(this).parents('td').next().find('span').text().trim();
        
    var entityValTxt = allEntities.substring(0, allEntities.length-1).split('[');
    for (var i=1; i<entityValTxt.length; i++) {
        
        var valueTmp = entityValTxt[i].substring(0, entityValTxt[i].length-1);
        entityValArr.push(valueTmp);
    }

    originalEntityVal.entityValue = entityValArr;

    editEntityFnc(originalEntityVal);

});

function editEntityFnc(originalEntityVal) {
    $('#updateEntityDefine').text(originalEntityVal.entityDefine);
    
    $('#updateApiGroup').children().each(function() {
        if ($(this).val() === originalEntityVal.api_group) {
            $(this).attr('selected', true);
            return;
        }
    });

    $('.updateEntityValDiv').html('');
    var inputEntityStr = "";
    var entityValArr = originalEntityVal.entityValue;
    for (var i=0; i<entityValArr.length; i++) {

        var entityLength = $('.updateEntityValDiv  input[name=entityValue]').length+1;
        inputEntityStr += "<div style='margin-top:4px;'><input name='entityValue' id='entityValue' tabindex='" + entityLength + "' type='text' value ='" + entityValArr[i] + "' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' >";
        inputEntityStr += '<a href="#" name="delEntityBtn" class="entity_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
    }
    $('.updateEntityValDiv').append(inputEntityStr);
    $('.updateEntityValDiv  input[name=entityValue]').eq($('.updateEntityValDiv  input[name=entityValue]').length-1).focus();
    
    $('#updateEntityBtn').trigger('click');

}

function entitiesAjax(){

    params = {
        'currentPage' : ($('#currentPage').val()== '')? 1 : $('#currentPage').val()
    };
    $.tiAjax({
        type: 'POST',
        data: params,
        url: '/learning/entities',
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
            $('#entitiesTbltbody').html('');
            var item = '';
            if(data.list.length > 0){
                for(var i = 0; i < data.list.length; i++){
                    
                    item += '<tr>';
                    item += '<td><a href="#" name="editEntityTag">' + data.list[i].ENTITY + "</a></td>" ;
                    //item += '<td>' + data.list[i].ENTITY + "</td>" ;
                    item += '<td><span class="fl">' + data.list[i].ENTITY_VALUE + "</span>";
                    item += '<a class="more fl"><span class="hc">+</span></a>';
                    item += '<div class="board">';
                    item += '<ul>';
                    item += '<form action="" method="post" onsubmit="return false;" autocomplete="off" name="entityForm">';
                    item += ' <li class="inp"><input name="entityValue" type="text" class="form-control fl"  style="width:50%;">';
                    item += '<button type="button" class="btn btn_01 mb05 addEntityValueBtn"><i class="fa fa-edit"></i> 저장</button> <button type="button" class="btn btn-default mb05 cancelEntityValueBtn"><i class="fa fa-times"></i> 취소</button>';
                    item += '</li>';
                    item += '<input type="hidden" name="entityDefine" value="' + data.list[i].ENTITY + '">';
                    item += '<input type="hidden" name="apiGroup" value="' + data.list[i].API_GROUP + '">';
                    item += "</form>";
                    item += '</ul>';
                    item += '</div>';
                    item += '</td>';
                    item += '<td>' + data.list[i].API_GROUP + '</td>';  
                    item += '<td><a href="#" name="delEntityRow" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></td>';
                    item += '</tr>';
                }
                
            } else {
                item += '<tr>' +
                            '<td colspan="4">' + language.NO_DATA + '</td>' +
                        '</tr>';
            }
            
            $('#entitiesTbltbody').append(item);
            $('#pagination').html('').append(data.pageList);
        }
    });
}

$(document).on('click','.li_paging',function(e){

    if(!$(this).hasClass('active')){
        $('#currentPage').val($(this).val());
        entitiesAjax();
    }
    /*
    if($(e.target).parent().val() != $('#currentPage').val()){
        $('#currentPage').val($(e.target).parent().val())
        entitiesAjax();
    }
    */
});

//엔티티 밸류 추가창 열기버튼
$(document).on('click', '.openAddInput', function() {

    $('.openAddInput').not($(this)).each(function(){
        if($(this).css('display') == 'none') {
            $(this).next().click();
        }
    })

    $(this).toggle();
    $(this).next().toggle();
    $(this).next().next().toggle();
})

//엔티티 밸류 추가창 닫기 버튼
$(document).on('click', '.closeAddInput', function() {

    $(this).toggle();
    $(this).prev().toggle();
    $(this).next().toggle();
})

//엔티티 밸류 저장 버튼
$(document).on('click', '.addEntityValueBtn', function() {
    
    //form submit 방지
    var submitAction = function(e) {
        e.preventDefault();
        e.stopPropagation();
        /* do something with Error */
    };
    $(this).parent().parent().on('submit', submitAction);

    if($(this).prev().val() == '' || $(this).prev().val() == null) {

        alert(language.Enter_entity_value_to_save);
    } else {

        var addValues = $(this).parent().parent().serializeObject();
        addEntityValueAjax(addValues);
    }
})

//엔티티 밸류 저장(추가) ajax
function addEntityValueAjax(addValues) {

    $.ajax({
        url: '/learning/insertEntity',
        dataType: 'json',
        type: 'POST',
        data: addValues,
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
            if(data.status == 200){
                //alert(language.Added);
                $('#proc_content').html("등록되었습니다.");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
                $("#iptentities").val(addValues.entityValue);
                searchEntities();
            } else if(data.status == 'Duplicate') {
                //alert(language.DUPLICATE_ENTITIES_EXIST);
                $('#proc_content').html("이미 등록된 Entity 입니다.");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
            } else {
                //alert(language.It_failed);
                $('#proc_content').html("등록에 실패되었습니다.");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
            }
        }
    });
}

//엔티티 검색
function searchEntities() {

    if($("#iptentities").val() == '' || $("#iptentities").val() == null) {
        $('#currentPage').val(1);
        entitiesAjax();
    } else {
        params = {
            'currentPage' : 1,
            'searchEntities' : $('#iptentities').val()
        };
        $.tiAjax({
            type: 'POST',
            data: params,
            url: '/learning/searchEntities',
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
                $('#entitiesTbltbody').html('');
                var item = '';
                if(data.list.length > 0){
                    for(var i = 0; i < data.list.length; i++){
                        item += '<tr>';
                        item += '<td><a href="#" name="editEntityTag">' + data.list[i].ENTITY + "</a></td>" ;
                        //item += '<td>' + data.list[i].ENTITY + "</td>" ;
                        item += '<td><span class="fl">' + data.list[i].ENTITY_VALUE + "</span>";
                        item += '<a class="more fl"><span class="hc">+</span></a>';
                        item += '<input type="hidden" name="entityDefine" value="' + data.list[i].ENTITY + '">';
                        item += '<input type="hidden" name="apiGroup" value="' + data.list[i].API_GROUP + '">';
                        item += '<div class="board">';
                        item += '<ul>';
                        item += '<form action="" method="post" name="entityForm">';
                        item += ' <li class="inp"><input name="entityValue" type="text" class="form-control fl"  style="width:50%;">';
                        item += '<button type="button" class="btn btn_01 mb05 addEntityValueBtn"><i class="fa fa-edit"></i> 저장</button> <button type="button" class="btn btn-default mb05 cancelEntityValueBtn"><i class="fa fa-times"></i> 취소</button>';
                        item += '</li>';
                        item += '<input type="hidden" name="entityDefine" value="' + data.list[i].ENTITY + '">';
                        item += '<input type="hidden" name="apiGroup" value="' + data.list[i].API_GROUP + '">';
                        item += "</form>";
                        item += '</ul>';
                        item += '</div>';
                        item += '</td>';
                        item += '<td>' + data.list[i].API_GROUP + '</td>';  
                        item += '<td><a href="#" name="delEntityRow" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></td>';
                        
                        item += '</tr>';
                    }
                    
                } else {
                    item += '<tr style="height: 175px;">' +
                                '<td colspan="4">' + language.NO_DATA + '</td>' +
                            '</tr>';
                }
                $('#entitiesTbltbody').append(item);
                $('#pagination').html('').append(data.pageList);
            }
        });
    }
}

//** 모달창 */
function openModalBox(target){

    // 화면의 높이와 너비를 변수로 만듭니다.
    var maskHeight = $(document).height();
    var maskWidth = $(window).width();

    // 마스크의 높이와 너비를 화면의 높이와 너비 변수로 설정합니다.
    $('.mask').css({'width':maskWidth,'height':maskHeight});


    // 레이어 팝업을 가운데로 띄우기 위해 화면의 높이와 너비의 가운데 값과 스크롤 값을 더하여 변수로 만듭니다.
    var left = ( $(window).scrollLeft() + ( $(window).width() - $(target).width()) / 2 );
    var top = ( $(window).scrollTop() + ( $(window).height() - $(target).height()) / 2 );

    // css 스타일을 변경합니다.
    $(target).css({'left':left,'top':top, 'position':'absolute'});

    // 레이어 팝업을 띄웁니다.
    $(target).show();

    $('#dialogPreview').css({'height':$('#dialogSet').height()});

    $('html').css({'overflow': 'hidden', 'height': '100%'});
    $('#element').on('scroll touchmove mousewheel', function(event) { // 터치무브와 마우스휠 스크롤 방지
        event.preventDefault();
        event.stopPropagation();
        return false;
    });
    wrapWindowByMask();
}

function wrapWindowByMask(){ //화면의 높이와 너비를 구한다. 
    var maskHeight = $(document).height(); 
    var maskWidth = $(window).width(); //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채운다. 
    $('#layoutBackground').css({'width':maskWidth,'height':maskHeight}); //마스크의 투명도 처리 
    $('#layoutBackground').fadeTo("fast",0.7); 
} 


//모달창 입력값에 따른 save 버튼 활성화 처리
function dialogValidation(){
    
    var defineText = $('#entityDefine').val().trim();
    var valueText = true;
    
    $('.entityValDiv  input[name=entityValue]').each(function() {
        if ($(this).val().trim() === "") {
            valueText = false;
            return;
        }
    });

    if(defineText != "" && valueText) {
        $('#btnAddDlg').removeClass("disable");
        $('#btnAddDlg').attr("disabled", false);
    } else {
        $('#btnAddDlg').attr("disabled", "disabled");
        $('#btnAddDlg').addClass("disable");
    }
       
}

//엔티티 업데이트
//originalEntityVal
function updateEntity() {
    

    var valueText = false;
    $('.updateEntityValDiv input[name=entityValue]').each(function() {
        if ($(this).val().trim() === "") {
            valueText = true;
            return;
        }
    });

    if (valueText) {
        alert(language.Please_enter);
        return ;
    }

    //
    var apiGroupVal = $('#apiGroup :selected').val();
    var entityValueList = [];
    $('.updateEntityValDiv input[name=entityValue]').each(function() {
        
        for (var i=0; i<entityValueList.length; i++) {
            if ( entityValueList[i].entityValue === $(this).val().trim()) {
                valueText = true;
            }
        }
        entityValueList.push($(this).val().trim());
    });

    if (valueText) {
        alert(language.DUPLICATE_ENTITIES_EXIST);
        return ;
    }
    originalEntityVal.entityValue = entityValueList;

    $.ajax({
        url: '/learning/updateEntity',
        dataType: 'json',
        contentType: 'application/json',
        type: 'POST',
        data: JSON.stringify(originalEntityVal) //$('#appInsertForm').serializeObject(),
        , beforeSend: function () {
            $('.updateEntityCancel').click();
            var width = 0;
            var height = 0;
            var left = 0;
            var top = 0;

            width = 50;
            height = 50;

            top = ( $(window).height() - height ) / 2 + $(window).scrollTop();
            left = ( $(window).width() - width ) / 2 + $(window).scrollLeft();

            $("#loadingBar").addClass("in");
            $("#loadingImg").css({position:'relative'}).css({left:left,top:top});
            $("#loadingBar").css("display","block");
        }
        , complete: function () {
            $("#loadingBar").removeClass("in");
            $("#loadingBar").css("display","none");      
        },
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
            if(data.status == 200){
                alert(language.Added);
                entitiesAjax();
            } else if(data.status == 'Duplicate') {
                alert(language.DUPLICATE_ENTITIES_EXIST);
            } else {
                alert(language.It_failed);
            }
        }
    });



}

//엔티티 추가
function insertEntity(){

    if ($('#entityDefine').val().trim() === "") {
        alert(language.Please_enter);
        return false;
    }
    var valueText = false;
    
    $('.entityValDiv input[name=entityValue]').each(function() {
        if ($(this).val().trim() === "") {
            valueText = true;
            return;
        }
    });

    if (valueText) {
        alert(language.Please_enter);
        return ;
    }

    
    //
    var entityDefineVal = $('#entityDefine').val().trim();
    var apiGroupVal = $('#apiGroup :selected').val();
    var entityValueList = [];
    $('.entityValDiv input[name=entityValue]').each(function() {
        
        for (var i=0; i<entityValueList.length; i++) {
            if ( entityValueList[i].entityValue === $(this).val().trim()) {
                valueText = true;
            }
        }

        var obj = new Object();
        obj.entityDefine = entityDefineVal;
        obj.apiGroup = apiGroupVal;
        obj.entityValue = $(this).val().trim();
        entityValueList.push(obj);
    });

    if (valueText) {
        alert(language.DUPLICATE_ENTITIES_EXIST);
        return ;
    }
    
    $.ajax({
        url: '/learning/insertEntity',
        dataType: 'json',
        contentType: 'application/json',
        type: 'POST',
        data: JSON.stringify(entityValueList), //$('#appInsertForm').serializeObject(),
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

            if(data.status == 200){
                //alert(language.Added);
                $('#proc_content').html("등록되었습니다.");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
                $('.addDialogCancel').click();
                entitiesAjax();
            } else if(data.status == 'Duplicate') {
                //alert(language.DUPLICATE_ENTITIES_EXIST);
                $('#proc_content').html("이미 등록된 Entity 입니다.");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
            } else {
                //alert(language.It_failed);
                $('#proc_content').html("등록에 실패되었습니다.");
                $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
                $('#procEntity').modal('show');
            }
        }
    });
}

//엔티티 추가 group selbox 설정
function selectApiGroup() {
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        //data: params,
        url: '/learning/selectApiGroup',
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
            if (data.groupList) {
                var groupList = data.groupList;
                var optionStr = "";
                for (var i=0; i<groupList.length; i++) {
                    optionStr += '<option value="' + groupList[i].API_GROUP + '">' + groupList[i].API_GROUP + '</option>'
                }
                $('#apiGroup').html(optionStr);
                $('#updateApiGroup').html(optionStr);
            }
        }
    });
}
//** 모달창 끝 */