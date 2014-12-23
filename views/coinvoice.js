define([
	'jquery', 
	'underscore', 
	'backbone', 
	'models/wordlist', 
	'models/crypto', 
	'models/qrcode',
	'models/bitcoin',
], function($, _, Backbone, WordList, crypto, qrcode, Bitcoin){
	currencies = [{'code':'AED','name':'United Arab Emirates Dirham'},{'code':'ARS','name':'Argentine Peso'},{'code':'AUD','name':'Australian Dollar'},{'code':'BGN','name':'Bulgarian Lev'},{'code':'BND','name':'Brunei Dollar'},{'code':'BOB','name':'Bolivian Boliviano'},{'code':'BRL','name':'Brazilian Real'},{'code':'CAD','name':'Canadian Dollar'},{'code':'CHF','name':'Swiss Franc'},{'code':'CLP','name':'Chilean Peso'},{'code':'CNY','name':'Chinese Yuan Renminbi'},{'code':'COP','name':'Colombian Peso'},{'code':'CZK','name':'Czech Republic Koruna'},{'code':'DKK','name':'Danish Krone'},{'code':'EGP','name':'Egyptian Pound'},{'code':'EUR','name':'Euro'},{'code':'FJD','name':'Fijian Dollar'},{'code':'GBP','name':'British Pound Sterling'},{'code':'HKD','name':'Hong Kong Dollar'},{'code':'HRK','name':'Croatian Kuna'},{'code':'HUF','name':'Hungarian Forint'},{'code':'IDR','name':'Indonesian Rupiah'},{'code':'ILS','name':'Israeli New Sheqel'},{'code':'INR','name':'Indian Rupee'},{'code':'JPY','name':'Japanese Yen'},{'code':'KES','name':'Kenyan Shilling'},{'code':'KRW','name':'South Korean Won'},{'code':'LTL','name':'Lithuanian Litas'},{'code':'MAD','name':'Moroccan Dirham'},{'code':'MXN','name':'Mexican Peso'},{'code':'MYR','name':'Malaysian Ringgit'},{'code':'NOK','name':'Norwegian Krone'},{'code':'NZD','name':'New Zealand Dollar'},{'code':'PEN','name':'Peruvian Nuevo Sol'},{'code':'PHP','name':'Philippine Peso'},{'code':'PKR','name':'Pakistani Rupee'},{'code':'PLN','name':'Polish Zloty'},{'code':'RON','name':'Romanian Leu'},{'code':'RSD','name':'Serbian Dinar'},{'code':'RUB','name':'Russian Ruble'},{'code':'SAR','name':'Saudi Riyal'},{'code':'SEK','name':'Swedish Krona'},{'code':'SGD','name':'Singapore Dollar'},{'code':'THB','name':'Thai Baht'},{'code':'TRY','name':'Turkish Lira'},{'code':'TWD','name':'New Taiwan Dollar'},{'code':'UAH','name':'Ukrainian Hryvnia'},{'code':'USD','name':'US Dollar'},{'code':'VEF','name':'Venezuelan Bolí­var Fuerte'},{'code':'VND','name':'Vietnamese Dong'},{'code':'ZAR','name':'South African Rand'}];
	var Coinvoice = Backbone.View.extend({
		el: $('#contents'), 
		template: "\
			<form role='form'>\
				<div class='form-group row'>\
					<div class='col-xs-12'>\
						<h5>This tool just makes a QR code for a bitcoin payment in a currency</h5>\
					</div>\
				</div>\
				<div class='form-group'>\
					<label for='address'>Bitcoin address to send the funds to:</label>\
					<input type='text' class='form-control' name='btc address' id='address' placeholder='enter your BTC address here' />\
				</div>\
				<div class='form-group'>\
					<label for='amount'>How many fiat:</label>\
					<input type='text' class='form-control' name='btc address' id='fiat' placeholder='enter fiat amount' />\
				</div>\
				<div class='form-group'>\
					<label for='currency'>Currency Code:</label>\
					<select id='currency'>\
						<% _.each(currencies, function(currency, index) {%> \
							<option><%=currency.code%></option>\
						<%})%>\
					</select>\
				</div>\
				<br>\
				<br>\
				<div class='text-left' id='label-address'></div>\
				<div class='text-left' id='label-privkey'></div>\
				<div class='col-xs-6' id='qrcode-address-image'></div>\
				 <div id='reader' style='width:300px;height:250px'>\
			</form>\
			<br>\
			<div class='col-xs-12'>\
			<h6>Use at your own risks, if you find this application useful, you can buy us a coffee at 1LPUpS4nc2mo63GvgBxrUSJ6y3xumqzWSW</h6>\
			</div>\
		", 
		events: {
			'click select[id=currency]': 'updateRate', 
			'keyup input[id=address]': 'deleteResults', 
			'keyup input[id=fiat]': 'deleteResults'

		}, 

		getParameterByName: function(name) {
		    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		        results = regex.exec(location.search);
		    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		},

		render: function() {
			var address = this.getParameterByName('address');
			var currency = this.getParameterByName('currency');
			this.$el.html(_.template(this.template));
			$('input[id=address]').val(address);
			$('select[id=currency]').val(currency);	
			this.getRate("USD",currency);

			$.getJSON('http://api.coindesk.com/v1/bpi/currentprice.json', function(data) {
				btcUsd = (data.bpi.USD.rate);
				}).done(
				)
			;

			
		},

		updateRate: function() {
			currency = $('select[id=currency]', this.$el).val();
			this.getRate("USD",currency);
			return $().promise
		},

		random: function() {

				$('input[name=passphrase]', this.$el).val(
					WordList.random($('select[name=count_words]', this.$el).val())
				);

		}, 

		deleteResults: function() {

			$('div[id=qrcode-address-image]').text('');
			$('div[id=qrcode-privkey-image]').text('');
			this.generate();

			//$('div[id=label-address]').text('');
			//$('div[id=label-privkey]').text('');
			//$('div[id=text-address]').text('');
			//$('div[id=text-privatekey]').text('');

		}, 

 		getRate: function(from, to) {
 			master = this;
 			//console.log(this.httpGet('http://www.bitstamp.net/api/ticker'));
 			insertReply = function (content) {
 				rate = content.rate;
 				if (btcUsd) {
 					master.deleteResults()
 				}
			}

			// create script element
			var script = document.createElement('script');
			// assing src with callback name
			
			script.src = 'http://rate-exchange.appspot.com/currency?from=' + from + '&to=' + to + '&format=json&callback=insertReply';
			//script.src = 'https://api.coindesk.com/v1/bpi/currentprice.json?callback=insertReply';	

			// insert script to document and load content
			document.body.appendChild(script);
		},


//GET http://www.bitstamp.net/api/ticker/

		deleteIfChanged: function() {

			if (
				this.passphraseMemory!=$('input[name=passphrase]', this.$el).val() |
				this.saltMemory!=$('input[name=email]', this.$el).val()
				){
					this.deleteResults()
				}

		}, 

		generate: function() {
			//this.deleteResults();
			if ($('select[id=currency]', this.$el).val() != currency) {
				this.updateRate().done()
			}

			var address = $('input[id=address]', this.$el).val()
			var fiat = $('input[id=fiat]', this.$el).val()

			if (true) {

				//if (cryptoscrypt.validPkey(address)) { return };

				//.deleteResults()

				var qrcode = new QRCode("qrcode-address-image", {width: 160, height: 160,correctLevel : QRCode.CorrectLevel.L});
				var amount = Math.floor(10000*(fiat / (rate*btcUsd)))/10000;
				var result = 'bitcoin://'+address+'?amount='+amount;
				
				qrcode.makeCode(result);
				

				//$('div[id=label-address]').text(curren);
				rateperone = Math.floor(10000*rate*btcUsd)/10000;
				$('div[id=label-privkey]').text(amount+' BTC with 1 BTC = '+(rateperone)+' '+currency);
				
				//$('div[id=text-privkey]').text('Public Bitcoin zrezer: '+amount);
				/*
				$('div[id=label-address]').text('Public Bitcoin Address: '+result[1]);
				$('div[id=label-privkey]').text('Secret Private key: '+result[0]);
				$('div[id=text-address]').text("Address");
				$('div[id=text-privatekey]').text("Private Key");
				*/
			}
		}
	});

	return Coinvoice;
});
