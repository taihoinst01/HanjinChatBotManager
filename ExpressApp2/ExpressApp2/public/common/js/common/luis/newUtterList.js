

//가장 먼저 실행.
var language;
var simpleList = [];
var hierarchyList = [];
var compositeList = [];
var closedList = [];
//createEntity -> childcomposite List
var childCompositeList = [];
;(function($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function(data) {
            language= data.lang;
        }
    });
    getEntityList();
})(jQuery);

$(document).ready(function() {
    makeQnaTable();
    selectGroup('searchIntentGroup');

    //검색 버튼 클릭
    $('#searchBtn').click(function(){
        $('#searchStr').val($('#searchQnaText').val().trim());
        $('#currentPage').val(1);
        makeQnaTable();
    });


    $("#searchDialogBtn").on('click', function () {
        searchBtnFnc();
    });
        
    //dlg search input enter
    $('input[name=serachDlg]').keypress(function(e){
        if (e.keyCode === 13) {	//	Enter Key
            if ($('input[name=serachDlg]').val().trim() != '') {
                $("#searchDialogBtn").trigger('click');
            }
        }
    });

        /*
    $("#searchLargeGroup").change(function () {
        var str = "";
        $("#searchLargeGroup option:selected").each(function () {
            str = $(this).text() + " ";
        });
        selectGroup("searchMediumGroup", str);
    });

    $("#searchMediumGroup").change(function () {
        var str1 = "";
        $("#searchLargeGroup option:selected").each(function () {
            str1 = $(this).text() + " ";
        });

        var str2 = "";
        $("#searchMediumGroup option:selected").each(function () {
            str2 = $(this).text() + " ";
        });

        selectGroup("searchSmallGroup", str1, str2);
    });
    */


    $(".searchDialogClose").on('click', function () {
        $('input[name=serachDlg]').val('');
        $('#searchDlgResultDiv').html('');
        $('.dialog_result strong').html(' 0 ');

        $('select[name=searchIntentGroup]').children('option').each(function() {
            if ($(this).is(':selected'))
            { 
                $(this).removeAttr('selected');
                return false;
            }
        });
        $('select[name=searchIntentGroup]').children().eq(0).prop('selected', 'selected');

    });

});


//페이징 클릭
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        $('#currentPage').val($(this).val());
        makeQnaTable();
    }
});

//dlg검색 클릭
$(document).on('click','a[name=selEntity]',function(e){
    var utterAppId = $(this).parents('tr').find('#hiddenappId').val();
    $('#selectUtterAppId').val(utterAppId);
    var utterIntent = $(this).parents('tr').find('#hiddenIntent').val();
    $('#selectUtterIntent').val(utterIntent);
    var utterSeq = $(this).parents('tr').find('#hiddenSeq').val();
    $('#selectUtterSeq').val(utterSeq);
    var utterEntities = $(this).parents('tr').find('#hiddenEntity').val();
    $('#selectUtterEntities').val(utterEntities);

    var contextEntity = $(this).parents('tr').find('input[name=hiddenEntity]').val();
    openModalBox(contextEntity);
    
});
//검색 input 엔터 감지
$(document).on("keypress", "#searchQnaText", function(e){
    if (e.keyCode === 13) {	//	Enter Key
        if ($('#searchQnaText').val().trim() == '' ) {
            if ($('#searchStr').val() != '') {
                $('#searchBtn').trigger('click');
            }
        } else {
            $('#searchBtn').trigger('click');
        }
    }
});


$(document).on("change", "select[name=utterSelBox]", function(e){
    var newUtter =  $(this).find(':selected').text();
    var newEntity =  $(this).find(':selected').val();
    $(this).parents('tr').find('a[name=selEntity]').text('').text(newUtter);
    $(this).parents('tr').find('td').eq(3).text('').text(newEntity);
});

//엔티티 가져오기
function getEntityList(intentName, intentId) {

    $.ajax({
        type: 'POST',
        url: '/luis/getEntityList',
        data: {'isAll' : 'ALL'},
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
            if (data.error) {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
            }
            else 
            {
                simpleList = data.simpleList;
                hierarchyList = data.hierarchyList;
                compositeList = data.compositeList;
                closedList = data.closedList;
            }
        }
    });
}

function makeQnaTable() {
    var params = {
        'searchQnA' : $('#searchStr').val(),
        'selPage' : $('#currentPage').val(),
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/luis/getNewUtterList',
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
            $('#qnaListBody').html('');
            $('#pagination').html('');
            var entityBodyHtml = '';
            if(data.qnaList.length > 0){
                for(var i = 0; i < data.qnaList.length; i++){

                    if (data.qnaList[i].INTENT.indexOf('None_') != -1) {
                        continue;
                    }

                    var j=i+1
                    var selDupleIntent = "<select name='utterSelBox' class='form-control'  >";
                    selDupleIntent += "<option value='" + data.qnaList[i].ENTITY + "'>" + data.qnaList[i].DLG_QUESTION + "</option>";
                    for (; j<data.qnaList.length; j++) {
                        if (data.qnaList[i].INTENT == data.qnaList[j].INTENT) {
                            selDupleIntent += "<option value='" + data.qnaList[j].ENTITY + "'>" + data.qnaList[j].DLG_QUESTION + "</option>";
                        } else {
                            break;
                        }
                    }
                    selDupleIntent += "</select>";

                    entityBodyHtml += "<tr>";
                    entityBodyHtml += "<td style='text-align: left; padding-left:1%;'><a href='#' name='selEntity' onclick='return false;' >" + data.qnaList[i].DLG_QUESTION + "</a></td>";
                    entityBodyHtml += "<td style=' padding-left:1%;'>" + data.qnaList[i].INTENT + "</td>";
                    entityBodyHtml += "<td style='text-align: left; padding-left:1%;'>" + selDupleIntent + "</td>";
                    entityBodyHtml += "<td style='text-align: left; padding-left:1%;'>" + data.qnaList[i].ENTITY + "</td>";
                    entityBodyHtml += "<td style='text-align: left; padding-left:1%;'>" + data.qnaList[i].REG_DT + "</td>";
                    entityBodyHtml += "<td style='text-align: right; padding-right:1.5%;'>";
                    entityBodyHtml += "<input type='hidden' id='hiddenSeq' name='hiddenSeq' value='" + data.qnaList[i].SEQ + "' />";
                    entityBodyHtml += "<input type='hidden' id='hiddenEntity' name='hiddenEntity' value='" + data.qnaList[i].ENTITY + "' />";
                    entityBodyHtml += "<input type='hidden' id='hiddenIntent' name='hiddenIntent' value='" + data.qnaList[i].INTENT + "' />";
                    entityBodyHtml += "<input type='hidden' id='hiddenappId' name='hiddenappId' value='" + data.qnaList[i].APP_ID + "' />";
                    //entityBodyHtml += "<input type='hidden' id='entityHiddenId' name='entityHiddenId' value='" + data.qnaList[i].Q_ID + "' />";
                    //entityBodyHtml += "<a href='#' name='addReplyBtn' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-edit' style='font-size: 25px;'></span></a>";
                    entityBodyHtml += "</td>";
                    entityBodyHtml += "</tr>";
                    if (i+1 != j) {
                        i = j;
                    }
                }
                //<td><a href="#" name="delEntityRow" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></td>
                $('#qnaListBody').html(entityBodyHtml);
                if (entityBodyHtml != '') {

                    $('#pagination').html('').append(data.pageList);
                }
            }
        }
    });
}




//---------------두연 추가
var insertForm;
var dlgForm;
var carouselForm;
var mediaForm;
var chkEntities;
var addCarouselForm;
var deleteInsertForm;
var botChatNum = 1;
function openModalBox(contextEntity) {
    if (contextEntity == '') {
        contextEntityData = '';
        $('#createIntent').html('<input type="text" name="predictIntent" id="predictIntent" class="form-control">');
    } else {
        contextEntityData = contextEntity;
        $('#createIntent').html('<input type="hidden" name="predictIntent" id="predictIntent" value="">');
    }

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
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '"  spellcheck="false" autocomplete="off">' +
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

    mediaForm = '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '<span class="nec_ico">*</span></label>' +
        '<input type="text" name="mediaImgUrl" class="form-control" placeholder="' + language.Please_enter + '"  spellcheck="false" autocomplete="off">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.MEDIA_URL + '</label>' +
        '<input type="text" name="mediaUrl"class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off">' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default addMediaBtn" >' + language.INSERT_MORE_BUTTON + '</button>' +
        '</div>';

    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '<span class="nec_ico">*</span></label>' +
        '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off">' +
        '</div>' +
        '</div>';

    deleteInsertForm = '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >' +
        '<button type="button" class="btn btn-default deleteInsertForm">' + language.DELETE_DIALOG + '</button>' +
        '</div>'

    
    //selectGroup('searchIntentGroup');
    $('#searchDlgModalBtn').trigger('click');
}


function selectGroup(selectId, str1, str2) {
    $.ajax({
        url: '/learning/selectGroup',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',
        data: { 'selectId': selectId, 'selectValue1': str1, 'selectValue2': str2 },
        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            var group = result.rows;
            $("#" + selectId).html("");

            if (selectId == "searchIntentGroup") {
                $("#" + selectId).append('<option value="">' + language.Large_group + '</option>');
            } 
            /*
            if (selectId == "searchLargeGroup") {
                $("#" + selectId).append('<option value="">' + language.Large_group + '</option>');
                $('#searchMediumGroup').html("");
                $('#searchSmallGroup').html("");
                $('#searchMediumGroup').append('<option value="">' + language.Middle_group + '</option>');
                $('#searchSmallGroup').append('<option value="">' + language.Small_group + '</option>');
            } else if (selectId == "searchMediumGroup") {
                $("#" + selectId).append('<option value="">' + language.Middle_group + '</option>');
                $('#searchSmallGroup').html("");
                $('#searchSmallGroup').append('<option value="">' + language.Small_group + '</option>');
            } else {
                $('#searchSmallGroup').append('<option value="">' + language.Small_group + '</option>');
            }
            */
            for (var i = 0; i < group.length; i++) {
                $("#" + selectId).append('<option value="' + group[i]['DLG_INTENT'] + '">' + group[i]['DLG_INTENT'] + '</option>');
            }

        }
    });
}




function searchDialog(contextEntityData) {
    $('#searchDialogBtn').off('click');
    var formData = $("form[name=searchForm]").serialize();
    $.ajax({
        url: '/learning/searchDialogByIntent',
        dataType: 'json',
        type: 'POST',
        data: formData,
        beforeSend: function () {

            var width = 0;
            var height = 0;
            var left = 0;
            var top = 0;

            width = 50;
            height = 50;

            top = ($(window).height() - height) / 2 + $(window).scrollTop();
            left = ($(window).width() - width) / 2 + $(window).scrollLeft();

            $("#loadingBar").addClass("in");
            $("#loadingImg").css({ position: 'absolute' }).css({ left: left, top: top });
            $("#loadingBar").css("z-index", 9999);
            $("#loadingBar").css("display", "block");
            $(".dialog_result strong").html(" " + "..." + " ");
        },
        complete: function () {
            $("#loadingBar").removeClass("in");
            $("#loadingBar").css("display", "none");

            $("#searchDialogBtn").on('click', function () {
                searchBtnFnc();
            });
        },
        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }

            var inputUttrHtml = '';

            var row = [];
            var arrayNum = 0;
            for (var k = 0; k < result['list'].length; k++) {
                if (k != 0 && result['list'][k].RNUM == result['list'][k - 1].RNUM) {
                    var num = result['list'][k].DLG_ORDER_NO - 1;
                    arrayNum--;
                    row[arrayNum][num] = result['list'][k];
                    arrayNum++;
                } else {
                    row[arrayNum] = [];
                    row[arrayNum][0] = result['list'][k];
                    arrayNum++;
                }
            }

            for (var i = 0; i < row.length; i++) {
                botChatNum++;
                var val = row[i];

                inputUttrHtml += '<div class="chat_box">';
                inputUttrHtml += '<p><input type="checkbox" name="searchDlgChk" class="flat-red"></p>';
                inputUttrHtml += '<div style="width: 100%; height: 95%; overflow: scroll; overflow-x: hidden; padding:10px;">';
                inputUttrHtml += '<div>';

                for (var l = 0; l < val.length; l++) {
                    var tmp = val[l];

                    for (var j = 0; j < tmp.dlg.length; j++) {

                        if (tmp.dlg[j].DLG_TYPE == 2) {

                            inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                            inputUttrHtml += '<div class="wc-message-content">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div><div class="format-markdown"><div class="textMent">';
                            inputUttrHtml += '<p>';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '||' + contextEntityData + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.GroupL + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.GroupM + '"/>';
                            inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.GroupM + '"/>';
                            inputUttrHtml += tmp.dlg[j].CARD_TEXT;
                            inputUttrHtml += '</p>';
                            inputUttrHtml += '</div></div></div></div></div>';

                        } else if (tmp.dlg[j].DLG_TYPE == 3) {

                            if (j == 0) {
                                inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                                inputUttrHtml += '<div class="wc-message-content">';
                                inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                                inputUttrHtml += '<div class="wc-carousel slideBanner" style="width:280px;">';
                                inputUttrHtml += '<div>';
                                inputUttrHtml += '<button class="scroll previous" id="prevBtn' + (botChatNum) + '" style="display: none;" onclick="prevBtn(' + botChatNum + ', this)">';
                                inputUttrHtml += '<img src="/images/02_contents_carousel_btn_left_401x.png">';
                                inputUttrHtml += '</button>';
                                inputUttrHtml += '<div class="wc-hscroll-outer" >';
                                inputUttrHtml += '<div class="wc-hscroll" style="margin-bottom: 0px;" class="content" id="slideDiv' + (botChatNum) + '">';
                                inputUttrHtml += '<ul style="padding-left: 0px;">';
                                inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                                inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.GroupL + '"/>';
                                inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.GroupM + '"/>';
                                inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.GroupM + '"/>';
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

                                inputUttrHtml += '<p class="carousel">' + /*cardtext*/ tmp.dlg[j].CARD_TEXT + '</p>';
                            }
                            if (tmp.dlg[j].BTN_1_TITLE != null) {
                                inputUttrHtml += '<ul class="wc-card-buttons" style="padding-left:0px;"><li><button>' + /*btntitle*/ tmp.dlg[j].BTN_1_TITLE + '</button></li></ul>';
                            }
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '</li>';

                            //다이얼로그가 한개일때에는 오른쪽 버튼 x
                            if ((tmp.dlg.length == 2 && j == 1) || (tmp.dlg.length == 1 && j == 0)) {
                                inputUttrHtml += '</ul>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div></div></div></div>';
                            } else if ((tmp.dlg.length - 1) == j) {
                                inputUttrHtml += '</ul>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '<button class="scroll next" id="nextBtn' + (botChatNum) + '" onclick="nextBtn(' + botChatNum + ', this)"><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
                                inputUttrHtml += '</div></div></div></div>';
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
                            inputUttrHtml += '<ul style="min-width:0px; padding-left: 0px;">';
                            inputUttrHtml += '<li class="wc-carousel-item wc-carousel-play">';
                            inputUttrHtml += '<div class="wc-card hero" style="width:70%">';
                            inputUttrHtml += '<div class="wc-card-div imgContainer">';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.GroupL + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.GroupM + '"/>';
                            inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.GroupM + '"/>';
                            inputUttrHtml += '<img src="' + /* 이미지 url */ tmp.dlg[j].MEDIA_URL + '">';
                            inputUttrHtml += '<div class="playImg"></div>';
                            inputUttrHtml += '<div class="hidden" alt="' + tmp.dlg[j].CARD_TITLE + '"></div>';
                            inputUttrHtml += '<div class="hidden" alt="' + /* media url */ tmp.dlg[j].CARD_VALUE + '"></div>';
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '<h1>' + /* title */ tmp.dlg[j].CARD_TITLE + '</h1>';
                            inputUttrHtml += '<ul class="wc-card-buttons">';
                            inputUttrHtml += '</ul>';
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '</li>';

                            //다이얼로그가 한개일때에는 오른쪽 버튼 x
                            if ((tmp.dlg.length == 2 && j == 1) || (tmp.dlg.length == 1 && j == 0)) {
                                inputUttrHtml += '</ul>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div></div></div></div></div>';
                            } else if ((tmp.dlg.length - 1) == j) {
                                inputUttrHtml += '</ul>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '<button class="scroll next" id="nextBtn' + (botChatNum) + '" onclick="nextBtn(' + botChatNum + ', this)"><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
                                inputUttrHtml += '</div></div></div></div></div>';
                            }
                        }
                    }
                }

                inputUttrHtml += '</div>';
                inputUttrHtml += '</div>';
                inputUttrHtml += '</div>';
            }

            $(".dialog_result strong").html(" " + row.length + " ");
            $('#searchDlgResultDiv').prepend(inputUttrHtml);

            //Flat red color scheme for iCheck
            $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
                checkboxClass: 'icheckbox_flat-green',
                radioClass: 'iradio_flat-green'
            })

        },
        error: function (e) {
            $('#alertMsg').text(e.responseText);
            $('#alertBtnModal').modal('show');
            //alert(e.responseText);
        }
    });
}



//오른쪽 버튼 클릭시 슬라이드
function nextBtn(botChatNum, e) {

    var width = parseInt($(e).parent().parent().css('width'));
    $("#slideDiv" + botChatNum).animate({ scrollLeft: (parseInt($("#slideDiv" + botChatNum).scrollLeft()) + width) }, 500, function () {

        if ($("#slideDiv" + botChatNum).scrollLeft() ==
            ($("#slideDiv" + botChatNum).find(".wc-carousel-item").length - 2) * (width / 2)) {
            $("#nextBtn" + botChatNum).hide();
        }

    });

    $("#prevBtn" + botChatNum).show();
}

//왼쪽 버튼 클릭시 슬라이드
function prevBtn(botChatNum, e) {

    var width = parseInt($(e).parent().parent().css('width'));
    $("#slideDiv" + botChatNum).animate({ scrollLeft: ($("#slideDiv" + botChatNum).scrollLeft() - width) }, 500, function () {

        if ($("#slideDiv" + botChatNum).scrollLeft() == 0) {
            $("#prevBtn" + botChatNum).hide();
        }
    });

    $("#nextBtn" + botChatNum).show();
}



function selectDialog() {
    
    var successFlagg = false;
    var multieChk = false;
    var chkCnt = 0;
    $("input[name=searchDlgChk]").each(function (n) {
        var chk = $(this).parent().hasClass('checked');
        if (chk == true) {
            if (chkCnt > 0) {
                multieChk = true;
                return false;
            } else {
                chkCnt++;
                var cloneDlg = $(this).parent().parent().next().children().clone();
                if (contextEntityData == '') {
                    $('#dlgViewDiv').html('');
                    $('#dlgViewDiv').append(cloneDlg);
                } else {
                    $('#dlgViewDiv_' + contextEntityData).html('');
                    $('#dlgViewDiv_' + contextEntityData).append(cloneDlg);
                }
                successFlagg = true;
            }
        }
    });
    if (multieChk) {
        
        $('#alertMsg').text('1개만 선택 가능합니다.');
        $('#alertBtnModal').modal('show');
        return false;
    }
    if (successFlagg == false) {
        
        $('#alertMsg').text(language.Please_select_a_dialogue);
        $('#alertBtnModal').modal('show');
        //alert(language.Please_select_a_dialogue);
    } else {
        makeRelation();
        
        $('.previous').hide();
        $('.next').show();
        $('.searchDialogClose').click();
    }
}



// Utterance Learn
function makeRelation() {

    var selectUtterSeq = $('#selectUtterSeq').val();
    
    //var entities = $('input[name=entity]').val();
    var entities = $('#selectUtterEntities').val().trim();

    if (entities == "") {
        $('#alertMsg').text("엔티티를 먼저 등록해 주세요.");
        $('#alertBtnModal').modal('show');
        //alert("엔티티를 먼저 등록해 주세요.");
    }

    //var inputDlgId = $('input[name=dlgId]');

    var dlgId = new Array();
    var contextData = new Array();

    /*
    * inputDlgId 에서 12||entity 양식이 아니면 기존 로직
    * 맞으면 context 이므로 데이터를 넣는다.
    */
    /*
    var check_array;
    for (var t = 0; t < inputDlgId.length; t++) {
        //alert("inputDlgId for==="+inputDlgId[t].value);
        check_array = inputDlgId[t].value.split('||');
        if (check_array[1] == "" || check_array[1] == null) {
            dlgId.push(check_array[0]);
        } else {
            contextData.push(inputDlgId[t].value);
        }
    }
    */


    $('input[name=dlgId]').each(function (n) {
        var chk = $(this).parents('.chat_box').find('input[name=searchDlgChk]').parent().hasClass('checked');
        if (chk == true) {
            dlgId.push($(this).val().split('||')[0]);
        }
    });

    var inputUtterArray = new Array();
    var selIndex = -1;
    $('#qnaListBody tr').each(function () {
        selIndex++;
        var tmpSeq = $(this).find('#hiddenSeq').val()
        if (tmpSeq == selectUtterSeq) {
            inputUtterArray.push($(this).find('a[name=selEntity]').text());
        }
        /*
        if ($(this).find('div').hasClass('checked')) {
            inputUtterArray.push($(this).find('input[name=hiddenUtter]').val());
        }
        */
    });

    var utterQuery = $('');
    //var luisId = $('#dlgViewDiv').find($('input[name=luisId]'))[0].value;
    //var luisIntent = $('#dlgViewDiv').find($('input[name=luisIntent]'))[0].value; 기존에는 middle group
    var luisIntent = $('#selectUtterIntent').val();
    var selAppId = $('#selectUtterAppId').val();
    //var predictIntent = $('#dlgViewDiv').find($('input[name=predictIntent]'))[0].value;//안 쓰겠지만 지우면 고칠게 많아질듯...차후 변경

    //console.log('d');

    $.ajax({
        url: '/learning/relationUtterAjax',
        dataType: 'json',
        type: 'POST',
        data: { 'entities': entities, 'dlgId': dlgId, 'utters': inputUtterArray,  'luisIntent': luisIntent, 'contextData': contextData, 'selectUtterSeq' : selectUtterSeq, 'selAppId': selAppId },
        beforeSend: function () {

            var width = 0;
            var height = 0;
            var left = 0;
            var top = 0;

            width = 50;
            height = 50;

            top = ($(window).height() - height) / 2 + $(window).scrollTop();
            left = ($(window).width() - width) / 2 + $(window).scrollLeft();

            $("#loadingBar").addClass("in");
            $("#loadingImg").css({ position: 'absolute' }).css({ left: left, top: top });
            $("#loadingBar").css("display", "block");
        },
        complete: function () {
            $("#loadingBar").removeClass("in");
            $("#loadingBar").css("display", "none");
        },
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
            if (!data.result) {
                $('#alertMsg').text(language.It_failed);
                $('#alertBtnModal').modal('show');
                //alert("failed");
                return false;
            }
            else {
                $('#alertMsg').text(language.Added);
                $('#alertBtnModal').modal('show');
                $('#qnaListBody tr').eq(selIndex).remove();
                //alert(language.Added);
                //location.reload();
            }
        }
    });
    

    
}


function searchBtnFnc() {
    if ($('input[name=serachDlg]').val() == '' && $('#searchLargeGroup').val() == '') {
        
        $('#alertMsg').text(language.Select_search_word_or_group);
        $('#alertBtnModal').modal('show');
        //alert(language.Select_search_word_or_group);
    } else {
        $("#searchDlgResultDiv").html("");

        searchDialog(contextEntityData);
    }
}

