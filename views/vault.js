define([
	'jquery', 
	'underscore', 
	'backbone', 
	'models/wordlist', 
	'models/crypto', 
	'models/qrcode',
	'models/bitcoin',
], function($, _, Backbone, WordList, crypto, qrcode, Bitcoin){
	var checking = false;
	var VaultView = Backbone.View.extend({
		el: $('#contents'), 
		//el: $('#contents'),
	  //template: _.template($('#vaultViewTemplate').text()),
		template: _.template($('#vaultViewTemplate').text()), 
		events: {
			'click .btn-random' : 'random',
			'click .btn-generate' : 'pleaseWait',
			'keyup input[name=passphrase]' : 'deleteIfChanged', 
			'keyup input[name=email]' : 'deleteIfChanged',
			'focus input[id=passphrase]' : 'internetChecker'
		}, 

		internetChecker: function() {
			var master = this;
			goodpage = function() { return ($('Title').html() == 'EasyBTC Vault Creator') }
			iCheck = function() {
				if (this.goodpage() == false) {
					return
				}
				if (checking == true)  {
					setTimeout(this.iCheck,4000);
				};

				var iCheckDefer = $.Deferred();
				cryptoscrypt.internetCheck(iCheckDefer)
				.done(function(data){
					if((data.result=='yes') & goodpage()) {
						$('div[id=contents]').css('border','5px solid red');
						$('div[id=vault-warning]').html('<h3 style=color:red>You are using an online computer, as a result this vault is insecure. If you are unsure of what you are doing, check the guidance</h3>')
					}
				})
				.fail(function(){
					$('div[id=contents]').css('border','5px solid green');
					$('div[id=vault-warning]').html('<h3 style=color:darkgreen>You seem to be offline. For achieving maximum security, check the guidance.</h3>')
					});
			}
			if (checking == false) {
				checking = true 
				iCheck();
			} 
		},

		render: function() {

			$('Title').html('EasyBTC Vault Creator');
			this.$el.html(this.template());
			$('div[id=contents]').css('border','5px solid black');
			checking = false;

		}, 

		random: function() {
			this.internetChecker();
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
			$('div[id=qrcode-pubkey-image]').text('');
			$('div[id=text-pubkey]').text('');
			$('div[id=label-pubkey]').text('');
		}, 

		deleteIfChanged: function() {

			if (
				this.passphraseMemory!=$('input[name=passphrase]', this.$el).val() |
				this.saltMemory!=$('input[name=email]', this.$el).val()
				){
					this.deleteResults()
				}

		}, 

		pleaseWait: function() {
			this.internetChecker()
			var master = this;
			var text = ($('h3[id=pleaseWait]').text() == '') ? '..........Please wait, this should take few seconds on a normal computer..........' : '';

			$('div[id=pleaseWait]', this.$el).html('<h3 id="pleaseWait" style="text-center">' + text + '</h3>');
			$('div[id=pleaseWait]', this.$el).show();

			setTimeout(function () {
				master.generate(master)
			},100);
		},

		generate: function(master) {

			master = master ? master : this;

			master.passphraseMemory = $('input[name=passphrase]', master.$el).val()
			master.saltMemory = $('input[name=passphrase]', master.$el).val()

			if (cryptoscrypt.validPkey(master.passphraseMemory)) { return };
			master.deleteResults()

			var qrcode = new QRCode("qrcode-address-image", {width: 260, height: 260,correctLevel : QRCode.CorrectLevel.L, colorDark : 'black'});
			var qrcode2 = new QRCode("qrcode-privkey-image", {width: 260, height: 260, correctLevel : QRCode.CorrectLevel.L, colorDark : 'red'});
			var qrcode3 = new QRCode("qrcode-pubkey-image", {width: 260, height: 260, correctLevel : QRCode.CorrectLevel.L, colorDark : 'darkBlue'});

			var result = cryptoscrypt.warp(
				$('input[name=passphrase]', master.$el).val(), 
				$('input[name=email]', master.$el).val()
			);    

			qrcode.makeCode('bitcoin:'+result[1]);
			qrcode2.makeCode(result[0]);
			qrcode3.makeCode(result[2]);

			$('div[id=label-pubkey]').text(result[2]);
			$('div[id=label-address]').text(result[1]);
			$('div[id=label-privkey]').text(result[0]);
			$('div[id=text-address]').text("Address");
			$('div[id=text-privatekey]').text("Private Key");
			$('div[id=text-pubkey]').text("Public Key (for multisig)");
			
			$('div[id=pleaseWait]', master.$el).html('')
		}
	});

	return VaultView;
});
