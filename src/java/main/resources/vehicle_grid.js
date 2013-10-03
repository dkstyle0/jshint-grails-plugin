/***************************
    js for filter page NCV shopping tools
***************************/

var filter = (function($){
    return {
        actionName: null,
        imgScaleViews: ['index'],

        init: function(){

            initImageScaling();

            /* unused? - Adam
            $(".disclaimer_title").click(function(){
                $(".disclaimer_copy").slideToggle();
            });
            */
        }

    };

    /**************
        Private methods
    ***************/

    function initImageScaling(){
        if( $.inArray(filter.actionName, filter.imgScaleViews) >= 0 ){

        var $gridItems = $("ul.vehicle_grid>li");
            var gridCount = $gridItems.length;
            var remainder = gridCount % gridSize;

            if(remainder == 0){remainder=gridSize;}
            $gridItems.slice(-remainder).addClass('row-bottom');

                    if ($('.ie8').length) {
                  $gridItems.filter(':nth-child('+gridSize+'n)').addClass('row-end');
            }


            $("ul.vehicle_grid li").hover(
                function() {

                    var li = $(this);
                    filter.executed = false;

                    li.find('.vehicle-details').stop().delay(200).fadeIn('medium');
                    li.find('.showcase').stop().effect( "size", {
                      to: { width: 286, height: 454 },
                      origin: [ "center", "center" ],
                      scale: 'content'
                    }, function(){
                      $(this).css({'margin-left':'-147px'});
                    }, 50, 'linear' );

                    // Old method
                    //li.addClass("showcase");
                    //li.find('.vehicle-info').animate({top: '-8px',left: '-23px',paddingTop:'8px',width:'286px',height:'422px'},200);
                    //li.addClass("showcase");

                }, function() {

                    var li = $(this);
                    li.find('.showcase, .vehicle-details').stop().removeAttr('style').hide();

                    // Unused? - Adam
                    //var hud_id = 'disclaimer_' + li.find('.disclaim').attr('rel');
                    //if(hud_id !== undefined){
                      //hud_id.toLowerCase().replace(/\s.*/,'');
                    //}

                    // Old Method
                    //var fadeout_speed = 200;
                    //var height = li.height();
                    //var width = li.width();
                    //li.removeClass("showcase");
                    //li.find('.vehicle-details').hide();
                    //li.removeClass("showcase").find('.vehicle-info').animate({top:'0',left:'0',paddingTop:'0',width:width+'px',height: height+'px'},fadeout_speed);
            });
        }
    }

})(jQuery);

$(document).ready(function(){
  if (window['actionName'] != undefined) {
    filter.actionName = actionName;
  }
  filter.init();
});