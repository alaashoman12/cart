$(document).ready(function() {
	ajaxCart.overrideButtonsInThePage();
	ajaxCart.refresh();
	$('input[name=order_pickup]').on('change', function() {
		var order_pickup = $('input[name=order_pickup]:checked').val();
		if (order_pickup == 0 || order_pickup == 1) {
			ajaxCart.refreshPickupOptions(order_pickup);
			if (order_pickup == 0) {
				$('#shipping_select_city').removeClass('hide');
			} else {
				$('#shipping_select_city').addClass('hide');
			}
		}
	});
	$('input[name=order_registration]').on('change', function() {
		var order_registration = $('input[name=order_registration]:checked').val();
		if (order_registration == 0 || order_registration == 1) {
			if(order_registration == 1) {
				$('.client_order_registration-0').each(function(){
					$(this).addClass('hide');
				});
				$('.client_order_registration-1').each(function(){
					$(this).removeClass('hide');
				});
			} else {
				$('.client_order_registration-0').each(function(){
					$(this).removeClass('hide');
				});
				$('.client_order_registration-1').each(function(){
					$(this).addClass('hide');
				});
			}
			ajaxCart.refreshCheckoutBtn(order_registration);
			ajaxCart.refreshRegistrationOptions(order_registration);
		}
	});
	$('.client_phone_container input[name=client_phone]').on('keyup keypress change', function() {
		var order_registration = $('input[name=order_registration]:checked').val();
		if(order_registration == 0) {
			ajaxCart.refreshCheckoutBtn(order_registration);
		}
	});
	
	if($('#delivery_date').length) {
		$('#delivery_date').datepicker({
			dateFormat: 'yy-mm-dd',
			minDate: '+'+shipping_start_min+'d',
			maxDate: '+'+shipping_start_max+'d',
		});
	}
	$(document).on('click', '#layered_form .select, #layered_form input[type=checkbox], #layered_form input[type=radio]', function(e) {
		data = $('#layered_form').serialize();
		$('#layered_form .select option').each(function() {
			if ($(this).attr('id') && $(this).parent().val() == $(this).val()) {
				data += '&' + $(this).attr('id') + '=' + $(this).val();
			}
		});
		window.location.href = baseUri + 'products/?'+data;
	});
});

var ajaxCart = {
	overrideButtonsInThePage: function() {
		$(document).off('click', '.ajax_add_to_cart_button').on('click', '.ajax_add_to_cart_button', function(e) {
			e.preventDefault();
			var errors = [];
			var data_el = $(this).closest('.orditem_data');
			var loading_layer_el = data_el.find('.loading_layer_container .loading_layer');
			var idProduct = parseInt(data_el.data('id-product'));
			var idVariant = parseInt(data_el.data('id-variant'));
			var qty_input = data_el.find('.product_qty_input');
			var orditem_qty = (qty_input.length) ? parseInt(qty_input.val()) : 1;
			var qtyMin = parseInt(data_el.data('min-qty'));
			var qtyMax = parseInt(data_el.data('max-qty'));
			if (!qtyMin) {
				qtyMin = 0;
			}
			if(orditem_qty < qtyMin) {
				errors.push('Error: Minimum Quantity to buy this product is:'+qtyMin);
				qty_input.val(qtyMin);
			} else if(orditem_qty > qtyMax) {
				errors.push('Error: Maximum Quantity to buy this product is:'+qtyMax);
				qty_input.val(qtyMax);
			} else {
				ajaxCart.add(idProduct, idVariant, orditem_qty, qtyMax, $(this));
			}
			if(errors.length) {
				show_alerts_modal(errors);
			}
		});
		$(document).off('click', '.ajax_cart_block_remove_link').on('click', '.ajax_cart_block_remove_link', function(e) {
			e.preventDefault();
			var data_el = $(this).closest('.orditem_data');
			var orditem_uniqueid = data_el.data('orditem_uniqueid');
			ajaxCart.remove(orditem_uniqueid);
		});
		$(document).off('click', '.validate_coupon').on('click', '.validate_coupon', function(e) {
			e.preventDefault();
			var client_code_container = $(this).closest('.client_code_container');
			var client_code = client_code_container.find('input[name=client_code]').val();
			
			if (client_code != '') {
				ajaxCart.refreshCouponOptions(client_code);
			} else {
				var errors = [];
				errors.push("Error: Empty coupon Code");
				show_alerts_modal(errors);
			}
		});
		$(document).off('click', '.product_quantity_change').on('click', '.product_quantity_change', function(e) {
			e.preventDefault();
			var data_el = $(this).closest('.orditem_data');
			var changeType = $(this).data('type');
			var changeValue = 1;
			ajaxCart.refreshProductQtyInput(data_el, changeType, changeValue, $(this).hasClass('from_cart'));
		});
		$(document).on('change keyup', '.product_qty_input', function(e) {
			var data_el = $(this).closest('.orditem_data');
			var qtyInput = $(this);
			var currentValue = parseInt(qtyInput.val());
			var oldValue = parseInt(qtyInput.data('old-value'));
			if(currentValue != oldValue) {
				if(currentValue > oldValue) {
					var changeValue = currentValue - oldValue;
					var changeType = "up";
				} else if(currentValue < oldValue) {
					var changeValue = oldValue - currentValue;
					var changeType = "down";
				}
				ajaxCart.refreshProductQtyInput(data_el, currentValue, changeValue, $(this).hasClass('from_cart'));
			}
		});
		$(document).on('change', '.provariant_select', function(e) {
			var data_el = $(this).closest('.orditem_data');
			var idVariant = parseInt($(this).find(':selected').data('id-variant'));
			var qtyMin = parseInt($(this).find(':selected').data('min-qty'));
			var qtyMax = parseInt($(this).find(':selected').data('max-qty'));
			data_el.data('id-variant', idVariant);
			data_el.data('min-qty', qtyMin);
			data_el.data('max-qty', qtyMax);
			if(qtyMax >= qtyMin) {
				data_el.find('.add2cart_btn').removeClass('disabled').addClass('ajax_add_to_cart_button').html(addToCart);
			} else {
				data_el.find('.add2cart_btn').addClass('disabled').removeClass('ajax_add_to_cart_button').html(outOfStock);
			}
		});
		$(document).on('change', '#order_shipping_cityid', function(e) {
			var errors = [];
			SHIPPINGCITYID = parseInt($(this).val());
			if(SHIPPINGCITYID > 0) {
				//ajaxCart.refreshShippingCityCompanies(SHIPPINGCITYID);
				ajaxCart.refreshShippingCity(SHIPPINGCITYID);
			} else {
				errors.push("ERROR: Please Select Shipping City.");
				show_alerts_modal(errors);
			}
		});
		$(document).on('change', '#order_shipping_companyid', function(e) {
			var errors = [];
			SHIPPINGCOMPANYID = parseInt($(this).val());
			if(SHIPPINGCOMPANYID > 0) {
				ajaxCart.refreshShippingCompany(SHIPPINGCOMPANYID);
			} else {
				errors.push("ERROR: Please Select Shipping Company.");
				show_alerts_modal(errors);
			}
		});
	},
	refresh: function() {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: "json",
			data: 'refresh=1&ajax=true',
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				}
				ajaxCart.updateCart(jsonData);
			}
		});
	},
	add: function(idProduct, idVariant, orditem_qty, qtyMax, callerElement) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: "json",
			data: 'add2cart=1&ajax=true&orditem_qty='+orditem_qty+'&id='+idProduct+'&idVariant='+idVariant,
			beforeSend: function(jqXHR, settings) {
				callerElement.closest('.orditem_data').find('.loading_layer_container .loading_layer').css('display','flex');
			},
			success: function(jsonData, textStatus, jqXHR) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				} else {
					var itemImg = callerElement.closest('.orditem_data').find('.product-item-img-' + idProduct);		
					if(itemImg.length && $('#my_cart_btn').length) {
						flyToElement($(itemImg), $('#my_cart_btn'));
					}
					var qty_remaining = qtyMax - orditem_qty;
					$('.orditem_data_'+idProduct).each(function (){
						$(this).data('max-qty', qty_remaining);
					});
					if(callerElement.hasClass('buyNow')) {
						window.location.href = baseUri+'/cart/';
					} else {
						//$('#alertAdd2Cart').modal('show');
					}
				}
				ajaxCart.updateCart(jsonData);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: Impossible to add the product to the cart.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					callerElement.closest('.orditem_data').find('.loading_layer_container .loading_layer').css('display','none');
				}, 500);
			}
		});
	},
	remove: function(orditem_uniqueid) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: "json",
			data: 'delete_item=1&orditem_uniqueid=' + orditem_uniqueid + '&ajax=true',
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				} else {
					if (parseInt(jsonData.orders_items.length) == 0) {
						document.location.href = document.location.href;
					} else {
						$('#cart_orditem_'+orditem_uniqueid).fadeOut('slow', function() {
							$(this).remove();
						});
						$('#ajax_cart_orditem_'+orditem_uniqueid).fadeOut('slow', function() {
							$(this).remove();
						});
					}
				}
				ajaxCart.updateCart(jsonData);
			},
			error: function() {
				var errors = [];
				errors.push("ERROR: unable to delete the product");
				show_alerts_modal(errors);
			}
		});
	},
	update: function (data_el, newValue, qtyInput, changeType) {
		var orditem_uniqueid = data_el.data('orditem_uniqueid');
		var oldValue = qtyInput.data('old-value');
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: 'update_qty=1' + '&orditem_uniqueid=' + orditem_uniqueid +'&orditem_qty_new=' + newValue,
			beforeSend: function(jqXHR, settings) {
				$('#cart_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
					qtyInput.data('old-value', oldValue).val(oldValue);
				}
				if (jsonData.refresh) {
					window.location.href = window.location.href;
				}
				ajaxCart.updateCart(jsonData);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to update quantity.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#cart_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	},
	refreshCouponOptions: function(client_code) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: 'update_coupon=1' +'&client_code=' + client_code,
			beforeSend: function(jqXHR, settings) {
				$('#coupon_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				} else {
					$('input[name=client_code]').parent('.form-group').addClass('form-ok');
					var messages = [];
					messages.push("Success: Coupon applied");
					show_alerts_modal(messages, 'Success !');
				}
				ajaxCart.updateCart(jsonData);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to save coupon.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#coupon_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	
	},
	refreshPickupOptions: function (order_pickup) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: 'update_pickup=1' +'&order_pickup=' + order_pickup,
			beforeSend: function(jqXHR, settings) {
				$('#address_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				}
				ajaxCart.updateCart(jsonData);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to save pickup options.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#address_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	},
	refreshShippingCityCompanies: function (SHIPPINGCITYID) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri+'/ajax/get_shippings_companies.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: {
				SHIPPINGCITYID: SHIPPINGCITYID,
			},
			beforeSend: function(jqXHR, settings) {
				$('#address_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				} else {
					$('#order_shipping_companyid').empty();
					var shippings_companies = jsonData.shippings_companies;
					shippings_companies.forEach(function(item, index) {
						$('#order_shipping_companyid').append("<option value='"+item.SHIPPINGCOMPANYID+"'"+(index == 0 ? "selected" : "")+">"+item.shippingcompany_name+"</option>");						     
					});
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to get shipping companies.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#address_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	},
	refreshShippingCity: function (SHIPPINGCITYID) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: 'update_shipping_city=1' +'&SHIPPINGCITYID=' + SHIPPINGCITYID,
			beforeSend: function(jqXHR, settings) {
				$('#address_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				}
				ajaxCart.updateCart(jsonData);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to save Shipping City.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#address_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	},
	refreshShippingCompany: function (SHIPPINGCOMPANYID) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: 'update_shipping_company=1' +'&SHIPPINGCOMPANYID=' + SHIPPINGCOMPANYID,
			beforeSend: function(jqXHR, settings) {
				$('#address_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				}
				ajaxCart.updateCart(jsonData);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to save Shipping Company.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#address_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	},
	refreshRegistrationOptions: function (order_registration) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: 'update_registration=1' +'&order_registration=' + order_registration,
			beforeSend: function(jqXHR, settings) {
				$('#registration_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to update registrations options.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#registration_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	},
	refreshClientPhone: function(client_phone) {
		$.ajax({
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			url: baseUri + 'ajax/cart_update.php',
			async: false,
			cache: false,
			dataType: 'json',
			data: 'update_client_phone=1' + '&client_phone=' + client_phone,
			beforeSend: function(jqXHR, settings) {
				$('#registration_loading_layer_container .loading_layer').css('display','flex');
				$('.standard-checkout').css('display','none');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors);
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to save phone number.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#registration_loading_layer_container .loading_layer').css('display','none');
					$('.standard-checkout').css('display','block');
				}, 500);
			}
		});
	},
	refreshCheckoutBtn: function (order_registration) {
		var client_phone = $('input[name=client_phone]').val();
		if(ajaxCart.validatePhoneNumber(client_phone)){
			ajaxCart.refreshClientPhone(client_phone);
			$('.standard-checkout').removeClass('hide');
		} else {
			$('.standard-checkout').addClass('hide');
		}
	},
	validatePhoneNumber: function (client_phone) {
		var phone_valid = false;
		client_phone = client_phone.ArtoEn();
		client_phone = client_phone.replace(/[^0-9]/, '');
		if (client_phone.indexOf("002") == 0) {
		  client_phone = client_phone.slice(3);
		}
		if (client_phone.indexOf("2") == 0) {
		  client_phone = client_phone.slice(1);
		}
		if (client_phone != '' && (/*(client_phone.length == 10 && client_phone.startsWith("02")) ||*/ (client_phone.length == 11 && client_phone.startsWith("01")))) {
			phone_valid = true;
			$('input[name=client_phone]').val(client_phone);
		}
		return phone_valid;
	},
	updateCart: function(jsonData) {
		for (index = 0; index < jsonData.orders_items.length; ++index) {
			$('#orditem_totalprice_' + jsonData.orders_items[index].orditem_uniqueid).html(parseFloat(jsonData.orders_items[index].orditem_totalprice) + currencySign);
			$('#product_qty_input_' + jsonData.orders_items[index].orditem_uniqueid).val(parseInt(jsonData.orders_items[index].orditem_qty));
		}
		
		$('.ajax_order_sub_total').text(jsonData.order_sub_total + currencySign);
		$('.ajax_order_coupon_discount').text(jsonData.order_coupon_discount + currencySign);
		$('.ajax_cart_shipping_cityname').text(jsonData.order_shipping_cityname);
		$('.ajax_order_shipping_fees').text(jsonData.order_shipping_fees + currencySign);
		$('.ajax_order_taxes_total').html(parseFloat(jsonData.order_taxes_total) + currencySign);
		$('.ajax_order_total').text(jsonData.order_total + currencySign);
		
		$('.ajax_cart_quantity').text(jsonData.total_products);
		$('.ajax_cart_list').empty();
		$('.ajax_cart_list').append(jsonData.cart_mini_list);
		$('.ajax_cart_shipping_vendors').empty();
		$('.ajax_cart_shipping_vendors').append(jsonData.cart_shipping_vendors_list);
		$('.ajax_cart_list .unvisible').slideDown(450).removeClass('unvisible');
	},
	refreshProductQtyInput: function (data_el, changeType, changeValue, from_cart) {
		var errors = [];
		var hasError = false;
		var idProduct = parseInt(data_el.data('id-product'));
		var idVariant = parseInt(data_el.data('id-variant'));
		var qtyMax = parseInt(data_el.data('max-qty'));
		var qtyMin = parseInt(data_el.data('min-qty'));
		var qtyInput = data_el.find('.product_qty_input');
		var currentValue = parseInt(qtyInput.val());
		if(changeType == "up") {
			var newValue = currentValue + changeValue;
			if (!isNaN(newValue) && newValue <= qtyMax) {
				$('.layer_cart_qty_'+idProduct).each(function (){
					$(this).val(newValue);
					$(this).data('old-value', newValue);
				});
			} else {
				qtyInput.val(qtyMax);
				qtyInput.data('old-value', qtyMax);
				hasError = true;
				errors.push('Error: Maximum Quantity to buy this product is:'+qtyMax);
			}
		} else if(changeType == "down") {
			var newValue = currentValue - changeValue;
			if (!isNaN(newValue) && newValue >= qtyMin) {
				$('.layer_cart_qty_'+idProduct).each(function (){
					$(this).val(newValue);
					$(this).data('old-value', newValue);
				});
			} else {
				qtyInput.val(qtyMin);
				qtyInput.data('old-value', qtyMin);
				hasError = true;
				errors.push('Error: Minimum Quantity to buy this product is:'+qtyMin);
			}
		}
		if(hasError) {
			show_alerts_modal(errors);
		} else {
			if (from_cart) {
				ajaxCart.update(data_el, newValue, qtyInput, changeType);
			}
		}
	}
};

// Function to update URL parameters
function updateURLParameter(url, key, value) {
    var urlObj = new URL(url);
    var searchParams = urlObj.searchParams;

    // Check if the parameter already exists
    if (searchParams.has(key)) {
        searchParams.set(key, value); // Update the value
    } else {
        searchParams.append(key, value); // Add the parameter
    }

    // Convert searchParams back to string
    var newParamsString = searchParams.toString();

    // Update the URL
    var newURL = urlObj.origin + urlObj.pathname + '?' + newParamsString + urlObj.hash;

    return newURL;
}

function removeURLParameter(url, keyToRemove) {
    var urlObj = new URL(url);
    var searchParams = urlObj.searchParams;

    // Remove the parameter if it exists
    if (searchParams.has(keyToRemove)) {
        searchParams.delete(keyToRemove);
    }

    // Convert searchParams back to string
    var newParamsString = searchParams.toString();

    // Update the URL
    var newURL = urlObj.origin + urlObj.pathname + '?' + newParamsString + urlObj.hash;

    return newURL;
}

$(document).ready(function() {
	$('select.filter_input').on('change', function() {
		var currentURL = window.location.href;
		var filterKey = $(this).data('filter');
		var filterValue = $(this).val();
		var updatedURL = currentURL;
		
		if(filterKey === 'brands')
		{
			if(filterValue > 0) {
				updatedURL = updateURLParameter(currentURL, filterKey, filterValue);
			} else {
				updatedURL = removeURLParameter(currentURL, filterKey);
			}
		}
		
		if(filterKey === 'sortBy')
		{
			var acceptedValues = ["","price_low", "price_high", "newest", "oldest", "alphabetic"];
			if(acceptedValues.indexOf(filterValue) !== -1) {
				updatedURL = updateURLParameter(currentURL, filterKey, filterValue);
			}
		}
		
		window.location.href = updatedURL;
	});
	$(document).on('click', '#submitNewReview', function(e) {
		e.preventDefault();
		$.ajax({
			url: baseUri + 'ajax/products_review.php',
			data: $('#NewReviewForm').serialize(),
			type: 'POST',
			headers: {
				"cache-control": "no-cache"
			},
			dataType: "json",
			beforeSend: function(jqXHR, settings) {
				$('#review_loading_layer_container .loading_layer').css('display','flex');
			},
			success: function(jsonData) {
				if (jsonData.hasError) {
					show_alerts_modal(jsonData.errors, '', jsonData.modal_action, jsonData.modal_action_label, jsonData.modal_action_url);
				} else {
					var messages = [];
					messages.push("Success: Your review was sent successfully and waiting moderation .");
					show_alerts_modal(messages, 'Success !');
					$('#NewReviewForm')[0].reset()
					/*$('#NewReviewForm').find("input[type=text], input[type=password], textarea").val("");*/
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if (textStatus !== 'abort') {
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to save review.");
					show_alerts_modal(errors);
				}
			},
			complete: function(jqXHR, textStatus){
				setTimeout(function(){
					$('#review_loading_layer_container .loading_layer').css('display','none');
				}, 500);
			}
		});
	});
});

if($('#loadmore_data').length) {
	var loadmore = true;
	var loadmore_script = $('#loadmore_data').data('loadmore_script');
	var loadmore_page = parseInt($('#loadmore_data').data('loadmore_page'));
	var loadmore_additional_query = $('#loadmore_data').data('loadmore_additional_query');
	$(window).scroll(function() {
		var loadmore_top = $('#loadmore_loading').offset().top;
		var loadmore_height = $('#loadmore_loading').outerHeight();
		var window_height = $(window).height();
		var window_scroll = $(this).scrollTop();
		if (window_scroll > (loadmore_top + loadmore_height - window_height - 300) && loadmore == true && loadmore_page >= 2) {
			var ajax_data = 'page='+loadmore_page+'&'+loadmore_additional_query;
			loadmore = false;
			$.ajax({
				type: 'POST',
				headers: {
					"cache-control": "no-cache"
				},
				url: baseUri + 'ajax/'+loadmore_script,
				async: false,
				cache: false,
				dataType: "json",
				data: ajax_data,
				tryCount : 0,
				retryLimit : 5,
				success: function(jsonData) {
					if(jsonData.loadmore_items != '') {
						$('#loadmore_list').append(jsonData.loadmore_items);
						if(jsonData.loadmore_continue)
						{
							loadmore_page ++;
							$('#loadmore_data').data('loadmore_page', loadmore_page);
							loadmore = true;
						} else {
							$('#loadmore_loading').addClass('hide');
							$('#loadmore_finished').removeClass('hide');
						}
					} else {
						$('#loadmore_loading').addClass('hide');
						$('#loadmore_finished').removeClass('hide');
					}
				},
				error: function(xhr, textStatus, errorThrown ) {
					var error_text = '';
					if (textStatus == 'timeout') {
						var error_text = 'ERROR: Request Timed Out during loading more data	!';
					} else if (xhr.status == 500) {
						var error_text = 'ERROR: Internal Server Error during loading more data !';
					} else {
						var error_text = 'ERROR: Undefined error during loading more data !';
					}
					
					if(error_text != '') {
						this.tryCount++;
						if (this.tryCount <= this.retryLimit) {
							$.ajax(this);
							return;
						}
						$('#loadmore_loading').addClass('hide');
						$('#loadmore_retry').removeClass('hide');
					}
				}
			});
		}
	});
}

/* Show Alerts */
function show_alerts_modal(errors, title = "Something is wrong") {
	errors_len = errors.length;
	errors_html = '';
	if(errors_len != 0) {
		for (var i = 0; i < errors_len; i++) {
		  errors_html = errors_html + '<li>' + errors[i] + '</li>';
		}
		$('#alertError .modal-title').html(title);
		$('#alertError .modal-body .list-unstyled').html(errors_html);
		$('#alertError').modal('show');
	}
}
$(document).on('hidden.bs.modal', function (event) {
  if ($('.modal:visible').length) {
    $('body').addClass('modal-open');
  }
});

//English to Arabic digits.
String.prototype.EntoAr= function() {
	return this.replace(/\d/g, d =>  '٠١٢٣٤٥٦٧٨٩'[d]);
}

//Arabic to English digits.
String.prototype.ArtoEn= function() {
	return this.replace(/[\u0660-\u0669]/g, d => d.charCodeAt() - 1632);
}

$(document).ready(function() {
	onloadCaptchaCallback = function() {
		for (i = 0; i < captcha_input.length; i++) {
			var $capthcaItem = $(captcha_input[i]);

			grecaptcha.render(
				$capthcaItem.attr('id'), {
					sitekey: $capthcaItem.attr('data-sitekey'),
					size: $capthcaItem.attr('data-size') ? $capthcaItem.attr('data-size') : 'normal',
					theme: $capthcaItem.attr('data-theme') ? $capthcaItem.attr('data-theme') : 'light',
					callback: function(e) {
						$('.recaptcha').trigger('propertychange');
					}
				}
			);
			$capthcaItem.after("<span class='form-validation'></span>");
		}
	};
	var captcha_input = $(".recaptcha");
	if (captcha_input.length) {
		$.getScript("//www.google.com/recaptcha/api.js?onload=onloadCaptchaCallback&render=explicit&hl=en");
	}
});

$(function() {
	$(".ajax_form input,.ajax_form textarea,.ajax_form select").not("[type=submit]").jqBootstrapValidation({
		preventSubmit: true,
		submitError: function($form, event, errors) {
			// additional error messages or events
		},
		submitSuccess: function($form, event) {
			event.preventDefault();
			$formData = new FormData($form[0]);
			$this = $form.find('[type=submit]');
			$this.prop("disabled", true); // Disable submit button until AJAX call is complete to prevent duplicate messages
			$.ajax({
				type: "POST",
				headers: {
					"cache-control": "no-cache"
				},
				cache: false,
				async: true,
				dataType: "json",
				contentType: false,
				processData: false,
				url: $form.attr('action'),
				data: $formData,
				beforeSend: function(jqXHR, settings) {
					$form.find('.loading_layer_container .loading_layer').css('display','flex');
					$form.find('.loading_layer_container .loading_layer').addClass('active');
				},
				success: function(jsonData) {
					if (jsonData.hasError == false) {
						show_alerts_modal(jsonData.messages, 'Success !');
						$form.trigger("reset");
						if(jsonData.hasRedirect) {
							setTimeout(function() {
								$(location).attr('href',jsonData.redirectUrl);
							}, 5000);
						}
					} else if (jsonData.hasError == true){
						show_alerts_modal(jsonData.errors);
					}
					if($form.find('.recaptcha').length) {
						grecaptcha.reset();
					}
				},
				error: function() {
					// Fail message
					var errors = [];
					errors.push("TECHNICAL ERROR: unable to send contact form.");
					show_alerts_modal(errors);
				},
				complete: function() {
					setTimeout(function() {
						$this.prop("disabled", false); // Re-enable submit button when AJAX call is complete
					}, 1000);
					setTimeout(function(){
						$form.find('.loading_layer_container .loading_layer').css('display','none');
					}, 500);
				}
			});
		},
		filter: function() {
			return $(this).is(":visible");
		},
	});

	$("a[data-toggle=\"tab\"]").click(function(e) {
		e.preventDefault();
		$(this).tab("show");
	});
});

function flyToElement(flyer, flyingTo) {
	var $func = $(this);
	var divider = 3;
	var flyerClone = $(flyer).clone();
	$(flyerClone).css({'max-width': $(flyer).width(), 'overflow': 'hidden', 'position': 'absolute', 'top': $(flyer).offset().top + "px", 'left': $(flyer).offset().left + "px", 'opacity': 1, 'z-index': 1000});
	$('body').append($(flyerClone));
	var gotoY = $(flyingTo).offset().top + ($(flyingTo).height() / 2) - ($(flyer).height()/divider)/2;
	var gotoX = $(flyingTo).offset().left + ($(flyingTo).width() / 2) - ($(flyer).width()/divider)/2;
	if(gotoX < 0) {
		gotoX = 0;
	}
	if(gotoY < 0) {
		gotoY = 0;
	}
	
	var animateTo = ($(flyingTo).offset().left > $(flyingTo).offset().right) ? 'right' : 'left';
	animateTo = 'left';
	$(flyerClone).animate({
		opacity: 0.4,
		left: gotoX,
		top: gotoY,
		width: $(flyer).width()/divider,
		height: $(flyer).height()/divider
	}, 700,
	function () {
		$(flyingTo).fadeOut('fast', function () {
			$(flyingTo).fadeIn('fast', function () {
				$(flyerClone).fadeOut('fast', function () {
					$(flyerClone).remove();
				});
			});
		});
	});
}