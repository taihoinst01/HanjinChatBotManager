

//가장 먼저 실행.
var language;
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
    getChildCompositeList();
})(jQuery);

//childList 저장
var childList = [];
$(document).ready(function() {

    getChildEntityList();
    
    $('#updateEntityName').click(function() {
        editEntityName();
    });

    $('#addchildBtn').click(function() {
        addChildEntityRow();
    });

    $('#initEntityBtn').click(function() {
        getChildEntityList();
        $('#entityNameTitle').html('');
        $('#entityNameTitle').text($('#hiddenEntityName').val());
    });

    //save entity
    $('#saveEntityBtn').click(function() {
        saveEntityDetail();
    });

    //delete Entity
    $('#deleteEntityBtn').click(function() {
        var entityHiddenName = $('#entityNameTitle').text();
        if (confirm("["+ entityHiddenName + "] 삭제하시겠습니까?")) {
            var hId = $('#hiddenEntityId').val();
            var hType = $('#hiddenEntityType').val();
            deleteEntity(entityHiddenName, hId, hType);
        }
    });
    
});

//edit entity name focus out 
$(document).on('focusout','#editEntityName',function(e){
    var editEntityName = $('#editEntityName').val();
    $('#entityNameTitle').html('');
    $('#entityNameTitle').text(editEntityName);
});

//delete child entity
$(document).on('click','a[name=delchildBtn]',function(e){
    var entityType = $('#hiddenEntityType').val();
    if (entityType == "3") {
        $(this).parents('tr').remove();
        if ($('input[name=childName]').length < 10) {
            $('#addchildBtn').show();
        }
    } else if (entityType == "4") {
        $(this).parents('tr').remove();
        if ($('select[name=childCompositeSel]').length < 10) {
            $('#addchildBtn').show();
        }
    } else {
        var entityName = $(this).parents('tr').find('#childHiddenName').val();
        if (confirm("[" + entityName + "] 삭제하시겠습니까?")) {
            $(this).parents('tr').remove();
        }
    }
});


//delete child entity
$(document).on('click','a[name=subList]',function(e){
    if ($(this).parent().find('input[name=editSynonymsVal]').length == 0 ) {
        return false;
    } else {
        $(this).remove();
    }
});



//click event
$(document).click(function(event) {
    //console.log($(event.target).attr('name'));
    //console.log(event);
    var entityType = $('#hiddenEntityType').val();
    if (entityType == "5" ) {
        var chkInnerTable = ( $(event.target).parents('tr').length > 0 && $(event.target).parents('#listEntityTblBody').length > 0 );
        if ($('.editing').length > 0) {
            if (chkInnerTable && $(event.target).parents('tr').hasClass('editing')) {
                //none
            } else {
                var changeVal = $('.editing').find('input[name=editNormalVal]').val().trim();
                
                if (chkDupleListEntity(changeVal)){
                    $('.editing').find('input[name=childHiddenName]').val(changeVal);
                    var childHtmlStr = "<span name='entityNormalVal' style='font-size:1.2em;'>" + changeVal + "</span> ";
                    $('.editing').find('td:first').html(childHtmlStr);
                    $('.editing').find('input[name=editSynonymsVal]').remove();
                    $('.editing').removeClass('editing');
    
                    if ($(event.target).parents('tr').find('th').length==0) {
                        listEntityClickForm(event.target);
                    }
                }
            }
        } else if (chkInnerTable) {
            if ($(event.target).parents('td').find('a[name=delchildBtn]').length==0 && !$(event.target).parents('tr').hasClass('editing') ) {
                listEntityClickForm(event.target);
            }
        }
    }
});

//list entity esc 종료
$(document).keyup(function(e) {
    var entityType = $('#hiddenEntityType').val();
    if (entityType == "5" && $('.editing').length > 0) {
        if (e.which == 27) {
            $('#entityNameTitle').trigger('click');
        }
    }
});

//list ENtity synonyms 엔터 감지
$(document).on("keypress", "input[name=editSynonymsVal]", function(e){
    if (e.keyCode === 13) {	//	Enter Key
        var addVal = $(this).val().trim();
        if (addVal == '' ) {
            //none
        } else if (addVal.indexOf(',') >= 0) {
            $('#alertMsg').text(' , 를 입력할 수 없습니다.');
            $('#alertBtnModal').modal('show');
            //alert(' , 를 입력할 수 없습니다.');
        } else {
            var inputHtmlStr = makeListTypeSynonyms(addVal, "NOT_LIST");
            $(this).parent().append(inputHtmlStr);
            $(this).remove();
            $('input[name=editSynonymsVal]').focus();
        }
    }
});

//list ENtity 추가 엔터 감지
$(document).on("keypress", "#entityInputText", function(e){
    if (e.keyCode === 13) {	//	Enter Key
        var addVal = $(this).val().trim();
        if (addVal == '' ) {
            //none
        } else if (addVal.indexOf(',') >= 0) {
            $('#alertMsg').text(' , 를 입력할 수 없습니다.');
            $('#alertBtnModal').modal('show');
            //alert(' , 를 입력할 수 없습니다.');
        } else {
            if (!chkDupleListEntity(addVal)) {
                //none
            } else {
                var childHtmlStr = "";
                childHtmlStr += "<tr>";
                childHtmlStr += "<td style='text-align: left; padding-left:1%;'>";
                childHtmlStr += "<span name='entityNormalVal' style='font-size:1.2em;'>" + addVal + "</span> ";
                childHtmlStr += "</td>";
                childHtmlStr += "<td style='text-align: left; padding-left:2%;'>";
                childHtmlStr += "</td>";
                childHtmlStr += "<td style='text-align: right; padding-right:1.5%;'>";
                childHtmlStr += "<input type='hidden' name='childHiddenName' value='" + addVal + "' />";
                childHtmlStr += "<input type='hidden' name='childHiddenId' value='' />";
                childHtmlStr += "<a href='#' name='delchildBtn' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                childHtmlStr += "</td>";
                childHtmlStr += "</tr>";

                $('#listEntityTblBody').prepend(childHtmlStr);
                $(this).val('');
            }
        }
    }
});

//composite child selbox
$(document).on("change", "select[name=childCompositeSel]", function(e){
    if ($(this).find('option:first').val() == "NONE")
    {   
        $(this).find('option:first').remove();
    }
    var selValArr = [];//$(this).val();
    var selIndex = $('select[name=childCompositeSel]').index(this);
    //$(this).find('option:first').remove();
    $('select[name=childCompositeSel]').each(function(index, value){
        //if (index != selIndex) {
        if ($(this).val() != "NONE") {
            selValArr.push($(this).val());
        }
    });
    $('select[name=childCompositeSel]').each(function(index, value){
        if (index != selIndex) {
            var selStr = '';
            var changeVal = $(this).val();

            if ($(this).val() == "NONE") {
                selStr += '<option value="NONE">선택하세요</option>';
            }

            for (var i=0; i<childCompositeList.length; i++) {
                var isDuple = false;

                selValArr.forEach(function(element){
                    if (element == childCompositeList[i] && $('select[name=childCompositeSel]').eq(index).val() !=  element) {
                        isDuple = true;
                    }
                });

                if (!isDuple) {
                    if (changeVal == childCompositeList[i]) {
                        selStr += '<option value="' + childCompositeList[i] + '" selected>' + childCompositeList[i] + '</option>';
                    } else {
                        selStr += '<option value="' + childCompositeList[i] + '">' + childCompositeList[i] + '</option>';
                    }
                }
            }
            $(this).html(selStr);
        }
    });
});

function listEntityClickForm(thisObj) {
    var entityName = $(thisObj).parents('tr').find('input[name=childHiddenName]').val();
    var inputHtml = "<input type='text' name='editNormalVal' class='listTypeStyle' style='width : 70%;' spellcheck='false' value='" + entityName + "' />";
    var inputSynonymsHtml = "<input type='text' name='editSynonymsVal' class='listTypeStyle' style='width : 15%;' spellcheck='false' value='' placeholder='입력하세요..' />";
    
    $(thisObj).parents('tr').addClass('editing');
    $(thisObj).parents('tr').children().eq(0).html(inputHtml);
    $(thisObj).parents('tr').children().eq(1).append(inputSynonymsHtml);
    $('input[name=editSynonymsVal]').focus();
}


//save Entity
function saveEntityDetail() {
    var entityType = $('#hiddenEntityType').val();
    if (confirm("저장하시겠습니까?")) {
        if (chkEntityChange()) {
            var saveChildList = [];

            if (entityType == "3") {
                $('input[name=childName]').each(function(){
                    saveChildList.push($(this).val());
                });
            }
            else if (entityType == "4") {
                $('select[name=childCompositeSel]').each(function(){
                    saveChildList.push($(this).val());
                });
            }
            else if (entityType == "5") {
                $('#listEntityTblBody tr').each(function(){
                    var tmpObj = new Object();
                    tmpObj.canonicalForm = $(this).find('span[name=entityNormalVal]').text();
                    
                    var subList = [];
                    $(this).find('b').each(function() {
                        subList.push($(this).text());
                    });
                    tmpObj.list = subList;
                    saveChildList.push(tmpObj);
                });
            }

            var params = {
                'entityId' : $('#hiddenEntityId').val(),
                'entityName' : $('#entityNameTitle').text(),
                'entityType' : entityType,
                'chilEntityList' : ( entityType!="5"?saveChildList:JSON.stringify(saveChildList) )   
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
                url: '/luis/saveChangedEntity',
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
                        //alert(data.message);
                        childList = [];
                        for (var i=0; i<saveChildList.length; i++) {
                            var tmpObj = new Object();
                            tmpObj.CHILDREN_NAME =saveChildList[i];
                            childList.push(tmpObj);
                        }
                    }
                    else {
                        $('#alertMsg').text("실패했습니다. 다시 시도해주세요.");
                        $('#alertBtnModal').modal('show');
                        //alert("실패했습니다. 다시 시도해주세요.");
                    }
                }
            });

        }
    }
}

//validation before save 
function chkEntityChange() {
    var entityType = $('#hiddenEntityType').val();
    var isChange = false;
    var isBlank = false;
    var saveChildList = [];

    if ($('#hiddenEntityName').val() != $('#entityNameTitle').text()) {
        isChange = true;
    }
    if (entityType == "3") {
        $('input[name=childName]').each(function(){
            if ($(this).val().trim() == '') {
                isBlank = true;
                return false;
            } else {
                saveChildList.push($(this).val());
            }
        });
    }
    else if (entityType == "4") {
        $('select[name=childCompositeSel]').each(function(){
            if ($(this).val() == 'NONE') {
                isBlank = true;
                return false;
            } else {
                saveChildList.push($(this).val());
            }
        });
    }
    else if (entityType == "5") {
        $('span[name=entityNormalVal]').each(function(){
            
            saveChildList.push($(this).text());
            
        });
    }

    if (entityType != "1" || entityType != "2" ) {
        for (var j=0; j<childList.length; j++) {
            for (var i=0; i<saveChildList.length; i++) {
                if (saveChildList[i] == childList[j].CHILDREN_NAME) {
                    break;
                }
                if (i+1 == saveChildList.length) {
                    isChange = true;
                }
            }
            if (isChange) break;
        }
        if (!isChange) {
            var subList = [];
            $('#listEntityTblBody tr').each(function(){
                var indx = 0;

                var chilName = $(this).find('span[name=entityNormalVal]').text();
                for (var j=0; j<childList.length; j++) {
                    if (childList[j].CHILDREN_NAME == chilName) {
                        indx = j;
                        break;
                    }
                }

                var chkListChng = false
                $(this).find('b').each(function() {
                    var splittedChildList = childList[indx].SUB_LIST.split(",");

                    var chkTmp = false;
                    for (var i=0; i<splittedChildList.length; i++) {
                        if (splittedChildList[i] == $(this).text() ) {
                            chkTmp = true;
                            break;
                        }
                    }
                    if (!chkTmp) {
                        chkListChng = true;
                        return false;
                    }
                });

                if (chkListChng) {
                    isChange = true;
                }
            });
        }
    }
    
    //return false;

    if (isBlank) {
        $('#alertMsg').text("공백은 저장할 수 없습니다.");
        $('#alertBtnModal').modal('show');
        //alert("공백은 저장할 수 없습니다.");
        return false;
    } else if (!isChange && (entityType != "1" || entityType != "2" ) ) {
        $('#alertMsg').text("변경된 값이 없습니다.");
        $('#alertBtnModal').modal('show');
        //alert("변경된 값이 없습니다.");
        return false;
    } else {
        return true;
    }
}


//get child Entity List
function getChildEntityList() {
    var params = {
        'entityId' : $('#hiddenEntityId').val(),
        'entityType' : $('#hiddenEntityType').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/luis/getChildEntity',
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
                childList = data.selChildList;
                makeChildList();
            }
            else {
                $('#alertMsg').text("실패했습니다. 다시 시도해주세요.");
                $('#alertBtnModal').modal('show');
                //alert("실패했습니다. 다시 시도해주세요.");
            }
        }
    });
}

function makeChildList() {
    var entityType = $('#hiddenEntityType').val();
    var childHtmlStr = "";

    switch(entityType) {
        case '1':
            //'Simple';
            break;
        case '2':
            //'Prebuilt';
            break;
        case '3':
            //'Hierarchical';
            for (var i=0; i<childList.length; i++) {
                childHtmlStr += "<tr><td style='text-align: left; padding-left:1%;'>";
                childHtmlStr += "<input type='text' name='childName' class='form-control' style='width:80%; margin: 0 0 0.5% 0; display: inline;' value='" + childList[i].CHILDREN_NAME + "' />";
                childHtmlStr += "<input type='hidden' name='childHiddenName' value='" + childList[i].CHILDREN_NAME + "' />";
                childHtmlStr += "<input type='hidden' name='childHiddenId' value='" + childList[i].CHILDREN_ID + "' />";
                childHtmlStr += "<a href='#' name='delchildBtn' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                childHtmlStr += "</td></tr>";
            }
            $('#hierarchyEntityTblBody').html(childHtmlStr);
            if (childList.length < 10) {
                $('#addchildBtn').show();
            }
            break;
        case '4':
            //'Composite';
            for (var i=0; i<childList.length; i++) {
                childHtmlStr += "<tr><td style='text-align: left; padding-left:1%;'>";
                childHtmlStr += "<select name='childCompositeSel' class='form-control' style='width:80%; margin: 0 0 0.5% 0; display: inline;' >";
                childHtmlStr += makeChildOptionHtml(childList[i].CHILDREN_NAME);
                childHtmlStr += "</select>";
                childHtmlStr += "<input type='hidden' name='childHiddenName' value='" + childList[i].CHILDREN_NAME + "' />";
                childHtmlStr += "<input type='hidden' name='childHiddenId' value='" + childList[i].CHILDREN_ID + "' />";
                childHtmlStr += "<a href='#' name='delchildBtn' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                childHtmlStr += "</td></tr>";
            }
            $('#compositeEntityTblBody').html(childHtmlStr);
            if (childList.length < 10) {
                $('#addchildBtn').show();
            }
            break;
        case '5':
            //'Closed List';
            for (var i=0; i<childList.length; i++) {
                childHtmlStr += "<tr>";
                childHtmlStr += "<td style='text-align: left; padding-left:1%;'>";
                childHtmlStr += "<span name='entityNormalVal' style='font-size:1.2em;'>" + childList[i].CHILDREN_NAME + "</span> ";
                childHtmlStr += "</td>";
                childHtmlStr += "<td style='text-align: left; padding-left:2%;'>";
                childHtmlStr += makeListTypeSynonyms(childList[i].SUB_LIST, "LIST_TYPE");
                childHtmlStr += "</td>";
                childHtmlStr += "<td style='text-align: right; padding-right:1.5%;'>";
                childHtmlStr += "<input type='hidden' name='childHiddenName' value='" + childList[i].CHILDREN_NAME + "' />";
                childHtmlStr += "<input type='hidden' name='childHiddenId' value='" + childList[i].CHILDREN_ID + "' />";
                childHtmlStr += "<a href='#' name='delchildBtn' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                childHtmlStr += "</td>";
                childHtmlStr += "</tr>";
            }
            
            $('#listEntityTblBody').html(childHtmlStr);
            break;
        default:
            break;
    }
}


function makeListTypeSynonyms(subList, type) {
    
    var htmlStr = "";
    if (type == "LIST_TYPE") {
        if (subList.split() != '') {
            var splittedChildList = subList.split(",");

            for (var i=0; i<splittedChildList.length; i++) {
                htmlStr += "<a href='javascript:' name='subList' class='btn b07' ><b>" + splittedChildList[i] + "</b><span></span></a>";
            }
        }
    }
    else
    {
        htmlStr += "<a href='javascript:' name='subList' class='btn b07' ><b>" + subList + "</b><span></span></a>";
        htmlStr += "<input type='text' name='editSynonymsVal' class='listTypeStyle' style='width : 15%;' spellcheck='false' value='' placeholder='입력하세요..' />";
    }   

    return htmlStr;
}

function makeChildOptionHtml(name) {
    var htmlStr = "";
    if (typeof name == "undefined") {
        htmlStr = "<option value='NONE'>선택하세요</option>";
    }   

    for (var i=0; i<childCompositeList.length; i++) {
        if (childCompositeList[i] == name) {
            htmlStr += "<option value='" + childCompositeList[i] + "' selected>" + childCompositeList[i] + "</option>";
        }
        else 
        {
            var isDuple = false;
            $('select[name=childCompositeSel]').each(function(){
                if ($(this).val() == childCompositeList[i]) {
                    isDuple = true;
                    return false;
                }
            });
            if (!isDuple) {
                htmlStr += '<option value="' + childCompositeList[i] + '">' + childCompositeList[i] + '</option>';
            }
        }
    }
    return htmlStr;
}

function addChildEntityRow() {

    var entityType = $('#hiddenEntityType').val();
    
    var childHtmlStr = "";
    switch(entityType) {
        case '3':
            childHtmlStr += "<tr><td style='text-align: left; padding-left:1%;'>";
            childHtmlStr += "<input type='text' name='childName' class='form-control' style='width:80%; margin: 0 0 0.5% 0; display: inline;' value='' />";
            //childHtmlStr += "<input type='hidden' name='childHiddenName' value='' />";
            //childHtmlStr += "<input type='hidden' name='childHiddenId' value='' />";
            childHtmlStr += "<a href='#' name='delchildBtn' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
            childHtmlStr += "</td></tr>";
            $('#hierarchyEntityTblBody').append(childHtmlStr);
            if ($('input[name=childName]').length >= 10) {
                $('#addchildBtn').hide();
            }
            break;
        case '4':
            childHtmlStr += "<tr><td style='text-align: left; padding-left:1%;'>";
            childHtmlStr += "<select name='childCompositeSel' class='form-control' style='width:80%; margin: 0 0 0.5% 0; display: inline;' >";
            childHtmlStr += makeChildOptionHtml();
            childHtmlStr += "</select>";
            //childHtmlStr += "<input type='hidden' name='childHiddenName' value='' />";
            //childHtmlStr += "<input type='hidden' name='childHiddenId' value='' />";
            childHtmlStr += "<a href='#' name='delchildBtn' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
            childHtmlStr += "</td></tr>";
            $('#compositeEntityTblBody').append(childHtmlStr);
            if ($('select[name=childCompositeSel]').length >= 10) {
                $('#addchildBtn').hide();
            }
            break;
        default:
            break;
    }
}

//composite child list 조회
function getChildCompositeList() {
    $.ajax({
        type: 'POST',
        url: '/luis/selectChildCompositeList',
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
            else if (data.success) 
            {
                childCompositeList = data.childCompositeList;
            }
        }
    });
}

//엔티티 삭제
function deleteEntity(entityHiddenName, hId, hType) {
    var params = {
        'deleteEntityName' : entityHiddenName,
        'deleteEntityId' : hId,
        'deleteEntityType' : hType
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
        url: '/luis/deleteEntity',
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
                //location.href = "/luis/entityList";
            }
            else {
                $('#alertMsg').text(data.message);
                $('#alertBtnModal').modal('show');
                //alert(data.message);
            }
        }
    });
}

//change entity name input form
function editEntityName() {
    var entityName = $('#entityNameTitle').text();
    var inputHtml = "<input type='text' id='editEntityName' style='width : 40%;' name='editEntityName' spellcheck='false' value='' />";
    $('#entityNameTitle').html(inputHtml);
    $('#editEntityName').focus();
    $('#editEntityName').val(entityName);
    //$('#hiddenEntityName').val(entityName);
    
}

function chkDupleListEntity(inputVal) {
    var chkDuple = false;
    $('span[name=entityNormalVal]').each(function() {
        if (inputVal == $(this).text().trim()) {
            chkDuple = true;
            return false;
        }
    });
    if (chkDuple) {
        $('#alertMsg').text("같은 이름의 엔티티가 존재합니다.");
        $('#alertBtnModal').modal('show');
        //alert ("같은 이름의 엔티티가 존재합니다.");
        return false;
    } else {
        if ($('input[name=editNormalVal]').length>0) {
            if ($('input[name=editNormalVal]').val().trim() == '') {
                $('#alertMsg').text("공백을 입력할 수 없습니다.");
                $('#alertBtnModal').modal('show');
                //alert('공백을 입력할 수 없습니다.')
                return false;
            }
        }
        return true;
    }
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
            location.href = "/luis/entityList"
        }
    }
});
