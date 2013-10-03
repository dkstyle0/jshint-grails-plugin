//engine.js
var engine = ({
  selectedEngine:null,

  init: function(){

    $('.engine_selection .engine:not(:last)').addClass("border-right");

    engine.selectedEngine = $('.select-engine.selected');

    if(engine.selectedEngine.size() > 0){
      $('.next').removeClass("disabled");
    }

    configurator.disableLinks('.next');

    engine.bindEngineSelect();

    global.bindPlaceholders();
    configurator.bindNavigation();
    configurator.dealerSetup();

    // Dealer Search Tagging
    app.subscribe('/dealer/search/results/nodealer', function(){
      NCVOmniTracking.Page.zipCodeResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent2(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof);
    });
    app.subscribe('/dealer/search/error', function(){
      NCVOmniTracking.Page.zipCodeError(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent3(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof);
    });
    app.subscribe('/dealer/search/change', function(){
      NCVOmniTracking.Page.changeDealer(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent5(configurator.currentVehicle.model);
    });
    app.subscribe('/dealer/search/results/change', function(){
      NCVOmniTracking.Page.changeDealerResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent6(configurator.currentVehicle.model);
    });
  },

  bindEngineSelect: function(){
    $(".select-engine").overlay({
      mask: global.mask_settings,
      closeOnClick:false,
      oneInstance:false,
      onBeforeLoad:function(){
        if(previousScratchSave === ""){
          var button = this.getTrigger();
          configurator.confirmed = false;
          engine.setNCode(button);
          return false;
        }
      },
      onClose:function(e){
        if($(e.srcElement).attr("id") == "decline_engine"){
          configurator.confirmed = false;
        } else {
          var button = this.getTrigger();
          configurator.confirmed = true;
          engine.setNCode(button);
          previousScratchSave = "";
        }
      }
    });
  },

  setNCode: function(button){
    engine.updateButton(button);
    $('body').addClass("progress");
    $.get($(button).attr("href"),function(){
      $('.next').removeClass("disabled");
      $('.configs_nav .disabled .nav_link').unbind("click.navDisabled");
      $('.configs_nav .disabled').removeClass("disabled");
      $('body').removeClass("progress");
    });
  },

  updateButton: function(button){
    $('.select-engine').removeClass("selected").text("Select Engine");
    $(button).addClass("selected").text("Selected");
  }

});

$(document).ready(function(){
  engine.init();
});
