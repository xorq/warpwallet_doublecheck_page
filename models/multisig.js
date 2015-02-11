	define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone) {
	function Multisig() {
		this.test = '';
		this.pubkeys = [ { address:'1Xorq87adKn12bheqPFuwLZgZi5TyUTBq', pubkey:'04dedf0b95880044bec816c25404ce7dbac265bb79f73a0880e1d1237200f28c57c5d13975f3a045be6f6c6db984ecfbe20c62d12203de7f483fd482e2435e2f22', thumb:'', onename:'xorq', avatar:'' } , { address:'1MadcatHTGAZTJwNaTSnko15sbrPTBdBv3', pubkey:'04567be2411c1ef05b252c0cf3b37f74e5a88b4088192007d4599dbbf35974ebb1026b54152c430ceebc12d6c3f3ac2b04055b3639a6f7b7d63f3011dc3879fc0e', thumb:'', onename:'alo', avatar:'' }];
		this.expectedField = undefined;
		this.multisig = '';
		this.multisigs = [];
		this.showImportQr = false;
		this.numberOfSignatures = 1;
		this.redeemScript = '';
		
		this.addEntry = function() {
			if (this.pubkeys.length < 15) {
			this.pubkeys.push({ address:'', pubkey:'', thumb:'', onename:'', avatar:'' })
			} else {
				window.alert('You cannot have more than 15 addresses for one multisig address')
			}
		},

		this.deletePubkey = function(index) {
			if (this.pubkeys.length>2) {
				this.pubkeys.splice(index, 1);
			} else {
				this.pubkeys=[ 
					{ address:'', pubkey:'', thumb:'', onename:'', avatar:'' },
					{ address:'', pubkey:'', thumb:'', onename:'', avatar:'' } 
				];
			}
		},

		this.getRequest = function(url, success, error) {
			$.ajax({
				url : url,
				dataType : 'text',
				success : success,
				error : error
			});
		},

		this.getPubKey = function(address) {
			var result = $.Deferred();
			var success = function(data) {
				result.resolve(data)
			};
			var error = function() {
				console.log("failure")
			};
			this.getRequest('https://blockchain.info/q/pubkeyaddr/' + address + '?cors=true', success, error);
			return result
		},

		this.resolvePubKey = function(address, field) {
			var master = this;
			return this.getPubKey(address).done(function(data) {
				master.pubkeys[field].pubkey = data;
				master.pubkeys[field].address = address;
			})
		},

		this.resolveOnename = function(input, field) {
			var master = this;
			return $.getJSON('https://onename.com/' + input + '.json', function(data) {
				var address = data.bitcoin.address ? data.bitcoin.address : '';
				if (data.avatar) {
					master.pubkeys[field].avatar = data.avatar;
				};
				if (cryptoscrypt.validAddress(address) == true) {
						master.pubkeys[field].address = address;
					};
				}
			)
		},

		this.findAddress = function() {
			pubkeys = _.without(_.pluck(this.pubkeys,'pubkey'),'','unknown');
			this.multisig = cryptoscrypt.getMultisigAddress(pubkeys, parseInt(this.numberOfSignatures));
			this.redeemScript = this.multisig['redeemScript'];
			this.address = this.multisig['address'];
		},

		this.findAddresses = function(pubkeys) {
			this.multisigs = cryptoscrypt.getMultisigAddresses(pubkeys, this.numberOfSignatures);
		},

		this.importRedeem = function(code) {
			//console.log(bitcoin.Script.fromHex(redeemScriptHex))
		},

		this.loadRedeemScript = function(redeemScript) {
			var addresses = cryptoscrypt.getAddressesFromRedeemScript(redeemScript);
			this.numberOfSignatures = cryptoscrypt.getNumberOfSignaturesFromRedeemScript(redeemScript);
			this.pubkeys = _.map(addresses,function(data) { 
				return {
				address:data.address, pubkey:data.pubkey, thumb:'', onename:'', avatar:'' }
			})
		}
	}
	return Multisig;
});

