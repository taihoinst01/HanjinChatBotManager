



/*
$('html').click(function(e) { 
    if ($('.appLayout').css('display') == 'block') {

        if(!$(e.target).hasClass("appLayout")) {
            //alert('영역 밖입니다.'); 
            $('.appLayout').css('display', 'none');
        }
    }
}); 
*/


$(document).ready(function(){

    /*
    $(".js-modal-close").click(function() {
        $('html').css({'overflow': 'auto', 'height': '100%'}); //scroll hidden 해제
        //$('#element').off('scroll touchmove mousewheel'); // 터치무브 및 마우스휠 스크롤 가능
        $('#deleteAppId').val('');
        $('#currentAppName').val('');
        $('#layoutBackground').hide();
    });
    */

    $('.box-body.tc').click(function() { 

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


        var appName = $(this).find('span').text().trim();
        location.href = "/board?appName=" + appName;

    });

    /*
    $(document).mousedown(function(e){

        $('.appLayout').each(function(){

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
                    $('#deleteAppId').val('');
                    $('#currentAppName').val('');
                }
            }
        });
    }); 
    */
})

/*
function openModalBox(target){
    if(target === '#rename_chatbot'){
        $('#lay').css('display','none');
        $('#reName').val($('#currentAppName').val());
    }
    // 화면의 높이와 너비를 변수로 만듭니다.
    var maskHeight = $(document).height();
    var maskWidth = $(window).width();

    // 마스크의 높이와 너비를 화면의 높이와 너비 변수로 설정합니다.
    $('.mask').css({'width':maskWidth,'height':maskHeight});


    // 레이어 팝업을 가운데로 띄우기 위해 화면의 높이와 너비의 가운데 값과 스크롤 값을 더하여 변수로 만듭니다.
    var left = ( $(window).scrollLeft() + ( $(window).width() - $('#new_chatbot').width()) / 2 );
    var top = ( $(window).scrollTop() + ( $(window).height() - $('#new_chatbot').height()) / 2 );

    // css 스타일을 변경합니다.
    $(target).css({'left':left,'top':top, 'position':'absolute'});

    // 레이어 팝업을 띄웁니다.
    $(target).show();

    $('html, body').css({'overflow': 'hidden', 'height': '100%'});
        $('#element').on('scroll touchmove mousewheel', function(event) { // 터치무브와 마우스휠 스크롤 방지
            event.preventDefault();
            event.stopPropagation();
            return false;
    });
    wrapWindowByMask();
}

function wrapWindowByMask(){ //화면의 높이와 너비를 구한다. 
    var maskHeight = $(document).height(); 
    var maskWidth = $(window).width(); //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채운다. 
    $('#layoutBackground').css({'width':maskWidth,'height':maskHeight}); //마스크의 투명도 처리 
    $('#layoutBackground').fadeTo("fast",0.7); 
} 

//click위치 return, 사용안함.dyyoo
function abspos(e, object){
    this.x = e.clientX + (document.documentElement.scrollLeft?document.documentElement.scrollLeft:document.body.scrollLeft);
    this.y = e.clientY + (document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop);
    return this;
}
//end


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
  
function itemClick(e, object, deleteAppId, appName){
    //var ex_obj = $('.appLayout');
    $('#deleteAppId').val(deleteAppId);

    var ex_obj = document.getElementById('lay');
    if(!e) e = window.Event;
    pos = GetAbsPosition(object);//abspos(e, object);
    //x위치 수정해서 위치조정
    ex_obj.style.left = (pos.x-145)+"px";
    ex_obj.style.top = (pos.y+20)+"px";

    if ($('.appLayout').css('display') == 'none') {
        $('.appLayout').show();
        $('#deleteAppId').val(deleteAppId);
        $('#currentAppName').val(appName);
    }
    //ex_obj.style.display = ex_obj.style.display=='none'?'block':'none';
}

*/