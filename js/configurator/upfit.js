// upfit.js
var upfit = ({

  init: function(){
    visualizer.swfPath = swfPath;

    configurator.dealerSetup();

    if(autoOpen){
      setTimeout(function(){$(".launch-upfit").trigger("click");},500);
    }

    // Dealer Search Tagging
    app.subscribe('/dealer/search/results/nodealer', function(){
      NCVOmniTracking.Page.zipCodeResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent9(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof);
    });
    app.subscribe('/dealer/search/error', function(){
      NCVOmniTracking.Page.zipCodeError(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent10(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof);
    });
    app.subscribe('/dealer/search/change', function(){
      NCVOmniTracking.Page.changeDealer(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent11(configurator.currentVehicle.model);
    });
    app.subscribe('/dealer/search/results/change', function(){
      NCVOmniTracking.Page.changeDealerResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent12(configurator.currentVehicle.model);
    });
  }

});

$(document).ready(function(){
  upfit.init();
});
