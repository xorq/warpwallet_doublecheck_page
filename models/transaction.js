	define([
	'jquery',
	'underscore',
	'backbone',
	'models/bitcoin',
], function($, _, Backbone,Bitcoin) {
	function Transaction() {
		this.guidance = false;
		this.from = '';
		this.checkedFrom = '';
		this.thumbFrom = '';
		this.recipients = [ { address:'', amount:0, checkedAddress:'', thumb:'' } ];
		this.fee = 0;
		this.passphrase = '';
		this.salt = '';
		this.balance = '';
		this.unspent = [ { } ];
		this.qrcode = '';
		this.feeMode = 'auto';
		this.showImportQR = false;
		this.signAddress = "";
		this.expectedField = undefined;
		
		this.getJSONrequest = function(url,success,fail) {
			return $.ajax({
				url: url,
				dataType: 'json',
				success: success,
				error: fail
			});
		}

		this.changeFeeMode = function() {
			var modes = [ 'auto', 'custom' ];
			this.feeMode = modes[ (modes.indexOf(this.feeMode) + 1) % modes.length ];
		}

		this.glyphiconClass = function(address) {

			return (cryptoscrypt.validAddress(address)) ? 
				'glyphicon glyphicon-ok form-control-feedback' : (address) ? 
					'glyphicon glyphicon-remove form-control-feedback' : ''
		}

		this.addRecipient = function() {
			this.recipients.push({ address : '', amount : 0 });
		}

		this.addSender = function(from) {
			this.from = from;
		}

		this.removeRecipient = function(index) {
			if (this.recipients.length>1) {
				this.recipients.splice(index, 1);
			} else {
				this.recipients=[ { address:'', amount:0, checkedAddress:'', thumb:'' } ];
			}
			
		}

		this.pushTransaction = function() {
			// todo
		}

		this.data = function() {
			return {
				from : this.from,
				thumbFrom : this.thumbFrom,
				balance : this.balance,
				recipients : this.recipients,
				fee : this.fee,
				passphrase : this.passphrase,
				salt : this.salt,
				getFee : this.getFee(),
				total : this.getTotal(),
				qrcode : this.qrcode,
				feeMode : this.feeMode,
				guidance : this.guidance,
				showImportQR: this.showImportQR,
				qrPartials: this.qrPartials,
				qrTotal: this.qrTotal,
				qrParts: this.qrParts,
				signAddress: this.signAddress
			};
		}

		this.export = function() {

			recipientsExport = [];
			this.recipients.forEach(function(v){ 
			recipientsExport.push(_.pick(v,'address','amount'));
			});

			unspentExport = [];
			this.unspent.forEach(function(v){ 
				unspentExport.push(_.pick(v,'transaction_hash','value','transaction_index'));
			});

			data = {
				recipients : recipientsExport,
				from : this.from,
				balance : this.balance,
				unspent : unspentExport
			};

			data = JSON.stringify(data);
			
			var chunkLength = 150;
			var fullCheck = sjcl.hash.sha256.hash(data)[0];
			var numChunks = Math.ceil(data.length / chunkLength);
			chunkLength = Math.ceil(data.length / numChunks);

			var chunks = [];

			_.times(Math.ceil(data.length/chunkLength), function(i) {
				chunks.push(
					JSON.stringify(
						{
							i: i,
							t: numChunks,
							d: data.substr(i * chunkLength, chunkLength),
							c: fullCheck
						}
					)
				)
			});

			return chunks
		}

		this.newImport = function() {
			this.qrPartials = {};
			this.qrTotal = 0;
			this.qrParts = 0;
			this.lastQrCode = false;
		},

		this.import = function(data) {
			var master = this;
			isAddress = cryptoscrypt.validAddress(data);
			if (isAddress) {
				master.recipients[master.expectedField].address = data;
				return true;
			}
			try {
				var qrData = JSON.parse(data);
				console.log('parse OK');
			} catch (e) {
				console.log("Couldn't parse JSON");
				return;
			}
			if (!qrData) {
				console.log("Invalid QR data, aborting");
				return;
			}
			if (this.lastQrCode && this.lastQrCode.c != qrData.c) {
				console.log("Checksum doesn't match previous QR code, ignoring this code");
				return;
			}

			if (!this.qrPartials[qrData.i]) {
				this.qrParts++;
				this.qrPartials[qrData.i] = qrData;
				this.lastQrCode = qrData;
			}
			this.qrTotal = qrData.t;
			console.log(this.qrPartials);

			var code = _.reduce(this.qrPartials, function(code, chunk) { return code + chunk.d; }, '');
			var check = sjcl.hash.sha256.hash(code);
			if (check[0] != qrData.c) {
				console.log('invalid code checksum or missing pieces');
				return;
			}
			var jsonCode = JSON.parse(code);
			console.log(jsonCode);

			this.recipients = jsonCode.recipients;
			this.from = jsonCode.from;
			this.unspent = jsonCode.unspent;
			this.balance = jsonCode.balance;
			return true;

		}


		this.putAll = function(recipientId) {

			var outputAmounts = [];
			var master = this;

			var sumAmounts = cryptoscrypt.sumArray( 
				_.pluck(this.recipients, 'amount')
			 );

			this.recipients[recipientId][ 'amount' ] = parseInt(this.balance - sumAmounts - this.fee + this.recipients[recipientId][ 'amount' ]);
		}

		this.fromData = function(data) {
			this.from = data.from;
			this.recipients = data.recipients;
			this.fee = data.fee;
			this.passphrase = data.passphrase;
			this.salt = data.salt;
		}

		this.getFee = function() {

			try {
				master = this;

				if (this.from == '') { return 0 }

				if (this.feeMode == 'custom') {
					return this.fee
				}

				if (this.unspent.length>0) {
					var numOfInputs = cryptoscrypt.bestCombination(
						_.pluck(this.unspent, 'transaction_index'),
						master.getTotal()
					).length;
					this.fee = parseInt(( 140 * numOfInputs + 100 * this.recipients.length + 150 ) / 1000) * 10000 + 10000;
				};

				return this.fee;
				//this.updateTotal();
			} catch(err) {
				return 0
			}
		}

		this.getTotal = function() {
			try {
				return cryptoscrypt.sumArray(
					_.pluck(this.recipients, 'amount')
					)+this.fee
			} catch(err) {
				return 0
			}
		}

		this.sign = function(passphrase,salt) {

			if (this.getTotal()>this.balance) {
				window.alert('There is not enough money available');
				return 'There is not enough money available';
			}

			// Build the unsigned transaction;

			var tx = cryptoscrypt.buildTx(
			  _.pluck(this.unspent, 'transaction_hash'),
			  _.pluck(this.unspent, 'transaction_index'),
			  _.pluck(this.unspent, 'value'),
			  _.pluck(this.recipients, 'address'),
			  this.from,
			  _.pluck(this.recipients, 'amount'),
			  this.fee
			);

			// Display unsigned transaction

			console.log(tx[0].toHex());
			
			// Calculate the private key;

			pkey = cryptoscrypt.getPkey(passphrase, salt);

			this.signAddress = cryptoscrypt.pkeyToAddress(pkey);

			cryptoscrypt.pkeyToAddress(pkey);

			// Perform the signatures

			tx = cryptoscrypt.signTx(tx, pkey);

			//Create the QR code

			this.qrcode = tx[0].toHex().toString();

			// Show the signed transaction Hex

			console.log(tx[0].toHex());
		}

		this.updateUnspent = function(from, success, fail) {
			return this.getJSONrequest('https://api.biteasy.com/blockchain/v1/addresses/' + from + '/unspent-outputs?per_page=100&callback=?refreshSection', success, fail);
		}

		this.updateUnspentOnion = function(from, success, fail) {
			return this.getJSONrequest('https://blockchainbdgpzk.onion/unspent?active=' + from + '&cors=true', success, fail);
		}

		this.updateBalance = function() {
			var master = this;

			var successFunction = function(data) {
				master.unspent = data.data.outputs;
				if (master.unspent[0].value) {
					master.balance = cryptoscrypt.sumArray(_.pluck(master.unspent, 'value'))
				}
				def.resolve();
			};

			var successFunctionOnion = function(data) {
				master.unspent = data.unspent_outputs;
				if (master.unspent[0].value) {
					master.balance = cryptoscrypt.sumArray(_.pluck(master.unspent, 'value'))

					//Rename keys to match
					b = [];
					var map = {
						tx_hash : "transaction_hash",
						value : "value",
						tx_output_n : "transaction_index",
					};
					master.unspent.forEach( function(value, index) {
						block = {};
						_.each(master.unspent[index], function(value2, key) {
							key = map[key] || key;
							block[key] = value2;
						})
						b[index] = block;
					});
					master.unspent = b;
				}

				def.resolve();
			};


			var failFunction = function() {

				return master.updateUnspentOnion(
					master.from,
					successFunctionOnion,
					function() {
						console.log('Unable to fetch address data');
						return def.reject;
					})
			};

			var url = 'https://api.biteasy.com/blockchain/v1/addresses/' + this.from + '/unspent-outputs?per_page=100';
			var def = $.Deferred()

			this.getJSONrequest(url, successFunction, failFunction);

			return def
		}
		

		this.lookup = function(field,dataId,inputValue) {

			var master = this;
			var address = inputValue;

			// If nothing

			if (inputValue == '') {
				return $().promise(); 
			}

			// Stop function if nothing has changed

			check = (field == 'sender') ? this.checkedFrom : master.recipients[dataId].checkedAddress;
			if (inputValue == check) {
				return $().promise();
			}

			//reset values if anything changed

			if (field == 'sender') {
				this.balance = '';
				//this.from = inputValue; this is already done on keydown
				this.thumbFrom = '';
			} 

			if (field == 'to') {
				//this.recipients[dataId].address = inputValue; This is already done on keydown
				this.recipients[dataId].thumb = '';
			} 

			//If address is already valid

			if (cryptoscrypt.validAddress(inputValue) == true) {

				if (field == 'from') {
					this.from = address;
					this.thumbFrom = '';
					this.updateBalance().done();
				} 

				if (field == 'to') {
					this.recipients[dataId].address = inputValue;
					this.recipients[dataId].thumb = '';
				}
				
				return;
			}
			// If not valid address, lookup on onename.io

			return $.getJSON('https://onename.com/' + inputValue + '.json', function(data) {

				address = data.bitcoin.address ? data.bitcoin.address : '';

				if (data.avatar) {

					if (field == 'sender') {
					master.thumbFrom = data.avatar.url
					} else {
					master.recipients[dataId].thumb = data.avatar.url
					}

				};

				// Double check that whatever onename.io sent is valid

				if (cryptoscrypt.validAddress(address) == true) {
					if (field == 'sender'){
						master.from = address;
						master.checkedFrom = address;
					};
					if (field.substring(0,2) == 'to'){
						master.recipients[dataId].address = address;
						master.recipients[dataId].checkedAddress = address;
					};
				}

			})
		}
	}
	return Transaction;
});

