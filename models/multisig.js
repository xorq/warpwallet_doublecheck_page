	define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone) {
	function Multisig() {
		this.test = '';
		this.pubkeys = [ { address:'', pubkey:'', thumb:'', onename:'', avatar:'' }];
		this.expectedField = undefined;
		
		this.addEntry = function() {
			this.pubkeys.push({ address:'', pubkey:'', thumb:'', onename:'', avatar:'' })
		}, 

		this.deletePubkey = function(index) {
			if (this.pubkeys.length>1) {
				this.pubkeys.splice(index, 1);
			} else {
				this.pubkeys=[ { address:'', pubkey:'', thumb:'', onename:'', avatar:'' } ];
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
		}
	}
	return Multisig;
});

