define([
	'jquery', 
	'underscore', 
	'backbone', 
	'models/qrcode',
	'models/transaction',
	'models/currencylist'
], function($, _, Backbone, qrcode, Transaction, CurrencyList){
	var currency = '';
	var rate = 0;
	var btcUsd = 0;
	var thumb = '';
	var onename = '';
	var address = '';
	var title = '';
	var fiat = 0;
	var amount = 0;
	var Coinvoice = Backbone.View.extend({
		el: $('#contents'),
		template: _.template("\
			<%currencies = [{'code':'BTC','name':'Bitcoin'},{'code':'AED','name':'United Arab Emirates Dirham'},{'code':'ARS','name':'Argentine Peso'},{'code':'AUD','name':'Australian Dollar'},{'code':'BGN','name':'Bulgarian Lev'},{'code':'BND','name':'Brunei Dollar'},{'code':'BOB','name':'Bolivian Boliviano'},{'code':'BRL','name':'Brazilian Real'},{'code':'CAD','name':'Canadian Dollar'},{'code':'CHF','name':'Swiss Franc'},{'code':'CLP','name':'Chilean Peso'},{'code':'CNY','name':'Chinese Yuan Renminbi'},{'code':'COP','name':'Colombian Peso'},{'code':'CZK','name':'Czech Republic Koruna'},{'code':'DKK','name':'Danish Krone'},{'code':'EGP','name':'Egyptian Pound'},{'code':'EUR','name':'Euro'},{'code':'FJD','name':'Fijian Dollar'},{'code':'GBP','name':'British Pound Sterling'},{'code':'HKD','name':'Hong Kong Dollar'},{'code':'HRK','name':'Croatian Kuna'},{'code':'HUF','name':'Hungarian Forint'},{'code':'IDR','name':'Indonesian Rupiah'},{'code':'ILS','name':'Israeli New Sheqel'},{'code':'INR','name':'Indian Rupee'},{'code':'JPY','name':'Japanese Yen'},{'code':'KES','name':'Kenyan Shilling'},{'code':'KRW','name':'South Korean Won'},{'code':'LTL','name':'Lithuanian Litas'},{'code':'MAD','name':'Moroccan Dirham'},{'code':'MXN','name':'Mexican Peso'},{'code':'MYR','name':'Malaysian Ringgit'},{'code':'NOK','name':'Norwegian Krone'},{'code':'NZD','name':'New Zealand Dollar'},{'code':'PEN','name':'Peruvian Nuevo Sol'},{'code':'PHP','name':'Philippine Peso'},{'code':'PKR','name':'Pakistani Rupee'},{'code':'PLN','name':'Polish Zloty'},{'code':'RON','name':'Romanian Leu'},{'code':'RSD','name':'Serbian Dinar'},{'code':'RUB','name':'Russian Ruble'},{'code':'SAR','name':'Saudi Riyal'},{'code':'SEK','name':'Swedish Krona'},{'code':'SGD','name':'Singapore Dollar'},{'code':'THB','name':'Thai Baht'},{'code':'TRY','name':'Turkish Lira'},{'code':'TWD','name':'New Taiwan Dollar'},{'code':'UAH','name':'Ukrainian Hryvnia'},{'code':'USD','name':'US Dollar'},{'code':'VEF','name':'Venezuelan Bolí­var Fuerte'},{'code':'VND','name':'Vietnamese Dong'},{'code':'ZAR','name':'South African Rand'}];%>\
			<form role='form'>\
				<div class='form-group row'>\
					<div class='col-xs-12'>\
						<h5>This tool just makes a QR code for a bitcoin payment denominated in a fiat currency</h5>\
						<h5>Use Onename for a picture inside the QR code</h5>\
					</div>\
				</div>\
				<div class='form-group'>\
					<label for='address'>Bitcoin address or <a href='http://www.onename.io'>Onename</a> to send the funds to:</label>\
					<input type='text' class='form-control' name='btc address' id='address' placeholder='enter your BTC address here' value='<%= address %>' />\
				</div>\
				<div class='form-group'>\
					<label for='amount'>How many fiat:</label>\
					<input type='text' class='form-control' name='btc address' id='fiat' placeholder='enter fiat amount' />\
				</div>\
				<div class='form-group'>\
					<label for='currency'>Currency Code:</label>\
					<select id='currency'>\
						<% _.each(currencies, function(currencyi, index) {%> \
							<option <%=currencyi.code==(currency || 'USD') && 'selected'%>><%=currencyi.code%></option>\
						<%})%>\
					</select>\
				</div>\
				<div class='text-left' id='link'></div>\
				<div class='text-left' id='label-address'></div>\
				<div class='text-left' id='legend'></div>\
				<div class='' id='title' style='font-weight:bold'><%=title%></div>\
				<div class='col-xs-6' id='qrcode-address-image'></div>\
				 <div id='reader' style='width:300px;height:250px'>\
			</form>\
			</div>\
			<div class='col-xs-12'>\
			<h6>Use at your own risks, if you find this application useful, you can buy us a coffee at 1LPUpS4nc2mo63GvgBxrUSJ6y3xumqzWSW</h6>\
			</div>\
		"), 
		events: {
			'click select[id=currency]': 'updateRate', 
			'keyup input[id=fiat]': 'updatePage',
			'blur input[id=address]': 'lookupFromInput',
		}, 

// VIEWS

		// Called at page initialization
		render: function() {

			// Get parameters
			//this.address = this.getParameterByName('address');
			this.currency = this.getParameterByName('currency');
			this.title = this.getParameterByName('title');
			this.onename = this.getParameterByName('onename');

			// Render the page
			this.$el.html(this.template({ 
				address: this.address,
				currency: this.currency,
				title: this.title
			}));

			// If onename is specified, resolve it and update the page
			if (this.onename) {
				this.lookupOnename(this.onename).done(function(data) {
					if (master.address & (data.address != master.address)) {
						window.alert("The address specified in the link wasn't the same as the one resolved by Onename. Onename's address will be kept, please double check and be very careful!");
					}

					$('input[id=address]').val(data.address);
					master.address = data.address;
					master.thumb = data.avatar;
				});
			};

			this.updateRate();
		},

		//Called by render and event click currency
		updateRate: function() {

			master = this;

			//Get currency and amount

			this.currency = $('select[id=currency]', this.$el).val();
			this.fiat = $('input[id=fiat]', this.$el).val();

			//special case for BTC since it is not resolved by https://rate-exchange.appspot.com
			if (this.currency == 'BTC') {
				master.btcUsd = 1;
				master.rate = 1;
				master.updateLink();
				return
			};

			//Get Rates into btcUsd and rate, when it is done, update the page
			this.getFiatRate("USD",this.currency).done(function(data){
				master.rate = data.result;
				master.getBtcRate().done(function(data){
					master.btcUsd = data.result;
					master.updateLink();
					master.updateLegend();
				});
			});
		},

		// Called by event inputAddress
		lookupFromInput: function() {
			var master = this;
			var input = $('input[id=address]').val();

			// if it is an address, no need for looking it up on onename
			if (cryptoscrypt.validAddress(address) == true) {
				this.address = address;
				master.updatePage();
				console.log('updatepagecalled now');
	    		return
			};

			// if it is not an address, then it must be a onename ID
			this.onename = input;
			this.lookupOnename(this.onename).done(function(data) {
				master.address = data.address;
				$('input[id=address]').val(master.address);
				master.thumb = data.avatar;
				master.updatePage();
			});
		},

		// Called in updateRate and updatePage
		updateLink: function() {
			var link = 'http://www.easy-btc.org/?address=' + this.address + '&currency=' + this.currency + '&onename=' + this.onename + '#coinvoice';
			$('div[id=link]').html("<a href=" + link + ">Your Link</a>");
		},

		// Called in lookupFromInput and even input fiat (keydown)
		updatePage: function() {
			console.log('updatepagecalled');
			var master = this;

			//gather data from page
			this.fiat = $('input[id=fiat]').val();
			this.amount = Math.floor(10000 * (this.fiat / (this.rate * this.btcUsd))) / 10000;

			//build the link
			this.updateLink();
			this.updateLegend();
			//erasing the qrcode
			$('div[id=qrcode-address-image]').text('');
			$('div[id=qrcode-privkey-image]').text('');

			this.makeQrCode();
	
			//Get the image and draw it
			if (master.thumb && master.thumb.url) {
				this.getImage(master.thumb.url).done(function(data) {
					master.imageSrc = data;
					master.drawThumb
				})
			}
		}, 
		// Called in updatePage and updateRate
		updateLegend: function() {

			var ratePerBTC = this.rate * this.btcUsd;

			this.amount = Math.floor(10000 * this.fiat / ratePerBTC)/10000;
			if ((this.address == '') | (this.amount == 0) | (ratePerBTC == 0)) {
				return
			};

			var legend = (this.amount + ' BTC with 1 BTC = ' + (ratePerBTC) + ' ' + this.currency)
			$('div[id=legend]').text( legend );

		},

		// Called in updateQr
		makeQrCode: function() {

			var qrcode = new QRCode("qrcode-address-image", { width: 160, height: 160, correctLevel: QRCode.CorrectLevel.H });
			var result = 'bitcoin://' + this.address + (this.amount ? '?amount=' + this.amount : '');

			qrcode.makeCode(result);

			if (this.thumb) {
				this.drawThumb()
			};
		},

		// Called in updatePage
		drawThumb: function() {

			var image = this.imageSrc ? this.imageSrc : new Image()
			var ctx = $('canvas')[0].getContext('2d');
			image.src = this.thumb.url;
			console.log(this.imageSrc);	
			ctx.drawImage(image, 60, 60, 40, 40);
		},

//MODELS

		// Called in render, lookupFromInput
		lookupOnename: function(onename) {
			var def = $.Deferred();
			var master = this;
			$.getJSON('https://onename.io/' + this.onename + '.json')
			.done(function(data) {
				def.resolve({
					address:data.bitcoin.address ? data.bitcoin.address : '',
					avatar:data.avatar ? data.avatar : ''
				});
			})
			return def;
		},

		// Called in updateRate
 		getFiatRate: function(from, to) {

 			var master = this;
			var def = $.Deferred();

			$.getJSON('https://rate-exchange.appspot.com/currency?from=' + from + '&to=' + to + '&callback=?')
			.done(function(data) { 
				def.resolve({
					result:data.rate
				});
			});
			return def;
		},

		// Called in updateRate
 		getBtcRate: function() {

 			var master = this;
			var def = $.Deferred();
			$.getJSON('http://api.coindesk.com/v1/bpi/currentprice.json')
			.done(function(data) { 
				def.resolve({
					result:data.bpi.USD.rate
				});
			});
			return def;
		},

		// Called in updatePage
 		getImage: function(url) {
 			var ctx = $('canvas')[0].getContext('2d');
 			var master = this;
 			var image = new Image();
			var def = $.Deferred();
			image.src = url;
			image.onload = function() {
				def.resolve(
					image
				);
				ctx.drawImage(image, 60, 60, 40, 40);
			};
			image.onerror = def.reject;
			return def;
		},

		// Called in render
		getParameterByName: function(name) {
		    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		        results = regex.exec(location.search);
		    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		},

	});

	return Coinvoice;

});
