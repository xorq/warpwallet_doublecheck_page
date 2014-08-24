define([
	'jquery',
	'underscore',
	'backbone',
	'models/wordlist',
	'models/crypto',
	'models/qrcode'
], function($, _, Backbone, WordList,crypto){

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
				</div>\
				<br>\
				<br>\
				<div class='text-left' id='label_address'></div>\
				<div class='text-left' id='label_privkey'></div>\
				<div class='row text-center'>\
					<div class='col-xs-6 h3 text-center' id='text_address'></div>\
					<div class='col-xs-6 h3 text-center' id='text_privatekey'></div>\
					<div class='col-xs-6 text-center' id='qrcode_address_image'></div>\
					<div class='col-xs-6 text-center' id='qrcode_privkey_image'></div>\
				</div>\
				</div>\
		",
		events: {
			'click .btn-random': 'random',
			'click .btn-generate': 'generate',
			'keyup input[name=passphrase]': 'delete_if_changed',
			'keyup input[name=email]': 'delete_if_changed'
		},
		render: function() {
			this.$el.html(_.template(this.template));
		},
		random: function() {
				$('input[name=passphrase]', this.$el).val(
					WordList.random($('select[name=count_words]', this.$el).val())
				);
		},
		delete_results: function() {
			$('div[id=qrcode_address_image]').text('');
			$('div[id=qrcode_privkey_image]').text('');
			$('div[id=label_address]').text('');
			$('div[id=label_privkey]').text('');
			$('div[id=text_address]').text('');
			$('div[id=text_privatekey]').text('');
		},
		delete_if_changed: function() {
			if (
				this.passphrase_memory!=$('input[name=passphrase]',this.$el).val() |
				this.salt_memory!=$('input[name=email]',this.$el).val()
				){
					this.delete_results()
				}
		},
		generate: function() {
			this.passphrase_memory = $('input[name=passphrase]',this.$el).val()
			this.salt_memory = $('input[name=passphrase]',this.$el).val()

			this.delete_results()
			var qrcode = new QRCode("qrcode_address_image",{width: 160,height: 160});
			var qrcode2 = new QRCode("qrcode_privkey_image",{width: 160,height: 160});

			var result = cryptoscrypt.warp(
				$('input[name=passphrase]',this.$el).val(),
				$('input[name=email]', this.$el).val()
			);    

			qrcode.makeCode(result[1]);
			qrcode2.makeCode(result[0]);

			$('div[id=label_address]').text('Public Bitcoin Address: '+result[1]);
			$('div[id=label_privkey]').text('Secret Private key: '+result[0]);
			$('div[id=text_address]').text("Address");
			$('div[id=text_privatekey]').text("Private Key");
		}
	});

	return VaultView;
});

function jQuery(query, scope) {
	// look for 'query' element within 'scope'
}
