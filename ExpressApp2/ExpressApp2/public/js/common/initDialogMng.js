var language;
; (function ($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function (data) {
            language = data.lang;

        }
    });
})(jQuery);

$(document).ready(function() {
    makeInitDlgTable();
});

$(document).ready(function() {
    
});
var listPageNo = "";
function makeInitDlgTable() {
    
    params = {
        'dlgGroupType': $('#dlgGroupType').val(),
        'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'searchTitleTxt': $('#searchTitleTxt').val(),
        'searchDescTxt': $('#searchDescTxt').val()
    };
    listPageNo = ($('#currentPage').val() == '') ? 1 : $('#currentPage').val();
    $.tiAjax({
        type: 'POST',
        url: '/qna/initDialogList',
        data: params,
        isloading: true,
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
            searchTitleTxt = $('#searchTitleTxt').val();
            searchDescTxt = $('#searchDescTxt').val();
            $('#dialogTbltbody').html('');
            var item = '';
            var type_name = "";
            var dlgNameHtml = "";
            var dlgGroupHtml = "";
            if (data.list.length > 0) {
                for (var i = 0; i < data.list.length; i++) {
                    if(data.list[i].DLG_TYPE==2){
                        type_name = language.DLG_TEXT;
                    }else if(data.list[i].DLG_TYPE==3){
                        type_name = language.DLG_CARD;
                    }else if(data.list[i].DLG_TYPE==4){
                        type_name = language.DLG_MEDIA;
                    }else{
                        type_name = "NONE";
                    }

                    if(data.list[i].DLG_NAME==null){
                        dlgNameHtml = "";
                    }else{
                        dlgNameHtml = data.list[i].DLG_NAME;
                    }

                    if(data.list[i].DLG_GROUP==1){
                        dlgGroupHtml = language.WELCOME_MESSAGE;
                    }else if(data.list[i].DLG_GROUP==5){
                        dlgGroupHtml = language.SORRY_MESSAGE;
                    }else if(data.list[i].DLG_GROUP==6){
                        dlgGroupHtml = language.SUGGEST_MESSAGE1;
                    }else if(data.list[i].DLG_GROUP==7){
                        dlgGroupHtml = language.SUGGEST_MESSAGE2;
                    }else if(data.list[i].DLG_GROUP==3){
                        dlgGroupHtml = language.BANDEDWORD_TYPE1;
                    }else if(data.list[i].DLG_GROUP==4){
                        dlgGroupHtml = language.BANDEDWORD_TYPE2;
                    }else{
                        dlgGroupHtml = "NONE";
                    }

                    item += '<tr>' +
                        '<td>' + dlgGroupHtml + '</td>' +
                        '<td class="tex01" id="show_dlg" listPageNo="'+listPageNo+'" page_type="initDlg" dlg_id="' + data.list[i].DLG_ID + '"><a href="#" onclick="return false;">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        '<td>' + type_name + '</td>' +
                        '<td>' + data.list[i].DLG_ORDER_NO + '</td>' +
                        '<td><a href="#" onclick="deleteDialogModal(' + data.list[i].DLG_ID + ',\'init\');return false;"><span class="fa fa-trash"></span></a></td>' +
                        '</tr>';

                }
            } else {
                item += '<tr style="height: 175px;">' +
                    '<td colspan="5">' + language.NO_DATA + '</td>' +
                    '</tr>';
            }

            currentSearchNum = 2;
            $('#dialogTbltbody').append(item);

            $('#pagination').html('').append(data.pageList);

        }
    });
}

$(document).on('click','.li_paging',function(e){
 
    if(!$(this).hasClass('active')){
        $('#currentPage').val($(this).val());
        makeInitDlgTable();
    }
});

var insertForm;
var dlgForm;
var carouselForm;
var mediaForm;
var chkEntities;
var addCarouselForm;
var deleteInsertForm;
function openModalBox(target) {

    $('#title').val('');

    // 화면의 높이와 너비를 변수로 만듭니다.
    var maskHeight = $(document).height();
    var maskWidth = $(window).width();

    // 마스크의 높이와 너비를 화면의 높이와 너비 변수로 설정합니다.
    $('.mask').css({ 'width': maskWidth, 'height': maskHeight });


    // 레이어 팝업을 가운데로 띄우기 위해 화면의 높이와 너비의 가운데 값과 스크롤 값을 더하여 변수로 만듭니다.
    var left = ($(window).scrollLeft() + ($(window).width() - $(target).width()) / 2);
    var top = ($(window).scrollTop() + ($(window).height() - $(target).height()) / 2);

    // css 스타일을 변경합니다.
    $(target).css({ 'left': left, 'top': top, 'position': 'absolute' });

    // 레이어 팝업을 띄웁니다.
    setTimeout(function () {
        $(target).fadeIn();
        $('#dialogPreview').css({ 'height': '80%' });
    }, 250);

    $('html').css({ 'overflow': 'hidden', 'height': '100%' });
    $('#element').on('scroll touchmove mousewheel', function (event) { // 터치무브와 마우스휠 스크롤 방지
        event.preventDefault();
        event.stopPropagation();
        return false;
    });
    wrapWindowByMask();

    //carousel clone 초기값 저장
    //$insertForm = $('#commonLayout .insertForm').eq(0).clone();
    insertForm = '<div class="insertForm">';
    insertForm += '<div class="form-group">';
    insertForm += '<form name="dialogLayout" id="dialogLayout">';
    insertForm += '<label>' + language.DIALOG_BOX_TYPE + '<span class="nec_ico">*</span> </label>';
    insertForm += '<select class="form-control" name="dlgType">';
    insertForm += '<option value="2">' + language.TEXT_TYPE + '</option>';
    insertForm += '<option value="3">' + language.CARD_TYPE + '</option>';
    //insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
    insertForm += '</select>';
    insertForm += '<div class="btn_wrap" style="clear:both" >';
    insertForm += '</div>';
    insertForm += '<div class="clear-both"></div>';
    insertForm += '</form>';
    insertForm += '</div>';
    insertForm += '</div>';

    carouselForm = '<div class="carouselLayout">' +
        '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '</label>' +
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group form-inline">' +
        '<label>Card_Mobile</label>' +
        '&nbsp;&nbsp;<select class="form-control" name="cardValue" id="cardValue"><option value="">미적용</option><option value="m^^">적용</option></select>' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default deleteCard"><i class="fa fa-trash"></i> ' + language.DELETE_CARD + '</button>' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default carouseBtn"><i class="fa fa-plus"></i> ' + language.INSERT_MORE_BUTTON + '</button>' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '</div>';

    addCarouselForm = '<div class="btn_wrap addCarouselBtnDiv" style="clear:both" >' +
        '<button type="button" class="btn btn-default addCarouselBtn"><i class="fa fa-plus"></i> ' + language.INSERT_MORE_CARDS + '</button>' +
        '</div>'

    mediaForm = '<div class="mediaLayout">' +
        '<label>' + language.IMAGE_URL + '<span class="nec_ico">*</span></label>' +
        '<input type="text" name="mediaImgUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
        '<div class="form-group">' +
        '<label>' + language.MEDIA_URL + '</label>' +
        '<input type="text" name="mediaUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default addMediaBtn" ><i class="fa fa-plus"></i> ' + language.INSERT_MORE_BUTTON + '</button>' +
        '<div class="clear-both"></div>' +
        '</div>';

    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '</label>' +
        //'<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '">' +
        '<textarea id="dialogText" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder=" ' + language.Please_enter + ' " rows="5"></textarea>' +
        '</div>' +
        '</div>';

    deleteInsertForm = '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >' +
        '<button type="button" class="btn btn-default deleteInsertForm"><i class="fa fa-trash"></i> ' + language.DELETE_DIALOG + '</button>' +
        '</div>'
    
    if (target == "#create_dlg") {
        $(".insertForm form").append($(".textLayout").clone(true));
        $(".insertForm form").append(deleteInsertForm);

        $('h4#myModalLabel.modal-title').text(language.CREATE_DIALOG_BOX);
        $('#description').text('');

        $(".insertForm .textLayout").css("display", "block");
        /*
        * intent 부분이 text 타입
        */
        var $iptLuisIntent = $('input[name=predictIntent]');
        var $selectLuisIntent = $('select[name=predictIntent]');

        $iptLuisIntent.show();
        $iptLuisIntent.removeAttr('disabled');

        $selectLuisIntent.hide();
        $selectLuisIntent.attr('disabled', 'disabled');

        $("#createDialog").attr('onclick', 'createDialog()');
        $("#createDialog").text(language.SAVE);
    }

    if (target == "#search_dlg") {
        selectGroup('searchLargeGroup');
    }

}

function wrapWindowByMask() { //화면의 높이와 너비를 구한다. 
    var maskHeight = $(document).height();
    var maskWidth = $(window).width(); //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채운다. 
    $('#layoutBackground').css({ 'width': maskWidth, 'height': maskHeight }); //마스크의 투명도 처리 
    $('#layoutBackground').fadeTo("fast", 0.7);
}

function selectInent(intent) {
    //intent하위 entity 존재하면 entity select box disable제거되게 구현해야함
    $('#entityList').removeAttr("disabled");
}

function selectEntity(entity) {
    //intent하위 entity 존재하면 entity select box disable제거되게 구현해야함
    $('#btnAddDlg').removeAttr("disabled");
    $('#btnAddDlg').removeClass("disable");
}

function initMordal(objId, objName) {
    //<option selected="selected" disabled="disabled">Select Intent<!-- 서비스 선택 --></option>
    if (objId == 'entityList') {
        $('#' + objId).attr("disabled", "disabled");
    }
    $('#btnAddDlg').attr("disabled", "disabled");
    $('#btnAddDlg').addClass("disable");

    $('#' + objId + ' option:eq(0)').remove();
    $('#' + objId).prepend('<option selected="selected" disabled="disabled">' + objName + '</option>');

}

//다이얼로그 생성 유효성 검사
function dialogValidation(type) {
    if (type == 'dialogInsert') {
        var dialogText = $('#dialogText').val();

        if (dialogText != "") {
            $('#btnAddDlg').removeClass("disable");
            $('#btnAddDlg').attr("disabled", false);
        } else {
            $('#btnAddDlg').attr("disabled", "disabled");
            $('#btnAddDlg').addClass("disable");
        }
    }
}

function createDialog() {

    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;


    if($('#dlgOrderNo').val().length < 1){
        alert(language.IS_REQUIRED);
        exit = true;
        return false;
    }

    //$('.insertForm input[name=dialogText]').each(function (index) {
    $('.insertForm textarea[name=dialogText]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.You_must_enter_the_dialog_text);
            exit = true;
            return false;
        }
    });

    
    
    if (exit) return;

    //dialogText textarea 값 치환
    var temp = $("#dialogText").val();
    temp = temp.replace(/(?:\r\n|\r|\n)/g, '/n');
    $("#dialogText").val(temp);

    $('.insertForm input[name=mediaImgUrl]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.ImageURL_must_be_entered);
            exit = true;
            return false;
        }
    });

    if (exit) return;


    for (var i = 0; i < idx; i++) {
        var tmp = $("form[name=dialogLayout]").eq(i).serializeArray();
        var object = {};
        var carouselArr = [];
        var objectCarousel = {};
        if (tmp[0].value === "3") {
            var btnTypeCount = 1;
            var cButtonContentCount = 1;
            var cButtonNameCount = 1;
            for (var j = 1; j < tmp.length; j++) {
                if (tmp[j].name == 'btnType') {
                    tmp[j].name = 'btn' + (btnTypeCount++) + 'Type';
                    if (btnTypeCount == 5) {
                        btnTypeCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonContent') {
                    tmp[j].name = 'cButtonContent' + (cButtonContentCount++);
                    if (cButtonContentCount == 5) {
                        cButtonContentCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonName') {
                    tmp[j].name = 'cButtonName' + (cButtonNameCount++);
                    if (cButtonNameCount == 5) {
                        cButtonNameCount = 1;
                    }
                }

                if (typeof objectCarousel[tmp[j].name] !== "undefined") {
                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    btnTypeCount = 1;
                    cButtonContentCount = 1;
                    cButtonNameCount = 1;
                }

                if (j === tmp.length - 1) {
                    object[tmp[0].name] = tmp[0].value;
                    objectCarousel[tmp[j].name] = tmp[j].value;

                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    break;
                }
                object[tmp[0].name] = tmp[0].value;
                objectCarousel[tmp[j].name] = tmp[j].value;
            }
            //carouselArr.push(objectCarousel);
            object['carouselArr'] = carouselArr;
        } else if (tmp[0].value === "4") {

            var btnTypeCount = 1;
            var mButtonContentCount = 1;
            var mButtonNameCount = 1;

            for (var j = 0; j < tmp.length; j++) {

                if (tmp[j].name == 'btnType') {
                    tmp[j].name = 'btn' + (btnTypeCount++) + 'Type';
                }
                if (tmp[j].name == 'mButtonContent') {
                    tmp[j].name = 'mButtonContent' + (mButtonContentCount++);

                }
                if (tmp[j].name == 'mButtonName') {
                    tmp[j].name = 'mButtonName' + (mButtonNameCount++);
                }

                object[tmp[j].name] = tmp[j].value;
            }

        } else {
            for (var j = 0; j < tmp.length; j++) {
                object[tmp[j].name] = tmp[j].value;
            }
        }

        array[i] = JSON.stringify(object);//JSON.stringify(tmp);//tmp.substring(1, tmp.length-2);
    }
    //JSON.stringify($("form[name=appInsertForm]").serializeObject());
    array[array.length] = JSON.stringify($("form[name=appInsertForm]").serializeObject());//JSON.stringify($("form[name=appInsertForm]"));

    $.ajax({
        url: '/learning/addDialog',
        dataType: 'json',
        type: 'POST',
        data: { 'data': array, /*'entities' : chkEntities*/ },
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
            //alert(language.Added);

            var inputUttrHtml = '';
            for (var i = 0; i < data.list.length; i++) {
                inputUttrHtml += '<input type="hidden" name="dlgId" value="' + data.list[i] + '"/>';
            }
            //var largeGroup = $('#appInsertForm').find('#largeGroup')[0].value
            var largeGroup;
            var middleGroup;
            $('#appInsertForm').find('[name=middleGroup]').each(function () {
                if ($(this).attr('disabled') == undefined) {
                    luisIntent = $(this).val();
                    return false;
                }
            })
            $('.newMidBtn').click();
            $('.cancelMidBtn').click();

            inputUttrHtml += '<input type="hidden" name="largeGroup" value="' + largeGroup + '"/>';
            inputUttrHtml += '<input type="hidden" name="middleGroup" value="' + middleGroup + '"/>';

            var createDlgClone = $('.dialogView').children().clone();
            $('.dialog_box').html('');
            $('.dialog_box').append(createDlgClone);
            $('.dialog_box').append(inputUttrHtml);
            $('.createDlgModalClose').click();

            $('#proc_content').html(language.Added);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
            $('#procDialog').modal('show');
            
            makeInitDlgTable();
        }
    });
}

function updateInitDialog() {

    var dlgId = $('#updateDlgId').val();
    var dlgType = $('#updateDlgType').val();
    var entity = $('#updateDlgEntity').val();

    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;
    /*
    order no 공백 체크할 것
    if ($('#description').val().trim() === "") {
        alert(language.Description_must_be_entered);
        return false;
    }
*/
    $('.insertForm textarea[name=dialogText]').each(function (index) {
        if ($(this).val().trim() === "") {
            //alert(language.You_must_enter_a_Dialog_Title);
            /*
            $('#alertMsg').text(language.You_must_enter_a_Dialog_Title);
            $('#alertBtnModal').modal('show');
            exit = true;
            return false;
*/
            $('#proc_content').html(language.You_must_enter_a_Dialog_Title);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
            $('#procDialog').modal('show');
            return;
            
        }
    });

    //dialogText textarea 값 치환
    var temp = $("#dialogText").val();
    temp = temp.replace(/(?:\r\n|\r|\n)/g, '/n');
    $("#dialogText").val(temp);

    if (exit) return;
    $('.insertForm input[name=imgUrl]').each(function (index) {
        if ($(this).val().trim() === "") {
            /*
            $('#alertMsg').text(language.ImageURL_must_be_entered);
            $('#alertBtnModal').modal('show');
            exit = true;
            return false;
            $('#proc_content').html(language.ImageURL_must_be_entered);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
            $('#procDialog').modal('show');
            return false;
            */
        }
    });
    //if (exit) return;


    for (var i = 0; i < idx; i++) {
        var tmp = $("form[name=dialogLayout]").eq(i).serializeArray();
        var object = {};
        var carouselArr = [];
        var objectCarousel = {};
        if (tmp[0].value === "3") {
            var btnTypeCount = 1;
            var cButtonContentCount = 1;
            var cButtonNameCount = 1;
            for (var j = 1; j < tmp.length; j++) {
                if (tmp[j].name == 'btnType') {
                    tmp[j].name = 'btn' + (btnTypeCount++) + 'Type';
                    if (btnTypeCount == 5) {
                        btnTypeCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonContent') {
                    tmp[j].name = 'cButtonContent' + (cButtonContentCount++);
                    if (cButtonContentCount == 5) {
                        cButtonContentCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonName') {
                    tmp[j].name = 'cButtonName' + (cButtonNameCount++);
                    if (cButtonNameCount == 5) {
                        cButtonNameCount = 1;
                    }
                }

                if (typeof objectCarousel[tmp[j].name] !== "undefined") {
                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    btnTypeCount = 1;
                    cButtonContentCount = 1;
                    cButtonNameCount = 1;
                }

                if (j === tmp.length - 1) {
                    object[tmp[0].name] = tmp[0].value;
                    objectCarousel[tmp[j].name] = tmp[j].value;

                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    break;
                }
                object[tmp[0].name] = tmp[0].value;
                objectCarousel[tmp[j].name] = tmp[j].value;
            }
            //carouselArr.push(objectCarousel);
            object['carouselArr'] = carouselArr;
       
        } else {
            for (var j = 0; j < tmp.length; j++) {
                object[tmp[j].name] = tmp[j].value;
            }
        }

        array[i] = JSON.stringify(object);//JSON.stringify(tmp);//tmp.substring(1, tmp.length-2);
    }
    
    array[array.length] = JSON.stringify($("form[name=appInsertForm]").serializeObject());//JSON.stringify($("form[name=appInsertForm]"));

    $.ajax({
        url: '/qna/updateInitDialog',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgId': dlgId, 'dlgType': dlgType, 'updateData': array, 'entity': entity },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            
            $('#proc_content').html(language.REGIST_SUCC);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
            $('#procDialog').modal('show');
            
            $('.createDlgModalClose').click();

            makeInitDlgTable();
        }

    });
}