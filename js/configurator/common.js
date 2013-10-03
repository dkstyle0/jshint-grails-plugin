/***************************
  Core js for NCV's configurator/request a quote
***************************/

/*
  Namespace used throughout NCV's configurator
*/
var configurator = (function($){
  return {
    builds_per_page: 6,
    dealerLocator: null,
    dealers: null,
    map:null,
    offset: 0,
    page_index: 0,
    confirmed: false,
    per_page: $('#per_page').val() === null || isNaN( parseInt( $('#per_page').val(), 10 ) ) ? 5 : parseInt( $('#per_page').val(), 10 ),
    disclaimer_config: {'event':'hover','delayBefore':0,'delayAfter':0},

    // Vehicle Object
    currentVehicle: {},
    vehicleDefaults: {
      color: 'QAK',
      modelLine: 'NV',
      model: 'NV1500',
      roof: 'standard',
      trim: 'S'
    },

    init: function(){
      /* Set the currentVehicle by merging the build configs from session with default settings */
      try {
        configurator.currentVehicle = $.extend( {}, configurator.vehicleDefaults, sessionBuildConfigs );
        configurator.vehicleDefaults.color = sessionBuildConfigs.defColor;
      } catch (error){
        global.logDebug("sessionBuildConfigs does not exist");
      }

      configurator.initNavLinks();

      configurator.bindViewAllSavedBuilds();
      configurator.setInventory();
      app.subscribe('/redrawDealer', function(){configurator.setInventory();});
      configurator.setCurrentDealer();
      configurator.showDealerServerError();
      global.bindDisclaimers(configurator.disclaimer_config);
      var subscribeDealerList = app.subscribe('/dealer/list', function(data){
        configurator.displayDealerSearchResults(data);
        if(dealerService.dealerId === null){
          app.publish('/dealer/search/results/nodealer');
        } else {
          app.publish('/dealer/search/results/change');
        }

      });

      $('.simplemodal-close').live('click', function() { $.modal.close(); });
    },

    /******
      Ajax
    *******/
    redrawBuildSummary: function(){
      var numRand = Math.floor(Math.random()*1000);
      $.get('/build/rail_summary', {"cb":numRand}, function(data){
        $('#vehicle_build_summary').replaceWith(data);
        if(payment_estimator){
          payment_estimator.updatePayments();
        }
        global.bindDisclaimers(configurator.disclaimer_config,'.rail');
      });
    },

    redrawCurrentDealer: function(dealerId){
      if(dealerId !== null){
        $.get('/build/rail_dealer', {id:dealerId}, function(data){
          $('#current_dealer').remove();
          $('#search_dealer_rail').remove();
          $('.rail').prepend(data);
          // configurator.bindDealerSearchOverlay();
          // configurator.bindViewMap();
          $('input[name="configurator.dealerId"]').val(dealerId) ;
          dealerService.getDealerById(dealerId);
          app.publish('/redrawDealer');
        });
      }
    },

    redrawPurchaseLease: function(dealerId){
      if(dealerId !== null){
        $.get('/build/rail_purchase_lease', {id:dealerId}, function(data){
          $('.rail .finance').replaceWith(data);
          configurator.bindPaymentEstimator();
          if($(".payment_est").length > 0) {
            payment_estimator.buildSettings.userzipcode = pe_userzipcode;
            payment_estimator.buildSettings.selectedRetailerZipCode = pe_selectedRetailerZipCode;
            payment_estimator.initPaymentEstimator();
          }
        });
      }
    },

    setInventory: function(){
      var params = {
        'dealerId':$('input[name="configurator.dealerId"]').val(),
        'ncode':$('input[name="configurator.ncode"]').val()
      };
      if($(".inventory_count").length > 0){
        $.getJSON( '/inventory/results', params, function(data){
          $(".inventory_count").html(data.delivered.length + data.in_transit.length);
        });
      }
    },

    /**********
      Animation
    ***********/
    bindNavigation: function(){
      $('.configs_nav li').hover(
        function () {
          $(this).addClass("over");
        },
        function () {
          $(this).removeClass("over");
        }
      );
    },

    updateHero: function(){
      // User has chosen to reset their build
      if(configurator.confirmed){
        configurator.currentVehicle.color = configurator.vehicleDefaults.color;
      }

      var hero = $("#vehicle-display .vehicle-overlay");
      var oldSrc = $(hero).attr("src");

      var newPath = "/images/" + configurator.currentVehicle.year + "/" +
                    configurator.currentVehicle.modelLine + "/angle/" +
                    configurator.currentVehicle.model + "/" +
                    configurator.currentVehicle.trim + "/" +
                    configurator.currentVehicle.roof + "/full/572x249_" +
                    configurator.currentVehicle.color + ".png";

      var oldPath = oldSrc;
      var newSrc = oldSrc.replace(oldPath,newPath);

      // IE cannot handle fading transparent images
      if(global.modernBrowser()){
        var fader = "<img class='vehicle-overlay fader' src='" + oldSrc + "' />";
        $("#vehicle-display").append(fader);
        $(hero).attr("src",newSrc);
        $(".fader").fadeOut('fast',function(){
          $(".fader").remove();
        });
      } else {
        $(hero).attr("src",newSrc);
      }
    },

    /*****************
      Event Delegation
    ******************/
    bindInventoryForm: function(){
      $('form.inventory_form').submit(function(){
        var $form = $(this);
        var zipcode = $form.find('input#zipcode').val();
        var city = $form.find('input#city').val();
        var state = $form.find('select#states').val();
        var radius = 100;
        if (zipcode === 'ZIP Code') {
          zipcode = '';
        }

        $('#dealer_results_container').hide();
        $('#change_dealer').modal({
          minWidth: 910,
          minHeight: 300,
          persist: false,
          onClose: function() {
            resetSearchForm();
            $('#select_dealer').html("");
            $('#dealer_results_container').hide();
            configurator.dealers = null;
            configurator.bindDealerSearchOverlay();
            configurator.bindViewMap();
          }
        });
        $('#simplemodal-container').css('position', 'absolute');

        $('#search_dealer').find(".loader").show();
        $('#dealer_locator_form').find('input[name=zipcode]').val(zipcode);
        $('#dealer_locator_form').find('input[name=city]').val(city);
        $('#dealer_locator_form').find('select[name=state]').val(state);
        configurator.validateSearchText(zipcode, city, state, radius);
      });
    },

    bindDealerSelect: function(){
      $('.dealer_sel').click(function(e){
        e.preventDefault();

        var dealerId = $(this).attr("id");
        dealerService.setDealerById(dealerId);

        // $.modal.close();
        app.publish('/modal/close');
        resetSearchForm();
        $('#dealer_results_container').hide();
        // TODO: Circle back to this condition
        configurator.redrawCurrentDealer(dealerId);
        configurator.redrawPurchaseLease(dealerId);
      });
    },

    bindDealerSearch: function(){
      $('#dealer_locator_form').submit(function(e){
        e.preventDefault();
        $('#search_dealer').find(".loader").show();
        var zip = $.trim( $(this).find('input[name=zipcode]').val() );
        var city = $.trim( $(this).find('input[name=city]').val() );
        var state = $(this).find('select[name=state]').val();
        var radius = $(this).find('select[name=radius]').val() !== null ? $(this).find('select[name=radius]').val() : 100;
        $('#sr_radius').val(radius); //prepop radius selection

        configurator.validateSearchText(zip, city, state, radius);
        $('#simplemodal-container').css('position', 'absolute');
      });
    },

    bindInventoryDealerSearch: function(){
      $('#dealer_locator_form').submit(function(e){
        $('#search_dealer').find(".loader").show();
        var validZip = /^[0-9]{5}$/;

        var zip = $.trim( $(this).find('input[name=zipcode]').val() );
        var city = $.trim( $(this).find('input[name=city]').val() );
        var state = $(this).find('select[name=state]').val();

        if (zip !== null && zip !== '') {

          if (validZip.test(zip) && zip != '00000') {
            return true;
          } else {
            configurator.showErrorMessage('Please enter a valid "zipcode" or "city, state" combination.');
            app.publish('/dealer/search/error');
            return false;
          }

        } else if ( (city !== null && city !== '') && (state !== null && state !== '')) {
          var searchString= city + ", " + state;
          var regexString = new RegExp("[\\d-<>@;:/|'`!#%\\+\\*\\?\\.]");

          if(!searchString.match(regexString)){
            return true;
          } else {
            configurator.showErrorMessage('Please enter a valid "zipcode" or "city, state" combination.');
            app.publish('/dealer/search/error');
            return false;
          }

        } else {
          configurator.showErrorMessage('Please enter a valid "zipcode" or "city, state" combination.');
          app.publish('/dealer/search/error');
          return false;
        }

      });
    },

    bindRadiusExpand: function(){
      $('#sr_radius').change(function(){
        configurator.showDSLoader();

        var zip = $.trim( $('#dealer_locator_form').find('input[name=zipcode]').val() );
        var city = $.trim( $('#dealer_locator_form').find('input[name=city]').val() );
        var state = $('#dealer_locator_form').find('select[name=state]').val();
        var radius = $(this).val();

        // TODO: Shouldn't have to make subsequent AJAX call. Can use existing dealer list.
        configurator.validateSearchText(zip, city, state, radius);
      });
    },

    bindPerPage: function(){
      $('#per_page').change(function(){
        configurator.showDSLoader();

        var zip = $.trim( $('#dealer_locator_form').find('input[name=zipcode]').val() );
        var city = $.trim( $('#dealer_locator_form').find('input[name=city]').val() );
        var state = $('#dealer_locator_form').find('select[name=state]').val();
        var radius = $('#sr_radius').val();

        configurator.per_page = parseInt( $('#per_page').val(), 10);
        if(dealerService.dealerList.dealers.length > 0) {
          configurator.displayDealerSearchResults(dealerService.dealerList);
        } else {
          configurator.validateSearchText(zip, city, state, radius);
        }
      });
    },


    disableLinks: function(links){
      $(links).click(function(e){
        var link = $(this);
        link.blur();
        if(link.hasClass("disabled")){
          e.preventDefault();
        }
      });
    },

    initNavLinks: function(){
      $('.configs_nav .disabled .nav_link').bind('click.navDisabled', function(e){
        e.preventDefault();
      });
    },

    /******
      Modal
    *******/
    bindPaymentEstimator: function(){
      if($(".payment_est").length > 0){
        var paymentEstimatorModalWidget = app.create('modal', {
          freeze: false,
          width: 800,
          height: 820,
          selector: '.payment_est',
          persist: false,
          modalContentId: 'payment_estimator'
        });
        app.start(paymentEstimatorModalWidget);
        app.subscribe('/modal/openModal', function() {
          if ($('#simplemodal-container #payment_estimator').length) {
            $('#simplemodal-container').css('position', 'absolute');
            payment_estimator.initModal();
            $('body').addClass('print_with_overlay');
          }
        });
        app.subscribe('/modal/closeModal', function(selector) {
          if (selector === '.payment_est') {
            if (!($('.glossary .modal_header').hasClass('collapse'))) {
              $('#glossary_terms').hide();
              $('.glossary .modal_header').addClass('collapse');
            }
            if (payment_estimator.userData.creditRating !== null && payment_estimator.userData.creditRating !== undefined) {
              payment_estimator.postUserData();
            }
          }
        });
        // $(".payment_est").overlay({
        //   mask: global.mask_settings,
        //   fixed:false,
        //   closeOnClick: false,
        //   onBeforeLoad: function(){
        //     payment_estimator.initModal();
        //     $('body').addClass('print_with_overlay');
        //   },
        //   onBeforeClose: function(){
        //     payment_estimator.postUserData();
        //   }
        // });
        payment_estimator.initLocale(paymentEstimatorMessages);
        this.financeTabSetup();
      }
    },

    bindDealerSearchOverlay: function(){
      var dealerSearchModalWidget = app.create('modal', {
          contentType: 'html',
          selector: '.retailer_cta',
          width: 910,
          height: 300,
          freeze: false,
          persist: false,
          modalContentId: 'change_dealer'
        });
        app.start(dealerSearchModalWidget);
        app.subscribe('/modal/contentInjected', function(selector) {
          if (selector === '.retailer_cta') {
            var dealerID = $('.retailer_cta').attr('id');
            app.publish('/dealer/search/change');
            configurator.bindViewMap();
          }
        });
        app.subscribe('/modal/closeModal', function(selector) {
          if (selector === '.retailer_cta') {
            $('#dealer_results_container').hide();
          }
        });
        $('#dealer_results_container').hide();
        //  $(".retailer_cta").click(function(e){
        //    e.preventDefault();
        //    if($('#change_dealer')){
        //      var dealerId = $(this).attr("id");
        //      $('#change_dealer').data("overlay").load();
        //      $('#change_dealer').css({'width':'730px'});
        //      configurator.repositionModal('change_dealer');
        //      app.publish('/dealer/search/change');
        //    }
        //  });


    },

    bindDSOIndependently: function(){
      // var changeDealerModalWidget = app.create('modal', {
      //   freeze: false,
      //   width: 910,
      //   height: 300,
      //   persist: false,
      //   modalContentId: 'change_dealer'
      // });
      // app.start(changeDealerModalWidget);
      // app.subscribe('/modal/closeModal', function(selector) {
      //   if (selector === '.retailer_cta') {
      //     resetSearchForm();
      //     $('#select_dealer').html("");
      //     $('#dealer_results_container').hide();
      //     configurator.dealers = null;
      //   }
      // });
      // $('#dealer_results_container').hide();
      // var changeDealerOvrly = $('#change_dealer').overlay({
      //   mask: global.mask_settings,
      //   fixed:false,
      //   closeOnClick: false,
      //   onClose: function(){
      //     resetSearchForm();
      //     $('#dealer_results_container').hide();
      //     $('#select_dealer').html("");
      //     configurator.dealers = null;
      //   }
      // });
      // $('#dealer_results_container').hide();
      // return changeDealerOvrly;
    },

    bindViewMap: function(){
      var dealerMapModalWidget = app.create('modal', {
        freeze: false,
        width: 650,
        height: 520,
        selector: '.dealer_directions',
        contentType: 'html',
        persist: true,
        modalContentId: 'view_map'
      });
      app.start(dealerMapModalWidget);
      app.subscribe('/modal/openModal', function() {
        if ($('#simplemodal-container #view_map').length) {
          var dealerId = $(".curDealerMap, .dealer_directions").attr('id');
          configurator.setMap(dealerId);
          if($('#contactDealer').length > 0) {
            global.resetValidator($("#contactDealer"));
          }
        }
      });
      app.subscribe('/modal/closeModal', function(selector) {
        if (selector === '.dealer_directions') {
          $('#VEDealerMap').empty();
        }
      });
      // $('.dealer_directions').overlay({
      //   mask: global.mask_settings,
      //   fixed:false,
      //   closeOnClick: false,
      //   onLoad: function(){
      //     var dealerId = $(".curDealerMap, .dealer_directions").attr('id');
      //     configurator.setMap(dealerId);
      //     if($('#contactDealer').length > 0){
      //       global.resetValidator($("#contactDealer"));
      //     }
      //   }
      // });
    },

    bindViewAllSavedBuilds: function(){
      $('.view_all').overlay({
        mask: global.mask_settings,
        fixed:false,
        closeOnClick: false,
        onBeforeLoad: function(){
          configurator.renderSavedBuilds();
        }
      });
    },

    dealerSetup: function(){
      configurator.bindDealerSearch();
      configurator.bindRadiusExpand();
      configurator.bindPerPage();
      if($('#inventory_form').size() > 0){
        configurator.bindInventoryForm();
        configurator.initZipCodeTooltip();
        configurator.bindViewMap();
      } else {
        configurator.bindDealerSearchOverlay();
        configurator.bindViewMap();
      }
    },

    repositionModal: function(id){
      var modal = $("#"+id);
      var left = ($(window).width() / 2) - (modal.width() / 2);
      modal.css({'left':left+"px"});
    },

    /******
      Tabs
    *******/
    financeTabSetup: function(){
      //cookie for last selected tab
      var leasebuyCookie = global.getCookie("sr_leasebuy");
      var tabIndex = leasebuyCookie !== undefined ? $('.finance .module-tabs a').index($('#'+leasebuyCookie)) : 0;
      if($(".finance ul.module-tabs").length > 0){
        /*$(".finance ul.module-tabs").tabs("module-tab_panes > div",{initialIndex:tabIndex});
        var api = $(".finance ul.module-tabs li a");//.data("tabs");
        api.click(function(index) {
          global.setCookie("sr_leasebuy",$(this).attr('id'));
        });*/

        $(".module-tabs").tabs(
            ".module-tab_panes > div",
            {
              effect: 'fade',
              fadeInSpeed: 400,
              fadeOutSpeed: 100,
              history: true
            }
          );
      }
    },

    /********
      Tooltip
    *********/
    initZipCodeTooltip: function(){
      var zipcode_copy = 'To find the dealer nearest you, please enter your five-digit zip code.';
      $('#zip_hud').hud('zipcode_hud', {
        'event':'hover',
        'alignment':'center',
        'position':'vertical',
        'delayAfter':0,
        'delayBefore':0,
        'fadeSpeed':0,
        'message':zipcode_copy
      });
    },

    /**********
      Utilities
    ***********/
    calcPaginationValues: function(){
      var _num_of_dealers = configurator.dealers.length;
      var _pages = Math.ceil(_num_of_dealers / configurator.per_page);
      configurator.offset = configurator.per_page * configurator.page_index;
      var _page_total = configurator.page_index+1 == _pages ? _num_of_dealers : configurator.offset + configurator.per_page;
      $('#dealer_results_container .count').text(_num_of_dealers);
      $('.page_info').text("Showing "+ (configurator.offset+1) + " - " + _page_total.toString().replace(/^0+/, ''));
    },

    displayDealerSearchResults: function(dealerResultsObject){
      if(dealerResultsObject !== null && dealerResultsObject.dealers !== null && dealerResultsObject.dealers.length > 0){
        var dealers = dealerService.getDealersList(dealerResultsObject);
        configurator.dealers = dealers;
        configurator.calcPaginationValues();
        $('#search_dealer').hide();
        $('#dealer_results_container').show();
        $('#dealer_results_container').find(".loader").hide();
        // $('#change_dealer').css({'width':'905px'});
        // configurator.repositionModal('change_dealer');
        jQuery(".search_section").css({'opacity':'1'});
        $("#pagination, #pagination_footer").pagination(configurator.dealers.length, {
          next_text:'&nbsp;',
          prev_text:'&nbsp;',
          items_per_page:configurator.per_page,
          callback:configurator.handlePaginationClick
        });

      }else{
        configurator.showErrorMessage('Your city and state combination is invalid.  Please try again.');
        $('#dealer_results_container').hide();
        // configurator.repositionModal("change_dealer");
      }

    },

    handlePaginationClick: function(new_page_index, pagination_container) {
      configurator.page_index = new_page_index;
      configurator.calcPaginationValues();
      renderSearchResults();
      return false;
    },

    setCurrentDealer: function(dealerId){
      var subscribeFoundDealer = app.subscribe('/dealer/found', function(dealer){
        if(dealer !== null){
          $('.curDealerName').text(dealer.dealerName);
          $('.curDealerStreet').text(dealer.dealerAddressLine1);
          $('.curDealerCity').text(dealer.dealerCityName);
          $('.curDealerState').text(dealer.dealerStateCode);
          $('.curDealerPhone').text(dealer.dealerPhoneNumber);
          $('.curDealerMap').attr("id", dealer.dealerId);
          $('.retailer_cta').attr("id", dealer.dealerId);
          $('.curDealerName').removeClass('hidden') ;
          $('.curDealerInfo').removeClass('hidden') ;
          $('p.noDealerName').addClass('hidden');
        }
      });
    },

    showDealerServerError: function() {
      var dealerServerError = app.subscribe('/dealer/server/error', function(data){
        $('#search_dealer').find(".loader").hide();
        $('.section_title').text("There was a server error trying to retrieve the dealer list.  Please try again later.");
      });
    },


    setMap: function(dealerId){
      dealerService.getDealerById(dealerId);
      var subscribeFoundDealer = app.subscribe('/dealer/found', function(dealer){
        jQuery('#view_map .loader').removeClass("loader");
        var mapDiv = document.getElementById('VEDealerMap');
        configurator.map = new google.maps.Map(
          mapDiv, {
            center: new google.maps.LatLng(dealer.dealerLatitude, dealer.dealerLongitude),
            zoom:13,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
            },
            navigationControl: true,
            navigationControlOptions: {
              style: google.maps.NavigationControlStyle.SMALL
            }
          }
        );
        jQuery('#cd_DealerName').text(dealer.dealerName);
        jQuery('#cd_DealerStreet').text(dealer.dealerAddressLine1);
        jQuery('#cd_DealerCity').text(dealer.dealerCityName);
        jQuery('#cd_DealerState').text(dealer.dealerStateCode);
        jQuery('#cd_DealerPhone').text(dealer.dealerPhoneNumber);
        var myLatLng = new google.maps.LatLng(dealer.dealerLatitude, dealer.dealerLongitude);
        var dealerMarker = new google.maps.Marker({
          position: myLatLng,
          map: configurator.map
        });
      });
    },

    showDSLoader: function(){
      $('#select_dealer').html("");
      $('#dealer_results_container').find(".loader").show();
    },

    showErrorMessage: function(msg){
      resetSearchForm();
      $('#modal_message').show().text(msg);
    },

    validateSearchText: function(zip, city, state, radius){
      var dealerLocator;
      var validZip = /^[0-9]{5}$/;

      if (zip !== null && zip !== '') {

        if (validZip.test(zip) && zip != '00000') {
          dealerService.setRadius(radius);
          dealerService.getDealersByZip(zip, 'ni');
        } else {
          configurator.showErrorMessage('Please enter a valid "zipcode" or "city, state" combination.');
          app.publish('/dealer/search/error');
          return false;
        }

      } else if ( (city !== null && city !== '') && (state !== null && state !== '')) {
        var searchString= city + ", " + state;
        var regexString = new RegExp("[\\d-<>@;:/|'`!#%\\+\\*\\?\\.]");

        if(!searchString.match(regexString)){
          dealerService.setRadius(radius);
          dealerService.getDealersByCityState(city, state, 'ni');
        } else {
          configurator.showErrorMessage('Please enter a valid "zipcode" or "city, state" combination.');
          app.publish('/dealer/search/error');
          return false;
        }

      } else {
        configurator.showErrorMessage('Please enter a valid "zipcode" or "city, state" combination.');
        app.publish('/dealer/search/error');
        return true;
      }
    }
  };

  /* Private Methods */
  function resetSearchForm(){
    $('#modal_message').hide();
    $('#search_dealer').show();
    // pulled out to fix IE issues NCV-503/NCV-505
    //$(".search_section").css({'opacity':'1'});
    $('#search_dealer').find(".loader").hide();
    $('#dealer_locator_form input, #dealer_locator_form select').not("input[name='submit'], input[name='zipcode']").val("");
    global.bindPlaceholders();
  }

  function renderSearchResults(){
    $('#select_dealer').html("");

    var resultLength = configurator.per_page;
    if (configurator.dealers.length < resultLength) {
      resultLength = configurator.dealers.length ;
    }

    for(var i = configurator.offset; i < configurator.offset + resultLength && i< configurator.dealers.length; i++){
      var dealer = configurator.dealers[i];
      if(dealer !== null){
        var dealerTmpl ="<div class='inventory_search_result clearfix clear'>"+
                        "<div class='inv_address'>"+
                          "<p class='paragraph bold'>${name}</p>"+
                          "<p class='paragraph'>${addressLine1}<br/>"+
                          "${city}, ${state} ${zipCode}<br/>"+
                          "${phoneNumber}</p>"+
                          "<p class='miles'><strong>${Math.round(distance)}</strong> miles from your location</p>"+
                        "</div>"+
                        "<div class='inv_info'>"+
                          "<h6>Dealer Certifications</h6>"+
                          "{{if excellenceCode==1}}"+
                            "<img src='/images/certificates/excellence.png' />"+
                          "{{/if}}"+
                          "{{if expressService}}"+
                            "<img src='/images/certificates/express_service.png' />"+
                          "{{/if}}"+
                        "</div>"+
                        "<div class='inv_select'>"+
                          "<a href='#' class='dealer_sel button-septenary alt2' id='${dealerId}'>Select</a>"+
                        "</div>"+
                      "</div>";
        $.tmpl( dealerTmpl, dealer ).appendTo( "#select_dealer" );
      }
    }
    configurator.bindDealerSelect();
  }

})(jQuery);

$(document).ready(function() {
    configurator.init();
});
