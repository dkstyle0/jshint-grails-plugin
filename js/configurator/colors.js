//colors.js
var colors = ({

  init: function(){

    $("#ext_color_set").buttonset();
    $("#int_color_set").buttonset();

    this.bindColorSelection();
    configurator.bindNavigation();
    this.bindInactives();
    //this.checkSelection();

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

  bindColorSelection: function() {
    var intIsSelected = false;
    var extIsSelected = false;
    var auto_int_value, auto_int_data;
    if ($("input[name='extColor']:checked").val() && $("input[name='intColor']:checked").val()) {
      $('.next').removeClass('disabled');
    }

    if ($("input[name='extColor']:checked").val()){
      extIsSelected = true;
      $("input[name='extColor']:checked").addClass('disabled');
    }

    if ($("input[name='intColor']:checked").val()){
      intIsSelected = true;
      $("input[name='intColor']:checked").addClass('disabled');
    }

    $('input:radio.exradio, input:radio.inradio').click(function(){

      var $this = $(this);

      if($this.hasClass("disabled")){return false;}

      if($this.hasClass("exradio")){
        extIsSelected = true;
        $('.inradio').each(function(index) {
          if($(this).attr("checked") == "checked"){
            intIsSelected = true;
          }
        });

        // Auto Select the first Interior Color
        if (intIsSelected == false){
          var $interiorRadio = $('#int_color_set li:first input');
          var $ineeriorLabel = $('#int_color_set li:first label');
          $ineeriorLabel.attr('aria-pressed',true)
          $ineeriorLabel.addClass('ui-state-active')
          $ineeriorLabel.removeClass('ui-corner-left');
          $interiorRadio.attr('checked','checked');
          auto_int_value = $interiorRadio.val();
        }

      }

      var random_number = Math.floor(Math.random()*1000);
      var random_number_auto_int = Math.floor(Math.random()*1000);
      var _configs = $this.hasClass('exradio') ? {type:'ext',summary_id:'#sum_ext_color'} : {type:'int',summary_id:'#sum_int_color'};
      var data = "code=" + $this.val() + "&type=" + _configs.type + "&cb=" + random_number;
      var int_or_ext_data = data;
      var _code = $this.val().replace(/_+[\d][\d]/, '');
      $('body').addClass("progress");
      $.ajax({
        url:"/build/colors/select",
        data: data,
        beforeSend: function(){
          $(".exradio, .inradio, label.color").addClass("disabled");
          $("#int_color_set, #ext_color_set").buttonset("option","disabled", true);
        },
        success:function(data){
          if(_configs.type === 'ext'){
            configurator.currentVehicle.color = _code;
            configurator.updateHero();
            $(_configs.summary_id).text($this.siblings('.color_label').text());
          } else {
            $(_configs.summary_id).text($this.siblings('.int_color_label').text());
          }

          $(".exradio, .inradio, label.color").removeClass("disabled");
          $("#int_color_set, #ext_color_set").buttonset("option","disabled", false);

          $("input[name='extColor']:checked").addClass('disabled');
          $("input[name='intColor']:checked").addClass('disabled');

          colors.checkSelection();
          $('body').removeClass("progress");
          if (!intIsSelected && extIsSelected){
            var _configs_int = {type:'int',summary_id:'#sum_int_color'};
            auto_int_data = "code=" + auto_int_value + "&type=int&cb=" + random_number_auto_int;
            $.ajax({
              url:"/build/colors/select",
              data: auto_int_data,
              beforeSend: function(){
                $(".exradio, .inradio, label.color").addClass("disabled");
                $("#int_color_set, #ext_color_set").buttonset("option","disabled", true);
              },
              success:function(data){
                $(_configs_int.summary_id).text($('[value='+auto_int_value+']').siblings('.color_label').text());
                $(".exradio, .inradio, label.color").removeClass("disabled");
                $("#int_color_set, #ext_color_set").buttonset("option","disabled", false);
              }
            });
            intIsSelected = true;
          }
        }
      });

    });
  },

  checkSelection: function(){
    var checks = $('input:checked').size();
    if(checks > 1){
      $('a.disabled').removeClass("disabled").unbind();
    }
  },

  bindInactives: function(){
    $('a.disabled').click(function(e){
      e.preventDefault();
    });
  }

});

$(document).ready(function(){
  colors.init();
});
