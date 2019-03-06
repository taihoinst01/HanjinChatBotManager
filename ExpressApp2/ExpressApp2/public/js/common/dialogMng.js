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
    $('#searchTitleTxt, #searchDescTxt').keyup(function (e) {
        if (e.keyCode == 13) {
            $('#searchDlgBtn').trigger('click');
            /*
            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
            */
            //searchIptDlg(1);
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
    
});

function createDialog() {

    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;

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
                if (tmp[j].name == 'cButtonContentM') {
                    tmp[j].name = 'cButtonContentM' + (cButtonContentCount++);
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
        url: '/qna/addDialog',
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
            /*
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
            */
            
            $('.createDlgModalClose').click();

            $('#proc_content').html(language.Added);
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
            $('#procDialog').modal('show');

            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
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
    var searchTitle = $('#searchTitleTxt').val().trim();
    var searchText = $('#searchDescTxt').val().trim();
    
    $('#hiddenSearchTitle').val(searchTitle);
    $('#hiddenSearchText').val(searchText);
    $('#currentPage').val(1);
    var groupType = $('.selected').text();
    var sourceType = $('#tblSourceType').val();
    selectDlgByTxt(groupType, sourceType);
    /*
    var group = {
        sourceType2: $('#sourceType2').val(),
        searchTitleTxt: $('#searchTitleTxt').val(),
        searchDescTxt: $('#searchDescTxt').val()
    }

    $('#currentPage').val(1);
    selectDlgByFilter(group);
    */
});
/*
var searchGroups; // 페이징을 위해서 검색 후 그룹들을 담아둘 변수
function selectDlgByFilter(group) {

    sourceType2 = $('#sourceType2').val();
    searchTitleTxt = $('#searchTitleTxt').val();
    searchDescTxt = $('#searchDescTxt').val();

    params = {
        //'searchTxt':$('#iptDialog').val(),
        'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'searchTitleTxt': group.searchTitleTxt,
        'searchDescTxt': group.searchDescTxt,
        'sourceType2': group.sourceType2
    };
    if (searchTitleTxt !== '') {
        params.searchTitleTxt = searchTitleTxt;
    }
    if (searchDescTxt !== '') {
        params.searchDescTxt = searchDescTxt;
    }

    $.tiAjax({
        type: 'POST',
        url: '/qna/dialogList',
        data: params,
        isloading: true,
        success: function (data) {

            $('#dialogTbltbody').html('');
            var item = '';
            if (data.list.length > 0) {

                for (var i = 0; i < data.list.length; i++) {
                    if(data.list[i].DLG_TYPE==2){
                        type_name = "TEXT";
                    }else if(data.list[i].DLG_TYPE==3){
                        type_name = "CARD";
                    }else if(data.list[i].DLG_TYPE==4){
                        type_name = "MEDIA";
                    }else{
                        type_name = "NONE";
                    }
                    item += '<tr>' +
                        '<td>' + data.list[i].NUM + '</td>' +
                        '<td class="txt_left">' + data.list[i].DLG_NAME + '</td>' +
                        //'<td class="txt_left tex01"><a href="#" onclick="searchDialog(' + data.list[i].DLG_ID + ');return false;">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        '<td class="txt_left tex01" id="show_dlg" page_type="dlg" dlg_id="' + data.list[i].DLG_ID + '"><a href="#">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        '<td>' + type_name + '</td>' +
                        '<td><a href="#" onclick="deleteDialog(' + data.list[i].DLG_ID + ');return false;"><span class="fa fa-trash"></span></a></td>' +
                        '</tr>';
                }

            } else {
                item += '<tr style="height: 175px;">' +
                    '<td colspan="5">' + language.NO_DATA + '</td>' +
                    '</tr>';
            }

            $('#dialogTbltbody').append(item);

            $('#pagination').html('').append(data.pageList);
            //currentSearchNum = 1;
            searchGroups = group;
        }
    });
}
*/

//그룹메뉴에서 모두보기 눌렀을시 리스트 초기화
/*
$(document).on('click', '.allGroup', function () {
    var groupType = $(this).text();
    var sourceType = $('#tblSourceType').val();
    $('#currentPage').val(1);
    $('.selected').text($(this).text());
    $('.selectOptionsbox').removeClass('active');
    selectDlgByTxt(groupType, sourceType);
})
*/

// 소그룹 클릭시 리스트 출력
/*
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
*/
function changeTypeOrder() {
    var typeOrderValue = $('#typeOrderTh').attr('orderValue');
    if (typeOrderValue == 'ASC') {
        $('#typeOrderTh').children().eq(0).removeClass('fa-arrow-up')
        $('#typeOrderTh').children().eq(0).addClass('fa-arrow-down')
        $('#typeOrderTh').attr('orderValue', 'DESC');
    } else {
        $('#typeOrderTh').children().eq(0).removeClass('fa-arrow-down')
        $('#typeOrderTh').children().eq(0).addClass('fa-arrow-up')
        $('#typeOrderTh').attr('orderValue', 'ASC');
    }
    $('#typeOrderTh').off('click');
    $('#searchDlgBtn').trigger('click');
}

//dialog 페이지 첫 로딩때도 실행
var sourceType2 = $('#sourceType2').val();
var searchTitleTxt = '';
var searchDescTxt = '';
var listPageNo = "";

function selectDlgByTxt(groupType, sourceType) {
    if (sourceType === 'search') {
        sourceType = $('#sourceType2').val();
    }
    params = {
        'sourceType2': sourceType2,
        'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'groupType': groupType,
        'sourceType': sourceType,
        'searchTitleTxt': $('#hiddenSearchTitle').val(),
        'searchDescTxt': $('#hiddenSearchText').val(),
        'typeOrder': $('#typeOrderTh').attr('orderValue')
    };
    listPageNo = ($('#currentPage').val() == '') ? 1 : $('#currentPage').val();
    
    $.ajax({
        type: 'POST',
        url: '/qna/dialogList',
        data: params,
        complete: function() {
            $('#typeOrderTh').off('click');
            $("#typeOrderTh").on('click', function () {
                changeTypeOrder();
            });
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
            if (data.result) {
                alert(language.It_failed);
                return false;
            }
            searchTitleTxt = $('#searchTitleTxt').val();
            searchDescTxt = $('#searchDescTxt').val();
            $('#dialogTbltbody').html('');
            var item = '';
            var type_name = "";
            var dlgNameHtml = "";
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


                    var tmpTitle = changeStrVal((data.list[i].CARD_TITLE==null?'':data.list[i].CARD_TITLE));
                    var tmpText = changeStrVal((data.list[i].CARD_TEXT==null?'':data.list[i].CARD_TEXT));

                    item += '<tr>' +
                        '<td>' + data.list[i].NUM + '</td>' +
                        '<td class="txt_left" name="dlgTitleTd">' + 
                        '<span name="titleSpan">' +
                        //'<strong>' + '[' + data.list[i].DLG_ORDER_NO + '] ' + '</strong>' + dlgNameHtml + '</span>' +
                         '<strong>' + '[' + data.list[i].DLG_ORDER_NO + '] ' + '</strong>' + '</span>' +
                        '<input type="hidden" name="cardTitle" value="' + tmpTitle + '" />' +
                        '<input type="hidden" name="cardText" value="' + tmpText + '" />' +
                        '</td>' +
                        //'<td class="txt_left tex01"><a href="#"  onclick="searchDialog(' + data.list[i].DLG_ID + ',\'dlg\');return false;">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        '<td class="txt_left tex01" id="show_dlg" listPageNo="'+listPageNo+'" page_type="dlg" dlg_id="' + data.list[i].DLG_ID + '"><a href="#" onclick="return false;">' + data.list[i].DLG_DESCRIPTION + '</a></td>' +
                        
                        '<td>' + type_name + '</td>' +
                        '<td><a href="#" onclick="deleteDialogModal(' + data.list[i].DLG_ID + ',\'common\');return false;"><span class="fa fa-trash"></span></a></td>' +
                        '</tr>';

                }
            } else {
                item += '<tr style="height: 175px;">' +
                    '<td colspan="5">' + language.NO_DATA + '</td>' +
                    '</tr>';
            }

            //currentSearchNum = 2;
            $('#dialogTbltbody').append(item);

            $('#pagination').html('').append(data.pageList);

            if (rememberSelBoxHtml !== '') {
                $('#selBoxBody').html(rememberSelBoxHtml);
            }

        }
    });
}

//var currentSearchNum = 2; // 0: 검색어로 검색한 경우, 1: 테이블 위 그룹으로 검색한 경우, 2: 테이블에 있는 그룹으로 검색한 경우
$(document).on('click', '.li_paging', function (e) {

    if (!$(this).hasClass('active')) {
        $('#currentPage').val($(this).val());
        
        var groupType = $('.selected').text();
        var sourceType = $('#tblSourceType').val();
        selectDlgByTxt(groupType, sourceType);
        /*
        if (currentSearchNum == 0) {
            searchIptDlg();
        } else if (currentSearchNum == 1) {
            selectDlgByFilter(searchGroups);
        } else if (currentSearchNum == 2) {

            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
        }
        */
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



function changeStrVal(inputStr) {
    var returnValue = inputStr;
    returnValue = returnValue.split("<").join("&lt;");
    returnValue = returnValue.split(">").join("&gt;");
    returnValue = returnValue.split("(").join("&#40;");
    returnValue = returnValue.split(")").join("&#41;");
    returnValue = returnValue.split("\"").join("&quot;");
    returnValue = returnValue.split("'").join("&#39;");

    return returnValue;
}