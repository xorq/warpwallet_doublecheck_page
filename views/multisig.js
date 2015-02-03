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
			'click select[name=numberOfSignatures]' : 'showMultisigAddress'  
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


			$('Title').html('Multisig');
			this.$el.html(this.template({pubkeys:this.model.pubkeys}));
			//$('div[id=contents]').css('border','5px solid black');
			this.showMultisigAddress()
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
			this.showMultisigAddress()
		},

		showMultisigAddress: function() {
			var pubkeys = _.pluck(this.model.pubkeys, 'pubkey');
			if (_.contains(pubkeys,"")) {
				return
			}
			console.log(parseInt($('select[name=numberOfSignatures]').val()));
			var multisig = cryptoscrypt.getMultisigAddress(pubkeys,parseInt($('select[name=numberOfSignatures]').val()))
			$('h3[name=multisigAddress]').text(multisig);
			console.log(multisig);
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
						$('h5[name=pubkeyShow][id=' + field + ']').text('Unknown public key, please provide the public key, or use an address that already had a transaction sent from.');
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
						console.log('gonna lookup')
						master.lookup(false, field, master.model.pubkeys[field].address);
					}
				})
				return
			}
		},

		showData: function(ev) {
			var field = parseInt(ev.currentTarget.id)
			var data = $('h5[name=pubkeyShow][id=' + field + ']').text() ? '' : this.model.pubkeys[field].pubkey;
			$('h5[name=pubkeyShow][id=' + field + ']').text(data)
		}
	});

	return MultisigView;
});
