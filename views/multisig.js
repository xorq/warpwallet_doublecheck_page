define([
	'jquery', 
	'underscore', 
	'backbone', 
	'models/crypto',
	'models/multisig',
	'models/qrcode',
	'models/bitcoin'
], function($, _, Backbone, crypto, Multisig, qrcode, Bitcoin){
	var checking = false;
	var MultisigView = Backbone.View.extend({
		el: $('#contents'), 
		template: _.template($('#multisigViewTemplate').text()),
		templatePubkey: _.template($('#pubkeyTemplate').text()),  
		events: {
			'blur input[name=entryField]' : 'lookup',
			'click button[name=btn-add]' : 'addPubkey',
			'click button[name=btn-delete]' : 'deletePubkey',
			'click span[name=pubkeyFieldTitle]' : 'showData',
			'click select[name=numberOfSignatures]' : 'updateNumberOfSignatures',
			'click button[name=btn-scan]' : 'importQrcode',
			'click button[name=btnImportRedeemScript]' : 'importQrcode'
		}, 

		addPubkey: function() {
			this.model.addEntry();
			this.render();
		},

		deletePubkey: function(ev) {
			var field = parseInt(ev.currentTarget.id)
			this.model.deletePubkey(field);
			this.render();
		},
		
		render: function() {
			if (typeof(localMediaStream) != 'undefined' && localMediaStream) {
				localMediaStream.stop();
				localMediaStream.src = null;
				localMediaStream.mozSrcObject = null;
				localMediaStream = null;
			}
			var master = this;
			$('Title').html('Multisig');
			this.$el.html(this.template({
				pubkeys:master.model.pubkeys,
				multisig:master.model.multisig,
				showImportQr:master.model.showImportQr
			}));
			this.findMultisigAddress();
			this.renderMultisig();
			$('div[id=contents]').css('border','5px solid black');
		},

		renderPubkey: function(field) {
			$('div[id=' + field + '][name=pubkeyField]',this.el).html(
				this.templatePubkey(
					{
						index : field,
						pubkey : this.model.pubkeys[field]
					}
				)
			);
			this.findMultisigAddress();
			this.renderMultisig();
			this.renderSelect();
		},

		renderSelect: function() {
			var template = _.template("\
				<% _.each(_.without(_.pluck(pubkeys,'pubkey'),'','unknown'), function(pubkey, index) {%>\
						<option value='<%=index+1%>'><%=index+1%></option>\
					<%})%>\
			");
			$('select[name=numberOfSignatures]',this.el).html(
				template(
					{
						pubkeys : this.model.pubkeys
					}
				)
			);
		},

		renderMultisig: function(field) {
			var template = _.template("\
				</br>\
				<div>\
				<label style='font-size:20px'>Address: <%=multisig.address%></label>\
				<div class='' id='qrcode-multisig-address' name='qrcode-multisig-address'>\
				</div>\
				</br>\
				<div>\
				<label style='font-size:20px'>Multisig Data</label>\
				<div class='' id='qrcode-multisig-data' name='qrcode-multisig-data'>\
				</div>\
				</br>\
			");
			$('div[name=multiAddress]', this.$el).children().remove();
			$('div[name=multiAddress]',this.el).html(
				template(
					{
						multisig : this.model.multisig
					}
				)
			);

			var qrcodeAddress = new QRCode('qrcode-multisig-address', { 
				width: 300, 
				height: 300, 
				correctLevel : QRCode.CorrectLevel.L
			});
			qrcodeAddress.makeCode(JSON.stringify('bitcoin:' + this.model.multisig['address']));


			var qrcodeData = new QRCode('qrcode-multisig-data', { 
				width: 300, 
				height: 300, 
				correctLevel : QRCode.CorrectLevel.L
			});
			qrcodeData.makeCode(JSON.stringify(this.model.multisig));
		},

		updateNumberOfSignatures: function() {

			this.model.numberOfSignatures = $('select[name=numberOfSignatures]').val()
			this.findMultisigAddress();
			this.renderMultisig();
		},

		findMultisigAddress: function() {
			this.model.findAddress();
		},

		lookup: function(ev, field, inputValue) {
			var master = this;
			var field = ev ? parseInt(ev.currentTarget.id) : field; 
			var inputValue = ev ? ev.currentTarget.value : inputValue;
			//The input is an address
			if (cryptoscrypt.validAddress(inputValue)) {
				master.model.resolvePubKey(inputValue,field).done(function(){
					master.renderPubkey(field);
					if(!master.model.pubkeys[field].pubkey) {
						master.model.pubkeys[field].pubkey = 'unknown';
						master.model.pubkeys[field].onename = inputValue;
						master.showData(false, field);
						//$('h5[name=pubkeyShow][id=' + field + ']').text('Unknown public key, please provide the public key, or use an address that already had a transaction sent from.');
					}
				})
				return
			}

			//The input is a public key
			if (inputValue && cryptoscrypt.pubkeyToAddress(inputValue)) {
				master.model.pubkeys[field].pubkey = inputValue;
				master.model.pubkeys[field].address = cryptoscrypt.pubkeyToAddress(inputValue);
				master.renderPubkey(field);
				return
			}

			//The input is anything else
			if (inputValue) {
				this.model.resolveOnename(inputValue, field).done(function() {
					if (master.model.pubkeys[field].address) {
						master.renderPubkey(field);
						master.lookup(false, field, master.model.pubkeys[field].address);
					}
				})
				return
			}
		},

		showData: function(ev, field) {

			var field = ev ? parseInt(ev.currentTarget.id) : field;
			var data = $('h5[name=pubkeyShow][id=' + field + ']').text() ? '' : this.model.pubkeys[field].pubkey;
			data = data == 'unknown' ? 'Unknown public key, please provide the public key, or use an address that already had a transaction sent from.' : data;
			$('[name=pubkeyShow][id=' + field + ']').text(data)
		},

		importQrcode: function(ev) {
			var expectedField = ev.currentTarget.id;
			this.model.showImportQr = !this.model.showImportQr;
			this.render();
			if (!this.model.showImportQr) {
				return
			};
			var master = this;
			$('.qr-reader').html5_qrcode(
				function(code) {
					if(ev.currentTarget.name == 'btnImportRedeemScript') {
						var redeemScript = JSON.parse(code).redeemScript;
						if (cryptoscrypt.getMultisigAddressFromRedeemScript(redeemScript) == JSON.parse(code).address) {
							master.model.showImportQr = false;
							master.model.loadRedeemScript(redeemScript);
							master.render();
							return
						}
					}
					if(ev.currentTarget.name == 'btn-scan') {
						var code = cryptoscrypt.findBtcAddress(code);
						master.lookup(false, expectedField, code)
						master.model.showImportQr = false;
						master.render();
						return
					}
				},
				function(error) {
					console.log('error');
				}, 
				function(error) {
					console.log('error');
				}
			);
		}
	});

	return MultisigView;
});
