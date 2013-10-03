// Standard Features Modal
var featuresModalWidget = app.create('modal', {
  contentType : 'html',
  selector : '.standard_features, .package_options',
  height : 600,
  width : 800,
  freeze: false
});
app.start(featuresModalWidget);

app.subscribe('/modal/contentInjected', function(){
  $( "#accordion" ).accordion({autoHeight: false});
  global.disclaimerPopovers();
});

// trim.js
var trim = ({
  current_trim:null,

  init: function(){
    $('.trim_selection .trim:not(:last)').addClass("border-right");

    if($('.select-trim.selected').size() > 0){
      $('.next').removeClass("disabled");
      $('.configs_nav .trim.current').addClass("alt");
    }

    configurator.disableLinks('.next');

    trim.bindTrimSelect();

    global.bindPlaceholders();
    configurator.bindNavigation();
    configurator.dealerSetup();
    // TODO: Remove comments
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
      // crmEvent6(configurator.currentVehicle.model);
    });
    app.subscribe('/dealer/search/results/change', function(){
      NCVOmniTracking.Page.changeDealerResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent7(configurator.currentVehicle.model);
    });
  },

  bindTrimSelect: function(){
    $(".select-trim").overlay({
      mask: global.mask_settings,
      closeOnClick:false,
      oneInstance:false,
      onBeforeLoad:function(){
        if(previousScratchSave === ""){
          var button = this.getTrigger();
          configurator.confirmed = false;
          trim.setCurrentTrim(button);
          return false;
        }
      },
      onClose:function(e){
        // Work around since e.srcElement is undefined in Firefox
        var srcE = e.srcElement == undefined ? e.originalEvent.originalTarget.id : $(e.srcElement).attr("id") ;
        if(srcE == "decline_trim"){
          configurator.confirmed = false;
        } else {
          // The things we have to do for IE makes me sick
          var button = this.getTrigger();
          configurator.confirmed = true;
          trim.setCurrentTrim(button);
          previousScratchSave = "";
        }
      }
    });
  },

  setCurrentTrim: function(button){
    configurator.currentVehicle.trim = button.attr("title");
    $('body').addClass("progress");
    console.log("Button values " + $(button).attr("id"));

    $.ajax({
      url:'/trim/select/' + $(button).attr("id"),
      success:function(data){
        configurator.updateHero();
        trim.updateButton(button);
        $('body').removeClass("progress");
        $('.next').removeClass("disabled");

        if(data === 'showNav'){
          $('.configs_nav .disabled .nav_link').unbind("click.navDisabled");
          $('.configs_nav .disabled').removeClass("disabled");
          $('.configs_nav .trim.current').addClass("alt");
        } else if(data === 'hideNav'){
          $('.configs_nav .navItem').addClass("disabled");
          configurator.initNavLinks();
        }
      }
    });
  },

  updateButton: function(button){
    $('.select-trim').removeClass("selected").text("Select Trim");
    $(button).addClass("selected").text("Selected");
  }

});

$(document).ready(function() {
  trim.init();
});
