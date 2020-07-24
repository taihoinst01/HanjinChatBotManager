

$(window).load(function () {
    $('.settingBtn').each(function () {
        if ( $(this).text() === $('#selLeftMenu').val()) {
            $(this).addClass('now');
        } else {
            $(this).removeClass('now');
        }
    });

});




