define([
	'jquery', 
	'underscore', 
	'backbone', 
	'models/wordlist', 
	'models/crypto', 
	'models/qrcode',
	'models/bitcoin'
], function($, _, Backbone, WordList, crypto, Bitcoin){

	var VaultView = Backbone.View.extend({
		el: $('#contents'), 
		template: "\
			<form role='form'>\
				<div class='form-group row'>\
					<div class='col-xs-2'>\
						<label>Passphrase</label>\
					</div>\
					<div class='col-xs-6'>\
						<input type='text' class='form-control' name='passphrase' placeholder='Type your passphrase here' />\
					</div>\
					<div class='col-xs-2'>\
						<select class='form-control' name='count_words'>\
							<option value='1'>1</option>\
							<option value='2'>2</option>\
							<option value='3'>3</option>\
							<option selected value='4'>4</option>\
							<option value='5'>5</option>\
							<option value='6'>6</option>\
							<option value='7'>7</option>\
							<option value='8'>8</option>\
						</select>\
					</div>\
					<div class='col-xs-2'>\
						<button type='button' class='btn btn-primary btn-random'>Random</button>\
					</div>\
				</div>\
				<div class='form-group row'>\
					<div class='col-xs-2'>\
						<label>Email</label>\
					</div>\
					<div class='col-xs-10'>\
						<input type='text' class='form-control' name='email' placeholder='Enter your email/salt here' />\
					</div>\
				</div>\
				<button type='button' class='btn btn-primary btn-generate'>Generate Vault</button>\
				<br>\
				<br>\
				<div class='text-left' id='label-address'></div>\
				<div class='text-left' id='label-privkey'></div>\
				<div class='row text-center'>\
					<div class='col-xs-6 h3' id='text-address'></div>\
					<div class='col-xs-6 h3' id='text-privatekey'></div>\
					<div class='col-xs-6' id='qrcode-address-image'></div>\
					<div class='col-xs-6' id='qrcode-privkey-image'></div>\
				</div>\
			</form>\
		", 
		events: {
			'click .btn-random': 'random', 
			'click .btn-generate': 'generate', 
			'keyup input[name=passphrase]': 'deleteIfChanged', 
			'keyup input[name=email]': 'deleteIfChanged'
		}, 
		render: function() {
			this.$el.html(_.template(this.template));
		}, 
		random: function() {
				$('input[name=passphrase]', this.$el).val(
					WordList.random($('select[name=count_words]', this.$el).val())
				);
		}, 
		deleteResults: function() {
			$('div[id=qrcode-address-image]').text('');
			$('div[id=qrcode-privkey-image]').text('');
			$('div[id=label-address]').text('');
			$('div[id=label-privkey]').text('');
			$('div[id=text-address]').text('');
			$('div[id=text-privatekey]').text('');
		}, 
		deleteIfChanged: function() {
			if (
				this.passphraseMemory!=$('input[name=passphrase]', this.$el).val() |
				this.saltMemory!=$('input[name=email]', this.$el).val()
				){
					this.deleteResults()
				}
		}, 
		generate: function() {

			this.passphraseMemory = $('input[name=passphrase]', this.$el).val()
			this.saltMemory = $('input[name=passphrase]', this.$el).val()

			if (cryptoscrypt.validPkey(this.passphraseMemory)) { return };

			this.deleteResults()
			var qrcode = new QRCode("qrcode-address-image", {width: 160, height: 160,correctLevel : QRCode.CorrectLevel.L});
			var qrcode2 = new QRCode("qrcode-privkey-image", {width: 160, height: 160, correctLevel : QRCode.CorrectLevel.L});

			var result = cryptoscrypt.warp(
				$('input[name=passphrase]', this.$el).val(), 
				$('input[name=email]', this.$el).val()
			);    

			qrcode.makeCode(result[1]);
			qrcode2.makeCode(result[0]);

			$('div[id=label-address]').text('Public Bitcoin Address: '+result[1]);
			$('div[id=label-privkey]').text('Secret Private key: '+result[0]);
			$('div[id=text-address]').text("Address");
			$('div[id=text-privatekey]').text("Private Key");
		}
	});

	return VaultView;
});

function jQuery(query, scope) {
	// look for 'query' element within 'scope'
}
