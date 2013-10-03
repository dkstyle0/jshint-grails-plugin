var quote = ({
  currentInteriorColorCode: "",
  validInteriorColors: {
    "S":["NP","K8CL", "KCCL", "K8VIN"],
    "SV":["NP","K8CL", "KCCL"],
    "SL":["NP","CFLTH"]
  },

  init: function(){
    configurator.bindViewMap();
    $('input.radio').checkBox();
    $("#ext_color_set").buttonset();
    $("#int_color_set").buttonset();

    global.initValidation($("#contactDealer"),global.leadDealerContactForm);
    subscribeDealerError = app.subscribe('/dealer/lead/error', function(errors){
      // crmEvent4();
      NCVOmniTracking.Page.formError(quote.vehicle, 'form error', NCVOmniTracking.Channel);
    });
    subscribeDealerSubmit = app.subscribe('/dealer/lead/submit', function(data){
      $('#raq_content').html(data);
      $('body').removeClass("requestquote").addClass("raq-thankyou");
      // crmEvent5();
      NCVOmniTracking.Page.formThankYou(quote.vehicle,configurator.currentVehicle.trim,configurator.currentVehicle.roof, null, NCVOmniTracking.Channel);
    });

    $('#dealer_results_container').hide();

    quote.bindModelSelect();
    quote.bindColorSelect();

    quote.validateColors();

    app.subscribe('/dealer/search/error', function() {
      NCVOmniTracking.Page.formError(quote.vehicle, errors, NCVOmniTracking.Channel);
    });

    app.subscribe('/form/submit/error', function(errors){
      NCVOmniTracking.Page.formError(quote.vehicle, errors, NCVOmniTracking.Channel);
    });

  },

  bindModelSelect: function(){
    $('input:radio[name="model"]').bind('click.model',function(){
      var value = $(this).val();
      configurator.currentVehicle.roof = value.match(/H$/) ? 'high' : 'standard';
      configurator.currentVehicle.trim = value.replace(/H$|S$/, '') === '' ? 'S' : value.replace(/H$|S$/, '');
      // When changing model, the customerLeadVehicle value shouldn't change for NVP, and the roof variable must be 'Low' or 'High' for urban science leads
      if (vehicle != 'NV Passenger') {
        var urbanScienceRoof = value.match(/H$/) ? 'High' : 'Low';
        $('#customerLeadVehicle').val(sessionBuildConfigs.modelTaggingTitle + ' ' + urbanScienceRoof);
      }
      $('#customerLeadModel').val(configurator.currentVehicle.trim);
      quote.displayVehicleImage();
      quote.validateColors();
    });
  },

  bindColorSelect: function(){
    $('input:radio.exradio').click(function(){
      var val = $(this).val();
      var formVal = val == "No Preference" ? "" : ex_colors[val];
      $('#exterior_color_display').text("Selected: " + ex_colors[val]);
      $('#customerLeadExColor').val(formVal);
      if(val != 'NP'){
        configurator.currentVehicle.color = val;
        quote.displayVehicleImage();
      }
    });
    $('input:radio.inradio').click(function(){
      var val = $(this).val();
      var formVal = val == "No Preference" ? "" : in_colors[val];
      quote.currentInteriorColorCode = val;
      $('#interior_color_display').text("Selected: " + in_colors[val]);
      $('#customerLeadIntColor').val(formVal);
    });
  },

  // As of right now, only interior colors for passenger van needs validation and reset (3/27/2012)
  validateColors: function(){
    if(jQuery.inArray(quote.currentInteriorColorCode, quote.validInteriorColors[configurator.currentVehicle.trim]) == -1){
      quote.resetColor("interior");
    }
    if (configurator.currentVehicle.modelLine == 'NVP' && configurator.currentVehicle.trim == 'SL' ) {
      $(".swatches-K8CL").hide();
      $(".swatches-CFLTH").show();
    } else if(configurator.currentVehicle.modelLine == 'NVP'){
      $(".swatches-CFLTH").hide();
      $(".swatches-K8CL").show();
    }
    if(configurator.currentVehicle.modelLine == 'NV' && configurator.currentVehicle.trim != 'S'){
      $('.swatches-K8VIN').hide();
    } else if(configurator.currentVehicle.modelLine == 'NV'){
      $('.swatches-K8VIN').show();
    }
  },

  resetColor: function(color){
    if(color == "interior"){
      $('#interior_color_display').text("");
      $('#customerLeadIntColor').val("");
      $("#int_color_set .ui-state-active").removeClass("ui-state-active");
    }
  },

  displayVehicleImage: function(){
    $('#vehicle_image').attr('src',
      "/images/" +  configurator.currentVehicle.year + "/" +
                    configurator.currentVehicle.modelLine + "/angle/" +
                    configurator.currentVehicle.model + "/" +
                    configurator.currentVehicle.trim + "/" +
                    configurator.currentVehicle.roof + "/full/572x249_" +
                    configurator.currentVehicle.color + ".png"
    );
  }

});

configurator.displayDealerSearchResults = function(dealerResultsObject) {
  if(dealerResultsObject != null && dealerResultsObject.dealers != null && dealerResultsObject.dealers.length > 0){
    NCVOmniTracking.Page.searchResults(quote.vehicle, NCVOmniTracking.Channel);
    var dealers = dealerService.getDealersList(dealerResultsObject);
    configurator.dealers = dealers;
    configurator.calcPaginationValues();
    if (dealers.length == 1 && dealers[0].distance > dealerService.radius) {
      $('.dealer_message').text('No dealers were found within the search radius of your location, but here is the closest Nissan Commercial Vehicle dealership.  To see more dealers, please select a wider search radius or choose a new location with the link below.') ;
    }
    $('#modal_message').html("");
    $('#search_dealer .loader').hide();
    $('#dealer_results_container').show();
    $('#dealer_results_container').find(".loader").hide();
    $('#select_dealer_copy').show();
    $('#search_dealer').hide();
    $("#pagination, #pagination_footer").pagination(configurator.dealers.length, {
      next_text:'&nbsp;',
      prev_text:'&nbsp;',
      items_per_page:configurator.per_page,
      callback:configurator.handlePaginationClick
    });
  } else {
    configurator.showErrorMessage('No Dealers Found. Please try again.');
    $('#dealer_results_container').hide();
  }
}

configurator.bindDealerSelect =  function(){
  jQuery('.dealer_sel').click(function(e){
    e.preventDefault();
    var dealerId = $(this).attr("id");
    crmEvent2();
    dealerService.setDealerById(dealerId);
    app.subscribe('/dealer/set', function(){
      location.href = '/request-quote/dealer/'+dealerId+"?vehicleDesc="+quote.vehicle;
    });
  });
};

$(document).ready(function() {
  quote.vehicle = vehicle;
  global.bindPlaceholders();
  configurator.bindDealerSearch();
  configurator.bindRadiusExpand();
  configurator.bindPerPage();
  quote.init();
});
