var addedGtinFile = false;
if ($('#gtindropzone').length > 0){
  Dropzone.options.gtindropzone = {
    init: function() {
      this.on("addedfile", function(file) {
        this.emit("thumbnail", file, "/images/spreadsheet.png");
        addedGtinFile = true;
      });
      this.on("removedfile", function(file) {
        if ($('.dropzone .dz-preview').length === 0){
          addedGtinFile = false;
        }
      });
      this.on("dragenter", function(file) {
        dropzoneError.hide();
        dropzoneSuccess.hide();
        dropzoneMix.hide();
      });
      this.on("sending", function(file, xhr, formData) {
        formData.append('func', 'process_gtin_upload');
        formData.append('gtin_txt_upload', $('#gtin_txt_upload').val());
      });
      this.on("error", function(file, errorMessage) {
        this.removeFile(file);
        $('.dropzone-error').html(errorMessage);
        dropzoneError.show();
      });
      this.on("success", function(file, resp) {
        this.removeFile(file);
        $('#gtin_txt_upload').val('');
        addedGtinFile = false;
        showUploadResponse(resp);
      });
    },
    dictDefaultMessage: 'Drop UPCs file here<br/>OR<br/>click to upload.',
    paramName: 'gtin_xls_upload',
    maxFiles: 1,
    maxFilesize: 1, // MB
    autoProcessQueue: false,
    clickable: true,
    addRemoveLinks: true,
    dictRemoveFile: '<button type="button" class="btn btn-danger btn-sm btn-remove-file mt-2">Remove</button>',
    dictCancelUpload: '',
    acceptedFiles: 'text/plain'
    // acceptedFiles: 'application/vnd.google-apps.spreadsheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

var showUploadResponse = function(resp){
  // resp = respStatus|gtinsNotFound|gtinsOverMaxQty|gtinsOutOfStock|addedItems
  resp = resp.split('|');
  var cartAmount = parseInt($('#cart-amount').html()),
      addedItems = parseInt(resp[4]);
  // good AND bad gtins
  if (resp[0] === 'success' || resp[0] === 'mix'){
    dropzoneSuccess.show();
    $('.amount-added').html(addedItems);
  }
  // bad gtins
  if (resp[0] === 'fail' || resp[0] === 'mix'){
    if (resp[1]){
      $('.not-found span').html(resp[1]);
    }
    else{
      $('.not-found span').html('&#150;&#150;&#150;');
    }
    if (resp[2]){
      $('.bad-qty span').html(resp[2]);
    }
    else{
      $('.bad-qty span').html('&#150;&#150;&#150;');
    }
    if (resp[3]){
      $('.out-of-stock span').html(resp[3]);
    }
    else{
      $('.out-of-stock span').html('&#150;&#150;&#150;');
    }
    dropzoneMix.show();
  }
  // recalculate cart amount in header
  if (resp[4]){
    $('#cart-amount').html(cartAmount + addedItems);
  }
}

var uploadGtins = function(e){
  // no file upload and no textarea val
  if (addedGtinFile === false && $('#gtin_txt_upload').val() === ''){
    dropzoneSuccess.hide();
    dropzoneMix.hide();
    $('.dropzone-error').html('There are no UPCs to upload.');
    dropzoneError.show();
  }
  // file uploaded; picks up textarea val automatically
  else if (addedGtinFile === true){
    var myDropzone = Dropzone.forElement(".dropzone");
    myDropzone.processQueue();
  }
  // textarea value only
  else if (addedGtinFile === false && $('#gtin_txt_upload').val()){
    $.ajax({
      context: this,
      method: 'POST',
      url: '/handler',
      data: {
        func: 'process_gtin_upload',
        gtin_txt_upload: $('#gtin_txt_upload').val(),
        gtin_xls_upload: ''
      },
      beforeSend: function(){
        loader.show();
      },
      success: function(resp) {
        loader.hide();
        $('#gtin_txt_upload').val('');
        showUploadResponse(resp);
      },
      failure: function(resp) {
        loader.hide();
        alert('There was an error. Try again.');
      }
    });
  }
}

var host = window.location.hostname;

var loader = {
  show: function(){
    $('.fs-loader-mask').addClass('fs-loader-fade-in');
  },
  hide: function(){
    $('.fs-loader-mask').removeClass('fs-loader-fade-in');
  }
}

// flip thumbnail over for product details
var flipCard = function(e){
  // IE 10 & 11 have an issue with css prop backface-visibility
  $(this).closest('.flip-container').toggleClass('flipped');
}

var fulfillmentAddCart = function(e){
  var paren         = $(this).closest('.back'),
      quantityField = paren.find('.fulfillment-quantity'),
      quantity      = parseInt(quantityField.val()),
      max_quantity  = parseInt($(this).data('max-quantity')),
      cartAmount    = parseInt($('#cart-amount').html());
  if (quantity == '' || isNaN(quantity)){
    quantityField.data('content', 'Enter a valid number');
    quantityField.popover('show');
    $(paren).on('click', '.fulfillment-quantity, .flip-icon', function(e){
      quantityField.popover('dispose');
    });
  }
  // alert if qty is too high
  else if (quantity > max_quantity){
    quantityField.data('content', 'Quantity cannot exceed ' + max_quantity);
    quantityField.popover('show');
    $(paren).on('click', '.fulfillment-quantity, .flip-icon', function(e){
      quantityField.popover('dispose');
    });
  }
  else{
    quantityField.popover('dispose');
    loader.show();
    $.ajax({
      context: this,
      method: 'POST',
      url: '/order_handler',
      data: {
        func: 'process_add_to_cart',
        base_id: $(this).data('base-id'),
        account_name: $(this).data('account-name'),
        quantity: quantity,
        max_quantity: max_quantity
      },
      success: function(resp) {
        $('#cart-amount').html(cartAmount + quantity);
        // update max qty
        $(this).data('max-quantity', resp);
        paren.find('.fulfillment-quantity').attr('placeholder', 'max qty: ' + resp);
        paren.find('.fulfillment-quantity').val('');
        paren.find('.fulfillment-add-cart').switchClass('btn-secondary', 'btn-success');
        paren.find('.cart-and-success').switchClass('fa-shopping-cart', 'fa-check');
        paren.find('.fulfillment-add-cart').blur();
        setTimeout(function(){
          paren.find('.fulfillment-add-cart').switchClass('btn-success', 'btn-secondary');
          paren.find('.cart-and-success').switchClass('fa-check', 'fa-shopping-cart');
        }, 4000);
        loader.hide();
      },
      failure: function(resp) {
        loader.hide();
        alert('There was an error. Try again.');
      }
    });
  }
}

// executed when Enter key is hit on quantity field
var preFulfillmentAddCart = function(e){
  // allow numbers only
  $(this).val($(this).val().replace(/[^\d].+/, ""));
  if ((event.which < 48 || event.which > 57)) {
    event.preventDefault();
  }
  $(this).popover('dispose');
  // submit qty with Enter key
  if (e.which == 13 || e.keyCode == 13) {
    $(this).closest('.back').find('.fulfillment-add-cart').trigger('click');
  }
}

var forgotPasswordShow = function(){
  $('.login-container form').addClass('hide');
  $('#forgot-password').removeClass('hide');
}

var forgotPasswordSubmit = function(){
  loader.show();
  $('.forgot-password-valid').addClass('hide');
  $('.forgot-password-invalid').addClass('hide');
  $.ajax({
    context: this,
    method: 'POST',
    url: '/register',
    data: {
      func: 'process_forgot_password',
      email_address: $('.forgot-password-email').val()
    },
    success: function(resp) {
      if (resp === 'valid_email'){
        $('.forgot-password-valid').removeClass('hide');
        setTimeout(function(){
          location.reload();
        }, 5000);
      }
      if (resp === 'invalid_email'){
        $('.forgot-password-invalid').removeClass('hide');
      }
      loader.hide();
    },
    failure: function(resp) {
      loader.hide();
      alert('There was an error. Try again.');
    }
  });
}

var forgotPasswordLogin = function(e){
  e.preventDefault();
  $('.forgot-password-valid').addClass('hide');
  $('.forgot-password-invalid').addClass('hide');
  $('.login-container form').addClass('hide');
  $('#login').removeClass('hide');
}

var goToPage = function(e){
  e.preventDefault();
  var pageCount = $(this).data('page-count'),
      pageRequested = $(this).data('page-requested'),
      nextFunc = $(this).data('next-func'),
      fulfillment = $(this).data('fulfillment'),
      searchedKeyword = $('#searched-keyword').val();
  loader.show();
  $.ajax({
    context: this,
    method: 'POST',
    url: '/handler',
    data: {
      func: nextFunc,
      keyword: searchedKeyword,
      results_per_page: pageCount,
      page_requested: pageRequested,
      fulfillment: fulfillment
    },
    success: function(resp) {
      $('.search-results').html(resp);
      $('.page-' + pageRequested).addClass('active');
      loader.hide();
    },
    failure: function(resp) {
      loader.hide();
      alert('There was an error. Try again.');
    }
  });
}

var siteSearch = function(e){
  e.preventDefault();
  if ($('.nav-search').val() != ''){
    loader.show();
    $('.fulfillment-search')[0].submit();
  }
}

var cartRemove = function(e){
  var itemIndex = $(this).data('item-index'),
      container = $(this).closest('tr');
  loader.show();
  $.ajax({
    context: this,
    method: 'POST',
    url: '/order_handler',
    data: {
      func: 'process_remove_from_cart',
      item_index: itemIndex
    },
    success: function(resp) {
      container.remove();
      loader.hide();
    },
    failure: function(resp) {
      loader.hide();
      alert('There was an error. Try again.');
    }
  });
}

// highlight page 1 on pages with pagination
var pageOne = function(){
  if ($('.page-1').length > 0){
    $('.page-1').addClass('active');
  }
}

var checkout = function(){
  loader.show();
  $('#cart-form').submit();
}

var editAddress = function(e){
  $('#func').val('process_edit_address');
  $('#base_id').val($(this).data('base-id'));
  $('.ab-add-entry').addClass('hide');
  $('.ab-save-entry').removeClass('hide');
  $('#first_name').val($(this).data('first-name'));
  $('#last_name').val($(this).data('last-name'));
  $('#title').val($(this).data('title'));
  $('#address_1').val($(this).data('address-1'));
  $('#address_2').val($(this).data('address-2'));
  $('#city').val($(this).data('city'));
  $('#state_province').val($(this).data('state'));
  $('#zip_postal').val($(this).data('zip'));
  $('#country_id').val($(this).data('country'));
  $('#phone_number').val($(this).data('phone'));
  $('#fax_number').val($(this).data('fax'));
  $('#email_address').val($(this).data('email'));
}

var deleteAddress = function(e){
  var row    = $(this).closest('tr'),
      baseId = $(this).data('base-id');
  loader.show();
  $.ajax({
    context: this,
    method: 'POST',
    url: '/handler',
    data: {
      func: 'process_delete_address',
      base_id: baseId
    },
    success: function(resp) {
      row.remove();
      loader.hide();
    },
    failure: function(resp) {
      loader.hide();
      alert('There was an error. Try again.');
    }
  });
}

var resetAddress = function(){
  $('#address-book')[0].reset();
  $('#func').val('process_new_address');
  $('#base_id').val('');
  $('.ab-save-entry').addClass('hide');
  $('.ab-add-entry').removeClass('hide');
}

var overDropzone = function(e){
  $(this).addClass('dropzone-hover');
}

var outDropzone = function(e){
  $(this).removeClass('dropzone-hover');
}

var dropzoneError = {
  show: function(){
    $('.dropzone-error').fadeIn();
  },
  hide: function(){
    $('.dropzone-error').fadeOut();
  }
}

var dropzoneSuccess = {
  show: function(){
    $('.dropzone-success').fadeIn();
  },
  hide: function(){
    $('.dropzone-success').fadeOut();
  }
}

var dropzoneMix = {
  show: function(){
    $('.dropzone-mix').fadeIn();
  },
  hide: function(){
    $('.dropzone-mix').fadeOut();
  }
}

var gtinTxtHandler = function(){
  dropzoneError.hide();
  dropzoneSuccess.hide();
  dropzoneMix.hide();
}

var sameAsShipping = function(){
  if ($('#same_as_shipping').is(':checked')){
    $('#same_as_shipping').val('checked');
    $('#bill_address_1').val($('#ship_address_1').val());
    $('#bill_address_2').val($('#ship_address_2').val());
    $('#bill_city').val($('#ship_city').val());
    $('#bill_state_province').val($('#ship_state_province').val());
    $('#bill_zip_postal').val($('#ship_zip_postal').val());
    $('#bill_phone_number').val($('#ship_phone_number').val());
    $('#bill_email_address').val($('#ship_email_address').val());
  }
  else{
    $('#same_as_shipping').val('');
    $('.billing-list .form-control').val('');
    $('.billing-list select').prop('selectedIndex', 0);
  }
}

var shippingAddressBook = function(e){
    $.ajax({
      context: this,
      method: 'POST',
      url: '/order_handler',
      data: {
        func: 'process_load_shipping',
        shipping_address_book: $(this).val()
      },
      beforeSend: function(){
        loader.show();
      },
      success: function(resp) {
        var json = jQuery.parseJSON(resp);
        for (key in json){
          if ($('#' + key).length > 0){
            $('#' + key).val(json[key]);
          }
        }
        sameAsShipping();
        $(this).prop('selectedIndex', 0);
        loader.hide();
      },
      failure: function(resp) {
        $(this).prop('selectedIndex', 0);
        loader.hide();
        alert('There was an error. Try again.');
      }
    });
}

var paymentCancel = function(){
  $('#cancelButton').trigger('click');
}

var paymentSubmit = function(){
  $('#submitButton').trigger('click');
}

var valCartQuantity = function(e){
  var currentValue = String.fromCharCode(e.which),
      maxQty      = $(this).attr('max');
  if (currentValue > maxQty){
    e.preventDefault();
  }
}

var orderHistoryDetails = function(e){
  e.preventDefault();
  var orderNumber = $(this).data('order-number');
  $(this).closest('tbody').find('#order_' + orderNumber).toggleClass('hide');
}

var approveDenyUser = function(e){
  e.preventDefault();
  loader.show();
  var func = $(this).data('func'),
      ccsId = $(this).data('ccs-id');
  $.ajax({
    context: this,
    method: 'POST',
    url: '/handler',
    data: {
      func: func,
      ccs_id: ccsId
    },
    success: function(resp) {
      $('.login-container').html('<h5>Thank You</h5>');
      loader.hide();
    },
    failure: function(resp) {
      loader.hide();
      alert('There was an error. Try again.');
    }
  });
}

var inCartQtyChange = function(e){
  var counter   = 0,
      direction = $(this).data('direction'),
      cartQty   = $(this).closest('.cart-quantity-cell').find('.cart-quantity'),
      min       = cartQty.data('min'),
      max       = cartQty.data('max'),
      qty       = parseInt(cartQty.val());

  if (direction === 'up'){
    if (qty != max){
      cartQty.val(qty + 1);
    }
  }
  else if (direction === 'down'){
    if (qty != min){
      cartQty.val(qty - 1);
    }
  }
  // total all quantity inputs and place in cart indicator
  $('.cart-quantity-cell .cart-quantity').each(function(){
    counter += parseInt($(this).val());
  });
  $('#cart-amount').html(counter);
}

var injectDate = function(){
  if ($('.footer-year').length){
    var d = new Date();
    var n = d.getFullYear();
    $('.footer-year').html(n);
  }
}

$(document).ready(function() {
  injectDate();
  pageOne();
  $('body').delegate('.pagination .page-link', 'click', goToPage);
  $('body').delegate('.flip-icon', 'click', flipCard);
  $('body').delegate('.fulfillment-add-cart', 'click', fulfillmentAddCart);
  $('body').delegate('.fulfillment-quantity', 'keypress', preFulfillmentAddCart);
  $('.cart-quantity-cell .fa-angle').on('mousedown', inCartQtyChange);
  $('.forgot-password-button').on('click', forgotPasswordShow);
  $('.forgot-password-login').on('click', forgotPasswordLogin);
  $('.fulfillment-search').on('submit', siteSearch);
  $('.cart-remove').on('click', cartRemove);
  $('.checkout').on('click', checkout);
  $('.edit-address-btn').on('click', editAddress);
  $('.delete-address-btn').on('click', deleteAddress);
  $('.ab-reset').on('click', resetAddress);
  $('.dropzone').on('mouseover', overDropzone);
  $('.dropzone').on('mouseout', outDropzone);
  $('.btn-upload-gtins').on('click', uploadGtins);
  $('#gtin_txt_upload').on('keyup', gtinTxtHandler);
  $('#same_as_shipping').on('change', sameAsShipping);
  $('.shipping-list .form-control').on('keyup', sameAsShipping);
  $('.shipping-list select.select-data').on('change', sameAsShipping);
  $('.shipping-address-book').on('change', shippingAddressBook);
  $('.payment-cancel').on('click', paymentCancel);
  $('.payment-submit').on('click', paymentSubmit);
  $('.cart-quantity').on('keydown', valCartQuantity);
  $('.order-detail-trigger').on('click', orderHistoryDetails);
  $('.approve-deny-link').on('click', approveDenyUser);
});
