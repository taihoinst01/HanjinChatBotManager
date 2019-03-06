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
    //다이얼로그생성모달 버튼Add From
    $('#addDialogBtn').click(function (e) {

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
        insertForm += '<textarea id="dialogText" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder=" ' + language.Please_enter + ' " rows="5"></textarea>';
        insertForm += '</div>';
        insertForm += '</div>';
        insertForm += '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >';
        insertForm += '<button type="button" class="btn btn-default deleteInsertForm"><i class="fa fa-trash"></i> ' + language.DELETE_DIALOG + '</button>';
        insertForm += '</div>';
        insertForm += '</form>';
        insertForm += '</div>';
        insertForm += '</div>';

        $(".insertForm:last").after(insertForm);
        var dialogView = '';
        dialogView += '<div class="dialogView" >';
        dialogView += '<div class=" wc-message wc-message-from-bot cj-font" style="width:80%;">';
        dialogView += '<div class="wc-message-content">';
        dialogView += '<svg class="wc-message-callout"></svg>';
        dialogView += '<div>';
        dialogView += '<div class="format-markdown">';
        dialogView += '<div class="textMent  ">';
        dialogView += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
        //dialogView += '<p>' + language.Please_enter_your_content + '</p>';
        dialogView += '<div class="dlg_content">' + language.Please_enter_your_content + '</div>';
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
            '<option value="openUrl">openUrl</option>' +
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
                '<option value="openUrl">openUrl</option>' +
                '</select>' +
                '</td><td></td>' +
                '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
                '<td></td><td><input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
                '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
                '</tr>'
            $(this).parent().prev().find('tbody').append(inputTrHtml);
        } else {
            //alert(language.Up_to_4_buttons_can_be_added);
            $('#proc_content').html(language.Up_to_4_buttons_can_be_added);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
            $('#procDialog').modal('show');
            return;
        }

    });

    //두연1111
    // 다이얼로그 생성 모달 (다이얼로그 타입변경)
    $(document).on('change', 'select[name=dlgType]', function (e) {
        addCarouselForm = '<div class="btn_wrap addCarouselBtnDiv" style="clear:both" >' +
            '<button type="button" class="btn btn-default addCarouselBtn"><i class="fa fa-plus"></i> ' + language.INSERT_MORE_CARDS + '</button>' +
            '</div>';

        carouselForm = '<div class="carouselLayout">' +
            '<div class="form-group">' +
            '<label>' + language.IMAGE_URL + '</label>' +
            '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
            '</div>' +
            '<div class="form-group form-inline">' +
            '<label>' + language.CARD_MOBILE + '</label>' +
            '&nbsp;&nbsp;<select class="form-control" name="cardValue" id="cardValue"><option value="">' + language.CARDMOBIBLE_NO + '</option><option value="m^^">' + language.CARDMOBIBLE_OK + '</option></select>' +
            
            //두연 카드 노출 순서
            '&nbsp;&nbsp;<label>카드노출순서</label>' +
            '&nbsp;&nbsp;<select class="form-control" name="cardOrderValue" id="cardOrderValue"></select>' +
            '<input type="hidden" name="cardOrderHiddenValue" id="cardOrderHiddenValue" value"" />' +
            
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

        mediaForm = '<label>' + language.IMAGE_URL + '<span class="nec_ico">*</span></label>' +
            '<input type="text" name="mediaImgUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
            '<div class="form-group">' +
            '<label>' + language.MEDIA_URL + '</label>' +
            '<input type="text" name="mediaUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
            '</div>' +
            '<div class="modal_con btnInsertDiv">' +
            '</div>' +
            '<div class="btn_wrap" style="clear:both" >' +
            '<button type="button" class="btn btn-default addMediaBtn" ><i class="fa fa-plus"></i> ' + language.INSERT_MORE_BUTTON + '</button>' +
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
            $('.insertForm:eq(' + idx + ') form .deleteInsertFormDiv').before(addCarouselForm);
            $('.insertForm:eq(' + idx + ') form').find('.addCarouselBtnDiv').before(carouselForm);
            $('.insertForm:eq(' + idx + ') .carouselLayout').css('display', 'block');
            $('.insertForm:eq(' + idx + ') .carouselLayout').find('.addCarouselBtn:last').closest('div').css('display', 'inline-block');
        } else if ($(e.target).val() == "4") {
            $('.insertForm:eq(' + idx + ') form .deleteInsertFormDiv').before('<div class="mediaLayout" style="display:none;">' + mediaForm + '</div>');
            $('.insertForm:eq(' + idx + ') .mediaLayout').css('display', 'block');
            $('.insertForm:eq(' + idx + ') .mediaLayout').find('.addMediaBtn:last').closest('div').css('display', 'inline-block');
        }
        
        if ($(e.target).val() == "2") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class=" wc-message wc-message-from-bot cj-font" style="width:80%;">';
            insertHtml += '<div class="wc-message-content">';
            insertHtml += '<svg class="wc-message-callout"></svg>';
            insertHtml += '<div><div class="format-markdown"><div class="textMent  ">';
            insertHtml += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
            
            insertHtml += '<div class="dlg_content">';
            insertHtml += '<p>';
            insertHtml += language.Please_enter;
            insertHtml += '</p>';
            insertHtml += '</div>';

            insertHtml += '</div></div></div></div></div>';

            $(".dialogView").eq(idx).html(insertHtml);
        } else if ($(e.target).val() == "3") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class=" wc-message wc-message-from-bot cj-font" style="width:90%">';
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
            insertHtml += '<div class=" wc-message wc-message-from-bot cj-font">';
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
        var triggerEvent = jQuery.Event( 'keyup', { keyCode: 39, which: 39 } );
        $(this).parents('#dialogLayout').find('input[name=dialogTitle]').trigger(triggerEvent);
        $(this).parents('#dialogLayout').find('textarea[name=dialogText]').trigger(triggerEvent);
        





        //두연111
        var selectLength = $(this).parents('.insertForm').find('select[name=cardOrderValue]').length;
        var selIndex = $(this).parents('.insertForm').find('select[name=dlgType]').index(this);
        //var originalSelValue = $(this).parents('.insertForm').find('input[name=cardOrderHiddenValue]').eq(selIndex).val()*1;

        //var changedValue = $(this).val()*1;
        //for (inc=0; inc<selectLength; inc++) {
        var jnc=0;
        var cardOrderNumStr = '';
        var cardOrderNumLastStr 
        for (jnc=0; jnc < selectLength; jnc++) {
            if (jnc != selectLength-1) {
                $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(jnc).append('<option value="' + selectLength + '" selected>' + selectLength + '</option>');
                var selTmpVal = $(this).parents('.insertForm').find('input[name=cardOrderHiddenValue]').eq(jnc).val();
                $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(jnc).val(selTmpVal).prop("selected", true);
            }
            

            cardOrderNumStr += '<option value="' + (jnc+1) + '">' + (jnc+1) + '</option>';
        }
        //cardOrderNumStr += '<option value="' + (jnc) + '" selected>' + (jnc) + '</option>';

        $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(selIndex).html(cardOrderNumStr);

        $(this).parents('.insertForm').find('input[name=cardOrderHiddenValue]').eq(selIndex).val(jnc);
        $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(selIndex).val(jnc).prop("selected", true);
        //dialogText
        //dyyoo change이벤트 후 미리보기 적용. keycode:17 - ctrl한번 누르기
        /*
        var e = jQuery.Event( "keyup", { keyCode: 17 } ); 
        $("input[name=dialogTitle]").trigger(e);
        //$("input[name=dialogText]").trigger(e);
        $("textarea[name=dialogText]").trigger(e);
        $("input[name=imgUrl]").trigger(e);
        $("input[name=mediaUrl]").trigger(e);
        */
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
        dialogView += '<div class=" wc-message wc-message-from-bot cj-font" style="width:80%;">';
        dialogView += '<div class="wc-message-content">';
        dialogView += '<svg class="wc-message-callout"></svg>';
        dialogView += '<div>';
        dialogView += '<div class="format-markdown">';
        dialogView += '<div class="textMent  ">';
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
            dialogView += '<div class=" wc-message wc-message-from-bot cj-font" style="width:80%;">';
            dialogView += '<div class="wc-message-content">';
            dialogView += '<svg class="wc-message-callout"></svg>';
            dialogView += '<div>';
            dialogView += '<div class="format-markdown">';
            dialogView += '<div class="textMent  ">';
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
});

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

    var idx = $('#commonLayout .insertForm').index($(e).parents('.insertForm'));
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    var jcx = $(e).parents('.insertForm').find('input[name=dialogTitle]').index(e);

    if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 3) {
        $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('h1').text(e.value);
    } else if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 4) {
        $('.dialogView').children().eq(icx).find('h1').html(e.value);
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
    var idx = $('#commonLayout .insertForm').index($(e).parents('.insertForm'));
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 3) {
        var jcx = $(e).parents('.insertForm').find('textarea[name=dialogText]').index(e);
        if ($(e).parent().prev().find('input[name=dialogTitle]').val() == '') {
            $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('h1').text('');
        }
        var test = e.value;
        test = test.replace(/(?:\r\n|\r|\n)/g, '\n');
        var obj = $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('p').text(test);
        obj.html(obj.html().replace(/\n/g,'<br/>'));
        //$('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('p').text(e.value);


    } else if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 4) {
        $('.dialogView h1').eq(idx).text(e.value);
    } else {
        if ($(e).parent().prev().find('input[name=dialogTitle]').val() == '') {
            $('.dialogView').children().eq(icx).find('.textMent .textTitle').text('');
        }
        var test = e.value;
        //alert("test111==="+test);
        test = test.replace(/(?:\r\n|\r|\n)/g, '\n');
        //alert("test222==="+test);
        var obj = $('.dialogView').children().eq(icx).find('.textMent .dlg_content').text(test);
        obj.html(obj.html().replace(/\n/g,'<br/>'));
    }

}

//다이얼로그생성모달 - 다이얼로그삭제
$(document).on('click', '.deleteInsertForm', function (e) {

    insertFormLength = $('.insertForm').length;
    if (insertFormLength == 1) {
        //$('#alertMsg').text(language.You_must_have_one_dialog_by_default);
        //$('#alertBtnModal').modal('show');
        //alert(language.You_must_have_one_dialog_by_default);

        $('#proc_content').html(language.You_must_have_one_dialog_by_default);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
        $('#procDialog').modal('show');
        return;
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



//제목 td mouse hover event
$(document).on('mouseover', 'td[name=dlgTitleTd]', function (e) {
    var cardTitle = $(this).parent().find('input[name=cardTitle]').val();
    var cardText = $(this).parent().find('input[name=cardText]').val();
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

    cardTitle = cardTitle.split('/n').join('<br/>');
    cardText = cardText.split('/n').join('<br/>');

    $('#dlgTitle').html(cardTitle);
    $('#dlgText').html(cardText);
    $('#divInfo').css({
        "top": divTop,
        "left": divLeft,
        "position": "absolute"
    }).show();
});


$(document).on('mouseout', 'td[name=dlgTitleTd]', function (e) {
    $('#dlgTitle').text('');
    $('#dlgText').text('');
    $('#divInfo').hide();
});



//다이얼로그생성모달 - 버튼삭제
$(document).on('click', '.btn_delete', function (e) {
    var divIndex = $('.btnInsertDiv').index($(this).parents('.btnInsertDiv'));
    var trIndex = $(this).parents('tbody').children().index($(this).parents('tr'));
    var trLength = $(this).parents('tbody').children().length;
    if (trLength == 1) {
        $(this).parents('.btnInsertDiv').html('');
        return;
    }
    $(this).parent().parent().remove();
    $('.btnInsertDiv').eq(divIndex).find('tbody tr').eq(trIndex).find("select[name=btnType]").trigger('change');
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
        '<option value="openUrl">openUrl</option></select></td>' +
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
            '<option value="openUrl">openUrl</option></select></td>' +
            '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
            '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
            '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
            '</tr>'
        $(this).parent().prev().prev().prev().find('.cardCopyTbl tbody').append(inputTrHtml);
    } else {
        //alert("버튼은 4개까지 추가할 수 있습니다.");
        $('#proc_content').html(language.Up_to_4_buttons_can_be_added);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
        $('#procDialog').modal('show');
        return;
        
    }

});




//다이얼로그생성모달 - 카드추가 복사본!!
$(document).on('click', '.addCarouselBtn', function (e) {
    
    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '<span class="nec_ico">*</span></label>' +
        //'<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '">' +
        '<textarea id="dialogText" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder=" ' + language.Please_enter + ' " rows="5"></textarea>' +
        '</div>' +
        '</div>';
    
    carouselForm = '<div class="carouselLayout">' +
        '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '</label>' +
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group form-inline">' +
        '<label>' + language.CARD_MOBILE + '</label>' +
        '&nbsp;&nbsp;<select class="form-control" name="cardValue" id="cardValue"><option value="">' + language.CARDMOBIBLE_NO + '</option><option value="m^^">' + language.CARDMOBIBLE_OK + '</option></select>' +
        
        //두연 카드 노출 순서
        '&nbsp;&nbsp;<label>카드노출순서</label>' +
        '&nbsp;&nbsp;<select class="form-control" name="cardOrderValue" id="cardOrderValue"></select>' +
        '<input type="hidden" name="cardOrderHiddenValue" id="cardOrderHiddenValue" value"" />' +
        
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


    if ($(this).parents('.insertForm').find('.carouselLayout').length == 10) {
        //alert(language.Up_to_10_cards_can_be_added);
        $('#proc_content').html(language.Up_to_10_cards_can_be_added);
        $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
        $('#procDialog').modal('show');
        return;
    } else {
        var idx = $(".addCarouselBtn:visible").index(this);
        var jdx = $('select[name=dlgType]').index(($(".addCarouselBtn:visible").eq(idx).parents('form[name=dialogLayout]').find('select[name=dlgType]')));
        var dlgFormHtml = '<div class="textLayout" style="display: block;">' + dlgForm + '</div>';
        $(this).parent().before('<div class="clear-both"></div>').before(dlgFormHtml).before(carouselForm);
        var claerLen = $(this).parents('form[name=dialogLayout]').children('.clear-both').length - 1;
        $(this).parents('form[name=dialogLayout]').children('.clear-both').eq(claerLen).next().css('display', 'block');
        $(this).parents('form[name=dialogLayout]').children('.clear-both').eq(claerLen).next().next().css('display', 'block');
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


        var selectLength = $(this).parents('.insertForm').find('select[name=cardOrderValue]').length;
        var selIndex = $(this).parents('.insertForm').find('select[name=cardOrderValue]').index(this);
        //var originalSelValue = $(this).parents('.insertForm').find('input[name=cardOrderHiddenValue]').eq(selIndex).val()*1;

        //var changedValue = $(this).val()*1;
        //for (inc=0; inc<selectLength; inc++) {
        var jnc=0;
        var cardOrderNumStr = '';
        var cardOrderNumLastStr 
        for (jnc=0; jnc < selectLength; jnc++) {
            if (jnc != selectLength-1) {
                $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(jnc).append('<option value="' + selectLength + '" selected>' + selectLength + '</option>');
                var selTmpVal = $(this).parents('.insertForm').find('input[name=cardOrderHiddenValue]').eq(jnc).val();
                $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(jnc).val(selTmpVal).prop("selected", true);
            }

            cardOrderNumStr += '<option value="' + (jnc+1) + '">' + (jnc+1) + '</option>';
        }
        //cardOrderNumStr += '<option value="' + (jnc) + '" selected>' + (jnc) + '</option>';

        $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(selIndex).html(cardOrderNumStr);

        $(this).parents('.insertForm').find('input[name=cardOrderHiddenValue]').eq(selIndex).val(jnc);
        $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(selIndex).val(jnc).prop("selected", true);
        
    }
});

function updateDialog() {

    var dlgId = $('#updateDlgId').val();
    var dlgType = $('#updateDlgType').val();
    var entity = $('#updateDlgEntity').val();
    var relationNum = $('#updateDlgRelationNo').val();

    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;
    /*
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
            */
           /*이미지 URL
            $('#proc_content').html(language.ImageURL_must_be_entered);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
            $('#procDialog').modal('show');
            return;
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
    
    array[array.length] = JSON.stringify($("form[name=appInsertForm]").serializeObject());//JSON.stringify($("form[name=appInsertForm]"));
    
    $.ajax({
        url: '/qna/updateDialog',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgId': dlgId, 'dlgType': dlgType, 'updateData': array, 'entity': entity, 'relationNum' : relationNum},      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            
            $('#proc_content').html(language.REGIST_SUCC);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
            $('#procDialog').modal('show');
            
            $('.createDlgModalClose').click();

            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            if (typeof selectDlgByTxt == 'function') {
                selectDlgByTxt(groupType, sourceType);
            } else {
                makeQnaListTable(pageNo);
            }
        }

    });
}

var deleteDlgId = "";
var deleteDlgType = "";
function deleteDialogModal(dlgId, type) {
    deleteDlgId = dlgId;
    deleteDlgType = type;
    $('#proc_content').html(language.IS_DELETE_CONFIRM);
    $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button><button type="button" class="btn btn-primary" id="deleteDialogBtn" onClick="deleteDialog();"><i class="fa fa-trash"></i> ' + language.DELETE +'</button>');
    $('#procDialog').modal('show');
}

function deleteDialog() {
    $('#procDialog').modal('hide');
    $.ajax({
        url: '/learning/deleteDialog',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgId': deleteDlgId },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            //alert('delele complete');
            $('#proc_content').html(language.Deleted);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
            $('#procDialog').modal('show');
            
            if(deleteDlgType=="common"){
                $('.createDlgModalClose').click();
                var groupType = $('.selected').text();
                var sourceType = $('#tblSourceType').val();
                //selectDlgByTxt(groupType, sourceType);
                if (typeof selectDlgByTxt == 'function') {
                    selectDlgByTxt(groupType, sourceType);
                } else {
                    makeQnaListTable(pageNo);
                }
            }else if(deleteDlgType=="init"){
                
                makeInitDlgTable();
            }else{

            }
            
        }

    });
}

var botChatNum4Desc = 1;
var pageNo = "";
//dlg 저장
var dlgMap = new Object();
$(document).on("click", "#show_dlg", function () {
    var dlgID = $(this).attr("dlg_id");
    var pageType = $(this).attr("page_type");
    var listPageNo = $(this).attr("listPageNo");
    pageNo = listPageNo;

    $insertForm = $('#commonLayout .insertForm').eq(0).clone();
    $dlgForm = $('#commonLayout .textLayout').eq(0).clone();
    $carouselForm = $('#commonLayout .carouselLayout').eq(0).clone();
    $mediaForm = $('#commonLayout .mediaLayout').eq(0).clone();

    if(pageType=="qna"){
        var tr = $(this).parent().parent();
        var td = tr.children();
        var show_question = td.eq(1).text();
        var show_intent = td.eq(2).text();
    }

    carouselForm = '<div class="carouselLayout">' +
        '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '</label>' +
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group form-inline">' +
        '<label>Card_Mobile</label>' +
        '&nbsp;&nbsp;<select class="form-control" name="cardValue" id="cardValue"><option value="">미적용</option><option value="m^^">적용</option></select>' +
        //두연 카드 노출 순서
        '&nbsp;&nbsp;<label>카드노출순서</label>' +
        '&nbsp;&nbsp;<select class="form-control" name="cardOrderValue" id="cardOrderValue"></select>' +
        '<input type="hidden" name="cardOrderHiddenValue" id="cardOrderHiddenValue" value"" />' +

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
        '<option value="openUrl">openUrl</option></select></td>' +
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr></tbody></table></div>';

    var inputTrHtml = '<tr>' +
        '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
        '<option value="openUrl">openUrl</option></select></td>' +
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
        '<option value="openUrl">openUrl</option>' +
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
        '<option value="openUrl">openUrl</option>' +
        '</select>' +
        '</td><td></td>' +
        '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr>';

    $.ajax({
        url: '/qna/getDlgAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgID': dlgID },      //데이터를 json 형식, 객체형식으로 전송
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

                    
                    var cardOrderNumStr = '';
                    for (var jnc=0; jnc < tmp.dlg.length; jnc++) {
                        if (tmp.dlg[jnc].DLG_TYPE == 3) {
                            cardOrderNumStr += '<option value="' + tmp.dlg[jnc].CARD_ORDER_NO + '">' + tmp.dlg[jnc].CARD_ORDER_NO + '</option>'
                        }
                    }


                    for (var j = 0; j < tmp.dlg.length; j++) {
                        
                        var cardTextHtml = tmp.dlg[j].CARD_TEXT;
                        var dlgTextArea = tmp.dlg[j].CARD_TEXT;
                        var cardTitleHtml = "";
                        if(tmp.dlg[j].CARD_TITLE==null){
                            cardTitleHtml = "";
                        }else{
                            cardTitleHtml = tmp.dlg[j].CARD_TITLE;
                        }
                        cardTextHtml = cardTextHtml.replace(/\/n/gi,'</br>');
                        dlgTextArea = dlgTextArea.replace(/\/n/gi,'\r\n');
                        if (tmp.dlg[j].DLG_TYPE == 2) {
                            
                            var dlg_card_order = tmp.dlg[j].CARD_ORDER_NO;

                            inputUttrHtml += '<div class=" wc-message wc-message-from-bot cj-font" style="width:90%">';
                            inputUttrHtml += '<div class="wc-message-content">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div><div class="format-markdown"><div class="textMent  ">';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += '<h1 class="textTitle">' + cardTitleHtml + '</h1>';
                            inputUttrHtml += '<div class="dlg_content">';
                            //inputUttrHtml += tmp.dlg[j].CARD_TEXT;
                            inputUttrHtml += cardTextHtml;
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '</div></div></div></div></div>';

                            $(".insertForm form").append(dlgForm);
                            $(".insertForm form").append(deleteInsertForm);

                            $("#dialogLayout").eq(j).find("select[name=dlgType]").val("2").prop("selected", true);
                            $("#dialogLayout").eq(j).find("input[name=dialogTitle]").val(tmp.dlg[j].CARD_TITLE);
                            //$("#dialogLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            //$("#dialogLayout").eq(j).find("textarea[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            $("#dialogLayout").eq(j).find("textarea[name=dialogText]").val(dlgTextArea);
                            $(".insertForm .textLayout").css("display", "block");
                        } else if (tmp.dlg[j].DLG_TYPE == 3) {
                            var cardImgUrl = "";
                            if(tmp.dlg[j].IMG_URL==""||tmp.dlg[j].IMG_URL=="null"){
                                cardImgUrl = "";
                            }else if(tmp.dlg[j].IMG_URL==null){
                                cardImgUrl = "";
                            }else{
                                cardImgUrl = '<img src="' + tmp.dlg[j].IMG_URL + '">';
                            }
                            console.log("cardImgUrl=="+cardImgUrl);
                            if (j == 0) {
                                inputUttrHtml += '<div class=" wc-message wc-message-from-bot cj-font" style="width:90%">';
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
                            //inputUttrHtml += '<img src="' + tmp.dlg[j].IMG_URL + '">';
                            inputUttrHtml += cardImgUrl;
                            inputUttrHtml += '</div>';
                            if (tmp.dlg[j].CARD_TITLE != null) {
                                inputUttrHtml += '<h1>' + /*cardtitle*/ cardTitleHtml + '</h1>';
                            }
                            if (tmp.dlg[j].CARD_TEXT != null) {

                                //inputUttrHtml += '<p class="carousel" style="height:20px;min-height:20px;">' + /*cardtext*/ tmp.dlg[j].CARD_TEXT + '</p>';
                                inputUttrHtml += '<p class="carousel">' + /*cardtext*/ cardTextHtml + '</p>';
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
                            //$("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            //$("#dialogLayout").find(".textLayout").eq(j).find("textarea[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            $("#dialogLayout").find(".textLayout").eq(j).find("textarea[name=dialogText]").val(dlgTextArea);
                            $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=imgUrl]").val(tmp.dlg[j].IMG_URL);
                            $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=cardValue]").val(tmp.dlg[j].CARD_VALUE).prop("selected", true);
                            $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cardOrderHiddenValue]").val(tmp.dlg[j].CARD_ORDER_NO);
                            
                            $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=cardOrderValue]").html(cardOrderNumStr);
                            $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=cardOrderValue]").val(tmp.dlg[j].CARD_ORDER_NO).prop("selected", true);
                            

                            //두연
                            if (tmp.dlg[j].BTN_1_TYPE != null && tmp.dlg[j].BTN_1_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".btnInsertDiv").append(inputHtml);
                                for (var k=0; k<2; k++) {
                                    var childBtnVal = $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]").children().eq(k).val();
                                    if (childBtnVal == tmp.dlg[j].BTN_1_TYPE) {
                                        $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]").children().eq(k).prop("selected", true);
                                        $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]").trigger('change');
                                    }
                                }
                                //$("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(0)").val(tmp.dlg[j].BTN_1_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(0)").val(tmp.dlg[j].BTN_1_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(0)").val(tmp.dlg[j].BTN_1_CONTEXT);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContentM]:eq(0)").val(tmp.dlg[j].BTN_1_CONTEXT_M);
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
                            inputUttrHtml += '<div class=" wc-message wc-message-from-bot cj-font" style="width:90%">';
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
                            inputUttrHtml += '<h1>' + /* title */ cardTitleHtml + '</h1>';
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
                            //$("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            $("#dialogLayout").find(".textLayout").eq(j).find("textarea[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);

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
                        $('#updateDlgRelationNo').val(tmp.RELATION_NUM);
                    }
  
                }
            }
            $('.dialogView').html(inputUttrHtml);

            if(pageType=="qna"){
                //대화상자 수정 추가
                if(result['list'].length == 0){
                    $('#proc_content').html(language.No_exist_answer);
                    $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> ' + language.CLOSE +'</button>');
                    $('#procDialog').modal('show');
                    return;
                }else{
                    $('#description').val(result['list'][0].DLG_DESCRIPTION);
                    $("#largeGroup").val(result['list'][0].GROUPL);
                    $("#middleGroup").val(result['list'][0].GROUPM);
                }
                $('h4#myModalLabel.modal-title').text(language.Show_dlg);
                

                $('#dlgQuestion').text(show_question);
                $('#luisIntent').text(show_intent);
                $("#createDialog").attr('onclick', 'updateDialog()');
                $("#createDialog").text(language.MODIFY);
            }else if(pageType=="initDlg"){
                //대화상자 수정 추가
                $('h4#myModalLabel.modal-title').text(language.INITDLG_UPDATE_TITLE);

                $('select[name=dlgGroup]').val(result['list'][0].DLG_GROUP).prop("selected", true);
                $('#description').val(result['list'][0].DLG_DESCRIPTION);
                $('#title').val(result['list'][0].DLG_NAME);
                $('#dlgOrderNo').val(result['list'][0].DLG_ORDER_NO);
                $("#createDialog").attr('onclick', 'updateInitDialog()');
                $("#createDialog").text(language.MODIFY);
            }else{
                var $iptLuisIntent = $('input[name=predictIntent]');
                var $selectLuisIntent = $('select[name=predictIntent]');

                $selectLuisIntent.show();
                $selectLuisIntent.removeAttr('disabled');

                $iptLuisIntent.hide();
                $iptLuisIntent.attr('disabled', 'disabled');

                //대화상자 수정 추가
                $('h4#myModalLabel.modal-title').text(language.UPDATE_DIALOG_BOX);
                $('#description').val(result['list'][0].DLG_DESCRIPTION);
                $('#title').val(result['list'][0].DLG_NAME);
            
                $("#createDialog").attr('onclick', 'updateDialog()');
                $("#createDialog").text(language.MODIFY);
                //$(".insertForm .textLayout").css("display","block");
            }
            

            $('#myModal2').modal('show');

        }


    }); // ------      ajax 끝-----------------

});

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




$(document).on('change', 'select[name=btnType]', function (e) {

    var selBtnTypVal = $(this).val();
    var trIndex = $(this).parents('tbody').find('tr').index($(this).parents('tr'));
    if (selBtnTypVal == 'openUrl') {
        if (trIndex == 0) {
            var appendInput = '<input type="text" name="cButtonContentM" class="form-control" placeholder="' + language.INPUT_BTN_URL_MOBILE + '">';
            $(this).parents('tr').find('input[name=cButtonContent]').attr('placeholder', language.INPUT_BTN_URL_PC );
            $(this).parents('tr').find('input[name=cButtonContent]').after(appendInput);
        } else {
            $(this).parents('tr').find('input[name=cButtonContent]').attr('placeholder', language.INPUT_BTN_URL_PC );
        }
    }

});


//$("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=cardOrderValue]").val(tmp.dlg[j].CARD_ORDER_NO).prop("selected", true);


//두연
$(document).on('change', 'select[name=cardOrderValue]', function (e) {

    var selectLength = $(this).parents('.insertForm').find('select[name=cardOrderValue]').length;
    var selIndex = $(this).parents('.insertForm').find('select[name=cardOrderValue]').index(this);
    var originalSelValue = $(this).parents('.insertForm').find('input[name=cardOrderHiddenValue]').eq(selIndex).val()*1;

    var changedValue = $(this).val()*1;
    for (inc=0; inc<selectLength; inc++) {
        if (inc == selIndex) { 
            $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).next().val(changedValue);
            continue;
            //$(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).val((inc+1)).prop("selected", true);
        } else {
            var originalValue = $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).val()*1;
            
            var changePlus = false;
            if (originalSelValue > changedValue) {
                changePlus = true;
            } else {
            }
            if (originalValue > changedValue || changePlus) 
            {
                var plusValue = originalValue+1;
                if (plusValue > originalSelValue) {
                    continue;
                } else {
                    $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).val(plusValue).prop("selected", true);
                    $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).next().val(plusValue);
                }
            } else {
                var plusValue = originalValue-1;
                if (plusValue < originalSelValue) {
                    continue;
                } else {
                    $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).val(plusValue).prop("selected", true);
                    $(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).next().val(plusValue);
                }
            }
        }
        //$(this).parents('.insertForm').find('select[name=cardOrderValue]').eq(inc).
    }

});


