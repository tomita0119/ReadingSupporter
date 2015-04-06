$('body').prepend('<div id="ReadingSupporter_Message"><center>ブックマークしました</center></div>');

// メッセージを受け取ったらメッセージボックスを表示(数秒だけ見せて隠す)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.greeting == 'display_message'){
        console.log('display message');
        $('#BookMarker_Message')
            .css({
                'left': $(window).width()-250 + 'px'
            })
            .animate({
                'top': $(window).scrollTop()+40 + 'px'
            }, 1000)
            .delay(2000)
            .fadeOut('slow');
    }
});