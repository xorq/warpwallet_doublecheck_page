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
		model: Multisig,
		template: _.template($('#multisigViewTemplate').text()),
		//templatePubkey: _.template($('#pubkeyTemplate').text()),  
		events: {
			'blur input[name=entry-field]' : 'lookup',
			'click button[name=btn-add]' : 'addPubkey',
			'click button[name=btn-delete-pubkey]' : 'deletePubkey',
			//'click span[name=pubkey-field-title]' : 'showData',
			'click select[name=number-of-signatures]' : 'updateNumberOfSignatures',
			'click button[name=btn-scan]' : 'importQrcode',
			'click button[name=btn-scan-recipient]' : 'importQrTx',
			'click [name=btn-import-redeemscript]' : 'importQrcode',
			'click [name=btn-export-multisig]' : 'drawMutlisigData',
			'click button[name=address-button]' : 'drawMultisigAddress',
			'click button[name=btn-transaction]' : 'txButton',
			'click button[name=btn-add-recipient]' : 'addRecipient',
			'click button[name=btn-delete-recipient]' : 'deleteRecipient',
			'blur input[name=recipient-field]' : 'lookupRecipient',
			'blur input[name=amount-field]' : 'changedAmount',
			'click button[name=btn-all]' : 'putAll',
			'click [name=btn-export-tx]' : 'drawTxQr',
			'click [name=btn-import-tx]' : 'importQrTx',
			//'click button[name=signature-button]' : 'renderSignature',
			'click button[name=btn-signature]' : 'renderSignature',
			'click button[name=btn-edit-signature]' : 'openSubmitSignature',
			'click button[name=btn-make-signature]' : 'makeSignature',
			'click button[name=btn-create-signature]' : 'createSignature',
			'click video' : 'cameraClick',
			'click button[name=btn-delete-signature]' : 'deleteSignature',
			'click button[name=btn-show-qr-signature]' : 'showSignature',
			'click button[name=btn-scan-signature]' : 'importQrSig',
			'blur input[name=signature-hex]' : 'saveSignature',
			'click button[name=btn-scan-pkey]' : 'importPkey',
			'click button[name=btn-apply-signature]' : 'performMultisig',
			'click canvas' : 'clickCanvas'
		},

		clickCanvas: function(ev) {
			$(ev.currentTarget).parent().children().remove();
		},

		performMultisig: function() {
			if (_.filter(this.model.pubkeys, function(key) { return key.signature }).length >= this.model.numberOfSignatures) {
				data = this.model.buildMultisig();
				var qrcodeData = new QRCode('qrcode-signed-tx', { 
					width: 600, 
					height: 600, 
					correctLevel : QRCode.CorrectLevel.L
				});
				qrcodeData.makeCode(data);
				$('h4[name=signed-tx-data]').html(data);
			}
				
		},

		saveSignature: function(ev) {
			var field = ev.currentTarget.id;
			if (cryptoscrypt.validScript($('input[name=signature-hex][id=' + field + ']').val())){
				this.model.pubkeys[field].signature = $('input[name=signature-hex][id=' + field + ']').val();
				this.renderSignature();
				this.renderSignature();
				this.openSubmitSignature(ev);
				//$('span[name=signature-status][id=' + field + ']').addClass('glyphicon-ok-circle');
				//$('span[name=signature-status][id=' + field + ']').removeClass('glyphicon-remove-circle');
			} else {
				window.alert('This is not a signature')
			}
		},

		showSignature: function(ev) {
			field = ev.currentTarget.id;
			if ($('[id=qrcode-signature-' + field + ']').children().length == 0) {
				var qrcodeData = new QRCode('qrcode-signature-' + field, { 
						width: 300, 
						height: 300, 
						correctLevel : QRCode.CorrectLevel.L
					});
				qrcodeData.makeCode(JSON.stringify(
					{
						address : this.model.pubkeys[field].address,
						signature : this.model.pubkeys[field].signature,
						checksum : sjcl.hash.sha256.hash(this.model.pubkeys[field].address + this.model.pubkeys[field].signature)[0],
						txchecksum : sjcl.hash.sha256.hash(this.model.getTx())[0]
					}
				));
			} else {
				$('[id=qrcode-signature-' + field + ']').children().remove();
			}
		},

		deleteSignature: function(ev) {
			field = ev.currentTarget.id;
			this.model.pubkeys[field].signature = '';
			$('[name=signature-hex][id=' + field + ']').val(this.model.pubkeys[field].signature)
		},

		createSignature: function(ev) {
			field = ev.currentTarget.id;
			$('div[name=create-signature-area][id=' + field + ']').toggleClass('hidden','')
			$('span[name=chevron-create-signature][id=' + field + ']').toggleClass('glyphicon-triangle-left').toggleClass('glyphicon-triangle-bottom')

		},

		makeSignature: function(ev){

			var field = ev.currentTarget.id;
			var passphrase = $('input[name=passphrase-field][id=' + field + ']').val();
			var salt = $('input[name=amount-field][id=' + field + ']').val();
			if (!cryptoscrypt.validPkey(passphrase)) {
				passphrase = (cryptoscrypt.warp(passphrase,salt)[0]);
			}
			this.model.sign(passphrase, field);
			$('[name=signature-hex][id=' + field + ']').val(this.model.pubkeys[field].signature)
			this.saveSignature(ev);
			this.openSubmitSignature(ev);
		},

		cameraClick : function(ev) {
			this.model.showImportQr = false;
			this.model.showImportQrTx = false;
			this.model.showImportQrSig = false;;
			localMediaStream.stop();
			localMediaStream.src = null;
			localMediaStream.mozSrcObject = null;
			localMediaStream = null;
			$('video').parent().parent().css('display','none')
		},

		openSubmitSignature: function(ev) {
			var index = ev.currentTarget.id;
			$('button[name=btn-edit-signature][id=' + index + ']').toggleClass('glyphicon-triangle-left').toggleClass('glyphicon-triangle-bottom');
			if ($('div[name=pubkey-signature-form][id=' + index + ']').children().length == 0) {
				this.renderSubmitSignature(ev);
			} else {
				$('[name=pubkey-signature-form][id=' + index + ']').children().remove();
			}
		},

		renderSubmitSignature: function(ev) {
			index = ev.currentTarget.id
			
			var template = _.template("\
				<h4 class='col-xs-12'>Signature:<h4>\
				<div class='row col-xs-8' style='padding-right:5px'>\
					<input type='text' class='form-control input-group' id='<%=index%>' name='signature-hex' value='<%=signatures[index].signature%>' placeholder='Signature' value=''>\
					</input>\
				</div>\
				<div class='col-xs-2'>\
					<span class='input-group-btn'>\
						<button class='btn btn-default' type='button' name='btn-scan-signature' id='<%=index%>'>\
						<span class='glyphicon glyphicon-camera'></span> Scan Signature </button>\
						<button class='btn btn-default' type='button' name='btn-create-signature' id='<%=index%>'>\
						<span name='chevron-create-signature' id=<%=index%> class='glyphicon glyphicon-triangle-left'></span>\
						Create Signature</button>\
						<button class='btn btn-default glyphicon glyphicon-trash' type='button' name='btn-delete-signature' id='<%=index%>'></button>\
					</span>\
				</div>\
				<div name='create-signature-area' id='<%=index%>' class='hidden'>\
					<h5 class='col-xs-12'>Create Signature:</h5>\
					<div class='col-xs-4' style='padding-right:5px'>\
						<input style='font-size:12px' type='text' value='' class='form-control input-group' id='<%=index%>' name='passphrase-field'  placeholder='Passphrase or Private Key'>\
						</input>\
					</div>\
					<div class='col-xs-3' style='padding-right:5px'>\
						<input style='font-size:12px' type='text' class='form-control input-group' id='<%=index%>' name='amount-field'  placeholder='Salt (Email)' value=''>\
						</input>\
					</div>\
					<div class='col-xs-5'>\
						<span class='style='font-size:12px' input-group-btn'>\
							<button style='font-size:12px' class='btn btn-default' type='button' name='btn-scan-pkey' id='<%=index%>'>\
								<span style='font-size:12px' class='glyphicon glyphicon-camera'></span> Scan Private key </button>\
							<button style='font-size:12px' class='btn btn-default' type='button' name='btn-make-signature' id='<%=index%>'>\
							<span style='font-size:12px' class='glyphicon glyphicon-edit'></span>\
							Make Signature</button>\
						</span>\
					</div>\
				</div>\
				</br>\
				</br>\
				</br>\
				<div class='col-xs-12' name='import-qr-sig' style='display:none'>\
					<p>Hold a QR Code in front of your webcam.</p>\
					<div class='qr-status-sig'></div>\
					<div class='qr-reader-sig' style='width: 400px; height: 300px'></div>\
				</div>\
				</br>\
				</br>\
				</br>\
				</br>\
			");
			$('[name=pubkey-signature-form][id=' + index + ']').html(
				template(
					{
						index: index,
						signatures: this.model.pubkeys,
						showImportQrSig: this.model.showImportQrSig
					}
				)	
			)
		},

		renderSignature: function() {
			$('span[name=chevron-signature]').toggleClass('glyphicon-triangle-left').toggleClass('glyphicon-triangle-bottom')
			if($('div[name=multi-signature]',this.el).children().length == 0) {
				$('button').addClass('disabled');
				$('input').prop('disabled', 'disabled');
				$('button[name=btn-signature]').removeClass('disabled');
				var template = _.template("\
					<br>\
					<%pubkeys.forEach(function(pubkey, index) {%>\
						<div class='col-xs-8' style='padding-right:10px'>\
							<label class='' style='font-size:18px; padding-top:7px'><%=pubkey.address%></label>\
						</div>\
						<div class='col-xs-4' style='float:right'>\
							<button style='float:right' class='btn btn-default glyphicon glyphicon-triangle-left' name='btn-edit-signature' id=<%=index%> style='font-size:20px'></button>\
							<button style='float:right' class='btn btn-default glyphicon glyphicon-qrcode' name='btn-show-qr-signature' id=<%=index%> style='font-size:20px;margin-left:10px;margin-right:10px'></button>\
							<span class='glyphicon glyphicon-<%=pubkeys[index].signature ? 'ok' : 'remove'%>-circle disabled' name='signature-status' id=<%=index%> style='<%=pubkeys[index].signature ? 'color:green' : 'color:red'%>;top:5px;font-size:24px;float:right'></span>\
						</div>\
						</br>\
						<div name='pubkey-signature-form' id='<%=index%>' style='margin-left:60px'>\
						</div>\
						</br>\
						<div class='col-xs-12' id='qrcode-signature-<%=index%>'>\
						</div>\
						</br>\
					<%})%>\
					<div class='col-xs-12' style=''>\
						<button class='btn btn-default <%=_.filter(pubkeys, function(key) { return key.signature }).length >= numberOfSignatures ? '' : 'disabled'%>' style='font-size:20px; float: right;' name='btn-apply-signature'>\
							<span name='chevron-signature' class='glyphicon glyphicon-triangle-left'></span>\
							Apply Signature\
						</button>\
					</div>\
					<div class='col-xs-12' style='' id='qrcode-signed-tx'>\
					</div>\
					</br>\
					<h4 name='signed-tx-data'>\
					</h4>\
					</br>\
				");
				$('div[name=multi-signature]',this.el).html(
					template(
						{
							pubkeys : this.model.getPubKeys(),
							numberOfSignatures : this.model.numberOfSignatures
						}
					)
				);
			} else {
				$('div[name=multi-signature]',this.el).children().remove()
				$('button[name=btn-signature]').removeClass('hidden');
				$('button').addClass('disabled');
				//$('button[name=btn-signature]').removeClass('disabled');
				$('button[name=btn-transaction]').removeClass('disabled');
				$('select').prop('disabled', 'disabled');
				$('[name=pubkey-field-title]').prop('disabled', 'disabled');
				$('input[name=entry-field]').prop('disabled', 'disabled');
				this.renderTransaction();
			}

		},

		importPkey: function(ev) {
			master = this;
			field = ev.currentTarget.id

			if ($('div[name=import-qr-sig]').css('display') == 'none') {
				$('div[name=import-qr-sig]').css('display', '')

				$('.qr-reader-sig').html5_qrcode(
					function(code) {
						console.log('yes');
						foundPkey = cryptoscrypt.findBtcPkey(code);
						if (cryptoscrypt.validPkey(foundPkey)) {
							console.log(foundPkey)
							localMediaStream.stop();
							localMediaStream.src = null;
							localMediaStream.mozSrcObject = null;
							localMediaStream = null;
							$('div[name=import-qr-sig]').css('display', 'none')
							$('input[name=passphrase-field]').val(foundPkey);
							//master.openSubmitSignature(ev);
						}
					}
					, function(error) {
						console.log('error');
					}, function(error) {
						console.log('error');
					}
				)

			} else {
				$('div[name=import-qr-sig]').css('display', 'none')
				localMediaStream.stop();
				localMediaStream.src = null;
				localMediaStream.mozSrcObject = null;
				localMediaStream = null;
			}
		},

		importQrSig: function(ev) {
			master = this;
			field = ev.currentTarget.id
			console.log(ev.currentTarget.name);
			//this.model.showImportQrSig!=this.model.showImportQrSig;
			//this.model.showImportQrSig = true;//!this.model.showImportQrSig;
			//this.renderSubmitSignature(ev.currentTarget.id);
			if ($('div[name=import-qr-sig]').css('display') == 'none') {
				$('div[name=import-qr-sig]').css('display', '')
			//, $('div[name=import-qr-sig]').css('display') == 'none' ? '' : 'none');
			//$('div[class=importQrSig]').toggleClass('hidden', '');
			//this.model.showImportQrSig = true;

				$('.qr-reader-sig').html5_qrcode(
					function(code) {
						jaison = JSON.parse(code)
						console.log(code);
						console.log()
						if (jaison.checksum == (sjcl.hash.sha256.hash(jaison.address + jaison.signature)[0]) &&
						jaison.txchecksum == (sjcl.hash.sha256.hash(master.model.getTx())[0])) {
							master.model.pubkeys[field].signature = jaison.signature;	
							localMediaStream.stop();
							localMediaStream.src = null;
							localMediaStream.mozSrcObject = null;
							localMediaStream = null;
							$('div[name=import-qr-sig]').css('display', '')
							master.openSubmitSignature(ev);
						}
					}
					, function(error) {
						console.log('error');
					}, function(error) {
						console.log('error');
					}
				)

			} else {
				$('div[name=import-qr-sig]').css('display', 'none')
				localMediaStream.stop();
				localMediaStream.src = null;
				localMediaStream.mozSrcObject = null;
				localMediaStream = null;
			}
		},

		importQrTx: function(ev) {
			this.model.showImportQrTx = !this.model.showImportQrTx;
			this.renderTransaction();
			if (!this.model.showImportQrTx) {
				//this.render();
				this.renderTransaction();
				return
			};
			var master = this;
			this.model.newImport();
			$('.qr-reader-tx').html5_qrcode(
				function(code) {
					if(ev.currentTarget.name == 'btn-scan-signature') {
						//to do : checksum
						console.log(code);
						master.model.pubkeys[ev.currentTarget.id].signature = code;
						//master.model.showImportQrTx = false;
						
						console.log($('.qr-reader-tx'))
						//('input[name=signature-hex]').val(code);
						master.renderTransaction();
						//master.openSubmitSignature(ev);
						$('.qr-reader-tx').addClass('hidden');
						console.log('done')
						return
					};

					if(ev.currentTarget.name == 'btn-scan-recipient') {
						var code = cryptoscrypt.findBtcAddress(code);
						if (cryptoscrypt.validAddress(code)) {
							console.log(code)
							master.model.recipients[ev.currentTarget.id].address = code;
							master.model.showImportQrTx = false;
							master.renderTransaction();
						}
						return
					};
					if (master.model.importTx(code)) {
						master.model.showImportQrTx = false;
						master.renderTransaction();
					} else {
						console.log($('.qr-status-tx', master.el));
						$('.qr-status-tx', master.el).html("Got " + master.model.qrParts + ' out of ' + master.model.qrTotal + ' codes.');
					}
				}, function(error) {
					console.log('error');
				}, function(error) {
					console.log('error');
				}
			);	
		},

		drawTxQr: function() {
			if ($('div[id=qrcode-multisig-transaction]').children().length > 0) {
				$('div[id=qrcode-multisig-transaction]').children().remove();
				return;
			};
			console.log(this.model.exportTransaction())
			this.model.exportTransaction().forEach(function(chunk, index) {
				$('div[id=qrcode-multisig-transaction]').append('</br></br></br></br><label sytle="margin-bottom:30px">QRCode number ' + (1 + index) + '</label></br>')
				$('div[id=qrcode-multisig-transaction]').append('<div id=qrcode-tx-' + index + '></div>')
				var qrcodeData = new QRCode('qrcode-tx-' + index, { 
						width: 300, 
						height: 300, 
						correctLevel : QRCode.CorrectLevel.L
					});
				qrcodeData.makeCode(chunk);
			});
		},

		updateUnspent: function() {
			var master = this;
			this.model.getAddressUnspent().done(function() {
				master.renderAddress();
				if (master.model.unspents.length > 0) {
					$('button[name=btn-transaction]').removeClass('disabled')
				} else {
					$('button[name=btn-transaction]').addClass('disabled')
				}
			});
		},

		putAll: function(ev) {
			this.model.putAll(ev.currentTarget.id);
			$('input[name=amount-field]')[0].value = this.model.recipients[ev.currentTarget.id].amount / 100000000;
			this.renderTransaction();
			//$('div[name=multiTransaction]').removeClass('hidden');
		},

		changedAmount: function(ev) {
			var field = parseInt(ev.currentTarget.id);
			var inputValue = ev.currentTarget.value;
			this.model.recipients[field].amount = 100000000 * inputValue;
			//this.render();
			//$('div[name=multiTransaction]').removeClass('hidden');
		},

		lookupRecipient: function(ev, field, inputValue) {
			var master = this;
			var field = ev ? parseInt(ev.currentTarget.id) : field; 
			var inputValue = ev ? ev.currentTarget.value : inputValue;
			//The input is an address
			if (cryptoscrypt.validAddress(inputValue)) {
				master.model.recipients[field].address = inputValue;
				return
			}
			//The input is anything else
			if (inputValue) {
				this.model.resolveOnename(inputValue, field, master.model.recipients).done(function() {
					if (master.model.recipients[field].address) {
						//master.render();
						//$('div[name=multiTransaction]').removeClass('hidden');
						master.lookupRecipient(false, field, master.model.recipients[field].address);
						ev.currentTarget.value = master.model.recipients[field].address
					}
				})
				return
			}
			//$('div[name=multiTransaction]').removeClass('hidden');
		},

		deleteRecipient: function(ev) {
			this.model.deleteRecipient(parseInt(ev.currentTarget.id));
			this.renderTransaction();
			//$('div[name=multiTransaction]').removeClass('hidden');
		},

		addRecipient: function() {
			this.model.addRecipient();
			this.renderTransaction();
			//$('div[name=multiTransaction]').removeClass('hidden');
		},

		txButton: function() {
			$('span[name=chevron-tx-button]').toggleClass('glyphicon-triangle-left').toggleClass('glyphicon-triangle-bottom')
			if ($('div[name=multiTransaction]',this.el).children().length == 0) {
				$('button[name=btn-signature]').removeClass('hidden');
				$('button').addClass('disabled');
				//$('button[name=btn-signature]').removeClass('disabled');
				$('button[name=btn-transaction]').removeClass('disabled');
				$('select').prop('disabled', 'disabled');
				$('[name=pubkey-field-title]').prop('disabled', 'disabled');
				$('input[name=entry-field]').prop('disabled', 'disabled');
				this.renderTransaction();

			} else {
				$('div[name=multiTransaction]',this.el).children().remove()
				//$('button[name=btn-signature]').addClass('hidden');
				$('button').removeClass('disabled');
				$('select').prop('disabled', false);
				$('[name=pubkey-field-title]').prop('disabled', false);
				$('input[name=entry-field]').prop('disabled', false);
			}
		},

		renderTransaction: function() {
			if (typeof(localMediaStream) != 'undefined' && localMediaStream) {
				localMediaStream.stop();
				localMediaStream.src = null;
				localMediaStream.mozSrcObject = null;
				localMediaStream = null;
			};

			var template = _.template("\
				<br>\
				<button class='btn btn-default btn-primary' type='button' name='btn-export-tx' style='margin-bottom:20px'>Export Transaction To QR Code(s)</button>\
				<% _.each(recipients, function(recipient, index) {%>\
					<div id='<%=index%>' name='pubkey-field'>\
						<div class='col-xs-12 row' style='padding-right: 40px; margin-right: 0px;'>\
							<div class='col-xs-7' style='padding-left:0px;padding-right:5px'>\
								<input type='text' value='<%=recipient.address%>' class='form-horizontal form-control input-group' id='<%=index%>' name='recipient-field'  placeholder='Address of beneficiary'>\
								</input>\
							</div>\
							<div class='col-xs-3' style='padding-left:0px;padding-right:5px'>\
								<input type='text' class='form-horizontal form-control input-group' id='<%=index%>' name='amount-field'  placeholder='Amount in BTC' value='<%=recipient.amount ? recipient.amount / 100000000 : ''%>'>\
								</input>\
							</div>\
							<div class='col-xs-2' style='padding-left:0px'>\
								<span class='input-group-btn'>\
									<button class='btn btn-default glyphicon glyphicon-download' type='button' name='btn-all' id='<%=index%>'></button>\
									<button class='btn btn-default glyphicon glyphicon-camera' type='button' name='btn-scan-recipient' id='<%=index%>'></button>\
									<button class='btn btn-default glyphicon glyphicon-trash' type='button' name='btn-delete-recipient' id='<%=index%>'></button>\
								</span>\
							</div>\
						</div>\
					</div>\
				<%})%>\
				</br>\
				</div>\
				<div class=col-xs-12>\
				</br>\
				<button type='button' class='btn btn-default' name='btn-add-recipient' style='margin-bottom:20px'>\
				ADD\
				<span class='glyphicon glyphicon-plus-sign glyphicon-align-center' style='color:green;horizontal-align:middle;vertical-align:middle;horizontal-align:middle;bottom:1px'></span>\
				</button>\
				</div>\
				<div class=col-xs-12>\
				<div class='importQrTx' style='display: <%= showImportQrTx || 'none' %>'>\
					<p>Hold a QR Code in front of your webcam.</p>\
					<div class='qr-status-tx'>\
					</div>\
					<div class='qr-reader-tx' style='width: 400px; height: 300px'>\
					</div>\
				</div>\
				<div id='qrcode-multisig-transaction'>\
				</div>\
				</br>\
				</div>\
				<div class='row col-xs-12' style=''>\
				<button class='btn btn-default <%=unspents.length > 0 ? '' : 'disabled'%>' style='font-size:20px; float: right;' name='btn-signature'>\
					<span name='chevron-signature' class='glyphicon glyphicon-triangle-left'></span>\
					 Signature Mode\
				</button>\
				</div>\
				<div class='col-xs-12' name='multi-signature'>\
				</div>\
			");
			$('div[name=multiTransaction]',this.el).html(
				template(
					{
						showImportQrTx : this.model.showImportQrTx,
						recipients : this.model.recipients,
						unspents : this.model.unspents
					}
				)
			);
		},

		clearPubkey: function(ev) {
			var field = ev.currentTarget.id;
			if (this.model.pubkeys[field].address) {
				this.model.clearField(field);
				$('span[name=pubkey-field-title][id=' + field + ']')[0].style = 'background-color:default'	
			}
				$('div[name=multi-address]').html('');
				$('button[name=spendMultisig]').addClass('disabled');
		},

		addPubkey: function() {
			this.model.addEntry();
			this.render();
		},

		deletePubkey: function(ev) {
			var field = parseInt(ev.currentTarget.id)
			this.model.deletePubkey(field);
			this.render();
			this.updateUnspent();
		},
		
		render: function() {
			if (typeof(localMediaStream) != 'undefined' && localMediaStream) {
				localMediaStream.stop();
				localMediaStream.src = null;
				localMediaStream.mozSrcObject = null;
				localMediaStream = null;
			}

			var master = this;
			this.model.findAddress();
			$('Title').html('Multisig');
			$('#contents').html(this.template({
				pubkeys:master.model.pubkeys,
				multisig:master.model.multisig,
				showImportQr:master.model.showImportQr,
				showImportQrTx:master.model.showImportQrTx,
				showImportQrSig:master.model.showImportQrSig,
				recipients:master.model.recipients,
				balance:master.model.balance,
				unspents:master.model.unspents
			}));
			//this.renderTransaction();
			$('div[id=contents]').css('border','5px solid black');
			this.renderAddress();
		},

		renderAddress: function() {
			this.model.findAddress();
			if (this.model.multisig.address) {
				$('[name=label-address]').html(this.model.multisig.address + '</br>Balance: ' + (this.model.balance ? this.model.balance/100000000 + ' BTC' : 'No Data'));
			} else {
				$('[name=label-address]').html('Your Multisig Address Will Appear Here');
			}
		},

		renderPubkey: function(field) {
			$('span[id=' + field + '][name=pubkey-field-title]', this.el).css('background-color','green').css('color','white')
			$('input[id=' + field + '][name=entry-field]', this.el).val(this.model.pubkeys[field].address)
			this.renderSelect();
			this.renderAddress();
		},

		renderSelect: function() {
			var template = _.template("\
				<% _.each(_.without(_.pluck(pubkeys,'pubkey'),'','unknown'), function(pubkey, index) {%>\
						<option value='<%=index+1%>'><%=index+1%></option>\
					<%})%>\
			");
			$('select[name=number-of-signatures]',this.el).html(
				template(
					{
						pubkeys : this.model.pubkeys
					}
				)
			);
		},

		updateNumberOfSignatures: function() {
			this.model.numberOfSignatures = $('select[name=number-of-signatures]').val()
			$('div[name=multi-address]', this.$el).children().remove();
			this.renderAddress();
			this.updateUnspent();
		},

		drawMutlisigData: function() {
			if ($('div[id=qrcode-multisig-data]').children().length > 0) {
				$('div[id=qrcode-multisig-data]').children().remove();
			} else {
				$('div[id=qrcode-multisig-data]').children().remove();
				this.model.findAddress();
				var qrcodeData = new QRCode('qrcode-multisig-data', { 
						width: 300, 
						height: 300, 
						correctLevel : QRCode.CorrectLevel.L
					});
				qrcodeData.makeCode(JSON.stringify(this.model.multisig));
			}
		},

		drawMultisigAddress: function() {
			var master = this;
			this.model.findAddress();
			if (this.model.multisig.address) {
				if ($('div[id=qrcode-multisig-address]').children().length > 0) {
					$('div[id=qrcode-multisig-address]').children().remove();
				} else {
					$('div[id=qrcode-multisig-address]').children().remove();
					this.model.findAddress();
					var qrcodeAddress = new QRCode('qrcode-multisig-address', { 
						width: 300, 
						height: 300, 
						correctLevel : QRCode.CorrectLevel.L
					});
					qrcodeAddress.makeCode(JSON.stringify(master.model.multisig['address']));
				}
			}
		},

		lookup: function(ev, field, inputValue) {
			var master = this;
			var field = ev ? parseInt(ev.currentTarget.id) : field; 
			var inputValue = ev ? ev.currentTarget.value : inputValue;
			var savedPubkey = master.model.getPubKeys()[field]
			//The input is an address
			if (cryptoscrypt.validAddress(inputValue)) {
				if ((savedPubkey.address == inputValue) && (savedPubkey.pubkey)) {
					master.renderPubkey(field)
					return
				}
				master.model.resolvePubKey(inputValue,field).done(function(){
					if(!savedPubkey.pubkey) {
						savedPubkey.pubkey = 'unknown';
						savedPubkey.onename = inputValue;
						master.renderPubkey()
						master.showData(false, field);
					}
					master.renderPubkey(field);
				})
				master.updateUnspent();
				return
			}
			//The input is a public key
			if (inputValue && cryptoscrypt.pubkeyToAddress(inputValue)) {
				master.model.pubkeys[field].pubkey = inputValue;
				master.model.pubkeys[field].address = cryptoscrypt.pubkeyToAddress(inputValue);
				this.updateUnspent();
				master.renderPubkey(field);
				return
			}
			//The input is anything else
			if (inputValue) {
				this.model.resolveOnename(inputValue, field, master.model.pubkeys).done(function() {
					if (master.model.pubkeys[field].address) {
						master.renderPubkey(field);
						master.lookup(false, 	field, master.model.pubkeys[field].address);
					}
				})
				return
			}
		},

		showData: function(ev, field) {
			var field = ev ? parseInt(ev.currentTarget.id) : field;
			var data = $('h5[name=pubkey-display][id=' + field + ']').text() ;//? '' : this.model.pubkeys[field].pubkey;
			data = data == 'unknown' ? 'Unknown public key, please provide the public key, or use an address that already had a transaction sent from.' : data;
			$('[name=pubkey-display][id=' + field + ']').text(data)
		},

		importQrcode: function(ev) {
			var expectedField = ev.currentTarget.id;
			this.model.showImportQr = !this.model.showImportQr;
			this.render();
			if (!this.model.showImportQr) {
				return
			} else {
				console.log($('div[name=importQr]')[0]);
				$('div[name=importQr]').css('display','');
				console.log($('div[name=importQr]')[0]);
			}
			;
			var master = this;
			$('.qr-reader').html5_qrcode(
				function(code) {
					if(ev.currentTarget.name == 'btn-import-redeemscript') {
						var redeemScript = JSON.parse(code).redeemScript;
						if (cryptoscrypt.getMultisigAddressFromRedeemScript(redeemScript) == JSON.parse(code).address) {
							master.model.showImportQr = false;
							master.model.loadRedeemScript(redeemScript);
							master.render();
							return
						}
					};
					if(ev.currentTarget.name == 'btn-scan') {
						var code = cryptoscrypt.findBtcAddress(code);
						master.lookup(false, expectedField, code)
						master.model.showImportQr = false;
						master.render();
						return
					};
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
