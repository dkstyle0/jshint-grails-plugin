//packages.js
var packages = ({
  disclaimer_config: {'event':'hover','delayBefore':0,'delayAfter':0},
  init: function(){

    // packages.initCheckBoxes();
    packages.bindAddRemovePackages();
    packages.bindCheckboxes();
    packages.bindHudInfo();
    packages.bindHoverStates();

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
      // crmEvent6(configurator.currentVehicle.model);
    });
    app.subscribe('/dealer/search/results/change', function(){
      NCVOmniTracking.Page.changeDealerResults(configurator.currentVehicle.model, configurator.currentVehicle.trim, configurator.currentVehicle.roof, NCVOmniTracking.Channel);
      // crmEvent7(configurator.currentVehicle.model);
    });
  },

  initCheckBoxes: function(){
    $('input.pkg_ckbx').checkBox().each(function(){
      $(this).next().attr("id",$(this).attr("id"));
    });
  },

  bindHoverStates: function(){
    $(".add_package, .pkg_ckbx").hover(
      function () {
        $(this).parent().find('.ui-checkbox').addClass("ui-checkbox-hover ui-checkbox-state-hover");
      },
      function () {
        $(this).parent().find('.ui-checkbox').removeClass("ui-checkbox-hover ui-checkbox-state-hover");
    });
  },

  bindHudInfo: function(){
    $('.pkg_info').click(function(e){
      e.preventDefault();
    });
    $('.add_package, .pkg_info, .pkg_ckbx').each(function() {
      var $this = $(this);
      var message = $this.parent().find('.conditionsMessage').html();
      if (message && message.length) {
          $this.popover({
              'content': message,
              'html': true,
              'trigger':'hover',
              'placement':'left'
           });
       }
    });
  },

  bindAddRemovePackages: function(){
    $('.package_button').click(function(e){
      e.preventDefault();
      var _parent = $(this).parent();
      var _chbx = _parent.find('input:checkbox');
      if(!_chbx.hasClass("disabled")){
        $('input.pkg_ckbx').addClass("disabled").checkBox("disable");
        _parent.toggleClass("user_checked");
        packages.updateOptions(_chbx);
      }
    });
  },

  bindCheckboxes: function(){
    $('input:checkbox.pkg_ckbx').click(function(){
      if(!$(this).hasClass("disabled")){
        $('input.pkg_ckbx').addClass("disabled").checkBox("disable");
        var _parent = $(this).parent();
        _parent.toggleClass("user_checked");
        packages.updateOptions(this);
      }
    });
  },

  updateOptions: function(elm){
    $('body, .package_button').addClass("progress");
    var obj = $(elm);
    var numRand = Math.floor(Math.random()*1000);
    $.get("/build/options/select",{"code":obj.val(),"cb":numRand},function(data){
        $('#packages_list').html(data);
        $('input.pkg_ckbx').removeClass("disabled");
        //packages.initCheckBoxes();
        configurator.redrawBuildSummary();

        packages.bindAddRemovePackages();
        packages.bindCheckboxes();
        packages.bindHudInfo();
        packages.bindHoverStates();
        global.bindInlineDisclaimers(packages.disclaimer_config,'.config_content_container');
        $('body, .package_button').removeClass("progress");

      });
  }

});

$(document).ready(function(){
  packages.init();
});
