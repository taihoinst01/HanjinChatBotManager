$(document).ready(function () {

    $('#selectLang').change(function() {
        location.href="/index/lang"
    });


    $('.ajaxsend').click(function(){
        // content-type을 설정하고 데이터 송신
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-type', "application/json");

        // 데이터 수신이 완료되면 표시
        xhr.addEventListener('load', function(){
            console.log(xhr.responseText);
            // 문자열 형식으로 변환
            var result = JSON.parse(xhr.responseText);
            // 데이터가 없으면 return 반환
            if(result.result !== 'ok') return;
            // 데이터가 있으면 결과값 표시
            document.querySelector(".serult").innerHTML = result.email;
        });
    });

    $(document).mousedown(function(e){
        $('.userappLayout').each(function(){
            if( $(this).css('display') == 'block' )
            {
                var l_position = $(this).offset();
                l_position.right = parseInt(l_position.left) + ($(this).innerWidth());//($(this).width() + $(this).css('padding'));
                l_position.bottom = parseInt(l_position.top) + parseInt($(this).height());
    
    
                if( ( l_position.left <= e.pageX && e.pageX <= l_position.right )
                    && ( l_position.top <= e.pageY && e.pageY <= l_position.bottom ) )
                {
                    //alert( 'popup in click' );
                }
                else
                {
                    //alert( 'popup out click' );
                    $(this).hide();
                }
            }
        });
    });

});

function GetAbsPosition(object) {
    var position = new Object;
    position.x = 0;
    position.y = 0;
    
    //location return
    if( object ) {
        position.x = object.offsetLeft;
        position.y = object.offsetTop;
        
        if( object.offsetParent ) {
            var parentpos = GetAbsPosition(object.offsetParent);
            position.x += parentpos.x;
            position.y += parentpos.y;
        }
    }
    
    //size return
    position.cx = object.offsetWidth;
    position.cy = object.offsetHeight;
    
    return position;
}
  
function userLayoutPop(e, object){
    //var ex_obj = $('.appLayout');
    var ex_obj = document.getElementById('userlay');
    if(!e) e = window.Event;
    pos = GetAbsPosition(object);//abspos(e, object);
    //x위치 수정해서 위치조정
    ex_obj.style.left = (pos.x-145)+"px";
    ex_obj.style.top = (pos.y+40)+"px";

    if ($('.userappLayout').css('display') == 'none') {
        $('.userappLayout').show();
    }
    //ex_obj.style.display = ex_obj.style.display=='none'?'block':'none';
}





