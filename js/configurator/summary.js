var optionDetailSelector = '.option_details';
var optionDetailModalWidget = app.create('modal', {
  id : 'config-container',
  contentType : 'html',
  freeze: false,
  selector : optionDetailSelector,
  width : 760,
  height: 238
});
app.start(optionDetailModalWidget);
app.subscribe(
  '/modal/contentInjected',
  function(selector){
    if(selector === optionDetailSelector){
      $('#simplemodal-container').css({height:'auto'});
      global.disclaimerPopovers();
    }
});

var summary = ({

  init: function(){
    $("ul.tabs").tabs("div.tab_panes > div");

    global.initValidation($("#contactDealer"),global.leadDealerContactForm);
    var subscribeDealerSubmit = app.subscribe('/dealer/lead/submit', function(data){
      $('.summary_title').hide();
      $('.summary_subtitle').hide();
      $('.summary_form').html(data);
      $('.contact-info').text('');
      NCVOmniTracking.Page.summaryThankYou(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent4(sessionBuildConfigs.modelTaggingTitle, configurator.currentVehicle.trim, configurator.currentVehicle.roof);
    });

    app.subscribe('/form/submit/error', function(errors){
      NCVOmniTracking.Page.summaryError(configurator.currentVehicle.model, configurator.currentVehicle.trim, errors, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
    });

    var subscribeDealerSet = app.subscribe('/dealer/set', function() {
      // TODO: redraw dealer form instead of page reload
      location.reload();
    });
    // Dealer Search Tagging
    app.subscribe('/dealer/search/results/nodealer', function(){
      NCVOmniTracking.Page.zipCodeResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
    });
    app.subscribe('/dealer/search/error', function(){
      NCVOmniTracking.Page.zipCodeError(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
    });
    app.subscribe('/dealer/search/change', function(){
      NCVOmniTracking.Page.changeDealer(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
    });
    app.subscribe('/dealer/search/results/change', function(){
      NCVOmniTracking.Page.changeDealerResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
    });

    global.bindPlaceholders();
    configurator.bindNavigation();
    configurator.dealerSetup();
  }

});

$(document).ready(function(){
  summary.init();
});
