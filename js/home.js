/*jshint noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true,
indent:2, maxerr:1000 */

/* global  Modernizr: false  */

// SLIDER
var sliderID = 'slide1';
var slideWidget = app.create('slide', {
  id : sliderID
});
app.start(slideWidget);
app.subscribe('/slider/bullets/created', function(){
  home.sliderPopovers();
});
app.subscribe('/slider/slide/end', function(slider){ 
  var index = slider.data('slide');
  home.showCTA(index);
  home.firePFATag(index);
});

// VIDEO MODAL
var videoSelector = '.modal-video';
var videoModalWidget = app.create('modal', { 
  animate: false,
  contentType : 'html',
  selector : videoSelector,
  freeze : false,
  overlayClose : true,
  height : 500,
  width : 840,
  closeClass : 'video-close-btn',
  containerId : 'video-modal-container'
});
app.start(videoModalWidget);

app.subscribe('/modal/contentInjected', function(selector){
  if(selector === videoSelector) {
    var slider = $(document.getElementById(sliderID));
    var num = slider.data('slide');
    
    var _container = '.ncv-video-player';
    var _name = $(_container).attr('id');
    var html5 = !global.supports_html5_video();
   
    // overrides for specific poster images
    $('.Keith_Kahn_poster video').attr('poster', '/images/features/video/full/Keith_Kahn_large.gif');
    $('.David_Kaminski_poster video').attr('poster', '/images/features/video/full/David_Kaminski_large.gif');
    $('.Walkaround_poster video').attr('poster', '/images/features/video/full/Walkaround_large.jpg');

    var videoPlayer = app.create('videoPlayer', {
      container: _container
    });
    app.start(videoPlayer);
    
    var subStart = app.subscribe('/video/player/duration/started', function(){crmEvent3(num,_name,true,false,false,false,false,html5);});
    var sub25 = app.subscribe('/video/player/duration/25', function(){crmEvent3(num,_name,false,true,false,false,false,html5);});
    var sub50 = app.subscribe('/video/player/duration/50', function(){crmEvent3(num,_name,false,false,true,false,false,html5);});
    var sub75 = app.subscribe('/video/player/duration/75', function(){crmEvent3(num,_name,false,false,false,true,false,html5);});
    var subEnd = app.subscribe('/video/player/duration/ended', function(){crmEvent3(num,_name,false,false,false,false,true,html5);});

    app.subscribe('/modal/closeModal', function() {
      app.stop(videoPlayer);
    });
  }
});

var home = (function($){

  return {  
    _firedTags: [],

    init: function() {
      home.promoHover();
    },
  
    showCTA: function(index) {
      var slide = $(document.getElementById(sliderID)).find('li')[index];
      $('.cta-container').removeClass("showCTA");
      $(slide).find('.cta-container').addClass("showCTA");
    }, 
  
    sliderPopovers: function(){
      if(!Modernizr.touch){
        $(".slide-handle").popover({
          trigger: 'hover',
          placement: 'top',
          delay: 300,
          content: function(){
            var index = parseInt($(this).text(), 10);
            var slide = $(document.getElementById(sliderID)).find('li')[index];
            var pop = $(slide).find('.slide-popover');
            return pop.clone();
          }
        });
      }
    },
  
    promoHover: function(){
      $('.promo-wrapper .promo-img_container').removeClass("none");
    
      $('.promo-wrapper .promo').hover(
        function(e){
          $(this).addClass("animate").removeClass("back");
        },
        function(e){
          var $this = $(this);
          $this.removeClass("animate");
          if(!global.testTransitionEndEvent()){
            setTimeout(function() { $this.addClass('back'); }, 500); // same duration that is specified in the CSS
          }
        }
      );
    
      $('.promo-wrapper').on("webkitTransitionEnd transitionend oTransitionEnd", '.promo', function(e){
        var $this = $(this);
        if(!$this.hasClass("animate")) {
          $this.addClass("back");
        }
      });
      
    },

    firePFATag: function(index) {
      var slide = $(document.getElementById(sliderID)).find('li')[index];
      var _currentFeatureTagInfo = $(slide).find("input[name='crmName']");

      if( $.inArray(_currentFeatureTagInfo.val(), home._firedTags) == -1 ) {
        crmEvent2(_currentFeatureTagInfo.val(), "HTML", _currentFeatureTagInfo.attr("id"));
        home._firedTags.push(_currentFeatureTagInfo.val());
      }
    }
  };

})(jQuery);

$(document).ready(function() {
  home.init();
});

// Don't fire the first PFA tag until after crmEvent1
window.onload = function() {
  home.firePFATag(0);
};
