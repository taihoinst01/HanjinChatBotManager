var language;
(function($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function(data) {
            language= data.lang;
            recommendAjax();
        }
    });
})(jQuery);

$(document).ready(function () {

    $('.btn_delete').attr("disabled","disabled").css('background','url(../images/btn_delete_dis.png)')
    $('.span_delete').css('color','#465361c4');

    $('div[type=checkbox]').click(function(e) {
        checkBoxHandler(e);
    });

    $('#recommendPeriod').change(function(e){
        $('#currentPage').val('1');
        recommendAjax();
    });
})

function recommendAjax(){
 
    params = {
        'selectType' : $('#recommendPeriod').find('option:selected').val(),
        'currentPage' : ($('#currentPage').val()== '')? 1 : $('#currentPage').val(),
        'searchRecommendText' : $('input[name=searchRecommendText]').val()
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/learning/recommend',
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
            $('#recommendContents').html('');
            var item = '';

            if(data.list.length > 0){
                for(var i = 0; i < data.list.length; i++){
                    item += '<tr>' +
                            '<td><input type="checkbox" class="flat-red" name="tableCheckBox"><input type="hidden" class="seq" value="'+data.list[i].SEQ+'"></td>' +
                            '<td class="txt_left">' +

                            '<a href="/learning/utterances?utterance='+data.list[i].QUERY + 
                                    '" class="dashLink" style="font-size:14px">';
                    var query = data.list[i].QUERY;
                    var entities = data.list[i].ENTITIES.split(',');
                    if(entities.length > 0){
                        for(var j = 0; j < entities.length; j++){
                            query = query.split(entities[j]).join('<span class="highlight">'+entities[j]+'</span>');
                        }
                    }
                    item += query;
                    item += '</a>' +
                            '</td>' +
                            '<td>' +
                            data.list[i].UPD_DT +
                            '</td>' +
                            '</tr>';
                }
                
                $('#recommendContents').append(item);
            
                $('.pagination').html('').append(data.pageList)

                $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
                    checkboxClass: 'icheckbox_flat-green',
                    radioClass   : 'iradio_flat-green'
                })
                    
                $('input[name=tableAllChk]').on('ifChecked', function(event) {
                    $('input[name=tableCheckBox]').parent().iCheck('check');
                        
                }).on('ifUnchecked', function() {
                        $('input[name=tableCheckBox]').parent().iCheck('uncheck');
                    });

                
    
                $('input[name=tableAllChk]').parent().iCheck('uncheck');
            } else {       

                item += '<tr>' +
                            '<td colspan="3">' + language.NO_DATA + '</td>' +
                        '</tr>';
                $('#recommendContents').append(item);
                
            }
            
            

            

            
        }
    });
}

//html append시 이벤트 핸들러 달아주기
$(document).on('click','div[type=checkbox]',function(e){
    var checkedVal = false;
    if (typeof $(this).attr("checked") == 'undefined') {
        $(this).attr("checked", "");
    } else {
        $(this).removeAttr('checked');
    }
    checkBoxHandler(e);
});

$(document).on('click','.li_paging',function(e){
 
    if(!$(this).hasClass('active')){
        $('#currentPage').val($(this).val());
        recommendAjax();
    }
});

//체크박스 click 이벤트 핸들러
function checkBoxHandler(e){

    var isAll = $(e.target).children('#recommendAll').length;
    var isChecked = $(e.target).attr('checked');

    if(isAll == 1 && isChecked == 'checked'){
        $('div[type=checkbox]').each(function(index,item){
            if(index > 0 && $(item).attr('checked') != 'checked'){
                $(item).click();
            }
        });
    }else if(isAll == 1 && isChecked != 'checked'){
        $('div[type=checkbox]').each(function(index,item){
            if($(item).attr('checked') == 'checked'){
                $(item).click();
            }
        });
    }
    var checkCount = $('div[type=checkbox][checked]').length;
    if(checkCount > 0){
        $('.btn_delete').removeAttr("disabled").css('background','url(../images/btn_delete.png)')
        $('.span_delete').css('color','#2873ca');
    }else{
        $('.btn_delete').attr("disabled","disabled").css('background','url(../images/btn_delete_dis.png)')
        $('.span_delete').css('color','#465361c4');
    }
    
    if($('#recommendAll').parents('div[type=checkbox]').attr('checked') == 'checked' && checkCount == 1){
        $('#recommendAll').parents('div[type=checkbox]').click();
    }
}

//delete 버튼 클릭 이벤트
function deleteRecommend(){
    if ( confirm( language.ASK_DELETE)) {
        var arry = [];
        for(var i = 0; i < $('#recommendContents .checked').length; i++)
        {
            arry.push($('#recommendContents .checked + .seq')[i].value);
        }
        $.ajax({
                type: 'POST',
                data : {'seq' : arry+''},
                url : '/learning/deleteRecommend',
                isloading : true,
                success: function(data){
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
                    alert("삭제되었습니다.");
                    $('#currentPage').val(1)
                    recommendAjax();
                }
            });
    }
}

// 학습추천 검색
function recommendSearch() {

    var searchRecommendText = $('input[name=searchRecommendText]').val();

    if(!searchRecommendText) {
        alert("검색어를 입력해주시기 바랍니다.");
    } else {
        recommendAjax();
    }
}