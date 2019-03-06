

//가장 먼저 실행.
var language;

var simpleList = [];
var hierarchyList = [];
var compositeList = [];
var closedList = [];
var closedCompareList = [];
var isFirst = true;
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


Array.prototype.move = function(from,to){
    this.splice(to,0,this.splice(from,1)[0]);
    return this;
};

$(document).ready(function() {

    if ($('#hiddenIntentName').val() != '')
    {
        var decodeName = decodeURIComponent(decodeURI($('#hiddenIntentName').val()));
        $('#hiddenIntentName').val(decodeName);
        $('#intentNameTitle').text(decodeName);
    }
    
    makeUtteranceTable();

    if ($('#createQuery').val() != -1) {
        $('#utterInputText').val($('#createQuery').val());
        $('#utterInputText').focus();
    }

    $('#updateIntentName').click(function() {
        editIntentName();
        $('#updateIntentName').hide();
    });

    $('#scrollUpDownBtn').click(function() {
        
        if( $(this).children().eq(0).hasClass('fa-arrow-up') ) {
            $(this).children().eq(0).removeClass('fa-arrow-up')
            $(this).children().eq(0).addClass('fa-arrow-down')
            $('tr[name=utterSubTr]').hide( 200 );
        } else {
            $(this).children().eq(0).removeClass('fa-arrow-down')
            $(this).children().eq(0).addClass('fa-arrow-up')
            $('tr[name=utterSubTr]').show( "fast", function() {

            });
        }
    });
    
    $('#backToList').click(function() {
        var pageNum = $('#hiddenListPageNum').val();
        location.href = "/luis/intentList?rememberPageNum=" + pageNum;
    });

});

// input 엔터 감지
$(document).on("keydown", "input[name=matchUtterText]", function(e){ 
    
    var nowIndex = $(this).parents('tr').find('input[name=matchUtterText]').index(this);
    var inputLength = $(this).parents('tr').find('input[name=matchUtterText]').length;

    if (e.shiftKey && e.keyCode === 13) {

    } else if (e.keyCode === 13) {	//	Enter Key
        if ($(this).parent().find('select[name=multiMatchUtterSel]').length < 2) {
            if ($(this).val().trim() != '' && rememberUtterInput != $(this).val().trim()) {
                //$(this).focusout();
                $(this).trigger('blur');
            }
        }
    } else if (e.shiftKey && e.keyCode === 9) {
        e.preventDefault();
        while(1) {
            var goalIndex = (nowIndex==0)?inputLength-1:nowIndex-1;
            if ($(this).parents('tr').find('input[name=matchUtterText]').eq(goalIndex).prop('disabled')) {
                nowIndex--;
                continue;
            } else {
                $(this).parents('tr').find('input[name=matchUtterText]').eq(goalIndex).focus();
                break;
            }
        }
    } else if(e.keyCode === 9){ //tab
        e.preventDefault();
        while(1) {
            var goalIndex = ((nowIndex+1)==inputLength)?0:nowIndex+1;
            if ($(this).parents('tr').find('input[name=matchUtterText]').eq(goalIndex).prop('disabled')) {
                nowIndex++;
                continue;
            } else {
                $(this).parents('tr').find('input[name=matchUtterText]').eq(goalIndex).focus();
                break;
            }
        }
    }
});

/*//dyyoo 라벨링 제거
// tr클릭 scoreSelTd
$(document).on("click", "tr[name=utterMainTr]", function(e){ 
    if (e.target.className.indexOf('fa-plus') != -1 || e.target.className.indexOf('fa-trash') != -1 
        || e.target.className.indexOf('scoreSel') != -1 || e.target.className.indexOf('scoreSelTd') != -1) {
        return false;
    } else {
        if( $(this).next().css('display') != 'none') {
            $(this).next().hide( 150 );
        } else {

            $(this).next().show( "fast", function() {

            });
        }
    }
});
*/

function chkDulpleSelBox(trIndex, chkIndexStr) {
    
    $("tr[name=utterMainTr]").eq(trIndex).next().find('select[name=multiMatchUtterSel]').each(function(){

        $(this).children().each(function(){
            if (chkIndexStr == $(this).val()) {
                $(this).remove();
                return false;
            }
        });
        if ($(this).children().length <= 1) {
            //$(this).remove();
        }
    });

}


//input focusin
var rememberUtterInput = '';
var rememberUtterStart = -1;
var rememberUtterEnd = -1;
$(document).on("focusin", "input[name=matchUtterText]", function(e){
    rememberUtterInput = $(this).val().trim();
    rememberUtterStart = $(this).parent().find('input[name=startIndex]').val();
    rememberUtterEnd = $(this).parent().find('input[name=endIndex]').val();
});


//작업중

//input focusout
$(document).on("focusout", "input[name=matchUtterText]", function(e){

    if ($(this).parent().find('select[name=entityTypeForLabel]').val() == '4') {
        $(this).val('');
        return false;
    }

    //$(this).parent().find('select[name=multiMatchUtterSel]').length > 1 || 
    if ((rememberUtterInput == $(this).val() && rememberUtterInput != '')) {
        return false;
    }

    $(this).val($(this).val().trim());
    if (rememberUtterInput != $(this).val() && rememberUtterStart != -1) {
        if ($(this).parent().find('select[name=entitySelBox]').val() == 'NONE') {
            $('#alertMsg').text(language.ALERT_ENTITY_SELECT);
            $('#alertBtnModal').modal('show');
            //alert('엔티티를 선택해 주세요.');
            $(this).val('');
            return false;
        }
        $(this).parent().find('input[name=startIndex]').val('');
        $(this).parent().find('input[name=endIndex]').val('');
    
        if (rememberUtterStart != "") {
            for (var i=rememberUtterStart; i<=rememberUtterEnd; i++) {
                $(this).parents('tr').prev().find('span[name=utterText]').eq(i).removeClass();
            }
        }
        var chkMatch = [];
        var chkMatchIndex = [];
        var inputStr = $(this).val();
        var inputLength = $(this).val().length;
        var utterLength = $(this).parents('tr').prev().find('span[name=utterText]').length;


        var isEngNum = false;
        for (var i=0; i<inputLength; i++) {
            if (isAlpabet(inputStr[i])) {
                isEngNum = true;
                break;
            }
        }
        if (isEngNum) {
            var indexArr = [];
            var inputVal = $(this).val();
            $(this).parents('tr').prev().find('input[name=tokenVal]').each(function(index, item){
                var strVal = '';
                var isMatch = false;

                var innerIndex = 0;
                while (1) {
                    var hasClass = $(item).parent().find('#utterText_' + index).attr('class');
                    hasClass = hasClass == undefined? '' : hasClass;
                    if (hasClass.indexOf('span_color') != -1) {
                        break;
                    }
                    strVal += $(item).parent().find('input[name=tokenVal]').eq(index+innerIndex).val();
                    var subInput = inputVal.substr(0, strVal.length);
                    if (inputVal == strVal) {
                        isMatch = true
                        break;
                    } else if (strVal == subInput) {
                        innerIndex++
                        continue;
                    } else {
                        break;
                    }
                }
                if (isMatch) {
                    var matchObj = new Object();
                    matchObj.startIndex = index;
                    matchObj.endIndex = index+innerIndex;
                    indexArr.push(matchObj);
                    //
                    chkMatch.push(inputStr);
                    var tmpIndex = index + ',' + matchObj.endIndex;
                    chkMatchIndex.push(tmpIndex);
                }
            });
        } else {
            for (var i=0; i<=utterLength-inputLength; i++) {
                var strTmp = '';
                var chkLabeled = false;
                for (var j=0; j<inputLength; j++) {
                    var spanClass = $(this).parents('tr').prev().find('span[name=utterText]').eq(i+j).attr('class');
                    if (typeof spanClass == 'undefined') {
                        spanClass = '';
                }
                    if (spanClass.indexOf('span_color_') != -1) {
                        chkLabeled = true;
                        break;
                    } else {
                        strTmp += $(this).parents('tr').prev().find('span[name=utterText]').eq(i+j).text();
                    }
                }
                if ($(this).val() == strTmp && strTmp != '' && !chkLabeled) {
                    chkMatch.push($(this).val());
                    var tmpNum = (i + inputLength*1)-1;
                    var tmpIndex = i + ',' + tmpNum;
                    chkMatchIndex.push(tmpIndex);
                }
            }
        }
        

        //--------------------------------------------------------------------------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
        var utterBodyHtml = '';
        if (chkMatch.length > 1) {
            $(this).parent().find('span[name=alertSpan]').text("");
            rememberUtterInput = $(this).val();
            utterBodyHtml += "<select name='multiMatchUtterSel' class='form-control'  >";
            var j=0;
            for (j=0; j<chkMatch.length; j++) {
                if (j == chkMatch.length-1) {
                    utterBodyHtml += "<option value='" + chkMatchIndex[j] + "' selected>" + (j+1) + " - " + chkMatch[j] + "</option>";
                } else {
                    utterBodyHtml += "<option value='" + chkMatchIndex[j] + "'>" + (j+1) + " - " + chkMatch[j] + "</option>";
                }
            }
            utterBodyHtml += "</select>";
            if ($(this).parent().find('select[name=multiMatchUtterSel]').length > 0) {
                $(this).parent().find('select[name=multiMatchUtterSel]').remove();
            }
            $(this).after(utterBodyHtml);
            //$('select[name=multiMatchUtterSel]').focus();
            
            var matchStartIndex = chkMatchIndex[--j].split(",")[0];
            var matchEndIndex = chkMatchIndex[j].split(",")[1];
            //$(this).parent().find('input[name=startIndex]').val(matchStartIndex);
            //$(this).parent().find('input[name=endIndex]').val(matchEndIndex);
            var trIndex = $("tr[name=utterMainTr]").index($(this).parents('tr').prev());
            var divIndex = $("tr[name=utterMainTr]").eq(trIndex).find('div[name=labelInfoDiv]').index($(this).parents('div[name=labelInfoDiv]'));
            changeMultMatchiLabel(matchStartIndex, matchEndIndex, trIndex, divIndex);

        } else if (chkMatch.length > 0) {
            if (!chkLabeled) {
                $(this).parent().find('span[name=alertSpan]').text("");
                if ($(this).parent().find('select[name=multiMatchUtterSel]').length > 1) {
                    $(this).parent().find('select[name=multiMatchUtterSel]').remove();
                }

                rememberUtterInput = $(this).val();
                var matchStartIndex = chkMatchIndex[0].split(",")[0]*1;
                var matchEndIndex = chkMatchIndex[0].split(",")[1]*1;
                var colorIndexArr = [0, 1, 2, 3, 4];
                $(this).parents('tr').prev().find('span[name=utterText]').each(function(){
                    var classValue = $(this).attr('class');

                    if (typeof classValue == 'undefined') {
                        classValue = '';
                    }

                    if (classValue.indexOf('span_color_') != -1) {
                        for (var i=0; i<colorIndexArr.length; i++) {
                            if ('span_color_' + colorIndexArr[i] == $(this).attr('class')) {
                                colorIndexArr.splice(i--, 1);
                            }
                        }
                    }
                });

                for (var i=0; i<matchStartIndex; i++) {
                    var tmpClass = $(this).parents('tr').prev().find('span[name=utterText]').eq(i).attr('class');
                    if (typeof tmpClass == 'undefined') {
                        tmpClass = '';
                    }
                    if (tmpClass.indexOf('span_color_') != -1) {
                        if (colorIndexArr[i] == tmpClass.split('span_color_')[1]) {
                            colorIndexArr.splice(i--, 1);
                            break;
                        }
                    }
                }
                for (var i=matchEndIndex+1; i<matchStartIndex; i++) {
                    var tmpClass = $(this).parents('tr').prev().find('span[name=utterText]').eq(i).attr('class');
                    if (typeof tmpClass == 'undefined') {
                        tmpClass = '';
                    }
                    if (tmpClass.indexOf('span_color_') != -1) {
                        if (colorIndexArr[i] == tmpClass.split('span_color_')[1]) {
                            colorIndexArr.splice(i--, 1);
                            break;
                        }
                    }
                }

                if (colorIndexArr.length > 0) {
                    for (var i=matchStartIndex; i<=matchEndIndex; i++) {
                        $(this).parents('tr').prev().find('#utterText_' + i).addClass('span_color_' + colorIndexArr[0]);
                    }
                    $(this).parent().find('input[name=startIndex]').val(matchStartIndex);
                    $(this).parent().find('input[name=endIndex]').val(matchEndIndex);

                    if ($(this).parent().find('div[name=indentDiv]').length>0) {
                        var nowIndex = $('div[name=labelInfoDiv]').index($(this).parent());
                        var minIndex = -1;
                        var maxIndex = -1;
                        for (var k=nowIndex-1; k >= 0; k--) {
                            if ($('div[name=labelInfoDiv]').eq(k).find('div[name=indentDiv]').length == 0) {
                                minIndex = $('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val()==""?-1:$('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val();
                                maxIndex = $('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val()==""?-1:$('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val();
                                break;
                            }
                        }
                        for (var k=nowIndex; k >= 0; k--) {
                            if ($('div[name=labelInfoDiv]').eq(k).find('div[name=indentDiv]').length == 0) {
                                /*
                                var startInx = $('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val();
                                var endInx = $('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val();
                                startInx = startInx==""?matchStartIndex:startInx*1;
                                endInx = endInx==""?matchEndIndex:endInx*1;
                                if (startInx <= matchStartIndex) {
                                    $('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val(startInx);
                                }
                                if (endInx <= matchEndIndex) {
                                    $('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val(matchEndIndex);
                                }
                                */
                               $('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val(minIndex);
                               $('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val(maxIndex);
                                break;
                            } else {
                                var startInx = $('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val();
                                var endInx = $('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val();
                                if (minIndex == -1 || minIndex >= startInx) {
                                    minIndex = startInx;
                                }
                                if (maxIndex == -1 || endInx >= maxIndex) {
                                    maxIndex = endInx;
                                }
                            }
                        }
                    }

                    
                    var trIndex = $("tr[name=utterMainTr]").index($(this).parents('tr').prev());
                    
                    chkDulpleSelBox(trIndex, chkMatchIndex[0]);
                }
            }
        } else {
            console.log("매칭되는것 없음 ");
            $(this).parent().find('span[name=alertSpan]').text(language.ALERT_NO_MATCHING_WORDS);
        }
        //--------------------------------------------------------------------------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
    }
});

function changeMultMatchiLabel(matchStartIndex, matchEndIndex, trIndex, divIndex) {
    
    var colorIndexArr = [0, 1, 2, 3, 4];
    $('tr[name=utterMainTr]').eq(trIndex).find('span[name=utterText]').each(function(){

        var classValue = $(this).attr('class');

        if (typeof classValue == 'undefined') {
            classValue = '';
        }

        if (classValue.indexOf('span_color_') != -1) {
            for (var i=0; i<colorIndexArr.length; i++) {
                if ('span_color_' + colorIndexArr[i] == $(this).attr('class')) {
                    colorIndexArr.splice(i--, 1);
                }
            }
        }
    });

    for (var i=0; i<matchStartIndex; i++) {
        var tmpClass = $('tr[name=utterMainTr]').eq(trIndex).find('span[name=utterText]').eq(i).attr('class');
        if (typeof tmpClass == 'undefined') {
            tmpClass = '';
        }
        if (tmpClass.indexOf('span_color_') != -1) {
            if (colorIndexArr[i] == tmpClass.split('span_color_')[1]) {
                colorIndexArr.splice(i--, 1);
                break;
            }
        }
    }
    for (var i=(matchEndIndex*1)+1; i<matchStartIndex; i++) {
        var tmpClass = $('tr[name=utterMainTr]').eq(trIndex).find('span[name=utterText]').eq(i).attr('class');
        if (tmpClass.indexOf('span_color_') != -1) {
            if (colorIndexArr[i] == tmpClass.split('span_color_')[1]) {
                colorIndexArr.splice(i--, 1);
                break;
            }
        }
    }

    if (colorIndexArr.length > 0) {
        for (var i=matchStartIndex; i<=matchEndIndex; i++) {
            $('tr[name=utterMainTr]').eq(trIndex).find('#utterText_' + i).addClass('span_color_' + colorIndexArr[0]);
        }
        $('tr[name=utterMainTr]').eq(trIndex).next().find('div[name=labelInfoDiv]').eq(divIndex).find('input[name=startIndex]').val(matchStartIndex);
        $('tr[name=utterMainTr]').eq(trIndex).next().find('div[name=labelInfoDiv]').eq(divIndex).find('input[name=endIndex]').val(matchEndIndex);
    }
}

$(document).on("change", "select[name=multiMatchUtterSel]", function(e){ 

    var beforeStart;
    var beforeEnd;
    if ($(this).parent().find('input[name=startIndex]').val() != "") {
        beforeStart = $(this).parent().find('input[name=startIndex]').val();
        beforeEnd = $(this).parent().find('input[name=endIndex]').val();
        for (var i=beforeStart; i<=beforeEnd; i++) {
            $(this).parents('tr').prev().find('span[name=utterText]').eq(i).removeClass();
        }
    }


    var matchStartIndex = $(this).val().split(",")[0];
    var matchEndIndex = $(this).val().split(",")[1];
    //$(this).parent().find('input[name=startIndex]').val(matchStartIndex);
    //$(this).parent().find('input[name=endIndex]').val(matchEndIndex);
    var trIndex = $("tr[name=utterMainTr]").index($(this).parents('tr').prev());
    var divIndex = $("tr[name=utterMainTr]").eq(trIndex).find('div[name=labelInfoDiv]').index($(this).parents('div[name=labelInfoDiv]'));

    if ($(this).parent().find('div[name=indentDiv]').length>0) {
        var nowIndex = $('div[name=labelInfoDiv]').index($(this).parent());
        for (var k=nowIndex-1; k >= 0; k--) {
            if ($('div[name=labelInfoDiv]').eq(k).find('div[name=indentDiv]').length == 0) {
                var startInx = $('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val();
                var endInx = $('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val();
                startInx = startInx==""?matchStartIndex:startInx*1;
                endInx = endInx==""?matchEndIndex:endInx*1;
                if (startInx <= matchStartIndex) {
                    $('div[name=labelInfoDiv]').eq(k).find('input[name=startIndex]').val(startInx);
                }
                if (endInx >= matchEndIndex) {
                    $('div[name=labelInfoDiv]').eq(k).find('input[name=endIndex]').val(endInx);
                }
            }
        }
    }


    changeMultMatchiLabel(matchStartIndex, matchEndIndex, trIndex, divIndex);
});

//entity type sel
$(document).on("change", "select[name=entityTypeForLabel]", function(e){
    $(this).parent().find('select[name=entitySelBox]').remove();
    $(this).parent().find('select[name=entityChildSelBox]').remove();
    $(this).parent().find('input[name=matchUtterText]').remove();
    $(this).parent().find('a[name=delLabelBtn]').remove();
    $(this).parent().find('div[name=alertSpan]').remove();
    var startIndex = $(this).parent().find('input[name=startIndex]').val()*1;
    var endIndex = $(this).parent().find('input[name=endIndex]').val()*1;
    for (var i=startIndex; i<=endIndex; i++) {
        $(this).parents('tr').prev().find('#utterText_' + i).removeClass();//.removeAttr('class');
    }
    while(1) {
        if ($(this).parents('div').next().find('div[name=indentDiv]').length > 0) {
            $(this).parents('div').next().remove();
        } else {
            break;
        }
    }
    

    var utterBodyHtml = '';
    switch($(this).val()*1) {
        case 1:
            utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
            utterBodyHtml += "<option value='NONE'>" + language.SELECT + "</option>";
            for (var j=0; j<simpleList.length; j++) {
                utterBodyHtml += "<option value='" + simpleList[j].ENTITY_NAME + "'>" + simpleList[j].ENTITY_NAME + "</option>";
            }
            utterBodyHtml += "</select>";
            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
            utterBodyHtml += "<input type='hidden' name='startIndex' value='' />";
            utterBodyHtml += "<input type='hidden' name='endIndex' value=''  />";
            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
            utterBodyHtml += "<span name='alertSpan' ></span>";
            $(this).parent().append(utterBodyHtml);
            break;
        case 3:
            utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
            utterBodyHtml += "<option value='NONE'>" + language.SELECT + "</option>";
            for (var j=0; j<hierarchyList.length; j++) {
                utterBodyHtml += "<option value='" + hierarchyList[j].ENTITY_NAME + "'>" + hierarchyList[j].ENTITY_NAME + "</option>";
            }
            utterBodyHtml += "</select>";
            utterBodyHtml += "<select name='entityChildSelBox' class='form-control' style='display:none' >";
            utterBodyHtml += "<option value=''></option>";
            utterBodyHtml += "</select>";
            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
            utterBodyHtml += "<input type='hidden' name='startIndex' value='' />";
            utterBodyHtml += "<input type='hidden' name='endIndex' value=''  />";
            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
            utterBodyHtml += "<span name='alertSpan' ></span>";
            $(this).parent().append(utterBodyHtml);
            break;
        case 4:
            utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
            utterBodyHtml += "<option value='NONE'>" + language.SELECT + "</option>";
            for (var j=0; j<compositeList.length; j++) {
                utterBodyHtml += "<option value='" + compositeList[j].ENTITY_NAME + "'>" + compositeList[j].ENTITY_NAME + "</option>";
            }
            utterBodyHtml += "</select>";
            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
            utterBodyHtml += "<input type='hidden' name='startIndex' value='' />";
            utterBodyHtml += "<input type='hidden' name='endIndex' value=''  />";
            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
            utterBodyHtml += "<span name='alertSpan' ></span>";
            $(this).parent().append(utterBodyHtml);
            break;
            /*
        case 5:
            utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
            utterBodyHtml += "<option value='NONE'>선택해주세요.</option>";
            for (var j=0; j<closedList.length; j++) {
                utterBodyHtml += "<option value='" + closedList[j].ENTITY_NAME + "'>" + closedList[j].ENTITY_NAME + "</option>";
            }
            utterBodyHtml += "</select>";
            utterBodyHtml += "<select name='entityChildSelBox' class='form-control' style='display:none' >";
            utterBodyHtml += "<option value=''></option>";
            utterBodyHtml += "</select>";
            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
            utterBodyHtml += "<input type='hidden' name='startIndex' value='' />";
            utterBodyHtml += "<input type='hidden' name='endIndex' value=''  />";
            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
            utterBodyHtml += "<span name='alertSpan' style='font-size: 25px;'></span>";
            $(this).parent().append(utterBodyHtml);
            break;
            */
        default:
            break;
    }
});


//entity name sel
$(document).on("change", "select[name=entitySelBox]", function(e){
    $(this).parent().find('input[name=matchUtterText]').prop('disabled', false);
    var entityType = $(this).parent().find('select[name=entityTypeForLabel]').val();


    $(this).parent().find('input[name=matchUtterText]').val('');
    var startIndex = $(this).parent().find('input[name=startIndex]').val()*1;
    var endIndex = $(this).parent().find('input[name=endIndex]').val()*1;
    if (startIndex != '' && endIndex != '') {
        for (var i=startIndex; i<=endIndex; i++) {
            $(this).parents('tr').prev().find('#utterText_' + i).removeClass();//.removeAttr('class');
        }
    }
    if ($(this).parent().find('select[name=multiMatchUtterSel]').length > 0) {
        $(this).parent().find('select[name=multiMatchUtterSel]').remove();
    }

    switch(entityType*1) {
        case 3:

            makeChildSelBox ($(this), entityType);

            $(this).parent().find('select[name=entityChildSelBox]').show();
            $(this).parent().find('select[name=entityChildSelBox]').children('option').each(function() {
                if ($(this).is(':selected'))
                { 
                    $(this).removeAttr('selected');
                    return false;
                }
            });
            $(this).parent().find('select[name=entityChildSelBox]').children().eq(0).prop('selected', 'selected');
            break;
        case 4:
            while (1) {
                if ($(this).parents('div').next().find('div[name=indentDiv]').length > 0 ) {
                    $(this).parents('div').next().find('div[name=indentDiv]').parent().remove();
                } else {
                    break;
                }
            }

            var utterBodyHtml = "";
            for (var j=0; j<compositeList.length; j++) {
                if (compositeList[j].ENTITY_NAME == $(this).val()) {
                    var childList = compositeList[j].CHILD_ENTITY_LIST.slice();
                    for (var k=0; k<childList.length; k++) {

                        var childTypeStr = "";
                        var chkChildType = false;
                        for (var h=0; h<simpleList.length; h++) {
                            if (simpleList[h].ENTITY_ID == childList[k].CHILDREN_ID) {
                                chkChildType = true;
                                break;
                            }
                        }
                        if (chkChildType) {
                            childTypeStr = "<option value='1' selected>" + language.SIMPLE_ENTITY + "</option>";
                        } else {
                            childTypeStr = "<option value='3'>" + language.HIERARCHY_ENTITY + "</option>";
                        }

                        utterBodyHtml += "<div name='labelInfoDiv'>";
                        
                        //utterBodyHtml += "<div name='indentDiv'>&emsp;&emsp;</div>";
                        utterBodyHtml += "<div name='indentDiv'>----</div>";
                        utterBodyHtml += "<select name='entityTypeForLabel' class='form-control'  >";
                        utterBodyHtml += childTypeStr;
                        //utterBodyHtml += "<option value='1' selected>" + language.SIMPLE_ENTITY + "</option>";
                        //utterBodyHtml += "<option value='3'>" + language.HIERARCHY_ENTITY + "</option>";
                        //utterBodyHtml += "<option value='4'>" + language.COMPOSITE_ENTITY + "</option>";
                        //utterBodyHtml += "<option value='5'>" + language.CLOSED_LIST_ENTITY + "</option>";
                        utterBodyHtml += "</select>";
            
                        utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
                        //utterBodyHtml += "<option value='NONE'>" + language.SELECT + "</option>";
                        utterBodyHtml += "<option value='" + childList[k].CHILDREN_NAME + "'>" + childList[k].CHILDREN_NAME + "</option>";
                        /*
                        for (var q=0; q<childList.length; q++) {
                            utterBodyHtml += "<option value='" + childList[q].CHILDREN_NAME + "'>" + childList[q].CHILDREN_NAME + "</option>";
                        }
                        */
                        utterBodyHtml += "</select>";
                        utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='' />";
                        utterBodyHtml += "<input type='hidden' name='startIndex' value='' />";
                        utterBodyHtml += "<input type='hidden' name='endIndex' value=''  />";
                        utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                        utterBodyHtml += "<span name='alertSpan' ></span>";
                        utterBodyHtml += "</div>";
                    }
                    $(this).parents('div[name=labelInfoDiv]').after(utterBodyHtml);
                    break;
                }
            }
            $(this).parent().find('input[name=matchUtterText]').prop('disabled', true);
            break;
        case 5:
            makeChildSelBox ($(this), entityType);
            $(this).parent().find('select[name=entityChildSelBox]').show();
            $(this).parent().find('select[name=entityChildSelBox]').children('option').each(function() {
                if ($(this).is(':selected'))
                { 
                    $(this).removeAttr('selected');
                    return false;
                }
            });
            $(this).parent().find('select[name=entityChildSelBox]').children().eq(0).prop('selected', 'selected');
            break;
    }
});


function makeChildSelBox(selObj, entityType) {
    var selEntity = $(selObj).val();
    var utterBodyHtml = '';
    switch(entityType*1) {
        case 3:
        
            utterBodyHtml += "<option value='NONE'>" + language.SELECT + "</option>";
            for (var j=0; j<hierarchyList.length; j++) {
                if (selEntity == hierarchyList[j].ENTITY_NAME) {
                    for (var k=0; k<hierarchyList[j].CHILD_ENTITY_LIST.length; k++) {
                        
                        utterBodyHtml += "<option value='" + hierarchyList[j].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "'> " + hierarchyList[j].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                    }
                    break;
                }
            }
            break;
        case 4:

            break;
            /*
        case 5:
            utterBodyHtml += "<option value='NONE'>선택해주세요.</option>";
            for (var j=0; j<closedList.length; j++) {
                if (selEntity == closedList[j].ENTITY_NAME) {
                    for (var k=0; k<closedList[j].CHILD_ENTITY_LIST.length; k++) {
                        utterBodyHtml += "<option value='" + closedList[j].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "'> " + closedList[j].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                    }
                    break;
                }
            }
            break;
            */
    }

    $(selObj).parent().find('select[name=entityChildSelBox]').html(utterBodyHtml);
}


//edit entity name focus out 
$(document).on('focusout','#editIntentName',function(e){
    focusOutUpdateName();
});

function focusOutUpdateName() {
    var editEntityName = $('#editIntentName').val();
    if (editEntityName == $('#hiddenIntentName').val()) {
        $('button[name=confirmCancelBtn]').trigger('click');
        $('#updateIntentName').show();
        return false;
    }
    $('#confirmTitle').text(language.INTENT + ' ' + language.MODIFY);
    $('#confirmMsg').text("["+ editEntityName + "] " + language.ALERT_CHANGE_ENTITY);
    $('#confirmBtn').prev().show();
    $('#confirmBtnModal').modal('show');
    $('#updateIntentName').show();
    
}

$(document).on('click', 'button[name=confirmCancelBtn]', function(e){
    $('#intentNameTitle').html('').text($('#hiddenIntentName').val().trim());
});

//페이징 클릭
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        isFirst = true;
        
        if( $('#scrollUpDownBtn').children().eq(0).hasClass('fa-arrow-down') ) {
            $('#scrollUpDownBtn').children().eq(0).removeClass('fa-arrow-down')
            $('#scrollUpDownBtn').children().eq(0).addClass('fa-arrow-up')
        }
        $('#currentPage').val($(this).val());
        makeUtteranceTable();
    }
});

function changeIntentNameFnc() {
    var editEntityName = $('#editIntentName').val();
    var hiddenIntent = $('#hiddenIntentName').val();
    var params = {
        'intentHiddenName' : hiddenIntent,
        'intentName' : editEntityName,
        'intentId' : $('#hiddenIntentId').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/luis/renameIntent',
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
            else if (!data.success) {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
                
                $('#intentNameTitle').html('');
                $('#intentNameTitle').text($('#hiddenIntentName').val());
            } else {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
                $('#intentNameTitle').html('');
                $('#intentNameTitle').text(editEntityName);
                $('#hiddenIntentName').val(editEntityName);
            }
        }
    });
}
function isAlpabet(ch) {
    var numUnicode = ch.charCodeAt(0);
    
    if (48 <= numUnicode && numUnicode <= 57) {
        return true; //숫자
    }
    if (65 <= numUnicode && numUnicode <= 90) {
        return true; //대문자
    }
    if (97 <= numUnicode && numUnicode <= 122) {
        return true; //소문자
    }
    return false;
}


// input 엔터 감지
$(document).on("keypress", "#utterInputText", function(e){

    if (e.keyCode === 13) {	//	Enter Key
        var inputText = $('#utterInputText').val().trim();
        if (inputText != '' ) {
            var tokenArr = [];
            var utterBodyHtml = '';
            var inputArr = inputText.split(' ');
            for (var i=0; i<inputArr.length; i++) {
                var englishStr = '';
                for (var j=0; j<inputArr[i].length; j++) {
                    if (isAlpabet(inputArr[i][j])) {
                        englishStr += inputArr[i][j];
                        if (j == inputArr[i].length-1) {
                            tokenArr.push(englishStr);
                        }
                    } else {
                        if (englishStr != '') {
                            tokenArr.push(englishStr);
                            tokenArr.push(inputArr[i][j]);
                            englishStr = '';
                        } else {
                            tokenArr.push(inputArr[i][j]);
                        }
                    }
                }
            }
            
            utterBodyHtml += "<tr name='utterMainTr'>";
            utterBodyHtml += "<td ></td>";
            utterBodyHtml += "<td style='text-align: left; padding-left:1%;'>";
            utterBodyHtml += makeTokenizedText(tokenArr, 'SPAN'); 
            /*//dyyoo 라벨링 제거
            utterBodyHtml += "<a href='#' name='addUtter' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-plus' style='font-size: 25px;'></span></a>";
            */
            utterBodyHtml += "</td>";
            //utterBodyHtml += "<td style='text-align: left; padding-left:1.5%;'>" + utterList.tokenizedText + "</td>";
            utterBodyHtml += "<td></td>";
            utterBodyHtml += "<td style='text-align: left; padding-left:1.5%;' >";
            utterBodyHtml += makeTokenizedText(tokenArr, 'INPUT');
            utterBodyHtml += makeTokenizedText(tokenArr, 'INDEX', inputText);
            utterBodyHtml += "<input type='hidden' id='intentHiddenName' name='intentHiddenName' value='" + inputText + "' />";
            utterBodyHtml += "<input type='hidden' id='utterHiddenId' name='intentHiddenId' value='NEW' />";
            utterBodyHtml += "<a href='#' name='delUtterBtn' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
            utterBodyHtml += "</td>";
            utterBodyHtml += "</tr>";
            utterBodyHtml += makeLabelingTr();
                
            $('#utteranceTblBody').prepend(utterBodyHtml);
            $('#utterInputText').val('');
            $(this).focusout();
            //<td><a href="#" name="delEntityRow" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></td>
        } 
    }
});

//utter 추가  버튼
$(document).on("click", "a[name=addUtter]", function(e){
    /*
    if ($(this).parents('tr').next().find('div[name=labelInfoDiv]').length >= 5) {
        alert("우선 5개만 가능합니다.");
        return false;
    }
    */
    if ($(this).parents('tr').next().css('display') == 'none') {
        return false;
    }

    var utterBodyHtml = '';
    utterBodyHtml += "<div name='labelInfoDiv'>";
    utterBodyHtml += "<select name='entityTypeForLabel' class='form-control'  >";
    utterBodyHtml += "<option value='1' selected>" + language.SIMPLE_ENTITY + "</option>";
    utterBodyHtml += "<option value='3'>" + language.HIERARCHY_ENTITY + "</option>";
    utterBodyHtml += "<option value='4'>" + language.COMPOSITE_ENTITY + "</option>";
    //utterBodyHtml += "<option value='5'>" + language.CLOSED_LIST_ENTITY + "</option>";
    utterBodyHtml += "</select>";

    utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
    utterBodyHtml += "<option value='NONE'>" + language.SELECT + "</option>";
    for (var j=0; j<simpleList.length; j++) {
        utterBodyHtml += "<option value='" + simpleList[j].ENTITY_NAME + "'>" + simpleList[j].ENTITY_NAME + "</option>";
    }
    utterBodyHtml += "</select>";
    utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
    utterBodyHtml += "<input type='hidden' name='startIndex' value='' />";
    utterBodyHtml += "<input type='hidden' name='endIndex' value=''  />";
    utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
    utterBodyHtml += "<span name='alertSpan'></span>";
    utterBodyHtml += "</div>";
    $(this).parents('tr').next().children().eq(1).append(utterBodyHtml);

});


//utter 삭제  버튼
$(document).on("click", "a[name=delLabelBtn]", function(e){
    if ($(this).parent().find('div[name=indentDiv]').length>0) {
        $('#alertMsg').text(language.ALERT_DELETE_HIGH_LEVEL);
        $('#alertBtnModal').modal('show');
        //alert('상위 entity를 삭제해 주세요.');
        return false;
    }
    if ($(this).parent().find('select[name=entityTypeForLabel]').val() == '4') {
        while(1) {
            if ($(this).parent().next().find('div[name=indentDiv]').length>0) {
                $(this).parent().next().remove();
            } else {
                break;
            }
        }
    }

    var startIndexTmp = $(this).parent().find('input[name=startIndex]').val();
    var endIndexTmp = $(this).parent().find('input[name=endIndex]').val();
    if (startIndexTmp != "" && endIndexTmp != "") {
        for (var i=startIndexTmp; i<=endIndexTmp; i++) {
            $(this).parents('tr').prev().find('span[name=utterText]').eq(i).removeClass();
        }
    }
    $(this).parents('div[name=labelInfoDiv]').remove();
});

//intent 삭제 버튼
$(document).on("click", "#deleteIntentBtn", function(e){
    var intentName = $('#hiddenIntentName').val();
    $('#confirmTitle').text(language.INTENT + ' ' + language.DELETE);
    $('#confirmMsg').text("["+ intentName + "] " + language.ASK_DELETE);
    $('#confirmBtn').prev().show();
    $('#confirmBtnModal').modal('show');
});

var delUtterId = -1;
var delIndex = -1;
//utter 삭제 버튼
$(document).on("click", "a[name=delUtterBtn]", function(e){
    delUtterId = $(this).parent().find('input[name=intentHiddenId]').val();
    delIndex = $('#utteranceTblBody tr').index($(this).parents('tr'));
    var utterName = $(this).parent().find('input[name=intentHiddenName]').val();
    
    $('#confirmTitle').text(language.UTTERANCE + ' ' + language.DELETE);
    $('#confirmMsg').text("["+ utterName + "] " + language.ASK_DELETE);
    $('#confirmBtn').prev().show();
    $('#confirmBtnModal').modal('show');
});

function deleteUtter() {
    var intentId = $('#hiddenIntentId').val();
    if (delUtterId == 'NEW') {
        $('#utteranceTblBody tr').eq(delIndex+1).remove();
        $('#utteranceTblBody tr').eq(delIndex).remove();
    }
    else 
    {
        var params = {
            'utterId' : delUtterId,
            'intentId' : intentId
        };

        $.ajax({
            type: 'POST',
            data: params,
            url: '/luis/deleteUtterance',
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
                    $('#alertMsg').text("[" + data.existApp + "] " + language.ALERT_SAME_INTENT_EXIST);
                    $('#alertBtnModal').modal('show');
                }
                else if (!data.success) 
                {
                    $('#alertMsg').text(data.message);
                    $('#alertBtnModal').modal('show');
                }
                else if (data.error) {
                    $('#alertMsg').text(data.message);
                    $('#alertBtnModal').modal('show');
                }
                else 
                {
                    $('#utteranceTblBody tr').eq(delIndex+1).remove();
                    $('#utteranceTblBody tr').eq(delIndex).remove();
                    $('#alertMsg').text(data.message);
                    $('#alertBtnModal').modal('show');
                }
            }
        });
    }
}

//change entity name input form
function editIntentName() {
    var entityName = $('#intentNameTitle').text();
    var inputHtml = "<input type='text' id='editIntentName' style='width : 40%;' name='editIntentName' spellcheck='false' value='' />";
    $('#intentNameTitle').html(inputHtml);
    $('#editIntentName').focus();
    $('#editIntentName').val(entityName);
    //$('#hiddenEntityName').val(entityName);
    
}

//utter 리스트 출력
function makeUtteranceTable() {
    var intentName = $('#hiddenIntentName').val();
    var hId = $('#hiddenIntentId').val();
    var params = {
        'intentName' : intentName,
        'intentId' : hId,
        'selPage' : $('#currentPage').val(),
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/luis/selectUtterList',
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
            else {
                if (typeof data.utterObj.UTTER_LIST != "undefined") {
                    var utterList = data.utterObj.UTTER_LIST;
                    $('#utteranceTblBody').html('');
                    $('#pagination').html('');
                    var utterBodyHtml = '';
                    if(utterList.length > 0){
    
                        for(var i = 0; i < utterList.length; i++){
                            utterBodyHtml += "<tr name='utterMainTr'>";
                            utterBodyHtml += "<td ></td>";
                            utterBodyHtml += "<td style='text-align: left; padding-left:1%; max-width:1000px;'>";
                            utterBodyHtml += makeTokenizedText(utterList[i].tokenizedText, 'SPAN');
                            /*//dyyoo 라벨링 제거
                            utterBodyHtml += "<a href='#' name='addUtter' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-plus' style='font-size: 25px;'></span></a>";
                            */
                            utterBodyHtml += "</td>";
                            //utterBodyHtml += "<td style='text-align: left; padding-left:1.5%;'>" + utterList.tokenizedText + "</td>";
                            utterBodyHtml += "<td class='scoreSelTd'>";
                            utterBodyHtml += "<select name='scoreSel' class='form-control scoreSel'  >";
                            for (var k=0; k<utterList[i].intentScore.length; k++) {
                                var tmpStr = utterList[i].intentScore[k].name + "::" + utterList[i].intentScore[k].score.toFixed(2);
                                utterBodyHtml += "<option value='" + utterList[i].intentScore[k].id + "'> " + tmpStr + "</option>";
                            }
                            utterBodyHtml += "</select>";
                            utterBodyHtml += "";
                            utterBodyHtml += "<td style='text-align: left; padding-left:1.5%;' >";
                            utterBodyHtml += makeTokenizedText(utterList[i].tokenizedText, 'INPUT');
                            utterBodyHtml += makeTokenizedText(utterList[i].tokenizedText, 'INDEX', utterList[i].text);
                            utterBodyHtml += "<input type='hidden' id='intentHiddenName' name='intentHiddenName' value='" + utterList[i].text + "' />";
                            utterBodyHtml += "<input type='hidden' id='utterHiddenId' name='intentHiddenId' value='" + utterList[i].id + "' />";
                            utterBodyHtml += "<a href='#' id='delUtterBtn' name='delUtterBtn' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                            utterBodyHtml += "</td>";
                            utterBodyHtml += "</tr>";
                            utterBodyHtml += makeLabelingTr(utterList[i].entityLabels);
                            
                        }
                        //<td><a href="#" name="delEntityRow" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></td>
                        $('#utteranceTblBody').html(utterBodyHtml);
                        $('#pagination').html('').append(data.pageList);

                        changeEntitySel();
                        if (isFirst) {
                            isFirst = false;
                            $('#scrollUpDownBtn').trigger('click');
                        }
                                            
                        setTimeout(function () {
                            labelingClosedList ();
                        }, 200);
                    }
                }
            }
        }
    });
}

function makeTokenizedText(token, chk, text) {
    var tokenHtml = '';
    if (chk == 'INPUT') {
        for (var i=0; i<token.length; i++) {
            if (token[i]=="'") {
                tokenHtml += '<input type="hidden" id="tokenVal_' + i + '" name="tokenVal" value="' + token[i] + '" />';
            } else {
                tokenHtml += "<input type='hidden' id='tokenVal_" + i + "' name='tokenVal' value='" + token[i] + "' />";
            }
        }
    }
    else if (chk == 'SPAN') {
        for (var i=0; i<token.length; i++) {
            tokenHtml += "<span id='utterText_" + i + "' name='utterText' style='' >" + token[i] + "</span>";
            if (i != token.length-1) {
                tokenHtml += "<span class='barClass' style='' >|</span>";
            }
        }
    }
    else if (chk == 'INDEX') {
        var k=0;
        for (var i=0; i<token.length; i++) {
            var tokenLen = token[i].length;
            var sumStr = '';
            var sumIndex = '';
            for (var j=0; j<tokenLen; j++) {
                if (text[k] == ' ') {
                    k++;
                    j--;
                    continue;
                }
                else {
                    sumStr += text[k++];
                }
            }
            if (sumStr == token[i]) {
                var resultK = k - tokenLen; 
                sumIndex = i + ',' + resultK + ',' + (resultK + tokenLen-1);
                tokenHtml += "<input type='hidden' id='indexVal_" + i + "' name='indexVal' value='" + sumIndex + "' />"
            }
        }
    }
    return tokenHtml;
}

function chkInsideNum(startI, endI, targetStart, targetEnd) {
    if (startI <= targetStart  &&  endI >= targetEnd) {
        return true;
    } else {
        return false;
    }
}

//simpleList 
//hierarchyList 
//compositeList 
//closedList
function makeLabelingTr(entityLabel) {
    var utterBodyHtml = '';
    var chkComposit = false;
    var startIndx = -1;
    var endIndx = -1;

    utterBodyHtml += "<tr name='utterSubTr'>";
    utterBodyHtml += "<td></td>";
    utterBodyHtml += "<td style='text-align: left; padding-left:1%;'>";
    
    if (entityLabel != null) {
        for (var i=0; i<entityLabel.length; i++) {
            if (i+1 < entityLabel.length) {
                if (entityLabel[i+1].entityType == 4) {
                    entityLabel = entityLabel.move(i+1, i);

                    chkComposit = true;
                    compositeObj = entityLabel[i].CHILD_ENTITY_LIST;
                    startIndx = entityLabel[i].startTokenIndex;
                    endIndx = entityLabel[i].endTokenIndex;
                }
            }
            switch(entityLabel[i].entityType) {
                case 1:
                    //'Simple';
                    for (var j=0; j<simpleList.length; j++) {
                        if (simpleList[j].ENTITY_ID == entityLabel[i].id) {
                            utterBodyHtml += "<div name='labelInfoDiv'>";
                            
                            if (chkComposit) {
                                if (chkInsideNum(startIndx, endIndx, entityLabel[i].startTokenIndex, entityLabel[i].endTokenIndex) ) {
                                    //utterBodyHtml += "<div name='indentDiv'>&emsp;&emsp;</div>";
                                    utterBodyHtml += "<div name='indentDiv'>----</div>";
                                } else {
                                    chkComposit = false;
                                }
                            }
                            utterBodyHtml += "<select name='entityTypeForLabel' class='form-control'  >";
                            utterBodyHtml += "<option value='1' selected>" + language.SIMPLE_ENTITY + "</option>";
                            utterBodyHtml += "<option value='3'>" + language.HIERARCHY_ENTITY + "</option>";
                            if (!chkInsideNum(startIndx, endIndx, entityLabel[i].startTokenIndex, entityLabel[i].endTokenIndex) ) {
                                utterBodyHtml += "<option value='4'>" + language.COMPOSITE_ENTITY + "</option>";
                            }
                            //utterBodyHtml += "<option value='5'>closed list</option>";
                            utterBodyHtml += "</select>";
    
                            utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
                            utterBodyHtml += "<option value='" + entityLabel[i].id + "'></option>";
                            utterBodyHtml += "</select>";
                            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='' />";
                            utterBodyHtml += "<input type='hidden' name='startIndex' value='" + entityLabel[i].startTokenIndex + "' />";
                            utterBodyHtml += "<input type='hidden' name='endIndex' value='" + entityLabel[i].endTokenIndex + "'  />";
                            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                            utterBodyHtml += "<span name='alertSpan' ></span>";
                            utterBodyHtml += "</div>";
                        }
                    }
                    break;
                case 2:
                    //'Prebuilt';
                    break;
                case 3:
                    //'Hierarchical';
                    for (var j=0; j<hierarchyList.length; j++) {
                        if (hierarchyList[j].ENTITY_ID == entityLabel[i].id) {
                            utterBodyHtml += "<div name='labelInfoDiv'>";
    
                            var isInside = chkInsideNum(startIndx, endIndx, entityLabel[i].startTokenIndex, entityLabel[i].endTokenIndex);
                            if (chkComposit) {
                                if (isInside ) {
                                    //utterBodyHtml += "<div name='indentDiv'>&emsp;&emsp;</div>";
                                    utterBodyHtml += "<div name='indentDiv'>----</div>";
                                } else {
                                    chkComposit = false;
                                }
                            }

                            utterBodyHtml += "<select name='entityTypeForLabel' class='form-control'  >";
                            utterBodyHtml += "<option value='1'>" + language.SIMPLE_ENTITY + "</option>";
                            utterBodyHtml += "<option value='3' selected>" + language.HIERARCHY_ENTITY + "</option>";
                            if (!isInside ) {
                                utterBodyHtml += "<option value='4'>" + language.COMPOSITE_ENTITY + "</option>";
                            }
                            //utterBodyHtml += "<option value='5'>closed list</option>";
                            utterBodyHtml += "</select>";
    
                            utterBodyHtml += "<select name='entitySelBox' class='form-control'  >";
                            utterBodyHtml += "<option value='" + entityLabel[i].id + "'></option>";
                            utterBodyHtml += "</select>";
                            utterBodyHtml += "<select name='entityChildSelBox' class='form-control' style='display:none' >";
                            utterBodyHtml += "<option value=''></option>";
                            utterBodyHtml += "</select>";
                            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
                            utterBodyHtml += "<input type='hidden' name='startIndex' value='" + entityLabel[i].startTokenIndex + "' />";
                            utterBodyHtml += "<input type='hidden' name='endIndex' value='" + entityLabel[i].endTokenIndex + "'  />";
                            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                            utterBodyHtml += "<span name='alertSpan' ></span>";
                            utterBodyHtml += "</div>";
                        }
                    }
                    break;
                case 4:
                    //'Composite';
                    for (var j=0; j<compositeList.length; j++) {
                        if (compositeList[j].ENTITY_ID == entityLabel[i].id) {
                            utterBodyHtml += "<div name='labelInfoDiv'>";
    
                            utterBodyHtml += "<select name='entityTypeForLabel' class='form-control'  >";
                            utterBodyHtml += "<option value='1'>" + language.SIMPLE_ENTITY + "</option>";
                            utterBodyHtml += "<option value='3'>" + language.HIERARCHY_ENTITY + "</option>";
                            utterBodyHtml += "<option value='4' selected>" + language.COMPOSITE_ENTITY + "</option>";
                            //utterBodyHtml += "<option value='5'>closed list</option>";
                            utterBodyHtml += "</select>";
    
                            utterBodyHtml += "<select name='entitySelBox' class='form-control' >";
                            utterBodyHtml += "<option value='" + entityLabel[i].id + "'></option>";
                            utterBodyHtml += "</select>";
                            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' disabled/>";
                            utterBodyHtml += "<input type='hidden' name='startIndex' value='" + entityLabel[i].startTokenIndex + "' />";
                            utterBodyHtml += "<input type='hidden' name='endIndex' value='" + entityLabel[i].endTokenIndex + "'  />";
                            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                            utterBodyHtml += "<span name='alertSpan' ></span>";
                            utterBodyHtml += "</div>";
                        }
                    }
                    break;
                    /*
                case 5:
                    //'Closed List';
                    for (var j=0; j<closedList.length; j++) {
                        if (closedList[j].ENTITY_ID == entityLabel[i].id) {
                            utterBodyHtml += "<div name='labelInfoDiv'>";
    
                            utterBodyHtml += "<select name='entityTypeForLabel' class='form-control'  >";
                            utterBodyHtml += "<option value='1'>Simple</option>";
                            utterBodyHtml += "<option value='3'>hierarchy</option>";
                            utterBodyHtml += "<option value='4'>composite</option>";
                            utterBodyHtml += "<option value='5' selected>closed list</option>";
                            utterBodyHtml += "</select>";
    

                            utterBodyHtml += "<select name='entitySelBox' class='form-control' >";
                            utterBodyHtml += "<option value='" + entityLabel[i].id + "'></option>";
                            utterBodyHtml += "</select>";
                            
                            utterBodyHtml += "<select name='entityChildSelBox' class='form-control' >";
                            utterBodyHtml += "<option value='" + entityLabel[i].phrase + "'></option>";
                            utterBodyHtml += "</select>";

                            utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
                            utterBodyHtml += "<input type='hidden' name='startIndex' value='" + entityLabel[i].startTokenIndex + "' />";
                            utterBodyHtml += "<input type='hidden' name='endIndex' value='" + entityLabel[i].endTokenIndex + "'  />";
                            utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                            utterBodyHtml += "<span name='alertSpan' style='font-size: 25px;'></span>";
                            utterBodyHtml += "</div>";
                        }
                    }
                    break;
                    */
                case 6:
                    //'hierarchy child List';
                    for (var j=0; j<hierarchyList.length; j++) {
                        if (entityLabel[i].entityName.indexOf((hierarchyList[j].ENTITY_NAME + '::')) != -1 ) {
                            for (var k=0; k<hierarchyList[j].CHILD_ENTITY_LIST.length; k++) {
                                if (hierarchyList[j].CHILD_ENTITY_LIST[k].CHILDREN_ID == entityLabel[i].id) {
                                    utterBodyHtml += "<div name='labelInfoDiv'>";
    
                                    var isInside = chkInsideNum(startIndx, endIndx, entityLabel[i].startTokenIndex, entityLabel[i].endTokenIndex);
                                    if (chkComposit) {
                                        if (isInside ) {
                                            //utterBodyHtml += "<div name='indentDiv'>&emsp;&emsp;</div>";
                                            utterBodyHtml += "<div name='indentDiv'>----</div>";
                                        } else {
                                            chkComposit = false;
                                        }
                                    }

                                    utterBodyHtml += "<select name='entityTypeForLabel' class='form-control'  >";
                                    utterBodyHtml += "<option value='1'>" + language.SIMPLE_ENTITY + "</option>";
                                    utterBodyHtml += "<option value='3' selected>" + language.HIERARCHY_ENTITY + "</option>";
                                    if (!isInside ) {
                                        utterBodyHtml += "<option value='4'>" + language.COMPOSITE_ENTITY + "</option>";
                                    }
                                    //utterBodyHtml += "<option value='4'>composite</option>";
                                    //utterBodyHtml += "<option value='5'>closed list</option>";
                                    utterBodyHtml += "</select>";
            
                                    
                                    utterBodyHtml += "<select name='entitySelBox' class='form-control' >";
                                    utterBodyHtml += "<option value='" + hierarchyList[j].ENTITY_ID + "'></option>";
                                    utterBodyHtml += "</select>";
                                    utterBodyHtml += "<select name='entityChildSelBox' class='form-control' >";
                                    utterBodyHtml += "<option value='" + entityLabel[i].id + "'></option>";
                                    utterBodyHtml += "</select>";
                                    utterBodyHtml += "<input type='text' name='matchUtterText' value='' style='padding:0.5% 0; margin:0 0 0.5% 0;' />";
                                    utterBodyHtml += "<input type='hidden' name='startIndex' value='" + entityLabel[i].startTokenIndex + "' />";
                                    utterBodyHtml += "<input type='hidden' name='endIndex' value='" + entityLabel[i].endTokenIndex + "'  />";
                                    utterBodyHtml += "<a href='#' name='delLabelBtn' onclick='return false;' style=''><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                                    utterBodyHtml += "<span name='alertSpan' ></span>";
                                    utterBodyHtml += "</div>";
                                    break;
                                }
                            }
                        }
                    }
                    break;
                default:
                    //'None';
                    break;
            }
        }
    }
    
    utterBodyHtml += "</td>";
    utterBodyHtml += "<td></td>";
    utterBodyHtml += "<td></td>";
    utterBodyHtml += "</tr>";

    return utterBodyHtml;
}

//var simpleList = [];
//var hierarchyList = [];
//var compositeList = [];
//var closedList = [];
var colorLength = 5
function changeEntitySel() {

    var colorIndex = -1;
    var compositeObj = new Object();
    $('select[name=entitySelBox]').each(function(){
        if (colorIndex >= colorLength-1) {
            colorIndex = 0;
        } else {
            colorIndex++;
        }

        var utterStr = '';
        var startIndex = $(this).parent().find('input[name=startIndex]').val()*1;
        var endIndex = $(this).parent().find('input[name=endIndex]').val()*1;
        if ($(this).parent().find('select[name=entityTypeForLabel]').val() != 4) {
            for (var i=startIndex; i<=endIndex; i++) {
                utterStr += $(this).parents('tr').prev().find('#utterText_' + i).text();
                $(this).parents('tr').prev().find('#utterText_' + i).addClass('span_color_' + colorIndex);
            }
        }
        
        $(this).parent().find('input[name=matchUtterText]').val(utterStr);

        //composit child인지
        var isComChild = ($(this).parents('div[name=labelInfoDiv]').find('div[name=indentDiv]').length>0)

        var optionHtml = '';
        switch($(this).parent().find('select[name=entityTypeForLabel]').val()) {
            case '1':

                if ($(this).parent().find('div[name=indentDiv]').length > 0 ) {

                    for (var k=0; k<compositeObj.CHILD_ENTITY_LIST.length; k++) {
                        if (compositeObj.CHILD_ENTITY_LIST[k].CHILDREN_ID == $(this).val()) {
                            optionHtml += "<option value='" + compositeObj.CHILD_ENTITY_LIST[k].CHILDREN_NAME + "' selected>" + compositeObj.CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                        }
                        else {
                            optionHtml += "<option value='" + compositeObj.CHILD_ENTITY_LIST[k].CHILDREN_NAME + "' >" + compositeObj.CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                        }
                    }
                }
                else {
                    for (var i=0; i<simpleList.length; i++) {
                        if (simpleList[i].ENTITY_ID == $(this).val()) {
                            optionHtml += "<option value='" + simpleList[i].ENTITY_NAME + "' selected>" + simpleList[i].ENTITY_NAME + "</option>";
                        }
                        else {
                            optionHtml += "<option value='" + simpleList[i].ENTITY_NAME + "' >" + simpleList[i].ENTITY_NAME + "</option>";
                        }
                    }
                }
                $(this).html(optionHtml);
                break;
            case '2':
                break;
            case '3':
                var childHtml = '';
                var rememberId = -1;
                for (var i=0; i<hierarchyList.length; i++) {
                    if (hierarchyList[i].ENTITY_ID == $(this).val()) {
                        rememberId = i;
                        optionHtml += "<option value='" + hierarchyList[i].ENTITY_NAME + "' selected>" + hierarchyList[i].ENTITY_NAME + "</option>";
                    }
                    else {
                        optionHtml += "<option value='" + hierarchyList[i].ENTITY_NAME + "' >" + hierarchyList[i].ENTITY_NAME + "</option>";
                    }
                }

                $(this).html(optionHtml);
                var chkChildExists = false;
                if ($(this).parent().find('select[name=entityChildSelBox]').val() == ''  ) {
                    childHtml += "<option value='NONE' >" + language.SELECT_NOTHING + "</option>";
                    for (var k=0; k<hierarchyList[rememberId].CHILD_ENTITY_LIST.length; k++) {
                        childHtml += "<option value='" + hierarchyList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "' >" + hierarchyList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                    }
                }
                else {
                    childHtml += "<option value='NONE' >" + language.SELECT_NOTHING + "</option>";
                    for (var k=0; k<hierarchyList[rememberId].CHILD_ENTITY_LIST.length; k++) {
                        if (hierarchyList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_ID == $(this).next().val()) {
                            chkChildExists = true;
                            childHtml += "<option value='" + hierarchyList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "' selected>" + hierarchyList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                        }
                        else {
                            childHtml += "<option value='" + hierarchyList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "' >" + hierarchyList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                        }
                    }
                }
                $(this).next().css('display', 'inline');
                $(this).next().html(childHtml);
                if (chkChildExists) {
                    //$(this).next().prop('disabled', true);
                }
                
                break;
            case '4':
                for (var i=0; i<compositeList.length; i++) {
                    if (compositeList[i].ENTITY_ID == $(this).val()) {
                        compositeObj = compositeList[i];
                        optionHtml += "<option value='" + compositeList[i].ENTITY_NAME + "' selected>" + compositeList[i].ENTITY_NAME + "</option>";
                    }
                    else {
                        optionHtml += "<option value='" + compositeList[i].ENTITY_NAME + "' >" + compositeList[i].ENTITY_NAME + "</option>";
                    }
                }
                $(this).html(optionHtml);
                break;
                /*
            case '5':
                var childHtml = '';
                var rememberId = -1;
                for (var i=0; i<closedList.length; i++) {
                    if (closedList[i].ENTITY_ID == $(this).val()) {
                        rememberId = i; //closedList[i].ENTITY_ID;
                        optionHtml += "<option value='" + closedList[i].ENTITY_NAME + "' selected>" + closedList[i].ENTITY_NAME + "</option>";
                    }
                    else {
                        optionHtml += "<option value='" + closedList[i].ENTITY_NAME + "' >" + closedList[i].ENTITY_NAME + "</option>";
                    }
                }
                $(this).html(optionHtml);

                childHtml += "<option value='NONE' >선택안함</option>";
                for (var k=0; k<closedList[rememberId].CHILD_ENTITY_LIST.length; k++) {
                    var chilObj = closedList[rememberId].CHILD_ENTITY_LIST[k];
                    var childText = $(this).parent().find('select[name=entityChildSelBox]').val();
                    var isIn = false;
                    var subArr = chilObj.SUB_LIST.split(',');
                    for (var q=0; q<subArr.length; q++) {
                        if (subArr[q] == childText) {
                            isIn = true;
                            break;
                        }
                    }
                    if (isIn ) {
                        childHtml += "<option value='" + closedList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "' selected>" + closedList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                    }
                    else {
                        childHtml += "<option value='" + closedList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "' >" + closedList[rememberId].CHILD_ENTITY_LIST[k].CHILDREN_NAME + "</option>";
                    }
                }
                $(this).next().css('display', 'inline');
                $(this).next().html(childHtml);
                break;
                */
            case '6':
            
                for (var i=0; i<hierarchyList.length; i++) {
                    if (entityLabel[i].entityName.indexOf((hierarchyList[j].ENTITY_NAME + '::')) != -1 ) {
                        for (var k=0; k<hierarchyList[j].CHILD_ENTITY_LIST.length; k++) {
                            if (hierarchyList[j].CHILD_ENTITY_LIST[k].CHILDREN_ID == entityLabel[i].id) {

                            }
                        }
                    }

                    if (hierarchyList[i].ENTITY_ID == $(this).val().split('::')[0]) {
                        optionHtml += "<option value='" + simpleList[i].ENTITY_NAME + "' selected>" + simpleList[i].ENTITY_NAME + "</option>";
                    }
                    else {
                        optionHtml += "<option value='" + simpleList[i].ENTITY_NAME + "' >" + simpleList[i].ENTITY_NAME + "</option>";
                    }
                }
                $(this).html(optionHtml);
                
                break;
            default:
                break;
        }
        if (isComChild) {
            //entityChildSelBox
            $(this).prev().prop('disabled', true);
            $(this).prop('disabled', true);
        }
    });
}


//인텐트 생성 
function createIntent() {
    if ($('#intentName').val().trim() == '') 
    {
        $('#alertMsg').text(language.ALERT_INTENT_SELECT);
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
                    $('#alertMsg').text("[" + data.existApp + "] " + language.ALERT_SAME_INTENT_EXIST);
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
                    $('#alertMsg').text(language.SUCCESS);
                    $('#alertBtnModal').modal('show');
                    $('#chkAfterAlert').val('RELOAD');
                    //alert('생성되었습니다.');
                    //location.reload();
                }
            }
        });
        
    }
}



//intent 삭제
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
                $('#chkAfterAlert').val('GO_LIST');
                //alert(data.message);
                //location.href = "/luis/intentList";
            }
            else {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
            }
        }
    });
}


//엔티티 가져오기
function getEntityList(intentName, intentId) {

    $.ajax({
        type: 'POST',
        url: '/luis/getEntityList',
        data: {'isAll' : 'NOTALL'},
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
                var childTmpArr = [];
                for (var i=0; i<closedList.length; i++) {
                    var childList = closedList[i].CHILD_ENTITY_LIST;
                    for (var j=0; j<childList.length; j++) {
                        for (var k=0; k<childList[j].CHILDREN_NAME.length; k++) {
                            childTmpArr.push(childList[j].CHILDREN_NAME.split(' ').join(''));
                            if (childList[j].SUB_LIST) {
                                var tmp = childList[j].SUB_LIST.split(',');
                                for (var q=0; q<tmp.length; q++) {                                    
                                    childTmpArr.push(tmp[q].split(' ').join(''));
                                }
                            }
                        }
                    }
                }
                $.each(childTmpArr, function(i, el){
                    if($.inArray(el, closedCompareList) === -1) closedCompareList.push(el);
                });
            }
        }
    });
}


// input 엔터 감지
$(document).on("click", "#insertUtterBtn", function(e){ 
    if ($('#editIntentName').length>0) {
        focusOutUpdateName();
    }
    saveUtterance();
});

//인텐트 선택
function saveUtterance() {

    var intentName = $('#intentNameTitle').text();
    var utterArr = [];
    var trIndex = 0;
    var uterObj;
    var newArr = []
    var addClosedList = [];
    var isOk = false;
    var isNew = false;
    var isMatching = false;
    $('tr').each(function(){
        if (trIndex == 0) {
            trIndex++;
            return true;
        }

        if (trIndex++%2 == 0) {
            uterObj = new Object();
            var utterText = $(this).find('input[name=intentHiddenName]').val();
            if ($(this).find('input[name=intentHiddenId]').val() == 'NEW') {
                var tmpNewObj = new Object();
                tmpNewObj.text = utterText;
                tmpNewObj.intentName = $('#hiddenIntentName').val();
                newArr.push(tmpNewObj);
            }
            //console.log("newArr text=="+newArr.length);
            uterObj.text = utterText;
            uterObj.intentName = intentName;
            utterArr.push(uterObj);
            return true;
        }
        
    });

    if (isOk) {
        $('#alertMsg').text(language.ALERT_SELECT_LIST_TYPE);
        $('#alertBtnModal').modal('show');
        //alert('list type의 child Entity를 선택해 주세요.');
        return false;
    }

    if (isMatching) {
        $('#alertMsg').text(language.ALERT_NO_MATCHING_WORDS);
        $('#alertBtnModal').modal('show');
        return false;
    }

    var params = {
        'intentName' : $('#hiddenIntentName').val(),
        'labelArr' : utterArr,
        'newUtterArr' : newArr,
        'addClosedList' : addClosedList
    };
    
    //return false;

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
        url: '/luis/saveUtterance',
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
                //updateUtter();
            }
            else if (!data.success) {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
                //updateUtter();
            }
            else 
            {
                console.log("success luis in");
                var luisResult = data.luisResult;
                var outputTxtPre = "";
                var outputTxtAfter = "";
                var failCnt = 0;
                
                for (var i=0; i<luisResult.length; i++ ) {
                    if (luisResult[i].statusCode != 201) {
                        failCnt++;
                        console.log(i)
                        outputTxtAfter += "[" + luisResult[i].body.UtteranceText + "] " + language.ALERT_THIS_UTTER_FAILED + ' <br/>';
                    } 
                }
                outputTxtPre = language.SUCCESS + " : " + (luisResult.length - failCnt) + ", " + language.FAIL + " : " + failCnt + " <br/>";
                
                //$('#alertMsg').html(outputTxtPre + outputTxtAfter);
                //$('#alertBtnModal').modal('show');
                $('#confirmTitle').text(language.SUCCESS);
                $('#confirmMsg').html(outputTxtPre + outputTxtAfter);
                $('#confirmBtnModal').modal('show');
                //updateUtterInfo();
                //alert(data.message);
                //updateUtter();
            }
        }
    });
}


function saveUtteranceBack() {

    var intentName = $('#intentNameTitle').text();
    var utterArr = [];
    var trIndex = 0;
    var uterObj;
    var newArr = []
    var addClosedList = [];
    var isOk = false;
    var isNew = false;
    var isMatching = false;
    $('tr').each(function(){
        if (trIndex == 0) {
            trIndex++;
            return true;
        }
        if (trIndex++%2 == 1) {
            uterObj = new Object();
            var utterText = $(this).find('input[name=intentHiddenName]').val();
            if ($(this).find('input[name=intentHiddenId]').val() == 'NEW') {
                var tmpNewObj = new Object();
                tmpNewObj.text = utterText;
                tmpNewObj.intentName = $('#hiddenIntentName').val();
                newArr.push(tmpNewObj);
            }
            console.log("newArr push=="+newArr.length);
            uterObj.text = utterText;
            uterObj.intentName = intentName;
            return true;
        }
        else 
        {
            var entityLabels = [];
            $(this).find('div[name=labelInfoDiv]').each(function(){
                if ($(this).find('span[name=alertSpan]').text().trim() != '') {
                    isMatching = true;
                }
                var labelObj = new Object();
                var selEntity;
                var startIndex;
                var endIndex;
                var childName = '';

                var chkCompositeChild = false;
                var utterEntityType = $(this).find('select[name=entityTypeForLabel]').val();
                
                switch (utterEntityType) {
                    case '1':
                        if ($(this).find('div[name=indentDiv]').length) {
                            chkCompositeChild = true;
                        }
                        selEntity = $(this).find('select[name=entitySelBox]').val();
                        startIndex = $(this).find('input[name=startIndex]').val();
                        endIndex = $(this).find('input[name=endIndex]').val();
                        break;
                    case '3':
                        if ($(this).find('div[name=indentDiv]').length) {
                            chkCompositeChild = true;
                        }
                        selEntity = $(this).find('select[name=entitySelBox]').val();
                        startIndex = $(this).find('input[name=startIndex]').val();
                        endIndex = $(this).find('input[name=endIndex]').val();
                        
                        if ($(this).find('select[name=entityChildSelBox]').length) {
                        //if ($(this).find('select[name=entityChildSelBox]').val() != "NONE" && $(this).parents('tr').find('div[name=indentDiv]').length ==0) {
                            if ($(this).find('select[name=entityChildSelBox]').val() != "NONE") {
                                selEntity = selEntity + "::" + $(this).find('select[name=entityChildSelBox]').val();
                            }
                        }
                        break;

                    case '4':
                        selEntity = $(this).find('select[name=entitySelBox]').val();
                        startIndex = $(this).find('input[name=startIndex]').val();
                        endIndex = $(this).find('input[name=endIndex]').val();
                        break;
                    /*
                    case '5':
                        selEntity = $(this).find('select[name=entitySelBox]').val();
                        startIndex = $(this).find('input[name=startIndex]').val();
                        endIndex = $(this).find('input[name=endIndex]').val();
                        var canonical;
                        if ($(this).find('select[name=entityChildSelBox]').val() != "NONE") {
                            childName = $(this).find('input[name=matchUtterText]').val();
                            canonical = $(this).find('select[name=entityChildSelBox]').val();

                        } else {
                            isOk = true;
                        }
                        var listObj = new Object();
                        listObj.selEntity = selEntity;
                        listObj.childName = childName;
                        listObj.canonical = canonical;
                        for (var q=0; q<closedList.length; q++) {
                            if (closedList[q].ENTITY_NAME == selEntity) {
                                for (var w=0; w<closedList[q].CHILD_ENTITY_LIST.length; w++) {
                                    if (closedList[q].ENTITY_NAME == selEntity) {
                                        for (var w=0; w<closedList[q].CHILD_ENTITY_LIST.length; w++) {
                                            var childObj = closedList[q].CHILD_ENTITY_LIST[w];
                                            if (canonical == childObj.CHILDREN_NAME) {
                                                listObj.childId = childObj.CHILDREN_ID;
                                                childArr = childObj.SUB_LIST.split(',');
                                                for (var d=0; d<childArr.length; d++) {
                                                    if (childName == childArr[d]) {
                                                        isNew = true;
                                                    }
                                                }
                                            }
                                            
                                        }
                                    }
                                }
                            }
                        }

                        for (var q=0; q<closedList.length; q++) {
                            if (closedList[q].ENTITY_NAME == selEntity) {
                                listObj.entityId = closedList[q].ENTITY_ID;
                                listObj.entityId = closedList[q].ENTITY_ID;
                                break;
                            }
                        }
                        var childArr = [];
                        var isNew = false;
                        for (var q=0; q<closedList.length; q++) {
                            if (closedList[q].ENTITY_NAME == selEntity) {
                                for (var w=0; w<closedList[q].CHILD_ENTITY_LIST.length; w++) {
                                    var childObj = closedList[q].CHILD_ENTITY_LIST[w];
                                    if (canonical == childObj.CHILDREN_NAME) {
                                        listObj.childId = childObj.CHILDREN_ID;
                                        childArr = childObj.SUB_LIST.split(',');
                                        for (var d=0; d<childArr.length; d++) {
                                            if (childName == childArr[d]) {
                                                isNew = true;
                                            }
                                        }
                                    }
                                    
                                }
                            }
                        }
                        for (var q=0; q<addClosedList.length; q++) {
                            if (addClosedList[q].selEntity == listObj.selEntity && addClosedList[q].canonical == listObj.canonical) {
                                for (var w=0; w<addClosedList[q].list.length; w++) {
                                    if (addClosedList[q].list[w] == childName) {
                                        isNew = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (!isNew) {
                            childArr.push(childName);
                            listObj.list = childArr;
                            var isExist1 = false;
                            for (var q=0; q<addClosedList.length; q++) {
                                if (addClosedList[q].selEntity == listObj.selEntity && addClosedList[q].canonical == listObj.canonical) {
                                    isExist1 = true;
                                    var isExist2 = false;
                                    for (var w=0; w<addClosedList[q].list.length; w++) {
                                        if (addClosedList[q].list[w] == listObj.childName) {
                                            isExist2 == true;
                                        }
                                    }
                                    if (!isExist2) {
                                        addClosedList[q].list.push(listObj.childName);
                                    }
                                }
                            }
                            if (!isExist1) {
                                addClosedList.push(listObj);
                            }
                        }
                        break;
                    */
                }
                
                if (!isNew) {
                    labelObj.entityName = selEntity;
                    labelObj.childName = childName;
                    var startStr = $(this).parents('tr').prev().find('#indexVal_' + startIndex).val();
                    var endStr = $(this).parents('tr').prev().find('#indexVal_' + endIndex).val();
                    if (typeof startStr == 'undefined') {
                        isMatching = true;
                        return true;
                    }
                    var startInx = $(this).parents('tr').prev().find('#indexVal_' + startIndex).val().split(',')[1];
                    var endInx = $(this).parents('tr').prev().find('#indexVal_' + endIndex).val().split(',')[2];
    
                    labelObj.startCharIndex = startInx;
                    labelObj.endCharIndex = endInx;

                    
                    if (chkCompositeChild) {
                        var childTmpObj = entityLabels.pop();
                        entityLabels.push(labelObj);
                        entityLabels.push(childTmpObj);
                    } else {
                        entityLabels.push(labelObj)
                    }
                }
            });
            uterObj.entityLabels = entityLabels;
            utterArr.push(uterObj);
        }
    });

    if (isOk) {
        $('#alertMsg').text(language.ALERT_SELECT_LIST_TYPE);
        $('#alertBtnModal').modal('show');
        //alert('list type의 child Entity를 선택해 주세요.');
        return false;
    }

    if (isMatching) {
        $('#alertMsg').text(language.ALERT_NO_MATCHING_WORDS);
        $('#alertBtnModal').modal('show');
        return false;
    }

    var params = {
        'intentName' : $('#hiddenIntentName').val(),
        'labelArr' : utterArr,
        'newUtterArr' : newArr,
        'addClosedList' : addClosedList
    };
    
    //return false;

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
        url: '/luis/saveUtterance',
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
                //updateUtter();
            }
            else if (!data.success) {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
                //updateUtter();
            }
            else 
            {
                console.log("success luis in");
                var luisResult = data.luisResult;
                var outputTxtPre = "";
                var outputTxtAfter = "";
                var failCnt = 0;
                console.log("luisResult==="+luisResult);
                for (var i=0; i<luisResult.length; i++ ) {
                    if (luisResult[i].statusCode != 201) {
                        failCnt++;
                        console.log(i)
                        outputTxtAfter += "[" + luisResult[i].body.UtteranceText + "] " + language.ALERT_THIS_UTTER_FAILED + ' <br/>';
                    } 
                }
                outputTxtPre = language.SUCCESS + " : " + (luisResult.length - failCnt) + ", " + language.FAIL + " : " + failCnt + " <br/>";
                
                //$('#alertMsg').html(outputTxtPre + outputTxtAfter);
                //$('#alertBtnModal').modal('show');
                $('#confirmTitle').text(language.SUCCESS);
                $('#confirmMsg').html(outputTxtPre + outputTxtAfter);
                $('#confirmBtnModal').modal('show');
                //updateUtterInfo();
                //alert(data.message);
                //updateUtter();
            }
        }
    });
}

function updateUtter() {
    //getUtterInIntent
    var hiddenIntentName = $('#hiddenIntentName').val();
    var hiddenIntentId = $('#hiddenIntentId').val();
    var hiddenlebelCnt = $('#hiddenlebelCnt').val();

    var params = {
        'intentName' : hiddenIntentName,
        'intentId' : hiddenIntentId,
        'lebelCnt' : hiddenlebelCnt
    };

    $.ajax({
        type: 'POST',
        timeout: 0,
        data: params,
        url: '/luis/getUtterInIntent',
        complete: function () {
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
                location.href = "/luis/intentDetail?intentName=" + hiddenIntentName + "&intentId=" + hiddenIntentId + "&labelCnt=" + hiddenlebelCnt;
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
        else if (chkMsg == 'GO_LIST') {
            location.href = "/luis/intentList"
        }
    }
});


function updateUtterInfo() {
    var intentName = $('#hiddenIntentName').val();
    var intentId = $('#hiddenIntentId').val();
    var labelCnt = $('tr[name=utterMainTr]').length;
    var pageNum = $('#hiddenListPageNum').val();
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
                $('#confirmTitle').text(language.ALERT);
                $('#confirmMsg').text(data.message);
                $('#confirmBtnModal').modal('show');
                //$('#alertMsg').text(data.message);
                //$('#alertBtnModal').modal('show');
                //alert(data.message);
            }
            else if (data.error) {
                $('#confirmTitle').text(language.ALERT);
                $('#confirmMsg').text(data.message);
                $('#confirmBtnModal').modal('show');
                //$('#alertMsg').text(data.message);
                //$('#alertBtnModal').modal('show');
                //alert(data.message);
            }
            else 
            {
                location.href = "/luis/intentDetail?intentName=" + intentName + "&intentId=" + intentId + "&labelCnt=" + labelCnt + "&pageNum=" + pageNum;
            }
        }
    });
}



$(document).on("click", "#confirmBtn", function () {

    $('#confirmBtnModal').modal('hide');
    //$('#confirmBtn').prev().trigger('click');

    if ($('#confirmTitle').text() == language.SUCCESS) {
        updateUtterInfo();
    } else if ($('#confirmTitle').text() == language.UTTERANCE + ' ' + language.DELETE) {
        deleteUtter();
    } else if ($('#confirmTitle').text() == language.INTENT + ' ' + language.DELETE) {
        var intentName = $('#hiddenIntentName').val();
        var hId = $('#hiddenIntentId').val();
        deleteIntent(intentName, hId);
    } else if ($('#confirmTitle').text() == language.INTENT + ' ' + language.MODIFY) {
        changeIntentNameFnc();
    } else {
        var pageNum = $('#hiddenListPageNum').val();
        location.href = "/luis/intentList?rememberPageNum=" + pageNum;
    }
    $('#confirmBtn').prev().hide();
});



function labelingClosedList () {
    var indexArr = [];

    $('#utteranceTblBody tr[name=utterMainTr]').each(function(inx){

        var fullContext = $(this).find('#intentHiddenName').val();
        var matchClosedArr = [];
        for (var i=0; i<closedCompareList.length; i++) {
            if (fullContext.indexOf(closedCompareList[i]) != -1) {
                matchClosedArr.push(closedCompareList[i]);
            } else {
            }
        }

        
        for (var q=0; q<matchClosedArr.length; q++) {

            var chkMatch = [];
            var chkMatchIndex = [];
            var isMatch = false;
            var isEngNum = false;
            
            for (var i=0; i<matchClosedArr.length; i++) {
                var inputLength = matchClosedArr[i].length;
                var utterLength = $(this).find('span[name=utterText]').length;
                
                for (var j=0; j<matchClosedArr[i].length; j++) {
                    if (isAlpabet(matchClosedArr[i][j])) {
                        isEngNum = true;
                        break;
                    } 
                }

                var indexArr = [];
                var inputVal = matchClosedArr[i];
                if (isEngNum) {
                    $(this).find('input[name=tokenVal]').each(function(index, item){
                        var strVal = '';
                        var isMatch = false;
            
                        var innerIndex = 0;
                        while (1) {
                            var hasClass = $(item).parent().find('#utterText_' + index).attr('class');
                            hasClass = hasClass == undefined? '' : hasClass;
                            if (hasClass.indexOf('span_color') != -1) {
                                break;
                            }
                            strVal += $(item).parent().find('input[name=tokenVal]').eq(index+innerIndex).val();
                            var subInput = inputVal.substr(0, strVal.length);
                            if (inputVal == strVal) {
                                isMatch = true
                                break;
                            } else if (strVal == subInput) {
                                innerIndex++
                                continue;
                            } else {
                                break;
                            }
                        }
                        if (isMatch) {
                            var matchObj = new Object();
                            matchObj.startIndex = index;
                            matchObj.endIndex = index+innerIndex;
                            indexArr.push(matchObj);
                            //
                            chkMatch.push(inputStr);
                            var tmpIndex = index + ',' + matchObj.endIndex;
                            chkMatchIndex.push(tmpIndex);
                        }
                    });
                } else {
                    for (var inc=0; inc<=utterLength-inputLength; inc++) {
                        var strTmp = '';
                        var chkLabeled = false;
                        for (var jnc=0; jnc<inputLength; jnc++) {
                            var spanClass = $(this).find('span[name=utterText]').eq(inc+jnc).attr('class');
                            if (typeof spanClass == 'undefined') {
                                spanClass = '';
                        }
                            if (spanClass.indexOf('span_color_') != -1) {
                                chkLabeled = true;
                                break;
                            } else {
                                strTmp += $(this).find('span[name=utterText]').eq(inc+jnc).text();
                            }
                        }
                        if (inputVal == strTmp && strTmp != '' && !chkLabeled) {
                            chkMatch.push(inputVal);
                            var tmpNum = (inc + inputLength*1)-1;
                            var tmpIndex = inc + ',' + tmpNum;
                            chkMatchIndex.push(tmpIndex);
                        }
                    }
                }
            }

//-------------------------------[
//-------------------------------[
//-------------------------------[]
            if (chkMatch.length<1) {
                continue;
            }
            for (var k=0; k<chkMatchIndex.length; k++) {
                var matchStartIndex = chkMatchIndex[k].split(",")[0]*1;
                var matchEndIndex = chkMatchIndex[k].split(",")[1]*1;
                var colorIndexArr = [0, 1, 2, 3, 4];
                $(this).find('span[name=utterText]').each(function(){
                    var classValue = $(this).attr('class');

                    if (typeof classValue == 'undefined') {
                        classValue = '';
                    }

                    if (classValue.indexOf('span_color_') != -1) {
                        for (var i=0; i<colorIndexArr.length; i++) {
                            if ('span_color_' + colorIndexArr[i] == $(this).attr('class')) {
                                colorIndexArr.splice(i--, 1);
                            }
                        }
                    }
                });

                for (var i=0; i<matchStartIndex; i++) {
                    var tmpClass = $(this).find('span[name=utterText]').eq(i).attr('class');
                    if (typeof tmpClass == 'undefined') {
                        tmpClass = '';
                    }
                    if (tmpClass.indexOf('span_color_') != -1) {
                        if (colorIndexArr[i] == tmpClass.split('span_color_')[1]) {
                            colorIndexArr.splice(i--, 1);
                            break;
                        }
                    }
                }
                for (var i=matchEndIndex+1; i<matchStartIndex; i++) {
                    var tmpClass = $(this).find('span[name=utterText]').eq(i).attr('class');
                    if (typeof tmpClass == 'undefined') {
                        tmpClass = '';
                    }
                    if (tmpClass.indexOf('span_color_') != -1) {
                        if (colorIndexArr[i] == tmpClass.split('span_color_')[1]) {
                            colorIndexArr.splice(i--, 1);
                            break;
                        }
                    }
                }

                if (colorIndexArr.length > 0) {
                    for (var i=matchStartIndex; i<=matchEndIndex; i++) {
                        $(this).find('#utterText_' + i).addClass('span_color_' + colorIndexArr[0]);
                    }
                }
            }
            

        } 
    });
 
    
 
}
