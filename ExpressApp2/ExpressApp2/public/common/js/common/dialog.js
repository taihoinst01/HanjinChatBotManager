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

var rememberSelBoxHtml = '';
var $insertForm;
var $dlgForm;
var $carouselForm;
var $mediaForm;


$(document).ready(function () {

    // groupType 사양및 장단점 역할
    // sourceType 구분 역할
    var groupType = $('.selected').text();
    var sourceType = $('#tblSourceType').val();
    selectDlgByTxt(groupType, sourceType);

    //api selbox 초기설정
    //selectApiGroup();

    //검색 enter
    $('#iptDialog').keyup(function (e) {
        if (e.keyCode == 13) {
            searchIptDlg(1);
            //selectDlgByTxt('selectDlgByTxt', 'search');
        }
    });


    //그룹박스
    $('.selectbox .selected').click(function (e) {
        $('.selectOptionsbox').toggleClass('active');
        e.stopPropagation();
    });

    //그룹박스 영역 이외에 클릭시 그룹박스 닫기
    $('html').click(function (e) {

        if (!$(e.target).hasClass("selectArea")) {

            $('.selectOptionsbox').removeClass('active');
        }
    });

    $('#tblSourceType').change(function () {

        groupType = $('.selected').text();
        sourceType = $('#tblSourceType').val();
        $('#currentPage').val(1);
        rememberSelBoxHtml = $('#selBoxBody').html();

        selectDlgByTxt(groupType, sourceType);

    });
    //다이얼로그생성모달 버튼Add From
    $('#addDialogBtn').click(function (e) {
        //$(".insertForm:eq(0)").clone(true).appendTo(".copyForm");
        //$(".copyForm textarea[name=dialogText]:last").val('');

        var insertForm = '';
        insertForm += '<hr>';
        insertForm += '<div class="insertForm">';
        insertForm += '<div class="form-group" >';
        insertForm += '<form name="dialogLayout" id="dialogLayout">';

        insertForm += '<label>' + language.DIALOG_BOX_TYPE + '<span class="nec_ico">*</span></label>';
        insertForm += '<select class="form-control" name="dlgType">';
        insertForm += '<option value="2">' + language.TEXT_TYPE + '</option>';
        insertForm += '<option value="3">' + language.CARD_TYPE + '</option>';
        insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
        insertForm += '</select>';
        insertForm += '<div class="clear-both"></div>';

        insertForm += '<div class="textLayout" style="display: block;">';
        insertForm += '<div class="btn_wrap" style="clear:both">';
        insertForm += '</div>'
        insertForm += '<div class="form-group">';
        insertForm += '<label>' + language.DIALOG_BOX_TITLE + '</label>';
        insertForm += '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder=" ' + language.Please_enter + '">';
        insertForm += '</div>';
        insertForm += '<div class="form-group">';
        insertForm += '<label>' + language.DIALOG_BOX_CONTENTS + '<span class="nec_ico">*</span></label>';
        insertForm += '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder=" ' + language.Please_enter + ' ">';
        insertForm += '</div>';
        insertForm += '</div>';
        insertForm += '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >';
        insertForm += '<button type="button" class="btn btn-default deleteInsertForm">' + language.DELETE_DIALOG + '</button>';
        insertForm += '</div>';
        insertForm += '</form>';
        insertForm += '</div>';
        insertForm += '</div>';

        $(".insertForm:last").after(insertForm);
        //$(".insertFormWrap").append(insertForm);
        var dialogView = '';
        dialogView += '<div class="dialogView" >';
        dialogView += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
        dialogView += '<div class="wc-message-content">';
        dialogView += '<svg class="wc-message-callout"></svg>';
        dialogView += '<div>';
        dialogView += '<div class="format-markdown">';
        dialogView += '<div class="textMent">';
        dialogView += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
        dialogView += '<p>' + language.Please_enter_your_content + '</p>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';

        $('#dialogViewWrap').append(dialogView);
        e.stopPropagation();
        e.preventDefault();

    });


    //다이얼로그생성모달 - 미디어버튼추가
    $(document).on('click', '.addMediaBtn', function (e) {

        var inputHtml = '<label>' + language.BUTTON + '</label></div>' +
            '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
            '<table class="mediaCopyTbl" style="width:100%"><col width="21%">' +
            '<col width="1%"><col width="35%"><col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
            '<thead><tr><th>' + language.Type + '</th><th></th>' +
            '<th>' + language.NAME + '</th><th></th><th>' + language.CONTENTS + '</th>' +
            '<th></th><th></th></tr></thead><tbody>' +
            '<tr><td>' +
            '<select class="form-control" name="btnType">' +
            '<option value="imBack" selected>imBack</option>' +
            '<option value="openURL">openURL</option>' +
            '</select>' +
            '</td><td></td>' +
            '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '">' +
            '</td><td></td><td>' +
            '<input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '">' +
            '</td><td></td><td>' +
            '<a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a>' +
            '</td></tr></tbody></table></div></div></div>';

        $btnInsertDiv = $(this).parent().prev();
        if ($btnInsertDiv.children().length == 0) {
            $btnInsertDiv.html(inputHtml);
            return;
        }
        var trLength = $btnInsertDiv.find('tbody tr').length;
        if (trLength >= 1 && trLength < 4) {

            var inputTrHtml = '<tr>' +
                '<td>' +
                '<select class="form-control" name="btnType">' +
                '<option value="imBack" selected>imBack</option>' +
                '<option value="openURL">openURL</option>' +
                '</select>' +
                '</td><td></td>' +
                '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
                '<td></td><td><input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
                '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
                '</tr>'
            $(this).parent().prev().find('tbody').append(inputTrHtml);
        } else {
            alert(language.Up_to_4_buttons_can_be_added);
        }

    });

    // 다이얼로그 생성 모달 (다이얼로그 타입변경)
    $(document).on('change', 'select[name=dlgType]', function (e) {

        addCarouselForm = '<div class="btn_wrap addCarouselBtnDiv" style="clear:both" >' +
            '<button type="button" class="btn btn-default addCarouselBtn">' + language.INSERT_MORE_CARDS + '</button>' +
            '</div>';

        carouselForm = '<div class="carouselLayout">' +
            '<div class="form-group">' +
            '<label>' + language.IMAGE_URL + '</label>' +
            '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
            '</div>' +
            '<div class="modal_con btnInsertDiv">' +
            '</div>' +
            '<div class="clear-both"></div>' +
            '<div class="btn_wrap" style="clear:both" >' +
            '<button type="button" class="btn btn-default deleteCard">' + language.DELETE_CARD + '</button>' +
            '</div>' +
            '<div class="btn_wrap" style="clear:both" >' +
            '<button type="button" class="btn btn-default carouseBtn">' + language.INSERT_MORE_BUTTON + '</button>' +
            '</div>' +
            '<div class="clear-both"></div>' +
            '</div>';

        mediaForm = '<label>' + language.IMAGE_URL + '<span class="nec_ico">*</span></label>' +
            '<input type="text" name="mediaImgUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
            '<div class="form-group">' +
            '<label>' + language.MEDIA_URL + '</label>' +
            '<input type="text" name="mediaUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
            '</div>' +
            '<div class="modal_con btnInsertDiv">' +
            '</div>' +
            '<div class="btn_wrap" style="clear:both" >' +
            '<button type="button" class="btn btn-default addMediaBtn" >' + language.INSERT_MORE_BUTTON + '</button>' +
            '<div class="clear-both"></div>';

        var idx = $("select[name=dlgType]").index(this);
        var insertHtml = "";

        $('.insertForm:eq(' + idx + ') .carouselLayout').remove();
        $('.insertForm:eq(' + idx + ') .carouselLayout').after().remove();
        $('.insertForm:eq(' + idx + ') .mediaLayout').remove();
        $('.insertForm:eq(' + idx + ') .mediaLayout').after().remove();
        $('.insertForm:eq(' + idx + ')').find('.clear-both').each(function (index) {
            $('.insertForm:eq(' + idx + ') form').find('.addCarouselBtnDiv').remove();
            if (index != 0) {
                $(this).next().remove();
                $(this).remove();
            }
        });

        if ($(e.target).val() == "2") {

        } else if ($(e.target).val() == "3") {
            //var $clone = $('.carouselLayout').clone();  <div id="carouselLayout" style="display: block;">[object Object]</div>
            //var caraousHtml = '<div class="carouselLayout" style="display: block;">' +  + '</div>'
            $('.insertForm:eq(' + idx + ') form .deleteInsertFormDiv').before(addCarouselForm);
            $('.insertForm:eq(' + idx + ') form').find('.addCarouselBtnDiv').before(carouselForm);
            $('.insertForm:eq(' + idx + ') .carouselLayout').css('display', 'block');
            $('.insertForm:eq(' + idx + ') .carouselLayout').find('.addCarouselBtn:last').closest('div').css('display', 'inline-block');
        } else if ($(e.target).val() == "4") {
            //var mediaForm = '<div id="mediaLayout" style="display: block;">' + $mediaForm.html() + '</div>'
            $('.insertForm:eq(' + idx + ') form .deleteInsertFormDiv').before('<div class="mediaLayout" style="display:none;">' + mediaForm + '</div>');
            //$('.insertForm:eq(' + idx + ') form').append('<div class="mediaLayout" style="display:none;">' + mediaForm + '</div>') ;
            $('.insertForm:eq(' + idx + ') .mediaLayout').css('display', 'block');
            $('.insertForm:eq(' + idx + ') .mediaLayout').find('.addMediaBtn:last').closest('div').css('display', 'inline-block');
        }

        if ($(e.target).val() == "2") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
            insertHtml += '<div class="wc-message-content">';
            insertHtml += '<svg class="wc-message-callout"></svg>';
            insertHtml += '<div><div class="format-markdown"><div class="textMent">';
            insertHtml += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
            insertHtml += '<p>';
            insertHtml += language.Please_enter;
            insertHtml += '</p>';
            insertHtml += '</div></div></div></div></div>';

            $(".dialogView").eq(idx).html(insertHtml);
        } else if ($(e.target).val() == "3") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class="wc-message wc-message-from-bot" style="width:90%">';
            insertHtml += '<div class="wc-message-content" style="width:90%;">';
            insertHtml += '<svg class="wc-message-callout"></svg>';
            insertHtml += '<div class="wc-carousel slideBanner" style="width: 312px;">';
            insertHtml += '<div>';
            insertHtml += '<button class="scroll previous" id="prevBtn' + (idx) + '" style="display: none; height: 30px;" onclick="prevBtn(' + idx + ', this)">';
            insertHtml += '<img src="/images/02_contents_carousel_btn_left_401x.png">';
            insertHtml += '</button>';
            insertHtml += '<div class="wc-hscroll-outer" >';
            insertHtml += '<div class="wc-hscroll slideDiv" style="margin-bottom: 0px;" class="content" id="slideDiv' + (idx) + '">';
            insertHtml += '<ul style="padding-left: 0px;">';
            insertHtml += '<li class="wc-carousel-item">';
            insertHtml += '<div class="wc-card hero">';
            insertHtml += '<div class="wc-container imgContainer">';
            insertHtml += '<img src="/images/02_teaser.jpg">';
            insertHtml += '</div>';
            insertHtml += '<h1>' + language.Please_enter_a_title + '</h1>';
            insertHtml += '<p class="carousel">' + language.Please_enter_your_content + '</p>';
            insertHtml += '<ul class="wc-card-buttons" style="padding-left: 0px;"><li><button>BTN_1_TITLE</button></li></ul>';
            insertHtml += '</div>';
            insertHtml += '</li>';

            insertHtml += '</ul>';
            insertHtml += '</div>';
            insertHtml += '</div>';
            insertHtml += '<button class="scroll next" style="display: none; height: 30px;" id="nextBtn' + (idx) + '" onclick="nextBtn(' + idx + ', this)"><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
            insertHtml += '</div></div></div></div>';
            $(".dialogView").eq(idx).html(insertHtml);
        } else if ($(e.target).val() == "4") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class="wc-message wc-message-from-bot">';
            insertHtml += '<div class="wc-message-content">';
            insertHtml += '<svg class="wc-message-callout"></svg>';
            insertHtml += '<div>';
            insertHtml += '<div class="wc-carousel">';
            insertHtml += '<div>';
            insertHtml += '<button class="scroll previous" disabled=""><img src="/images/02_contents_carousel_btn_left_401x.png"></button>';
            insertHtml += '<div class="wc-hscroll-outer">';
            insertHtml += '<div class="wc-hscroll" style="margin-bottom: 0px;">';
            insertHtml += '<ul style="padding-left: 0px;">';
            insertHtml += '<li class="wc-carousel-item wc-carousel-play">';
            insertHtml += '<div class="wc-card hero">';
            insertHtml += '<div class="wc-card-div imgContainer">';
            insertHtml += '<input type="hidden" name="dlgId" value="dlg_id"/>';
            insertHtml += '<img src="/images/USP_convenience_09.jpg">';
            insertHtml += '<div class="playImg"></div>';
            insertHtml += '<div class="hidden" alt="card_title"></div>';
            insertHtml += '<div class="hidden" alt="card_value"></div>';
            insertHtml += '</div>';
            insertHtml += '<h1>' + language.Please_enter_a_title + '</h1>';
            insertHtml += '<p class="dlgMediaText">' + language.Please_enter_your_content + '</p>';
            insertHtml += '<ul class="wc-card-buttons" style="padding-left: 0px;">';
            insertHtml += '<li><button>BTN_1_TITLE</button></li></ul>';
            insertHtml += '</ul>';
            insertHtml += '</div>';
            insertHtml += '</li></ul></div></div>';
            insertHtml += '<button class="scroll next" disabled=""><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
            insertHtml += '</div></div></div></div></div>';

            $(".dialogView").eq(idx).html(insertHtml);
        }
    });

    //다이얼로그 생성 - 닫는 버튼
    $('.createDlgModalClose').click(function () {
        $('#mediaCarouselLayout').css('display', 'none');
        $('#cardLayout').css('display', 'none');
        $('#appInsertForm')[0].reset();
        $('.insertForm').remove();
        $('#commonLayout hr').remove();
        $('.btnInsertDiv').each(function () {
            $(this).html("");
        })

        var insertForm = '';
        insertForm += '<div class="insertForm">';
        insertForm += '<div class="form-group" >';
        insertForm += '<form name="dialogLayout" id="dialogLayout">';
        insertForm += '<label>' + language.DIALOG_BOX_TYPE + '<span class="nec_ico">*</span> </label>';
        insertForm += '<select class="form-control" name="dlgType">';
        insertForm += '<option value="2">' + language.TEXT_TYPE + '</option>';
        insertForm += '<option value="3">' + language.CARD_TYPE + '</option>';
        insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
        insertForm += '</select>';
        insertForm += '<div class="clear-both"></div>';
        insertForm += '</form>';
        insertForm += '</div>';
        insertForm += '</div>';

        $('#apiLayout').css('display', 'none');
        $('#commonLayout').css('display', 'block');
        $('#commonLayout').prepend(insertForm);

        if ($('#btnCreateLMiddle').html() == '취소' || $('#btnCreateMiddle').html() == 'CANCEL') {

            $('#btnCreateMiddle').click();
        }
        var dialogView = '';
        dialogView += '<div class="dialogView" >';
        dialogView += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
        dialogView += '<div class="wc-message-content">';
        dialogView += '<svg class="wc-message-callout"></svg>';
        dialogView += '<div>';
        dialogView += '<div class="format-markdown">';
        dialogView += '<div class="textMent">';
        dialogView += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
        dialogView += '<p>' + language.Please_enter + '</p>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        $('#dialogViewWrap').html(dialogView);
    });

    //다이얼로그 생성 모달 닫는 이벤트(초기화)
    $(".js-modal-close").click(function () {
        $('html').css({ 'overflow': 'auto', 'height': '100%' }); //scroll hidden 해제
        //$('#element').off('scroll touchmove mousewheel'); // 터치무브 및 마우스휠 스크롤 가능

        $('#appInsertDes').val('');
        $("#intentList option:eq(0)").attr("selected", "selected");
        //$('#intentList').find('option:first').attr('selected', 'selected');
        initMordal('intentList', 'Select Intent');
        initMordal('entityList', 'Select Entity');
        $('#dlgLang').find('option:first').attr('selected', 'selected');
        $('#dlgOrder').find('option:first').attr('selected', 'selected');
        $('#layoutBackground').hide();
    });
    /** 모달 끝 */

    // 다이얼로그 생성 모달 (소스 타입 변경)
    $('#sourceType').change(function (e) {
        if ($(e.target).val() == "API") {
            $('.dialogView').html('');
            $('#commonLayout').css('display', 'none');
            $('#apiLayout').css('display', 'block');
        } else {

            $('.insertForm').remove();
            var insertForm = '';
            insertForm += '<div class="insertForm">';
            insertForm += '<div class="form-group" >';
            insertForm += '<form name="dialogLayout" id="dialogLayout">';
            insertForm += '<label>' + language.DIALOG_BOX_TYPE + '<span class="nec_ico">*</span> </label>';
            insertForm += '<select class="form-control" name="dlgType">';
            insertForm += '<option value="2">' + language.TEXT_TYPE + '</option>';
            insertForm += '<option value="3">' + language.CARD_TYPE + '</option>';
            insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
            insertForm += '</select>';
            insertForm += '<div class="clear-both"></div>';
            insertForm += '</form>';
            insertForm += '</div>';
            insertForm += '</div>';

            $('#commonLayout').css('display', 'block');
            $('#commonLayout').prepend(insertForm);
            var dialogView = '';
            dialogView += '<div class="dialogView" >';
            dialogView += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
            dialogView += '<div class="wc-message-content">';
            dialogView += '<svg class="wc-message-callout"></svg>';
            dialogView += '<div>';
            dialogView += '<div class="format-markdown">';
            dialogView += '<div class="textMent">';
            dialogView += '<p>' + language.Please_enter + '</p>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            $('#dialogViewWrap').html(dialogView);

            $('#apiLayout').css('display', 'none');
            $(".insertForm form").append($(".textLayout").clone(true));
            $('.insertForm .textLayout').css('display', 'block');
        }
    });

    // 다이얼로그 생성 모달
    $('#btnCreateMiddle').on('click', function (e) {
        if ($(this).html() == "신규" || $(this).html() == "NEW") {
            $(this).html(language.CANCEL);
            $('#middleGroupEdit').css('display', 'block');
            $('#middleGroup').css('display', 'none');
        } else {
            $(this).html(language.NEW);
            $('#middleGroupEdit').css('display', 'none');
            $('#middleGroup').css('display', 'block');
        }

        return;
    });

    $('#iptDialog').on('input', function (e) {

        if ($(this).val() !== "") {
            $(this).next().removeClass('disable');
            $(this).next().prop("disabled", false);
        } else {
            $(this).next().addClass('disable');
            $(this).next().prop("disabled", true);
        }
    });

    //largeGroupSelect
    getGroupSeelectBox();
});

function getGroupSeelectBox() {
    $.ajax({
        type: 'POST',
        url: '/learning/getGroupSelectBox',
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
            var groupL = data.groupL;
            var groupM = data.groupM;

            var groupHtml = "";

            for (var i = 0; i < groupL.length; i++) {
                groupHtml += '<option value="' + groupL[i].GROUPL + '">' + groupL[i].GROUPL + '</option>';
            }

            $("#largeGroup").html(groupHtml);

            groupHtml = "";
            for (var i = 0; i < groupM.length; i++) {
                groupHtml += '<option value="' + groupM[i].GROUPM + '">' + groupM[i].GROUPM + '</option>';
            }

            $("#middleGroup").html(groupHtml);
            $("#predictIntent").html(groupHtml);

        }
    });
}


//검색어로 검색
var saveSelectDivHtml;
var searchIptText; //페이징시 필요한 검색어 담아두는 변수
function searchIptDlg(page) {

    if (page) {
        $('#currentPage').val(1);
        searchIptText = $('#iptDialog').val();
    }

    params = {
        'sourceType2': sourceType2,
        'searchGroupL': searchGroupL,
        'searchGroupM': searchGroupM,
        'searchGroupS': searchGroupS,
        'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'searchText': searchIptText
    };

    $.tiAjax({
        type: 'POST',
        url: '/learning/searchIptDlg',
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

            $('#dialogTbltbody').html('');
            var item = '';
            if (data.list.length > 0) {

                for (var i = 0; i < data.list.length; i++) {
                    if (data.list[i].DLG_API_DEFINE == 'D') {
                        data.list[i].DLG_API_DEFINE = 'Common';
                    }

                    if (data.list[i].MissingEntities == null) {
                        data.list[i].MissingEntities = '';
                    }

                    console.log("intent===" + data.list[i].LUIS_INTENT);
                    item += '<tr>' +
                        '<td>' + data.list[i].DLG_API_DEFINE + '</td>' +
                        '<td>' + data.list[i].GroupS + '</td>' +
                        '<td class="txt_left tex01"><a href="#"  data-toggle="modal" data-target="#myModal2"  onclick="searchDialog(' + data.list[i].DLG_ID + ',' + data.list[i].MissingEntities + ');return false;">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        //'<td>' + data.list[i].LUIS_ENTITIES +'</td>' +
                        '<td>' + data.list[i].LUIS_INTENT + '</td>' +
                        '<td>' + data.list[i].MissingEntities + '</td>' +
                        '<td><a href="#" onclick="deleteDialog(' + data.list[i].DLG_ID + ');return false;"><span class="fa fa-trash"></span></a></td>' +
                        '</tr>';
                }

                searchIptText = params.searchText;
                currentSearchNum = 0;

                if (data.groupList.length > 0) {
                    var item2 = '';
                    var item3 = '';
                    item2 = '<label for="all" class="allGroup selectArea">View all</label>';
                    for (var i = 0; i < data.groupList.length; i++) {
                        item2 += '<ul class="checkouter selectArea">' +
                            '<li class="selectArea">' +
                            '<div class="heading selectArea">' +
                            '<label class="groupL selectArea" for="' + data.groupList[i].largeGroup + '">' + data.groupList[i].largeGroup + '</label>' +
                            '<span class="checktoggle largeGroup selectArea"></span></div>' +
                            '<ul class="checklist selectArea" id="' + data.groupList[i].largeGroup + '">' +
                            '</ul>' +
                            '</li>' +
                            '</ul>';

                        item3 += '<option>' + data.groupList[i].largeGroup + '</option>'
                    }
                    $('.selectOptionsbox').html("");
                    $('.selectOptionsbox').append(item2);
                    //$('#searchGroupL').append(item3);
                    $('.checklist').hide();
                    saveSelectDivHtml = item2;
                } else {
                    $('.selectOptionsbox').html("");
                }
            } else {
                item += '<tr style="height: 175px;">' +
                    '<td colspan="5">' + language.NO_DATA + '</td>' +
                    '</tr>';
            }

            $('#dialogTbltbody').append(item);

            $('#pagination').html('').append(data.pageList);
        }
    });
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

// 다이얼로그 생성 모달 (다이얼로그 타이틀 입력)
function writeDialogTitle(e) {

    //var idx = $('input[name=dialogTitle]').index(e);
    var idx = $('#commonLayout .insertForm').index($(e).parents('.insertForm'));
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    var jcx = $(e).parents('.insertForm').find('input[name=dialogTitle]').index(e);

    if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 3) {
        //$('.dialogView:eq(' + idx + ') .carousel').html(e.value);
        $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('h1').text(e.value);
    } else if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 4) {
        $('.dialogView').children().eq(icx).find('h1').html(e.value);
        //$('.dialogView h1').eq(idx).html(e.value);
    } else {
        $('.dialogView').children().eq(icx).find('.textMent .textTitle').html(e.value);
    }
}

function writeCarouselImg(e) {
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    var jcx = $(e).parents('.insertForm').find('input[name=imgUrl]').index(e);

    $('#dialogPreview').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('.imgContainer img').attr("src", e.value);
}

// 다이얼로그 생성 모달 (다이얼로그 내용 입력)
function writeDialog(e) {
    //var idx = $('textarea[name=dialogText]').index(e);

    var idx = $('#commonLayout .insertForm').index($(e).parents('.insertForm'));
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    //var jcx = $(e).parents('.insertForm').find('input[name=dialogTitle]').index(e);

    if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 3) {
        //$('.dialogView:eq(' + idx + ') .carousel').html(e.value);
        //var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
        var jcx = $(e).parents('.insertForm').find('input[name=dialogText]').index(e);
        if ($(e).parent().prev().find('input[name=dialogTitle]').val() == '') {
            $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('h1').text('');
        }
        $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('p').text(e.value);


    } else if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 4) {
        $('.dialogView h1').eq(idx).text(e.value);
    } else {
        //$('.dialogView .textMent p:eq(' + idx + ')').html(e.value);
        //$('.dialogView').children().eq(icx).find('.textMent p:eq(' + idx + ')').html(e.value);
        if ($(e).parent().prev().find('input[name=dialogTitle]').val() == '') {
            $('.dialogView').children().eq(icx).find('.textMent .textTitle').text('');
        }
        $('.dialogView').children().eq(icx).find('.textMent p').text(e.value);
    }

}

//다이얼로그생성모달 - 다이얼로그삭제
$(document).on('click', '.deleteInsertForm', function (e) {

    insertFormLength = $('.insertForm').length;
    if (insertFormLength == 1) {
        alert(language.You_must_have_one_dialog_by_default);
    } else {
        var idx = $(".deleteInsertForm").index(this);
        if (idx == 0) {

            $(this).parents('.insertForm').next().remove();
        }
        $(".dialogView").eq(idx).remove();
        $(this).parents('.insertForm').prev().remove();
        $(this).parents('.insertForm').remove();
    }
    $(this).parents('.insertForm');
});

//다이얼로그생성모달 - 카드삭제 
$(document).on('click', '.deleteCard', function (e) {

    var insertFormIdx;
    $('.insertForm').each(function (count) {
        if ($(this)[0] == $(e.target).parents('#commonLayout').find($('.insertForm').find(e.target).parents('.insertForm'))[0]) {
            insertFormIdx = count;
        }
    })
    insertFormLength = $('.insertForm').length;
    //insertFormIdx = $('.insertForm').index();
    var carouselLayoutLength = $(this).parents('form[name=dialogLayout]').find('.carouselLayout').length;
    var idx = $(this).parents('form[name=dialogLayout]').find('.carouselLayout').find('.deleteCard').index(this);

    if (insertFormLength == 1) {

        if (carouselLayoutLength == 1) {
            alert(language.You_must_have_at_least_one_card);

        } else {

            if ($('.dialogView').eq(insertFormIdx).find('.slideDiv .wc-carousel-item').length == 3) {
                $('.dialogView').eq(insertFormIdx).find('.next').hide();
                $('.dialogView').eq(insertFormIdx).find('.previous').hide();
            }

            $(".dialogView").eq(insertFormIdx).find('.slideDiv .wc-carousel-item').eq(idx).remove();
            $(this).parent().parent().prev().remove();
            $(this).parent().parent().remove();
        }

    } else {

        if (carouselLayoutLength == 1) {
            alert(language.You_must_have_at_least_one_card);
        } else {

            if ($('.dialogView').eq(insertFormIdx).find('.slideDiv .wc-carousel-item').length == 3) {
                $('.dialogView').eq(insertFormIdx).find('.next').hide();
                $('.dialogView').eq(insertFormIdx).find('.previous').hide();
            }

            $(".dialogView").eq(insertFormIdx).find('.slideDiv .wc-carousel-item').eq(idx).remove();
            $(this).parent().parent().prev().prev().remove();
            $(this).parent().parent().prev().remove();
            $(this).parent().parent().remove();
        }

    }

});

//다이얼로그생성모달 - 버튼삭제
$(document).on('click', '.btn_delete', function (e) {

    var trLength = $(this).parents('tbody').children().length;
    if (trLength == 1) {
        $(this).parents('.btnInsertDiv').html('');
        return;
    }
    $(this).parent().parent().remove();
});

//다이얼로그생성모달 - 버튼추가
$(document).on('click', '.carouseBtn', function (e) {

    var inputHtml = '<div><label>' + language.BUTTON + '</label></div>' +
        '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
        '<table class="cardCopyTbl" style="width:100%">' +
        '<col width="21%"><col width="1%"><col width="35%">' +
        '<col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
        '<thead><tr>' +
        '<th>' + language.Type + '</th><th></th><th>' + language.NAME + '</th>' +
        '<th></th><th>' + language.CONTENTS + '</th><th></th><th></th>' +
        '</tr></thead>' +
        '<tbody>' +
        '<tr>' +
        '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option></select></td>' +
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr></tbody></table></div>';

    $btnInsertDiv = $(this).parent().prev().prev().prev();
    if ($btnInsertDiv.children().length == 0) {
        $btnInsertDiv.html(inputHtml);
        return;
    }
    var trLength = $(this).parent().prev().prev().prev().find('.cardCopyTbl tbody tr').length;
    if (trLength >= 1 && trLength < 4) {

        var inputTrHtml = '<tr>' +
            '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
            '<option value="openURL">openURL</option></select></td>' +
            '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
            '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
            '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
            '</tr>'
        $(this).parent().prev().prev().prev().find('.cardCopyTbl tbody').append(inputTrHtml);
    } else {
        alert("버튼은 4개까지 추가할 수 있습니다.");
    }

});

//다이얼로그생성모달 - 카드추가 복사본!!
$(document).on('click', '.addCarouselBtn', function (e) {
    //var $newInsertForm = $insertForm.clone();
    //var $newDlgForm = $dlgForm.clone();
    //var $newCarouselForm = $carouselForm.clone();

    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '<span class="nec_ico">*</span></label>' +
        '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '</div>';

    carouselForm = '<div class="carouselLayout">' +
        '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '</label>' +
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default deleteCard">' + language.DELETE_CARD + '</button>' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default carouseBtn">' + language.INSERT_MORE_BUTTON + '</button>' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '</div>';

    if ($(this).parents('.insertForm').find('.carouselLayout').length == 10) {
        alert(language.Up_to_10_cards_can_be_added);
    } else {
        var idx = $(".addCarouselBtn:visible").index(this);
        var jdx = $('select[name=dlgType]').index(($(".addCarouselBtn:visible").eq(idx).parents('form[name=dialogLayout]').find('select[name=dlgType]')));
        //$('.addCarouselBtn').eq(0).parent().parent().remove();
        //$(this).parents('.insertForm').after( $newInsertForm);  
        //<div id="textLayout" style="display: block;">  </div>
        //var caraousHtml = '<div class="carouselLayout" style="display: block;">' + $carouselForm.html() + '</div>';
        var dlgFormHtml = '<div class="textLayout" style="display: block;">' + dlgForm + '</div>';
        $(this).parent().before('<div class="clear-both"></div>').before(dlgFormHtml).before(carouselForm);
        //$(this).parents('form[name=dialogLayout] .deleteInsertFormDiv').before('<div class="clear-both"></div>').after(dlgFormHtml).append(carouselForm);
        //$(this).parents('.insertForm').next().find('.clear-both').after($newDlgForm);
        var claerLen = $(this).parents('form[name=dialogLayout]').children('.clear-both').length - 1;
        $(this).parents('form[name=dialogLayout]').children('.clear-both').eq(claerLen).next().css('display', 'block');
        $(this).parents('form[name=dialogLayout]').children('.clear-both').eq(claerLen).next().next().css('display', 'block');
        //$(this).parent().parent().remove();
        //$(this).parent().css('display', 'none');
        $(this).parents('form[name=dialogLayout]').find('.addCarouselBtn:last').closest('div').css('display', 'inline-block');

        var inputUttrHtml = '<li class="wc-carousel-item">';
        inputUttrHtml += '<div class="wc-card hero">';
        inputUttrHtml += '<div class="wc-container imgContainer" >';
        inputUttrHtml += '<img src="/images/02_teaser.jpg">';
        inputUttrHtml += '</div>';
        inputUttrHtml += '<h1>CARD_TITLE</h1>';
        inputUttrHtml += '<p class="carousel">CARD_TEXT</p>';
        inputUttrHtml += '<ul class="wc-card-buttons" style="padding-left:0px;"><li><button>BTN_1_TITLE</button></li></ul>';
        inputUttrHtml += '</div>';
        inputUttrHtml += '</li>';

        var kdx = $('.insertForm').index($(this).parents('.insertForm'));

        $('.dialogView').eq(jdx).find('#slideDiv' + kdx).children().append(inputUttrHtml);

        if ($('.dialogView').eq(jdx).find('#slideDiv' + kdx).children().children().length > 2) {
            $('#nextBtn' + jdx).show();
        }
    }
});



//엔티티 추가 group selbox 설정
function selectApiGroup() {
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        //data: params,
        url: '/learning/selectApiGroup',
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
            if (data.groupList) {
                var groupList = data.groupList;
                var optionStr = "";
                for (var i = 0; i < groupList.length; i++) {
                    optionStr += '<option value="' + groupList[i].API_GROUP + '">' + groupList[i].API_GROUP + '</option>'
                }
                $('#sourceType2').append(optionStr);
                $('#tblSourceType').append(optionStr);
            }
        }
    });
}

//오른쪽 버튼 클릭시 슬라이드
function nextBtn(botChatNum) {

    $("#slideDiv" + botChatNum).animate({ scrollLeft: ($("#slideDiv" + botChatNum).scrollLeft() + 312) }, 500, function () {

        if ($("#slideDiv" + botChatNum).scrollLeft() ==
            ($("#slideDiv" + botChatNum).find(".wc-carousel-item").length - 2) * 156) {
            $("#nextBtn" + botChatNum).hide();
        }

    });

    $("#prevBtn" + botChatNum).show();
}

//왼쪽 버튼 클릭시 슬라이드
function prevBtn(botChatNum) {

    $("#slideDiv" + botChatNum).animate({ scrollLeft: ($("#slideDiv" + botChatNum).scrollLeft() - 312) }, 500, function () {

        if ($("#slideDiv" + botChatNum).scrollLeft() == 0) {
            $("#prevBtn" + botChatNum).hide();
        }
    });

    $("#nextBtn" + botChatNum).show();
}

function createDialog() {

    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;

    //intent length check
    if ($('input[name=predictIntent]').val().length > 50) {
        alert("Intent Maximum length 50 characters");
        exit = true;

        return false;
    } else {

    }

    $('.insertForm input[name=dialogText]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.You_must_enter_the_dialog_text);
            exit = true;
            return false;
        }
    });

    if (exit) return;

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
            alert(language.Added);

            var inputUttrHtml = '';
            for (var i = 0; i < data.list.length; i++) {
                inputUttrHtml += '<input type="hidden" name="dlgId" value="' + data.list[i] + '"/>';
            }
            var largeGroup = $('#appInsertForm').find('#largeGroup')[0].value
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
        }
    });
}

//selectbox 중그룹 및 소그룹 찾기 kh
$(document).on('change', '.searchGroup', function () {

    if ($(this).attr('id') == 'searchGroupL') {

        searchGroup($(this).val(), 'searchMedium', 1);
    } else if ($(this).attr('id') == 'searchGroupM') {
        searchGroup($(this).val(), 'searchSmall', 1, $('#searchGroupL').val());
    }

});

//search버튼 클릭시 다이얼로그 검색
$(document).on('click', '#searchDlgBtn', function () {

    var group = {
        sourceType2: $('#sourceType2').val(),
        searchGroupL: $('#searchGroupL').val(),
        searchGroupM: $('#searchGroupM').val(),
        searchGroupS: $('#searchGroupS').val()
    }

    $('#currentPage').val(1);
    selectDlgByFilter(group);

});

var searchGroups; // 페이징을 위해서 검색 후 그룹들을 담아둘 변수
function selectDlgByFilter(group) {

    sourceType2 = $('#sourceType2').val();
    searchGroupL = $('#searchGroupL').val();
    searchGroupM = $('#searchGroupM').val();
    searchGroupS = $('#searchGroupS').val();

    params = {
        //'searchTxt':$('#iptDialog').val(),
        'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'searchGroupL': group.searchGroupL,
        'searchGroupM': group.searchGroupM,
        'searchGroupS': group.searchGroupS,
        'sourceType2': group.sourceType2
    };
    if (searchText !== '') {
        params.searchText = searchText;
    }
    if (searchGroupL !== '') {
        params.upperGroupL = searchGroupL;
    }
    if (searchGroupM !== '') {
        params.upperGroupM = searchGroupM;
    }
    if (searchGroupS !== '') {
        params.upperGroupS = searchGroupS;
    }

    $.tiAjax({
        type: 'POST',
        url: '/learning/dialogs2',
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

            $('#dialogTbltbody').html('');
            var item = '';
            if (data.list.length > 0) {

                for (var i = 0; i < data.list.length; i++) {
                    if (data.list[i].DLG_API_DEFINE == 'D') {
                        data.list[i].DLG_API_DEFINE = 'Common';
                    }

                    if (data.list[i].MissingEntities == null) {
                        data.list[i].MissingEntities = '';
                    }
                    item += '<tr>' +
                        '<td>' + data.list[i].DLG_API_DEFINE + '</td>' +
                        '<td>' + data.list[i].GroupS + '</td>' +
                        '<td class="txt_left tex01"><a href="#"  data-toggle="modal" data-target="#myModal2"  onclick="searchDialog(' + data.list[i].DLG_ID + ',' + data.list[i].MissingEntities + ');return false;">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        //'<td>' + data.list[i].LUIS_ENTITIES +'</td>' +
                        '<td>' + data.list[i].LUIS_INTENT + '</td>' +
                        '<td>' + data.list[i].MissingEntities + '</td>' +
                        '<td><a href="#" onclick="deleteDialog(' + data.list[i].DLG_ID + ');return false;"><span class="fa fa-trash"></span></a></td>' +
                        '</tr>';
                }

                if (searchGroupL !== '') {
                    if (!$('#selBoxBody').find('label[for=' + searchGroupL + ']').parent().hasClass('active')) {
                        $('#selBoxBody').find('label[for=' + searchGroupL + ']').next().trigger('click');
                    }
                }


            } else {
                item += '<tr style="height: 175px;">' +
                    '<td colspan="5">' + language.NO_DATA + '</td>' +
                    '</tr>';
            }

            $('#dialogTbltbody').append(item);

            $('#pagination').html('').append(data.pageList);
            currentSearchNum = 1;
            searchGroups = group;
        }
    });

}

//그룹메뉴에서 모두보기 눌렀을시 리스트 초기화
$(document).on('click', '.allGroup', function () {
    var groupType = $(this).text();
    var sourceType = $('#tblSourceType').val();
    $('#currentPage').val(1);
    $('.selected').text($(this).text());
    $('.selectOptionsbox').removeClass('active');
    selectDlgByTxt(groupType, sourceType);
})

// 소그룹 클릭시 리스트 출력
$(document).on('click', '.smallGroup', function () {

    var group = {
        searchGroupL: $('.currentGroupL').text(),
        searchGroupM: $('.currentGroupM').text(),
        searchGroupS: $(this).children().text(),
        sourceType2: $('#tblSourceType').val()
    }

    $('.selected').text($(this).find('.menuName').text());
    $('.selectOptionsbox').removeClass('active');


    $('#currentPage').val(1);
    selectDlgByFilter(group);
});

/** 대그룹 혹은 중그룹 클릭시 하위 그룹 검색  */
$(document).on('click', '.checktoggle', function (e) {

    // 대그룹 클릭시 중그룹 검색
    if ($(this).hasClass('largeGroup')) {

        if ($(this).parent().hasClass('active')) {

            $(this).parent().next().slideToggle(200);
            $(this).parent().toggleClass('active').toggleClass('bgcolor');

        } else {
            if ($(this).parent().next().children().size() == 0) {
                searchGroup($(this).prev().text(), 'searchMedium');
            }

            $('.largeGroup').parent().removeClass('active').removeClass('bgcolor');
            $('.largeGroup').parent().next().slideUp(200);
            $('.currentGroupL').removeClass('currentGroupL');

            $(this).prev().addClass('currentGroupL');
            $(this).parent().addClass('active').addClass('bgcolor');
            $(this).parent().next().slideDown(200);

            if (searchGroupM !== '') {
                if ($('#selBoxBody').find('label[for=' + searchGroupL + ']').parents('li')
                    .find('label[for=' + searchGroupM + ']').parent().next().css('display') !== 'block') {
                    if (searchGroupM !== '') {
                        $('#selBoxBody').find('label[for=' + searchGroupL + ']').parents('li')
                            .find('label[for=' + searchGroupM + ']').next().trigger('click');
                    }
                }
            }

        }
    }

    // 중분류 클릭시 소분류 검색
    if ($(this).hasClass('mediumGroup')) {

        if ($(this).parent().hasClass('active')) {
            $(this).parent().next().slideToggle(200);
            $(this).parent().toggleClass('active').toggleClass('bgcolor');
        } else {
            if ($(this).parent().next().children().size() == 0) {
                searchGroup($(this).prev().text(), 'searchSmall', 0, $('.groupL.currentGroupL').text());
            }

            $('.mediumGroup').parent().removeClass('active').removeClass('bgcolor');
            $('.mediumGroup').parent().next().slideUp(200);
            $('.currentGroupM').removeClass('currentGroupM');

            $(this).prev().addClass('currentGroupM');
            $(this).parent().addClass('active').addClass('bgcolor');
            $(this).parent().next().slideDown(200);
        }
    }
});

function searchGroup(groupName, group, type, groupL) {
    $.tiAjax({
        type: 'POST',
        url: '/learning/searchGroup',
        data: { 'groupName': groupName, 'group': group, 'searchType': type, 'groupL': groupL, 'searchTxt': $('#iptDialog').val() },
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
            if (type == 1) {

                if (group == 'searchMedium') {

                    var item = '<option value="">' + language.Middle_group + '</option>';

                    for (var i = 0; i < data.groupList.length; i++) {
                        if (searchGroupL !== '') {
                            //if (groupName === searchGroupL) {
                            item += '<option>' + data.groupList[i].mediumGroup + '</option>';
                            //}
                        } else {
                            item += '<option>' + data.groupList[i].mediumGroup + '</option>';
                        }
                    }
                    $('#searchGroupM').html('');
                    $('#searchGroupS').html('');
                    $('#searchGroupS').html('<option value="">' + language.Small_group + '</option>');
                    $('#searchGroupM').append(item);

                    //$('#selBoxBody').find('label[for=' + groupName + ']').next().trigger('click');

                    if (data.groupList.length > 0) {
                        var item2 = '';

                        for (var i = 0; i < data.groupList.length; i++) {
                            item2 += '<li class="selectArea">' +
                                '<div class="heading selectArea">' +
                                '<label class="selectArea groupM" for="' + data.groupList[i].mediumGroup + '">' + data.groupList[i].mediumGroup + '</label>' +
                                '<span class="checktoggle mediumGroup selectArea"></span></div>' +
                                '<ul class="checklist2 selectArea ' + data.groupList[i].mediumGroup + ' ' + groupName + '">' +
                                '</ul>' +
                                '</li>';

                        }
                    }
                    $('#' + groupName).empty();
                    $('#' + groupName).append(item2);
                    $('.checklist2').hide();


                } else if (group == 'searchSmall') {
                    var item = '<option value="">' + language.Small_group + '</option>';

                    for (var i = 0; i < data.groupList.length; i++) {
                        if (searchGroupM !== '') {
                            //if (data.groupList[i].smallGroup === searchGroupM) {
                            item += '<option>' + data.groupList[i].smallGroup + '</option>';
                            //}
                        } else {
                            item += '<option>' + data.groupList[i].smallGroup + '</option>';
                        }
                    }

                    $('#searchGroupS').html('');
                    $('#searchGroupS').append(item);

                    //$('#selBoxBody').find('label[for=' + $('#searchGroupL').val() + ']').parents('li')
                    //                .find('label[for=' + groupName + ']').next().trigger('click');

                    if (data.groupList.length > 0) {
                        var item2 = '';

                        for (var i = 0; i < data.groupList.length; i++) {

                            item2 += '<li class="smallGroup">' +
                                '<label for="check2 groupS" class="menuName">' + data.groupList[i].smallGroup + '</label>' +
                                '</li>';
                        }
                    }
                    $('.' + groupName + '.' + groupL).empty();
                    $('.' + groupName + '.' + groupL).append(item2);


                }
            } else {

                if (group == 'searchMedium') {

                    if (data.groupList.length > 0) {
                        var item2 = '';

                        for (var i = 0; i < data.groupList.length; i++) {
                            item2 += '<li class="selectArea">' +
                                '<div class="heading selectArea">' +
                                '<label class="selectArea groupM" for="' + data.groupList[i].mediumGroup + '">' + data.groupList[i].mediumGroup + '</label>' +
                                '<span class="checktoggle mediumGroup selectArea"></span></div>' +
                                '<ul class="checklist2 selectArea ' + data.groupList[i].mediumGroup + ' ' + groupName + '">' +
                                '</ul>' +
                                '</li>';

                        }
                    }
                    $('#' + groupName).empty();
                    $('#' + groupName).append(item2);
                    $('.checklist2').hide();

                } else if (group == 'searchSmall') {

                    if (data.groupList.length > 0) {
                        var item2 = '';

                        for (var i = 0; i < data.groupList.length; i++) {

                            item2 += '<li class="smallGroup">' +
                                '<label for="check2 groupS" class="menuName">' + data.groupList[i].smallGroup + '</label>' +
                                '</li>';
                        }
                    }
                    $('.' + groupName + '.' + groupL).empty();
                    $('.' + groupName + '.' + groupL).append(item2);
                }
            }

        }
    });
}

//dialog 페이지 첫 로딩때도 실행
var sourceType2 = $('#sourceType2').val();
var searchGroupL = '';
var searchGroupM = '';
var searchGroupS = '';
var searchText = '';
function selectDlgByTxt(groupType, sourceType) {
    if (sourceType === 'search') {
        sourceType = $('#sourceType2').val();
    }
    params = {
        'sourceType2': sourceType2,
        'searchGroupL': searchGroupL,
        'searchGroupM': searchGroupM,
        'searchGroupS': searchGroupS,
        'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'groupType': groupType,
        'sourceType': sourceType,
        'searchTxt': $('#iptDialog').val()
    };

    $.tiAjax({
        type: 'POST',
        url: '/learning/dialogs',
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
            searchText = $('#iptDialog').val();
            $('#dialogTbltbody').html('');
            var item = '';
            if (data.list.length > 0) {
                for (var i = 0; i < data.list.length; i++) {
                    if (data.list[i].DLG_API_DEFINE == 'D') {
                        data.list[i].DLG_API_DEFINE = 'Common';
                    }

                    if (data.list[i].MissingEntities == null) {
                        data.list[i].MissingEntities = '';
                    }
                    item += '<tr>' +
                        '<td>' + data.list[i].DLG_API_DEFINE + '</td>' +
                        '<td>' + data.list[i].GroupS + '</td>' +
                        '<td class="txt_left tex01"><a href="#"  data-toggle="modal" data-target="#myModal2"  onclick="searchDialog(' + data.list[i].DLG_ID + ',\'' + data.list[i].MissingEntities + '\');return false;">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        //'<td>' + data.list[i].LUIS_ENTITIES +'</td>' +
                        '<td>' + data.list[i].LUIS_INTENT + '</td>' +
                        '<td>' + data.list[i].MissingEntities + '</td>' +
                        '<td><a href="#" onclick="deleteDialog(' + data.list[i].DLG_ID + ');return false;"><span class="fa fa-trash"></span></a></td>' +
                        '</tr>';

                }

                if (data.groupList.length > 0) {
                    var item2 = '';
                    item2 = '<label for="all" class="allGroup selectArea">View all</label>';
                    for (var i = 0; i < data.groupList.length; i++) {
                        item2 += '<ul class="checkouter selectArea">' +
                            '<li class="selectArea">' +
                            '<div class="heading selectArea">' +
                            '<label class="groupL selectArea" for="' + data.groupList[i].largeGroup + '">' + data.groupList[i].largeGroup + '</label>' +
                            '<span class="checktoggle largeGroup selectArea"></span></div>' +
                            '<ul class="checklist selectArea" id="' + data.groupList[i].largeGroup + '">' +
                            '</ul>' +
                            '</li>' +
                            '</ul>';
                    }
                    $('.selectOptionsbox').html("");
                    $('.selectOptionsbox').append(item2);
                    $('.checklist').hide();
                    saveSelectDivHtml = item2;
                }
            } else {
                item += '<tr style="height: 175px;">' +
                    '<td colspan="5">' + language.NO_DATA + '</td>' +
                    '</tr>';
            }

            currentSearchNum = 2;
            $('#dialogTbltbody').append(item);

            $('#pagination').html('').append(data.pageList);

            if (rememberSelBoxHtml !== '') {
                $('#selBoxBody').html(rememberSelBoxHtml);
            }

        }
    });
}




var currentSearchNum = 2; // 0: 검색어로 검색한 경우, 1: 테이블 위 그룹으로 검색한 경우, 2: 테이블에 있는 그룹으로 검색한 경우
$(document).on('click', '.li_paging', function (e) {

    if (!$(this).hasClass('active')) {
        $('#currentPage').val($(this).val());
        if (currentSearchNum == 0) {
            searchIptDlg();
        } else if (currentSearchNum == 1) {
            selectDlgByFilter(searchGroups);
        } else if (currentSearchNum == 2) {

            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
        }
    }
});





//---------------두연 추가
var insertForm;
var dlgForm;
var carouselForm;
var mediaForm;
var chkEntities;
var addCarouselForm;
var deleteInsertForm;
function openModalBox(target) {


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
    insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
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
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default deleteCard">' + language.DELETE_CARD + '</button>' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default carouseBtn">' + language.INSERT_MORE_BUTTON + '</button>' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '</div>';

    addCarouselForm = '<div class="btn_wrap addCarouselBtnDiv" style="clear:both" >' +
        '<button type="button" class="btn btn-default addCarouselBtn">' + language.INSERT_MORE_CARDS + '</button>' +
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
        '<button type="button" class="btn btn-default addMediaBtn" >' + language.INSERT_MORE_BUTTON + '</button>' +
        '<div class="clear-both"></div>' +
        '</div>';

    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '</label>' +
        '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '</div>';

    deleteInsertForm = '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >' +
        '<button type="button" class="btn btn-default deleteInsertForm">' + language.DELETE_DIALOG + '</button>' +
        '</div>'
    //$dlgForm = $('#commonLayout .textLayout').eq(0).clone();
    //$carouselForm = $('#commonLayout .carouselLayout').eq(0).clone();
    //$mediaForm = $('#commonLayout .mediaLayout').eq(0).clone();
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

//다이얼로그 생성
function insertDialog() {

    $.ajax({
        url: '/learning/insertDialog',
        dataType: 'json',
        type: 'POST',
        data: $('#appInsertForm').serializeObject(),
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
            if (data.status == 200) {
                var inputUttrHtml = '';
                inputUttrHtml += '<tr> <td> <div class="check-radio-tweak-wrapper" type="checkbox">';
                inputUttrHtml += '<input name="dlgChk" class="tweak-input"  onclick="" type="checkbox"/> </div> </td>';
                inputUttrHtml += '<td class="txt_left" ><input type="hidden" name="' + data.DLG_ID + '" value="' + data.DLG_ID + '" />' + data.CARD_TEXT + '</td></tr>';
                $('#dlgListTable').find('tbody').prepend(inputUttrHtml);

                $('#addDialogClose').click();
            }
        }
    });
}
/** 모달 끝 */






var botChatNum4Desc = 1;
//dlg 저장
var dlgMap = new Object();
function searchDialog(dlgID, missingEntitiesData) {

    $insertForm = $('#commonLayout .insertForm').eq(0).clone();
    $dlgForm = $('#commonLayout .textLayout').eq(0).clone();
    $carouselForm = $('#commonLayout .carouselLayout').eq(0).clone();
    $mediaForm = $('#commonLayout .mediaLayout').eq(0).clone();

    carouselForm = '<div class="carouselLayout">' +
        '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '</label>' +
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default deleteCard">' + language.DELETE_CARD + '</button>' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default carouseBtn">' + language.INSERT_MORE_BUTTON + '</button>' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '</div>';

    addCarouselForm = '<div class="btn_wrap addCarouselBtnDiv" style="clear:both" >' +
        '<button type="button" class="btn btn-default addCarouselBtn">' + language.INSERT_MORE_CARDS + '</button>' +
        '</div>';

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
        '<button type="button" class="btn btn-default addMediaBtn" >' + language.INSERT_MORE_BUTTON + '</button>' +
        '<div class="clear-both"></div>' +
        '</div>';

    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '</label>' +
        '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '</div>';

    deleteInsertForm = '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >' +
        '<button type="button" class="btn btn-default deleteInsertForm">' + language.DELETE_DIALOG + '</button>' +
        '</div>';

    var inputHtml = '<div><label>' + language.BUTTON + '</label></div>' +
        '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
        '<table class="cardCopyTbl" style="width:100%">' +
        '<col width="21%"><col width="1%"><col width="35%">' +
        '<col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
        '<thead><tr>' +
        '<th>' + language.Type + '</th><th></th><th>' + language.NAME + '</th>' +
        '<th></th><th>' + language.CONTENTS + '</th><th></th><th></th>' +
        '</tr></thead>' +
        '<tbody>' +
        '<tr>' +
        '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option></select></td>' +
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr></tbody></table></div>';

    var inputTrHtml = '<tr>' +
        '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option></select></td>' +
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr>';

    var inputMHtml = '<label>' + language.BUTTON + '</label></div>' +
        '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
        '<table class="mediaCopyTbl" style="width:100%"><col width="21%">' +
        '<col width="1%"><col width="35%"><col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
        '<thead><tr><th>' + language.Type + '</th><th></th>' +
        '<th>' + language.NAME + '</th><th></th><th>' + language.CONTENTS + '</th>' +
        '<th></th><th></th></tr></thead><tbody>' +
        '<tr><td>' +
        '<select class="form-control" name="btnType">' +
        '<option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option>' +
        '</select>' +
        '</td><td></td>' +
        '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '">' +
        '</td><td></td><td>' +
        '<input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '">' +
        '</td><td></td><td>' +
        '<a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a>' +
        '</td></tr></tbody></table></div></div></div>';

    var inputMTrHtml = '<tr>' +
        '<td>' +
        '<select class="form-control" name="btnType">' +
        '<option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option>' +
        '</select>' +
        '</td><td></td>' +
        '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr>';

    $.ajax({
        url: '/learning/getDlgAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgID': dlgID, 'missingEntitiesData': missingEntitiesData },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {          //성공했을 때 함수 인자 값으로 결과 값 나옴
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            var inputUttrHtml = '';

            if (result['list'].length == 0) {
                inputUttrHtml += '<div style="display:table-cell;vertical-align:middle; height:400px; width:900px; text-align:center;">' +
                    language.NO_DATA +
                    '</div>';
            } else {

                var row = result['list'];

                for (var i = 0; i < row.length; i++) {
                    botChatNum4Desc++;
                    var val = row[i];

                    var tmp = val;//val[l];

                    for (var j = 0; j < tmp.dlg.length; j++) {

                        if (tmp.dlg[j].DLG_TYPE == 2) {

                            inputUttrHtml += '<div class="wc-message wc-message-from-bot" style="width:200px">';
                            inputUttrHtml += '<div class="wc-message-content">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div><div class="format-markdown"><div class="textMent">';
                            inputUttrHtml += '<p>';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += tmp.dlg[j].CARD_TEXT;
                            inputUttrHtml += '</p>';
                            inputUttrHtml += '</div></div></div></div></div>';

                            $(".insertForm form").append(dlgForm);
                            $(".insertForm form").append(deleteInsertForm);
                            $("#dialogLayout").eq(j).find("select[name=dlgType]").val("2").prop("selected", true);
                            $("#dialogLayout").eq(j).find("input[name=dialogTitle]").val(tmp.dlg[j].CARD_TITLE);
                            $("#dialogLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            $(".insertForm .textLayout").css("display", "block");
                        } else if (tmp.dlg[j].DLG_TYPE == 3) {

                            if (j == 0) {
                                inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                                inputUttrHtml += '<div class="wc-message-content">';
                                inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                                inputUttrHtml += '<div class="wc-carousel slideBanner" style="width: 312px;">';
                                inputUttrHtml += '<div>';
                                inputUttrHtml += '<button class="scroll previous" id="prevBtn0" style="display: none;" onclick="prevBtn(0,this)">';
                                inputUttrHtml += '<img src="/images/02_contents_carousel_btn_left_401x.png">';
                                inputUttrHtml += '</button>';
                                inputUttrHtml += '<div class="wc-hscroll-outer" >';
                                inputUttrHtml += '<div class="wc-hscroll slideDiv" style="margin-bottom: 0px;" class="content" id="slideDiv0">';
                                inputUttrHtml += '<ul>';
                                //inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            }
                            inputUttrHtml += '<li class="wc-carousel-item">';
                            inputUttrHtml += '<div class="wc-card hero">';
                            inputUttrHtml += '<div class="wc-container imgContainer" >';
                            inputUttrHtml += '<img src="' + tmp.dlg[j].IMG_URL + '">';
                            inputUttrHtml += '</div>';
                            if (tmp.dlg[j].CARD_TITLE != null) {
                                inputUttrHtml += '<h1>' + /*cardtitle*/ tmp.dlg[j].CARD_TITLE + '</h1>';
                            }
                            if (tmp.dlg[j].CARD_TEXT != null) {

                                inputUttrHtml += '<p class="carousel" style="height:20px;min-height:20px;">' + /*cardtext*/ tmp.dlg[j].CARD_TEXT + '</p>';
                            }
                            if (tmp.dlg[j].BTN_1_TITLE != null) {
                                inputUttrHtml += '<ul class="wc-card-buttons"><li><button>' + /*btntitle*/ tmp.dlg[j].BTN_1_TITLE + '</button></li></ul>';
                            }
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '</li>';

                            //다이얼로그가 한개일때에는 오른쪽 버튼 x
                            if ((tmp.dlg.length - 1) == j) {
                                inputUttrHtml += '</ul>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div>';
                                if ((tmp.dlg.length) > 2) {
                                    inputUttrHtml += '<button class="scroll next" style="display: block; height: 30px;" id="nextBtn0" onclick="nextBtn(0,this)"><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
                                } else {
                                    inputUttrHtml += '<button class="scroll next" style="display: none; height: 30px;" id="nextBtn0" onclick="nextBtn(0,this)"><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
                                }
                                inputUttrHtml += '</div></div></div></div>';
                            }

                            if (j != 0) {
                                $(".insertForm form").append('<div class="clear-both"></div>');
                            }
                            $(".insertForm form").append(dlgForm);
                            $(".insertForm form").append(carouselForm);

                            if ((tmp.dlg.length - 1) == j) {
                                $("#dialogLayout").find(".carouselLayout").eq(j).after(addCarouselForm);
                                $("#dialogLayout").find(".addCarouselBtnDiv").after(deleteInsertForm);
                            }

                            $("#dialogLayout").eq(j).find("select[name=dlgType]").val("3").prop("selected", true);
                            $("#dialogLayout").find(".textLayout").eq(j).css("display", "block");
                            $("#dialogLayout").find(".carouselLayout").eq(j).css("display", "block");

                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogTitle]").val(tmp.dlg[j].CARD_TITLE);
                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=imgUrl]").val(tmp.dlg[j].IMG_URL);

                            if (tmp.dlg[j].BTN_1_TYPE != null && tmp.dlg[j].BTN_1_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".btnInsertDiv").append(inputHtml);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(0)").val(tmp.dlg[j].BTN_1_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(0)").val(tmp.dlg[j].BTN_1_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(0)").val(tmp.dlg[j].BTN_1_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_2_TYPE != null && tmp.dlg[j].BTN_2_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".cardCopyTbl tbody").append(inputTrHtml);

                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(1)").val(tmp.dlg[j].BTN_2_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(1)").val(tmp.dlg[j].BTN_2_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(1)").val(tmp.dlg[j].BTN_2_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_3_TYPE != null && tmp.dlg[j].BTN_3_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".cardCopyTbl tbody").append(inputTrHtml);

                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(2)").val(tmp.dlg[j].BTN_3_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(2)").val(tmp.dlg[j].BTN_3_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(2)").val(tmp.dlg[j].BTN_3_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_4_TYPE != null && tmp.dlg[j].BTN_4_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".cardCopyTbl tbody").append(inputTrHtml);

                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(3)").val(tmp.dlg[j].BTN_4_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(3)").val(tmp.dlg[j].BTN_4_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(3)").val(tmp.dlg[j].BTN_4_CONTEXT);
                            }
                        } else if (tmp.dlg[j].DLG_TYPE == 4) {
                            inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                            inputUttrHtml += '<div class="wc-message-content">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div>';
                            inputUttrHtml += '<div class="wc-carousel">';
                            inputUttrHtml += '<div>';
                            inputUttrHtml += '<button class="scroll previous" disabled=""><img src="/images/02_contents_carousel_btn_left_401x.png"></button>';
                            inputUttrHtml += '<div class="wc-hscroll-outer">';
                            inputUttrHtml += '<div class="wc-hscroll" style="margin-bottom: 0px;">';
                            inputUttrHtml += '<ul style="min-width:0px">';
                            inputUttrHtml += '<li class="wc-carousel-item wc-carousel-play">';
                            inputUttrHtml += '<div class="wc-card hero" style="width:70%">';
                            inputUttrHtml += '<div class="wc-card-div imgContainer">';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += '<img src="' + /* 이미지 url */ tmp.dlg[j].MEDIA_URL + '">';
                            inputUttrHtml += '<div class="playImg"></div>';
                            inputUttrHtml += '<div class="hidden" alt="' + tmp.dlg[j].CARD_TITLE + '"></div>';
                            inputUttrHtml += '<div class="hidden" alt="' + /* media url */ tmp.dlg[j].CARD_VALUE + '"></div>';
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '<h1>' + /* title */ tmp.dlg[j].CARD_TITLE + '</h1>';
                            inputUttrHtml += '<ul class="wc-card-buttons">';
                            inputUttrHtml += '</ul>';
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '</li></ul></div></div>';
                            inputUttrHtml += '<button class="scroll next" disabled=""><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
                            inputUttrHtml += '</div></div></div></div></div>';

                            $(".insertForm form").append(dlgForm);
                            $(".insertForm form").append(mediaForm);
                            $("#dialogLayout .mediaLayout").after(deleteInsertForm);
                            $("#dialogLayout").eq(j).find("select[name=dlgType]").val("4").prop("selected", true);
                            $("#dialogLayout").find(".textLayout").eq(j).css("display", "block");
                            $("#dialogLayout").find(".mediaLayout").eq(j).css("display", "block");

                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogTitle]").val(tmp.dlg[j].CARD_TITLE);
                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);

                            $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mediaImgUrl]").val(tmp.dlg[j].MEDIA_URL);
                            $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mediaUrl]").val(tmp.dlg[j].CARD_VALUE);

                            if (tmp.dlg[j].BTN_1_TYPE != null && tmp.dlg[j].BTN_1_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".btnInsertDiv").append(inputMHtml);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(0)").val(tmp.dlg[j].BTN_1_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(0)").val(tmp.dlg[j].BTN_1_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(0)").val(tmp.dlg[j].BTN_1_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_2_TYPE != null && tmp.dlg[j].BTN_2_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".mediaCopyTbl tbody").append(inputMTrHtml);

                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(1)").val(tmp.dlg[j].BTN_2_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(1)").val(tmp.dlg[j].BTN_2_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(1)").val(tmp.dlg[j].BTN_2_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_3_TYPE != null && tmp.dlg[j].BTN_3_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".mediaCopyTbl tbody").append(inputMTrHtml);

                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(2)").val(tmp.dlg[j].BTN_3_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(2)").val(tmp.dlg[j].BTN_3_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(2)").val(tmp.dlg[j].BTN_3_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_4_TYPE != null && tmp.dlg[j].BTN_4_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".mediaCopyTbl tbody").append(inputMTrHtml);

                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(3)").val(tmp.dlg[j].BTN_4_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(3)").val(tmp.dlg[j].BTN_4_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(3)").val(tmp.dlg[j].BTN_4_CONTEXT);
                            }

                        }
                        $('#updateDlgId').val(tmp.dlg[j].DLG_ID);
                        $('#updateDlgType').val(tmp.dlg[j].DLG_TYPE);
                        $('#updateDlgEntity').val(tmp.GROUPS);
                    }
                    //}


                    //inputUttrHtml += '</div>';
                    //inputUttrHtml += '</div>';
                }
            }
            $('.dialogView').html(inputUttrHtml);
            //$('#dialogShow').prepend(inputUttrHtml);

            /*
    * intent 부분이 select 타입
    */
            var $iptLuisIntent = $('input[name=predictIntent]');
            var $selectLuisIntent = $('select[name=predictIntent]');

            $selectLuisIntent.show();
            $selectLuisIntent.removeAttr('disabled');

            $iptLuisIntent.hide();
            $iptLuisIntent.attr('disabled', 'disabled');

            console.log("missingEntities===" + result['list'][0].MissingEntities);

            //대화상자 수정 추가
            $('h4#myModalLabel.modal-title').text(language.UPDATE_DIALOG_BOX);
            $('#description').text(result['list'][0].DLG_DESCRIPTION);
            $("#largeGroup").val(result['list'][0].GROUPL).prop("selected", true);
            $("#middleGroup").val(result['list'][0].GROUPM).prop("selected", true);

            $("#predictIntent").val(result['list'][0].GROUPM).prop("selected", true);
            $('#missingEntities').text(result['list'][0].MissingEntities);
            $("#createDialog").attr('onclick', 'updateDialog()');

            //$(".insertForm .textLayout").css("display","block");

        }


    }); // ------      ajax 끝-----------------

}

function updateDialog() {

    var dlgId = $('#updateDlgId').val();
    var dlgType = $('#updateDlgType').val();
    var entity = $('#updateDlgEntity').val();

    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;
    if ($('#description').val().trim() === "") {
        alert(language.Description_must_be_entered);
        return false;
    }

    $('.insertForm textarea[name=dialogText]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.You_must_enter_a_Dialog_Title);
            exit = true;
            return false;
        }
    });
    if (exit) return;
    $('.insertForm input[name=imgUrl]').each(function (index) {
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
        url: '/learning/updateDialog',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgId': dlgId, 'dlgType': dlgType, 'data': array, 'entity': entity },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            alert('success');
            $('.createDlgModalClose').click();

            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
        }

    });
}

function deleteDialog(dlgId) {
    $.ajax({
        url: '/learning/deleteDialog',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgId': dlgId },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            alert('delele complete');
            $('.createDlgModalClose').click();
            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
        }

    });
}

//다이얼로그 생성 모달창 - 중그룹 신규버튼
$(document).on('click', '.newMidBtn, .cancelMidBtn', function () {

    var $iptMiddleGroup = $('input[name=middleGroup]');
    var $selectMiddleGroup = $('select[name=middleGroup]');

    if ($(this).hasClass('newMidBtn')) {
        $('.newMidBtn').hide();
        $('.cancelMidBtn').show();

        $iptMiddleGroup.show();
        $iptMiddleGroup.removeAttr('disabled');

        $selectMiddleGroup.hide();
        $selectMiddleGroup.attr('disabled', 'disabled');
    } else {
        $('.newMidBtn').show();
        $('.cancelMidBtn').hide();

        $selectMiddleGroup.show();
        $selectMiddleGroup.removeAttr('disabled');

        $iptMiddleGroup.hide();
        $iptMiddleGroup.attr('disabled', 'disabled');
    }
})