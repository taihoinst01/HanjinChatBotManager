$(document).ready(function () {
    $('.sideMainMenu').click(function(){
        if($(this).children().hasClass('sortarr_down')) {

            $(this).children().removeClass('sortarr_down');
            $(this).children().addClass('sortarr_up');
        } else {

            $(this).children().removeClass('sortarr_up');
            $(this).children().addClass('sortarr_down');
        }
        $(this).parent().parent().next().toggleClass('subMenu');
    });
})