

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

$(document).ready(function() {
    makeEntityTable();

    //검색 버튼 클릭
    $('#searchBtn').click(function(){
        $('#searchStr').val($('#searchEntityText').val().trim());
        $('#currentPage').val(1);
        makeEntityTable();
    });

    //type selbox
    $('#entityTypeSelBox').change(function(){
        $('#currentPage').val(1);
        makeEntityTable();
    });

    //생성 모달 
    $('#createEntityBtn').click(function(){
        //modal초기화
        $('#entityName').val('');
        $('#createEntityType').val('NONE').trigger('change');
        //$('#modalBodyMain').find('.form-group.entityChildDiv').remove();

        $('#createEntityHiddenBtn').trigger('click');
    });

    //생성 타입 selbox 선택 감지
    $('#createEntityType').change(function(){
        $('#modalBodyMain').find('.form-group.entityChildDiv').remove();
        if ($('#createEntityType').val() == "3" || $('#createEntityType').val() == "4") {
            $('#addEntityValBtn').show();
            $('#addEntityValBtn').attr('disabled', false);
        }
        else 
        {
            $('#addEntityValBtn').hide();
            $('#addEntityValBtn').attr('disabled', true);
        }
    });

    $('#entityTypeFilter').change(function() {
        makeEntityTable();
    });

    //hierarchy, composite 생성->child entity 추가 버튼
    $('#addEntityValBtn').click(function(){

        if ($('input[name=entityValue]').length == 0 && $('select[name=childCompositeSel]').length == 0) {
            $('#modalBodyMain').append('<div class="form-group entityChildDiv" id="childEntityDiv"></div>');
        }

        if ($('input[name=entityValue]').length >= 10 || $('select[name=childCompositeSel]').length >= 10) {
            alert("Child Entity는 10개 이상 생성할 수 없습니다.");
        } else {
            if ($('#createEntityType').val() == "3") {
                $('#childEntityDiv').append('<input name="entityValue" id="entityValue" type="text" tabindex="2" class="form-control" style=" float: left; width:90%; margin:0 0 3px 5%;" >');
            } else {
                var selStr = '<select id="childCompositeSel" name="childCompositeSel" tabindex="2" class="form-control" style=" float: left; width:90%; margin:0 0 3px 5%;" >';
                selStr += '<option value="NONE">선택하세요</option>';
                for (var i=0; i<childCompositeList.length; i++) {
                    var isDuple = false;
                    $('select[name=childCompositeSel]').each(function(){
                        if ($(this).val() == childCompositeList[i]) {
                            isDuple = true;
                            return false;
                        }
                    });
                    if (!isDuple) {
                        selStr += '<option value="' + childCompositeList[i] + '">' + childCompositeList[i] + '</option>';
                    }
                }
                selStr += '</select>';
                $('#childEntityDiv').append(selStr);
            }
        }
    });
});

//alert 메세지 초기화
$(document).on("click", "#alertCloseBtn", function () {
    $('#alertMsg').text('');
    if ($('#chkAfterAlert').val() != 'NONE') {
        location.reload();
    }
});

//modal esc 종료
$(document).keyup(function(e) {
    if ($('#create_entity').css('display') == 'block') {
        if (e.which == 27) {
            $('.addEntityModalClose').trigger('click');
        }
    }
});

//entity 삭제 버튼
$(document).on("click", "a[name=delEntityBtn]", function(e){
    var entityHiddenName = $(this).parent().find('#entityHiddenName').val();
    
    var hId = $(this).parent().find('#entityHiddenId').val();
    var hType = $(this).parent().find('#entityHiddenType').val();
    $('#hId').val(hId);
    $('#hType').val(hType);
    $('#confirmTitle').text('엔티티 삭제');
    $('#confirmMsg').text("["+ entityHiddenName + "] 삭제하시겠습니까?");
    $('#confirmBtnModal').modal('show');
    /*
    if (confirm("["+ entityHiddenName + "] 삭제하시겠습니까?")) {
        deleteEntity(entityHiddenName, hId, hType);
    }
    */
});


$(document).on("click", "#confirmBtn", function () {
    var hId = $('#hId').val();
    var hType = $('#hType').val();
    var entityHiddenName = $(this).parents('td').find('#entityHiddenName').val();
    $('#confirmTitle').text('');
    $('#confirmMsg').text("");
    $(this).prev().trigger('click');
    deleteEntity(entityHiddenName, hId, hType);
});



//entity 상세페이지 이동
$(document).on("click", "a[name=selEntity]", function(e){
    var entityHiddenName = $(this).parents('tr').find('#entityHiddenName').val();

    var hId = $(this).parents('tr').find('#entityHiddenId').val();
    var hType = $(this).parents('tr').find('#entityHiddenType').val();
    detailEntity(entityHiddenName, hId, hType);
    
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

    /*
    $(this).find('option').each(function(){
        if (selVal == $(this).val()) {
            $(this).remove();
            return false;
        }
    });
    */
    
});

//검색 input 엔터 감지
$(document).on("keypress", "#searchEntityText", function(e){
    if (e.keyCode === 13) {	//	Enter Key
        if ($('#searchEntityText').val().trim() == '' ) {
            if ($('#searchStr').val() != '') {
                $('#searchBtn').trigger('click');
            }
        } else {
            $('#searchBtn').trigger('click');
        }
    }
});

//페이징 클릭
$(document).on('click','.li_paging',function(e){
    if(!$(this).hasClass('active')){
        $('#currentPage').val($(this).val());
        makeEntityTable();
    }
});


//엔티티 리스트 출력
function makeEntityTable() {
    var params = {
        'searchEntity' : $('#searchStr').val(),
        'entityType' : $('#entityTypeSelBox').val(),
        'selPage' : $('#currentPage').val(),
        'entityFilter' : $('#entityTypeFilter').val()
    };
    
    $.ajax({
        type: 'POST',
        data: params,
        url: '/luis/selectEntityList',
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
            $('#entityListBody').html('');
            $('#pagination').html('');
            var entityBodyHtml = '';
            if (data.error) {
                $('#alertMsg').text('예상치 못한 오류가 발생했습니다. 관리자에게 문의해주세요.');
                $('#alertBtnModal').modal('show');
            } else {
                if(data.entityList.length > 0){
                    for(var i = 0; i < data.entityList.length; i++){
                        entityBodyHtml += "<tr>";
                        entityBodyHtml += "<td style='text-align: left; padding-left:1%;'><a href='#' name='selEntity' onclick='return false;' >" + data.entityList[i].ENTITY_NAME + "</a></td>";
                        entityBodyHtml += "<td style='text-align: left; padding-left:0.5%;'>" + getEntityType(data.entityList[i].ENTITY_TYPE) + "</td>";
                        entityBodyHtml += "<td style='text-align: right; padding-right:1.5%;'>";
                        entityBodyHtml += "<input type='hidden' id='entityHiddenName' name='entityHiddenName' value='" + data.entityList[i].ENTITY_NAME + "' />";
                        entityBodyHtml += "<input type='hidden' id='entityHiddenId' name='entityHiddenId' value='" + data.entityList[i].ENTITY_ID + "' />";
                        entityBodyHtml += "<input type='hidden' id='entityHiddenType' name='entityHiddenType' value='" + data.entityList[i].ENTITY_TYPE + "' />";
                        entityBodyHtml += "<a href='#' id='delEntityBtn' name='delEntityBtn' onclick='return false;' style='display:inline-block; margin:7px 0 0 7px; '><span class='fa fa-trash' style='font-size: 25px;'></span></a>";
                        entityBodyHtml += "</td>";
                        entityBodyHtml += "</tr>";
                    }
                    //<td><a href="#" name="delEntityRow" style="display:inline-block; margin:7px 0 0 7px; "><span class="fa fa-trash" style="font-size: 25px;"></span></a></td>
                    $('#entityListBody').html(entityBodyHtml);
                    $('#pagination').html('').append(data.pageList);
                }
            }
        }
    });
}


//엔티티 생성 
function createEntity() {
    if ($('#entityName').val().trim() == '') 
    {
        $('#alertMsg').text('Entity를 입력해야 합니다.');
        $('#alertBtnModal').modal('show');
        //alert("Entity를 입력해야 합니다.");
    } 
    else if ($('#createEntityType').val() == 'NONE') 
    {
        $('#alertMsg').text('Entity type을 선택해야 합니다.');
        $('#alertBtnModal').modal('show');
        //alert("Entity type을 선택해야 합니다.");
    }
    else 
    {
        var isChildEntityBlank = false;
        var isChildEntityOk = false;
        var entityArrayList = [];
        if ($('#entityValue').length>0) {
            $('input[name=entityValue]').each(function(index1, object1){
                if ($(this).val().trim() == '') {
                    isChildEntityBlank = true;
                    return false;
                }
                var tmpEntity = $(this).val().trim();
                $('input[name=entityValue]').each(function(index2, object2){
                    if (tmpEntity == $(this).val().trim() && index1 != index2) {
                        isChildEntityOk = true;
                        return false;
                    }
                });
                if (isChildEntityOk) {
                    return false;
                } else {
                    entityArrayList.push(tmpEntity);
                }
            });
        }
        else if ($('select[name=childCompositeSel]').length>0) {
            $('input[name=entityValue]').each(function(index1, object1){
                var tmpEntity = $(this).val().trim();
                entityArrayList.push(tmpEntity);
            });
        }

        if (isChildEntityBlank) {
            $('#alertMsg').text('공백은 등록할 수 없습니다.');
            $('#alertBtnModal').modal('show');
            //lert("공백은 등록할 수 없습니다.");
        } 
        else if (isChildEntityOk) {
            $('#alertMsg').text('중복된 자식 엔티티가 존재합니다.');
            $('#alertBtnModal').modal('show');
            //alert("중복된 자식 엔티티가 존재합니다.");
        } 
        else 
        {
            var params;
            if (entityArrayList.length>0) {

                params = {
                    'entityName' : $('#entityName').val(),
                    'entityType' : $('#createEntityType').val(),
                    'childEntityList' : entityArrayList
                };
            }
            else
            {

                params = {
                    'entityName' : $('#entityName').val(),
                    'entityType' : $('#createEntityType').val()
                };
            }
            
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
                url: '/luis/createEntity',
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
                        if (data.existEntity) {
                            $('#alertMsg').text("[" + data.existEntity + "] 같은 이름의 자식 엔티티가 존재합니다.");
                            $('#alertBtnModal').modal('show');
                            //alert("[" + data.existEntity + "] 같은 이름의 자식 엔티티가 존재합니다.");
                        } else {
                            $('#alertMsg').text("[" + data.existApp + "] 앱에 같은 이름의 엔티티가 존재합니다.");
                            $('#alertBtnModal').modal('show');
                            //alert("[" + data.existApp + "] 앱에 같은 이름의 엔티티가 존재합니다.");
                        }
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
                        //location.reload();
                    }
                    else 
                    {
                        $('#alertMsg').text('생성되었습니다');
                        $('#alertBtnModal').modal('show');
                        $('#chkAfterAlert').val('EXIST');
                        //alert('생성되었습니다.');
                    }
                }
            });
        }
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
                $('#chkAfterAlert').val('EXIST');
                $('#alertBtnModal').modal('show');
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

//엔티티 상세페이지
function detailEntity(entityHiddenName, hId, hType) {
    location.href = "/luis/entityDetail?entityName=" + entityHiddenName + "&entityId=" + hId + "&entityType=" + hType; 
}

//entity type 추출
function getEntityType(typeVal) {
    var returnVal = '';
    switch(typeVal) {
        case '1':
            returnVal = 'Simple';
            break;
        case '2':
            returnVal = 'Prebuilt';
            break;
        case '3':
            returnVal = 'Hierarchical';
            break;
        case '4':
            returnVal = 'Composite';
            break;
        case '5':
            returnVal = 'Closed List';
            break;
        default:
            returnVal = 'None';
            break;
    }
    return returnVal;
}
