var roof = ({
  selectedRoof: null,

  init: function(){

    var carousel = $("#cloud_carousel").CloudCarousel( {
      minScale:0.7,
      buttonLeft: $('#roof-standard'),
      buttonRight: $('#roof-high'),
      yRadius:5,
      xRadius:200,
      xPos: 500,
      yPos: 120,
      speed:0.05,
      mouseWheel:false
    });

    roof.bindRoofSelect();

    roof.selectedRoof = $('.select-roof.selected');

    if(roof.selectedRoof.size() > 0){
      jQuery('.next').removeClass("disabled");
    }

    global.disableLinks('.next');

    if(roof.selectedRoof.attr('id') == "roof-high"){
      carousel.data('cloudcarousel').rotate(1);
    }
    jQuery('.vehicle-carousel-container').show();
    jQuery('.vehicle-carousel').css({'visibility':'visible'});
  },

  bindRoofSelect: function(){
    $(".select-roof").overlay({
        mask: global.mask_settings,
        closeOnClick:false,
        oneInstance:false,
        onBeforeLoad:function(){
          if(previousScratchSave == ""){
            var button = this.getTrigger();
            roof.setRoofSelection(button);
            return false;
          }
        },
        onClose:function(e){
          // Work around since e.srcElement is undefined in Firefox
          var srcE = e.srcElement == undefined ? e.originalEvent.originalTarget.id : $(e.srcElement).attr("id") ;
          if(srcE == "decline_roof"){
            roof.rotateVans();
            configurator.confirmed = false;
          } else {
            var button = this.getTrigger();
            configurator.confirmed = true;
            roof.setRoofSelection(button);
            previousScratchSave = "";
          }
        }
    });

  },

  setRoofSelection: function(button){
    roof.updateButton(button);
    $.get(button.attr("href"),function(data){
      $('.next').removeClass("disabled");
      roof.selectedRoof = $('.select-roof.selected');
      roof.rotateVans();
    });
  },

  updateButton: function(button){
    $('.select-roof').removeClass("selected").text("Select Roof");
    $(button).addClass("selected").text("Selected");
  },

  rotateVans:  function() {
    if(roof.selectedRoof.attr("id") == "roof-high"){
      $("#cloud_carousel").data('cloudcarousel').rotate(1);
    } else {
      $("#cloud_carousel").data('cloudcarousel').rotate(0);
    }
  }

});

jQuery(document).ready(function() {
  roof.init();
});