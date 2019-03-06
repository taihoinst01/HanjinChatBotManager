var language;
var contextEntityData = '';//context 화면 구성을 위한 임시변수이다.

; (function ($) {
    console.log("utterance test");
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function (data) {
            language = data.lang;
        }
    });
})(jQuery);

$(document).ready(function () {
    // recommend에서 넘어온 문장 insert
    var recommendParam = $('#utterence').val();
    if (recommendParam) {
        utterInput(recommendParam);
        predictIntent(recommendParam);
    }

    //새로운 다이얼로그 생성 모달창에 필요한 luisId 가져오기
    //getLuisInfo('luisId');

    //새로운 다이얼로그 생성 모달창에 필요한 그룹 가져오기
    getGroupSeelectBox();

    //엔티티 추가 모달 초기 설정
    entityValidation();
    //엔티티추가 모달 selectbox 설정
    selectApiGroup();

    $('.addDialogCancel').click(function () {
        $('#appInsertForm')[0].reset();
        var inputEntityStr = "<div style='margin-top:4px;'><input name='entityValue' tabindex='1' id='entityValue' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' onkeyup='entityValidation();' spellcheck='false' autocomplete='off'>";
        inputEntityStr += '<a href="#" name="delEntityBtn" class="entity_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
        $('.entityValDiv').html(inputEntityStr);
        entityValidation();
    });

    $('#entities').click(function () {
        setTimeout(function () {
            $('#addEntityModal').find("input:visible:first").focus();
            //$('#entityDefine').focus();
        }, 500);
    });

    $(document).on("click", "a[name=delEntityBtn]", function (e) {
        if ($('.entityValDiv  input[name=entityValue]').length < 2) {
            alert('1개 이상 입력해야 합니다.');
            $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length - 1).focus();
        } else {
            $(this).parent().remove();
            $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length - 1).focus();
            entityValidation();
        }
    });


});


$(document).on("click", "#addEntityValBtn", function (e) {
    var entityLength = $('.entityValDiv  input[name=entityValue]').length + 1;
    inputEntityStr = "<div style='margin-top:4px;'><input name='entityValue' id='entityValue' tabindex='" + entityLength + "' type='text' class='form-control' style=' float: left; width:80%;' placeholder='" + language.Please_enter + "' onkeyup='entityValidation();'  spellcheck='false' autocomplete='off'>";
    inputEntityStr += '<a href="#" name="delEntityBtn" class="entity_delete" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></div>';
    $('.entityValDiv').append(inputEntityStr);
    $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length - 1).focus();
    entityValidation();
});

$(document).on("keypress", "input[name=entityValue]", function (e) {
    if (e.keyCode === 13) {	//	Enter Key
        //var inputIndex = $('.entityValDiv  input[name=entityValue]').index($(this));
        $('#addEntityValBtn').trigger('click');
        $('.entityValDiv  input[name=entityValue]').eq($('.entityValDiv  input[name=entityValue]').length - 1).focus();
    }
});

// Utterance 삭제
$(document).on('click', '.utterDelete', function () {

    $(this).parents('tr').next().remove();
    $(this).parents('tr').remove();

    var $tr = $('.recommendTbl tbody').children('tr');
    $tr.css('opacity', '0.0')
        .addClass('off-screen')
        .slice(0, 6)
        .removeClass('off-screen')
        .animate({ opacity: 1 }, 300);



    $('#dlgViewDiv').html("");
    $('input[name=tableAllChk]').parent().iCheck('uncheck');
    //의도예측 데이터 삭제
    $('select[name=predictIntent] :first-child').nextAll().remove();

    $('input[name="iptUtterance"').attr("disabled", false);
    $('#contextHtmlDiv').html('No Entity');
    $('#contextDetailHtmlDiv').html('Please Select Entity');
    contextEntityData = "";

    pagingFnc();

});

function pagingFnc() {
    var rowPerPage = $('[name="dlgRowPerPage"]').val() * 1;// 1 을  곱하여 문자열을 숫자형로 변환

    //		console.log(typeof rowPerPage);

    var zeroWarning = 'Sorry, but we cat\'t display "0" rows page. + \nPlease try again.'
    if (!rowPerPage) {
        alert(zeroWarning);
        return;
    }
    $('.pagination').html('');
    var $products = $('.recommendTbl');

    var $tr = $($products).children('tbody').children('tr');
    var rowTotals = $tr.length;
    //	console.log(rowTotals);

    var pageTotal = Math.ceil(rowTotals / rowPerPage);
    var i = 0;

    for (; i < pageTotal; i++) {
        if (i == 0) {

            $('<li class="li_paging active" value="' + i + '"><a href="#" onclick="return false;">' + (i + 1) + '</a></li>')
                .appendTo('.pagination');
        } else {

            $('<li class="li_paging" value="' + i + '"><a href="#" onclick="return false;">' + (i + 1) + '</a></li>')
                .appendTo('.pagination');
        }
    }

    $tr.addClass('off-screen')
        .slice(0, rowPerPage)
        .removeClass('off-screen');


    var $pagingLink = $('.li_paging');
    $pagingLink.on('click', function (evt) {
        evt.preventDefault();
        var $this = $(this);
        if ($this.hasClass('active')) {
            return;
        }
        $pagingLink.removeClass('active');
        $this.addClass('active');
        // 0 => 0(0*4), 4(0*4+4)
        // 1 => 4(1*4), 8(1*4+4)
        // 2 => 8(2*4), 12(2*4+4)
        // 시작 행 = 페이지 번호 * 페이지당 행수
        // 끝 행 = 시작 행 + 페이지당 행수

        var currPage = $this.val();
        var startItem = currPage * rowPerPage;
        var endItem = startItem + rowPerPage;

        $tr.css('opacity', '0.0')
            .addClass('off-screen')
            .slice(startItem, endItem)
            .removeClass('off-screen')
            .animate({ opacity: 1 }, 300);
        //pagingSkip();

    });
    $pagingLink.filter(':first').addClass('active');
    //pagingSkip();

}

function pagingSkip() {

    $('#preBtn').remove();
    $('#nextBtn').remove();
    $('#firstBtn').remove();
    $('#lastBtn').remove();
    $('.pagination').children('a').show();

    var activeIndex = $('.pagination').children('a').index($('.active'));
    if (activeIndex - 4 > 0) {
        $('.pagination').children('a')
            .slice(0, activeIndex - 4)
            .hide();

        $('<a href="#"></a>')
            .attr('id', "firstBtn")
            .html("[1]")
            .prependTo('.pagination');
    }
    var activeRightIndex;
    if ($('#firstBtn').length > 0) {
        activeRightIndex = activeIndex + 6;
    } else {
        activeRightIndex = activeIndex + 5;
    }
    if (activeRightIndex < $('.pagination').children('a').length) {
        var rightLen = $('.pagination').children('a').length;
        if ($('#preBtn').length > 0) {
            activeRightIndex += 2;
        }
        $('.pagination').children('a')
            .slice(activeRightIndex, rightLen)
            .hide();
        $('<a href="#"></a>')
            .attr('id', "lastBtn")
            .html('[' + $('.pagination').children('a').eq($('.pagination').children('a').length - 1).html() + ']')
            .appendTo('.pagination');
    }
}

$(document).on('click', '#firstBtn', function () {
    $('.pagination').children('a').eq(2).trigger('click');
    return false;
});
$(document).on('click', '#lastBtn', function () {
    $('.pagination').children('a').eq($('.pagination').children('a').length - 3).trigger('click');
    return false;
});
$(document).ready(function () {

    //add eneity mordal save btn check
    $('input[name=entityDefine], input[name=entityValue]').on('input', function (e) {
        if ($('input[name=entityDefine]').val() !== "" && $('input[name=entityValue]').val() !== "") {
            $('#btnAddEntity').removeClass('disable');
            $('#btnAddEntity').prop("disabled", false);
        } else {
            $('#btnAddEntity').addClass('disable');
            $('#btnAddEntity').prop("disabled", true);
        }
    });




    // Utterance 입력
    $('input[name=iptUtterance]').keypress(function (e) {

        if (e.keyCode == 13) {	//	Enter Key

            //$("#entityUtteranceTextTable tbody").html("");
            $('#dlgViewDiv').html('');

            $('input[name=iptUtterance]').attr('readonly', true);
            var queryText = $(this).val();
            if (queryText.trim() == "" || queryText.trim() == null) {
                $('input[name=iptUtterance]').attr('readonly', false);
                return false;
            }
            utterInput(queryText);
            predictIntent(queryText);//의도예측 추가

            $("input[name=iptUtterance]").attr("readonly", false);
        }
    });

    // Context data 입력
    $('input[name=contextInputData]').keypress(function (e) {

        if (e.keyCode == 13) {	//	Enter Key
            $('#contextDataListBody').html('');
            $('#contextDetailHtmlDiv').html('');
            var contextData = $(this).val();
            if (contextData.trim() == "" || contextData.trim() == null) {
                $('input[name=contextDataListBody]').attr('readonly', false);
                return false;
            }

            var inputContextDataHtml = '';
            inputContextDataHtml += '<tr><input type="hidden" name="hiddenUtter" value="' + contextData + '"/>';
            inputContextDataHtml += '<td> <input type="checkbox" name="tableCheckBox" class="flat-red"></td>';
            inputContextDataHtml += '<td class="txt_left clickUtter"><input type=hidden name="entity" value="' + contextData + '"/>' + contextData + '</td>';
            inputContextDataHtml += '<td><a href="#" onClick="contextDataDel(\'' + contextData + '\', this)"><span class="fa  fa-trash"><span class="hc">삭제</span></span></a></td></tr>';

            $('#contextListTable > tbody:first').append(inputContextDataHtml);
            contextDataInput(contextData);
        }
    });

    // Utterance Learn
    $('#utterLearn').click(function () {

        var entitiyCheckFlag = true;
        var entitiyCheckCount = 0;
        $('input[name=tableCheckBox]').each(function () {
            if ($(this).parent().hasClass('checked') == true) {
                entitiyCheckCount++;
                if ($(this).parents('tr').find('input[name=entity]').val() == "") {
                    entitiyCheckFlag = false;
                }
            }
        })

        if (entitiyCheckCount == 0) {
            alert("선택된 문장이 없습니다 문장을 선택해주세요.");
        } else if (entitiyCheckCount > 1) {
            alert("학습된 엔티티가 포함된 문장을 한개만 선택해주세요.");
        } else if (entitiyCheckCount == 1) {

            if ($('input[name=dlgBoxChk]').parent().hasClass('checked') == true) {
                if ($('#dlgViewDiv').children().length == 0) {
                    alert("선택된 대화상자창에 대화상자가 없습니다. 대화상자를 검색해서 추가 하시거나 생성해주세요.");
                } else {
                    var entities = $('input[name=entity]').val();

                    var inputDlgId = $('input[name=dlgId]');

                    var dlgId = new Array();
                    var contextData = new Array();

                    /*
                    * inputDlgId 에서 12||entity 양식이 아니면 기존 로직
                    * 맞으면 context 이므로 데이터를 넣는다.
                    */
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

                    var inputUtterArray = new Array();
                    $('#utterTableBody tr').each(function () {
                        if ($(this).find('div').hasClass('checked')) {
                            inputUtterArray.push($(this).find('input[name=hiddenUtter]').val());
                        }
                    });

                    var utterQuery = $('');
                    var luisId = $('#dlgViewDiv').find($('input[name=luisId]'))[0].value;
                    //var luisIntent = $('#dlgViewDiv').find($('input[name=luisIntent]'))[0].value; 기존에는 middle group
                    var luisIntent = $('#dlgViewDiv').find($('input[name=predictIntent]'))[0].value;
                    var predictIntent = $('#dlgViewDiv').find($('input[name=predictIntent]'))[0].value;//안 쓰겠지만 지우면 고칠게 많아질듯...차후 변경

                    $.ajax({
                        url: '/learning/learnUtterAjax',
                        dataType: 'json',
                        type: 'POST',
                        data: { 'entities': entities, 'dlgId': dlgId, 'luisId': luisId, 'luisIntent': luisIntent, 'utters': inputUtterArray, 'predictIntent': predictIntent, 'contextData': contextData },
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
                        success: function (result) {
                            if (result.loginStatus == 'DUPLE_LOGIN') {
                                alert($('#dupleMassage').val());
                                location.href = '/users/logout';
                            }
                            if (result['result'] == "learned") {
                                alert(language.Learned);
                                $('input[name=tableAllChk]').parent().iCheck('uncheck');

                                $('.recommendTbl tbody').html('');
                                $('#dlgViewDiv').html('');

                                $('input[name=dlgBoxChk]').parent().iCheck('uncheck');

                                $('select[name=predictIntent] :first-child').nextAll().remove();
                                $('.pagination').html('');

                                $('#contextDataListBody').html('<tr><td colspan=3>No Context Data</td></tr>');
                                $('#contextDetailHtmlDiv').html('Please Select Entity');
                                contextEntityData = "";

                            } else {
                                if (result['result'] == true) {
                                    alert(language.Added);

                                    $('input[name=tableAllChk]').parent().iCheck('uncheck');

                                    $('.recommendTbl tbody').html('');
                                    $('#dlgViewDiv').html('');

                                    $('input[name=dlgBoxChk]').parent().iCheck('uncheck');

                                    $('select[name=predictIntent] :first-child').nextAll().remove();
                                    $('.pagination').html('');

                                    $('#contextDataListBody').html('<tr><td colspan=3>No Context Data</td></tr>');
                                    $('#contextDetailHtmlDiv').html('Please Select Entity');
                                    contextEntityData = "";

                                } else {
                                    alert(language.It_failed);
                                }
                            }

                        }
                    });
                }
            } else {
                alert("대화상자를 선택해주세요.");
            }

        }
    });



    //다이얼로그 생성 모달 닫는 이벤트(초기화)
    $(".js-modal-close").click(function () {
        $('html').css({ 'overflow': 'auto', 'height': '100%' }); //scroll hidden 해제
        $('#layoutBackground').hide();
    });

    //add entity mordal close event
    $('.addEntityModalClose').click(function () {
        $('form[name=entityInsertForm]')[0].reset();
    });

    $('.createDlgModalClose').click(function () {
        $('#mediaCarouselLayout').css('display', 'none');
        $('#cardLayout').css('display', 'none');
        $('#appInsertForm')[0].reset();
        $('.insertForm').remove();
        $('#commonLayout hr').remove();
        $('.btnInsertDiv').each(function () {
            $(this).html("");
        })


        $('#apiLayout').css('display', 'none');
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

    // 소스 타입 변경
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

    //다이얼로그 Add From
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
        insertForm += '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder=" ' + language.Please_enter + '" spellcheck="false" autocomplete="off">';
        insertForm += '</div>';
        insertForm += '<div class="form-group">';
        insertForm += '<label>' + language.DIALOG_BOX_CONTENTS + '<span class="nec_ico">*</span></label>';
        insertForm += '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder=" ' + language.Please_enter + '" spellcheck="false" autocomplete="off">';
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

    $("#searchDialogBtn").on('click', function () {

        if ($('input[name=serachDlg]').val() == '' && $('#searchLargeGroup').val() == '') {
            alert(language.Select_search_word_or_group);
        } else {
            $("#searchDlgResultDiv").html("");

            searchDialog(contextEntityData);
        }


    });

    $(".searchDialogClose").on('click', function () {
        $('input[name=serachDlg]').val('');
        $('#searchDlgResultDiv').html('');
        $('.dialog_result strong').html(' 0 ');
    });

});



//utter td 클릭
$(document).on('click', '.clickUtter', function (event) {
    var utter = $(this).find('input[name=entity]').val();
    $('#dlgViewDiv').html(dlgMap[utter]);
});

//intent selbox 선택
$(document).on('change', '#intentNameList', function (event) {
    selectDlgListAjax($("#intentNameList option:selected").val());
});

// 다이얼로그 생성 모달 (다이얼로그 타입변경)
$(document).on('change', 'select[name=dlgType]', function (e) {
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
        insertHtml += language.Please_enter_your_content;
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
        insertHtml += '</div>';
        insertHtml += '</li></ul></div></div>';
        insertHtml += '<button class="scroll next" disabled=""><img src="/images/02_contents_carousel_btn_right_401x.png"></button>';
        insertHtml += '</div></div></div></div></div>';

        $(".dialogView").eq(idx).html(insertHtml);
    }
});

//다이얼로그 생성 유효성 검사
function dialogValidation(type) {
    if (type == 'dialogInsert') {
        var dialogText = $('input[name=dialogText]').val();

        if (dialogText != "") {
            $('#btnAddDlg').removeClass("disable");
            $('#btnAddDlg').attr("disabled", false);
        } else {
            $('#btnAddDlg').attr("disabled", "disabled");
            $('#btnAddDlg').addClass("disable");
        }
    }
}

// 다이얼로그생성모달 (다이얼로그 타이틀 입력)
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

$(document).on('change', '.insertForm .mediaLayout input[name=imgUrl]', function (e) {
    var idx = $(".insertForm .mediaLayout input[name=imgUrl]").index(this);
    $('.dialogView .wc-card-div img:eq(' + idx + ')').attr("src", $(e.target).val());
});


function writeCarouselImg(e) {
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    var jcx = $(e).parents('.insertForm').find('input[name=imgUrl]').index(e);

    $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('.imgContainer img').attr("src", e.value);
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
        $('.dialogView').children().eq(icx).find('.dlgMediaText').text(e.value);
    } else {
        //$('.dialogView .textMent p:eq(' + idx + ')').html(e.value);
        //$('.dialogView').children().eq(icx).find('.textMent p:eq(' + idx + ')').html(e.value);
        if ($(e).parent().prev().find('input[name=dialogTitle]').val() == '') {
            $('.dialogView').children().eq(icx).find('.textMent .textTitle').text('');
        }
        $('.dialogView').children().eq(icx).find('.textMent p').text(e.value);
    }

}

//모달창 입력값에 따른 save 버튼 활성화 처리
function entityValidation() {

    var defineText = $('#entityDefine').val().trim();
    var valueText = true;

    $('.entityValDiv  input[name=entityValue]').each(function () {
        if ($(this).val().trim() === "") {
            valueText = false;
            return;
        }
    });

    if (defineText != "" && valueText) {
        $('#btnAddDlg').removeClass("disable");
        $('#btnAddDlg').attr("disabled", false);
    } else {
        $('#btnAddDlg').attr("disabled", "disabled");
        $('#btnAddDlg').addClass("disable");
    }

}

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
                $('#apiGroup').append(optionStr);
            }
        }
    });
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
        data: { 'data': array/*, 'entities' : chkEntities*/ },
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
                //inputUttrHtml += '<input type="hidden" name="dlgId" value="' + data.list[i] + '"/>';
                inputUttrHtml += '<input type="hidden" name="dlgId" value="' + data.list[i] + '||' + contextEntityData + '"/>';
            }
            var largeGroup = $('#appInsertForm').find('#largeGroup')[0].value
            var middleGroup;
            $('#appInsertForm').find('[name=middleGroup]').each(function () {
                if ($(this).attr('disabled') == undefined) {
                    middleGroup = $(this).val();
                    return false;
                }
            })
            //var predictIntent = $('#appInsertForm').find('#predictIntent')[0].value
            var predictIntent;
            $('#appInsertForm').find('[name=predictIntent]').each(function () {
                if ($(this).attr('disabled') == undefined) {
                    predictIntent = $(this).val();
                    return false;
                }
            })
            $('.newMidBtn').click();
            $('.cancelMidBtn').click();

            inputUttrHtml += '<input type="hidden" name="luisId" value="' + largeGroup + '"/>';
            inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + middleGroup + '"/>';
            inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + predictIntent + '"/>';

            var createDlgClone = $('.dialogView').children().clone();
            if (contextEntityData == '') {
                $('#dlgViewDiv').html('');
                $('#dlgViewDiv').append(createDlgClone);
                $('#dlgViewDiv').append(inputUttrHtml);
            } else {
                $('#dlgViewDiv_' + contextEntityData).html('');
                $('#dlgViewDiv_' + contextEntityData).append(createDlgClone);
                $('#dlgViewDiv_' + contextEntityData).append(inputUttrHtml);
            }

            $('.createDlgModalClose').click();
        }
    });
}

var botChatNum = 1;
//dlg 저장
var dlgMap = new Object();
function selectDlgListAjax(entity) {
    $.ajax({
        url: '/learning/selectDlgListAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'entity': entity },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {          //성공했을 때 함수 인자 값으로 결과 값 나옴
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            var inputUttrHtml = '';
            for (var i = 0; i < result['list'].length; i++) {
                var tmp = result['list'][i];

                for (var j = 0; j < tmp.dlg.length; j++) {
                    if (tmp.dlg[j].DLG_TYPE == 2) {
                        inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                        inputUttrHtml += '<div class="wc-message-content">';
                        inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                        inputUttrHtml += '<div><div class="format-markdown"><div class="textMent">';
                        inputUttrHtml += '<p>';
                        inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.LUIS_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.LUIS_INTENT + '"/>';
                        inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.LUIS_INTENT + '"/>';
                        inputUttrHtml += tmp.dlg[j].CARD_TEXT;
                        inputUttrHtml += '</p>';
                        inputUttrHtml += '</div></div></div></div></div>';
                    } else if (tmp.dlg[j].DLG_TYPE == 3) {

                        if (j == 0) {
                            inputUttrHtml += '<div class="wc-message wc-message-from-bot" style="width:90%">';
                            inputUttrHtml += '<div class="wc-message-content" style="width:90%;">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div class="wc-carousel slideBanner" style="width: 312px;">';
                            inputUttrHtml += '<div>';
                            inputUttrHtml += '<button class="scroll previous" id="prevBtn' + (botChatNum) + '" style="display: none;" onclick="prevBtn(' + botChatNum + ', this)">';
                            inputUttrHtml += '<img src="/images/02_contents_carousel_btn_left_401x.png">';
                            inputUttrHtml += '</button>';
                            inputUttrHtml += '<div class="wc-hscroll-outer" >';
                            inputUttrHtml += '<div class="wc-hscroll" style="margin-bottom: 0px;" class="content" id="slideDiv' + (botChatNum) + '">';
                            inputUttrHtml += '<ul style="padding-left:0px;">';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.LUIS_ID + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.LUIS_INTENT + '"/>';
                            inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.LUIS_INTENT + '"/>';
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
                        inputUttrHtml += '<ul class="wc-card-buttons"><li><button>' + /*btntitle*/ tmp.dlg[j].BTN_1_TITLE + '<button></li></ul>';
                        inputUttrHtml += '</div>';
                        inputUttrHtml += '</li>';

                        //다이얼로그가 한개일때에는 오른쪽 버튼 x
                        if (tmp.dlg.length == 2 && j == 1) {
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
                        inputUttrHtml += '<ul style="padding-left:0px;>';
                        inputUttrHtml += '<li class="wc-carousel-item wc-carousel-play">';
                        inputUttrHtml += '<div class="wc-card hero">';
                        inputUttrHtml += '<div class="wc-card-div imgContainer">';
                        inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.LUIS_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.LUIS_INTENT + '"/>';
                        inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.LUIS_INTENT + '"/>';
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

            }//<a href="#" class="btn b02  btn-small js-modal-close">Cancel</a>
            //$('#dlgListTable').find('tbody').empty();

            $('#dlgViewDiv').prepend(inputUttrHtml);

            //dlg 기억.
            var utter = "";
            for (var i = 0; i < entity.length; i++) {
                utter += entity[i] + ",";
            }
            utter = utter.substr(0, utter.length - 1);
            dlgMap[utter] = inputUttrHtml;

            botChatNum++;
        }

    }); // ------      ajax 끝-----------------
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

function contextDlgHowHide(it, box) {
    var vis = (box.checked) ? "block" : "none";
    document.getElementById("context_content_" + it).style.display = vis;
    if (vis == 'none') {
        $('#dlgViewDiv_' + it).html("");
    }
}


function utterInput(queryText) {
    var queryTextArr = [];
    if (typeof queryText === 'string') {
        queryTextArr[0] = queryText;
    } else {  //'object'
        queryTextArr = queryText.reverse();
    }


    $.ajax({
        url: '/learning/utterInputAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'iptUtterance': queryTextArr },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {          //성공했을 때 함수 인자 값으로 결과 값 나옴
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            var entities = result['entities'];
            for (var k = 0; k < queryTextArr.length; k++) {


                if (entities[k] != null) {
                    entities[k] = entities[k].split(",");
                } else {
                    entities[k] = [];
                }

                if (result['result'] == true) {
                    var utter = utterHighlight(result.commonEntities[k], result['iptUtterance'][k]);
                    var selBox = result['selBox'];

                    $('input[name="iptUtterance"').val('');
                    $('input[name="iptUtterance"').attr("disabled", true);
                    var inputUttrHtml = '';
                    inputUttrHtml += '<tr><input type="hidden" name="hiddenUtter" value="' + queryText + '"/>';
                    inputUttrHtml += '<td> <input type="checkbox" name="tableCheckBox" class="flat-red"></td>';
                    inputUttrHtml += '<td class="txt_left clickUtter"><input type=hidden name="entity" value="' + result['entities'][k] + '"/>' + utter + '</td>';
                    inputUttrHtml += '<td><a href="#"><span class="fa  fa-trash utterDelete"><span class="hc">삭제</span></span></a></td></tr>';
                    inputUttrHtml += '<tr><td></td><td class="txt_left">';
                    inputUttrHtml += '</td><td></td></tr>';

                    $('.recommendTbl').find('tbody').prepend(inputUttrHtml);

                    selectDlgListAjax(entities[k]);

                    pagingFnc();
                    //Flat red color scheme for iCheck
                    $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
                        checkboxClass: 'icheckbox_flat-green',
                        radioClass: 'iradio_flat-green'
                    })


                }
            }
        } //function끝

    }); // ------      ajax 끝-----------------


}

$(document).on('ifChecked', 'input[name=tableAllChk]', function () {

    $('input[name=tableCheckBox]').parent().iCheck('check');
});

$(document).on('ifUnchecked', 'input[name=tableAllChk]', function () {

    $('input[name=tableCheckBox]').parent().iCheck('uncheck');
});


function utterHighlight(entities, utter) {
    var result = utter;
    if (entities) {
        for (var i = 0; i < entities.length; i++) {
            result = result.replace(entities[i].ENTITY_VALUE, '<span class="highlight">' + entities[i].ENTITY_VALUE + '</span>');
        }
    }
    return result;
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
            for (var i = 0; i < group.length; i++) {
                $("#" + selectId).append('<option value="' + group[i]['GROUP'] + '">' + group[i]['GROUP'] + '</option>');
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
function openModalBox(target, contextEntity) {
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
    if (target == "#create_dlg") {

        $(".insertForm form").append($(".textLayout").clone(true));
        $(".insertForm form").append(deleteInsertForm);
        $(".insertForm .textLayout").css("display", "block");
    }

    if (target == "#search_dlg") {
        selectGroup('searchLargeGroup');
    }

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

function searchDialog(contextEntityData) {
    var formData = $("form[name=searchForm]").serialize();
    $.ajax({
        url: '/learning/searchDialog',
        dataType: 'json',
        type: 'POST',
        data: formData,
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
            alert(e.responseText);
        }
    });
}

// Search Dialogue 팝업창 
// 다이얼로그 체크박스 단일 체크
$(document).on('ifChecked', 'input[name=searchDlgChk]', function (event) {

    $('input[name=searchDlgChk]').not($(this)).each(function () {
        $(this).parent().iCheck('uncheck')
    });

})

function selectDialog() {
    //alert("selectDialog contextEntityData===="+contextEntityData);
    var successFlagg = false;
    $("input[name=searchDlgChk]").each(function (n) {
        var chk = $(this).parent().hasClass('checked');
        if (chk == true) {
            var cloneDlg = $(this).parent().parent().next().children().clone();
            if (contextEntityData == '') {
                $('#dlgViewDiv').html('');
                $('#dlgViewDiv').append(cloneDlg);
            } else {
                $('#dlgViewDiv_' + contextEntityData).html('');
                $('#dlgViewDiv_' + contextEntityData).append(cloneDlg);
            }

            $('.previous').hide();
            $('.next').show();
            $('.searchDialogClose').click();
            successFlagg = true;
            return false;
        }
    });

    if (successFlagg == false) {

        alert(language.Please_select_a_dialogue);
    }

}

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
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off"></td>' +
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
            '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off"></td>' +
            '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off"></td>' +
            '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
            '</tr>'
        $(this).parent().prev().prev().prev().find('.cardCopyTbl tbody').append(inputTrHtml);





    } else {
        alert("버튼은 4개까지 추가할 수 있습니다.");
    }

});

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

            $('.dialogView').eq(insertFormIdx).find('.slideDiv .wc-carousel-item').eq(idx).remove();
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
        '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off">' +
        '</td><td></td><td>' +
        '<input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off">' +
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
            '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off"></td>' +
            '<td></td><td><input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '" spellcheck="false" autocomplete="off"></td>' +
            '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
            '</tr>'
        $(this).parent().prev().find('tbody').append(inputTrHtml);
    } else {
        alert(language.Up_to_4_buttons_can_be_added);
    }

});

//다이얼로그생성 - 카드추가
$(document).on('click', '.addCarouselBtn', function (e) {

    if ($(this).parents('.insertForm').find('.carouselLayout').length == 10) {
        alert(language.Up_to_10_cards_can_be_added);
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
    }
});

//엔티티 추가
function insertEntity() {

    if ($('#entityDefine').val().trim() === "") {
        alert(language.Please_enter);
        return false;
    }
    var valueText = false;

    $('.entityValDiv input[name=entityValue]').each(function () {
        if ($(this).val().trim() === "") {
            valueText = true;
            return;
        }
    });

    if (valueText) {
        alert(language.Please_enter);
        return;
    }

    var entityDefineVal = $('#entityDefine').val().trim();
    var apiGroupVal = $('#apiGroup :selected').val();
    var entityValueList = [];
    $('.entityValDiv input[name=entityValue]').each(function () {

        for (var i = 0; i < entityValueList.length; i++) {
            if (entityValueList[i].entityValue === $(this).val().trim()) {
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
        return;
    }

    $.ajax({
        url: '/learning/insertEntity',
        dataType: 'json',
        contentType: 'application/json',
        type: 'POST',
        data: JSON.stringify(entityValueList), //$('#appInsertForm').serializeObject(),
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
                $('.addDialogCancel').click();
                alert(language.Added);
                entitiesAjax();
            } else if (data.status == 'Duplicate') {
                alert(language.DUPLICATE_ENTITIES_EXIST);
            } else {
                alert(language.It_failed);
            }
        }
    });

}

//다이얼로그 생성 모달창 - 중그룹 신규버튼
$(document).on('click', '.newMidBtn, .cancelMidBtn', function () {

    var $iptLuisIntent = $('input[name=middleGroup]');
    var $selectLuisIntent = $('select[name=middleGroup]');

    if ($(this).hasClass('newMidBtn')) {
        $('.newMidBtn').hide();
        $('.cancelMidBtn').show();

        $iptLuisIntent.show();
        $iptLuisIntent.removeAttr('disabled');

        $selectLuisIntent.hide();
        $selectLuisIntent.attr('disabled', 'disabled');
    } else {
        $('.newMidBtn').show();
        $('.cancelMidBtn').hide();

        $selectLuisIntent.show();
        $selectLuisIntent.removeAttr('disabled');

        $iptLuisIntent.hide();
        $iptLuisIntent.attr('disabled', 'disabled');
    }
})

//다이얼로그 생성 모달창 - intent group
$(document).on('click', '.newIntentBtn, .cancelIntentBtn', function () {

    var $iptLuisIntent = $('input[name=predictIntent]');
    var $selectLuisIntent = $('select[name=predictIntent]');

    if ($(this).hasClass('newIntentBtn')) {
        $('.newIntentBtn').hide();
        $('.cancelIntentBtn').show();

        $iptLuisIntent.show();
        $iptLuisIntent.removeAttr('disabled');

        $selectLuisIntent.hide();
        $selectLuisIntent.attr('disabled', 'disabled');
    } else {
        $('.newIntentBtn').show();
        $('.cancelIntentBtn').hide();

        $selectLuisIntent.show();
        $selectLuisIntent.removeAttr('disabled');

        $iptLuisIntent.hide();
        $iptLuisIntent.attr('disabled', 'disabled');
    }
})



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

        }
    });
}

/*
* 의도예측 select box 추가
*/
function predictIntent(queryText) {

    var queryTextArr = [];
    if (typeof queryText === 'string') {
        queryTextArr[0] = queryText;
    } else {  //'object'
        queryTextArr = queryText.reverse();
    }

    $.ajax({
        url: '/learning/predictIntentAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'iptUtterance': queryTextArr },      //데이터를 json 형식, 객체형식으로 전송

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
            var success_data = data.body.intents;
            var score_data;

            for (var i = 0; i < success_data.length; i++) {
                score_data = success_data[i].score.toFixed(2);
                $('select[name=predictIntent]').append('<option value="' + success_data[i].intent + '">' + success_data[i].intent + '::' + score_data + '</option>');
            }
        },
        error: function (error) {
            console.log("fail===");
        }//-------function end
    }); //-------------ajax end
}

$(document).on('change', '#predictIntent', function (e) {
    var intent = $("#predictIntent option:selected").val();

    $.ajax({
        url: '/learning/changeIntentAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'intent': intent },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            if (result.loginStatus == 'DUPLE_LOGIN') {
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            $('#dlgViewDiv').html('');
            var inputUttrHtml = '';
            for (var i = 0; i < result['list'].length; i++) {
                var tmp = result['list'][i];

                for (var j = 0; j < tmp.dlg.length; j++) {
                    if (tmp.dlg[j].DLG_TYPE == 2) {
                        inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                        inputUttrHtml += '<div class="wc-message-content">';
                        inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                        inputUttrHtml += '<div><div class="format-markdown"><div class="textMent">';
                        inputUttrHtml += '<p>';
                        inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.LUIS_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.LUIS_INTENT + '"/>';
                        inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.LUIS_INTENT + '"/>';
                        inputUttrHtml += tmp.dlg[j].CARD_TEXT;
                        inputUttrHtml += '</p>';
                        inputUttrHtml += '</div></div></div></div></div>';
                    } else if (tmp.dlg[j].DLG_TYPE == 3) {

                        if (j == 0) {
                            inputUttrHtml += '<div class="wc-message wc-message-from-bot" style="width:90%">';
                            inputUttrHtml += '<div class="wc-message-content" style="width:90%;">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div class="wc-carousel slideBanner" style="width: 312px;">';
                            inputUttrHtml += '<div>';
                            inputUttrHtml += '<button class="scroll previous" id="prevBtn' + (botChatNum) + '" style="display: none;" onclick="prevBtn(' + botChatNum + ', this)">';
                            inputUttrHtml += '<img src="/images/02_contents_carousel_btn_left_401x.png">';
                            inputUttrHtml += '</button>';
                            inputUttrHtml += '<div class="wc-hscroll-outer" >';
                            inputUttrHtml += '<div class="wc-hscroll" style="margin-bottom: 0px;" class="content" id="slideDiv' + (botChatNum) + '">';
                            inputUttrHtml += '<ul style="padding-left:0px;">';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.LUIS_ID + '"/>';
                            inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.LUIS_INTENT + '"/>';
                            inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.LUIS_INTENT + '"/>';
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
                        inputUttrHtml += '<ul class="wc-card-buttons"><li><button>' + /*btntitle*/ tmp.dlg[j].BTN_1_TITLE + '<button></li></ul>';
                        inputUttrHtml += '</div>';
                        inputUttrHtml += '</li>';

                        //다이얼로그가 한개일때에는 오른쪽 버튼 x
                        if (tmp.dlg.length == 2 && j == 1) {
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
                        inputUttrHtml += '<ul style="padding-left:0px;>';
                        inputUttrHtml += '<li class="wc-carousel-item wc-carousel-play">';
                        inputUttrHtml += '<div class="wc-card hero">';
                        inputUttrHtml += '<div class="wc-card-div imgContainer">';
                        inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisId" value="' + tmp.LUIS_ID + '"/>';
                        inputUttrHtml += '<input type="hidden" name="luisIntent" value="' + tmp.LUIS_INTENT + '"/>';
                        inputUttrHtml += '<input type="hidden" name="predictIntent" value="' + tmp.LUIS_INTENT + '"/>';
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
            }//<a href="#" class="btn b02  btn-small js-modal-close">Cancel</a>
            //$('#dlgListTable').find('tbody').empty();

            $('#dlgViewDiv').prepend(inputUttrHtml);

        },
        error: function (error) {
            console.log("fail===");
        }//-------function end
    });
});

/*
//TBL_DLG_RELATION_LUIS 테이블에서 LUIS_INTENT 가져오기
function getLuisInfo(searchInfo, luisId) {

    $.ajax({
        url: '/learning/getLuisInfo',
        dataType: 'json',
        data: {'searchInfo': searchInfo, 'luisId': luisId},
        type: 'POST',
        success: function(data) {

            if(searchInfo == 'luisIntent') {

                if(data.luisIntentList.length > 0 ) {

                    for(var i = 0; i < data.luisIntentList.length; i++) {
        
                        $('select[name=luisIntent]').append('<option>' + data.luisIntentList[i].luisIntent + '</option>');
                    }
                } else {
                    $('select[name=luisIntent] :first-child').nextAll().remove();
                }
            } else if(searchInfo == 'luisId') {

                for(var i = 0; i < data.luisIdList.length; i++) {
                    $('select[name=luisId]').append('<option>' + data.luisIdList[i].luisId + '</option>');
                }
            }

        }
    });
}
*/

function contextDataInput(contextData) {
    $('input[name="contextInputData"').val('');

    var addedFormDiv = document.getElementById("contextDetailHtmlDiv");
    var contextDetailHtml = '';
    contextDetailHtml += '<div class="box  color-palette-box"  style="height:550px">';
    contextDetailHtml += '<div class="box-body02">';
    contextDetailHtml += '<div class="box-header with-border">';
    contextDetailHtml += '<h3 class="box-title">' + contextData + ' Context Dialogue Box</h3>';
    contextDetailHtml += '<div class="btn_wrap03 fr" style="width:50%" >';
    contextDetailHtml += '<button type="button" class="btn btn_01" data-toggle="modal" data-target="#myModal1" onclick="openModalBox(\'#search_dlg\', \'' + contextData + '\')">검색</button>';
    contextDetailHtml += '&nbsp;<button type="button" class="btn btn-default" id="create_dlg" data-toggle="modal" data-target="#myModal2" onclick="openModalBox(\'#create_dlg\', \'' + contextData + '\')">새로생성</button>';
    contextDetailHtml += '</div>';
    contextDetailHtml += '</div>';
    contextDetailHtml += '<div class="dialog_wrap">';
    contextDetailHtml += '<div class="dialog_l"><input type="checkbox" name="dlgBoxChk" class="flat-red"></div>';
    contextDetailHtml += '<div class="dialog_r">';
    contextDetailHtml += '<div class="dialog_box" id="dlgViewDiv_' + contextData + '"> <!-- 챗팅창 --></div>';
    contextDetailHtml += '</div>';
    contextDetailHtml += '</div>';
    contextDetailHtml += '</div>';
    contextDetailHtml += '</div>';
    contextDetailHtml += '</div>';

    var addedDiv = document.createElement("div");
    addedDiv.id = "context_content_" + contextData;
    addedDiv.innerHTML = contextDetailHtml;
    addedFormDiv.appendChild(addedDiv);
}

function contextDataDel(delContextData, obj) {
    //context data delete
    var tr = $(obj).parent().parent();
    tr.remove();

    //context dialogue box delete
    var del_data = "context_content_" + delContextData;
    var field = document.getElementById(del_data);
    document.getElementById("contextDetailHtmlDiv").removeChild(field);
}
