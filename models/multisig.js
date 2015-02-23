	define([
	'jquery',
	'underscore',
	'backbone',
	'models/bitcoinjs.min',
	'models/biginteger'
], function($, _, Backbone, Bitcoin, BigInteger) {
	function Multisig() {
		this.test = '';
		this.pubkeys = [ { address : '', pubkey : '', signature : '', thumb : '', onename : '', avatar : '' } , { address : '', pubkey : '', thumb : '', onename : '', avatar : '' }];
		this.expectedField = undefined;
		this.multisig = {};
		this.balance = 70180;
		this.unspents = [];
		//this.multisigs = [];
		this.showImportQr = false;
		this.showImportQrTx = false;
		this.showImportQrSig = false;

		this.numberOfSignatures = 1;
		//this.redeemscript = '';
		this.fee = 10000;
		this.recipients = [ { address : '', amount : '', checkedAddress : '', thumb : '' } ];
		
		
		this.rawTx = '';

		this.buildMultisig = function() {
			try {
				var tx = Bitcoin.Transaction.fromHex(this.getTx());
				var dummyPkey = '5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss'

				var tx = cryptoscrypt.buildTx(
				  _.pluck(this.unspents, 'transaction_hash'),
				  _.pluck(this.unspents, 'transaction_index'),
				  _.pluck(this.unspents, 'value'),
				  _.pluck(this.recipients, 'address'),
				  this.from,
				  _.pluck(this.recipients, 'amount'),
				  this.fee
				);
				// Display unsigned transaction

				console.log(tx[0].toHex());
				this.rawTx = tx[0].toHex()
				// Calculate the private key;
				//var signAddress = cryptoscrypt.pkeyToAddress(pkey);
				var tx = Bitcoin.Transaction.fromHex(tx[0].toHex());
				// Create the transaction
				//var tx = Bitcoin.Transaction.fromHex(tx[0].toHex());
				var txb = Bitcoin.TransactionBuilder.fromTransaction(tx);
				// Perform the signatures

				var pkey = Bitcoin.ECKey.fromWIF(dummyPkey);
				txb.sign(0, pkey, Bitcoin.Script.fromHex(this.multisig.redeemscript));

				var signatures = [];
				this.pubkeys.forEach(function(pubkey){
					if (pubkey.signature) { 
						ttt = new BigInteger.fromHex(pubkey.signature).toBuffer();
						var sig = new Bitcoin.ECSignature.fromDER(ttt);
						signatures.push(sig);
					}
				});
				_.each(signatures, function(signature, index){
					txb.signatures[0].signatures[index] = signature;
				})
				var result = txb.build().toHex();
				console.log(result);
				return result;
			} catch(err) {
				console.log('error : ' + err)
				return false
			}
		},

		this.getTx = function() {
			var tx = cryptoscrypt.buildTx(
			  _.pluck(this.unspents, 'transaction_hash'),
			  _.pluck(this.unspents, 'transaction_index'),
			  _.pluck(this.unspents, 'value'),
			  _.pluck(this.recipients, 'address'),
			  this.from,
			  _.pluck(this.recipients, 'amount'),
			  this.fee
			)[0].toHex();
			this.rawTx = tx;
			return tx
		},

		this.getTotal = function() {
			try {
				return cryptoscrypt.sumArray(
					_.pluck(this.recipients, 'amount')
					)+this.fee
			} catch(err) {
				return 0
			}
		},

		this.sign = function(pkey, field) {
			var signingAddress = cryptoscrypt.WIFToAddress(pkey);
			if (signingAddress != this.pubkeys[field].address){
				window.alert('You entered the password/private key for the address "' + signingAddress + '", therefore this signature is invalid')
			}
			this.findAddress();
			if (this.getTotal()>this.balance) {
				window.alert('There is not enough money available');
				return 'There is not enough money available';
			}

			// Build the unsigned transaction;

			var tx = cryptoscrypt.buildTx(
			  _.pluck(this.unspents, 'transaction_hash'),
			  _.pluck(this.unspents, 'transaction_index'),
			  _.pluck(this.unspents, 'value'),
			  _.pluck(this.recipients, 'address'),
			  this.from,
			  _.pluck(this.recipients, 'amount'),
			  this.fee
			);
			// Display unsigned transaction

			console.log(tx[0].toHex());
			this.rawTx = tx[0].toHex()
			// Calculate the private key;
			//var signAddress = cryptoscrypt.pkeyToAddress(pkey);
			var tx = Bitcoin.Transaction.fromHex(tx[0].toHex());
			// Create the transaction
			//var tx = Bitcoin.Transaction.fromHex(tx[0].toHex());
			var txb = Bitcoin.TransactionBuilder.fromTransaction(tx);
			// Perform the signatures

			pkey = Bitcoin.ECKey.fromWIF(pkey);
			txb.sign(0, pkey, Bitcoin.Script.fromHex(this.multisig.redeemscript));

			//Create the QR code

				//this.qrcode = tx[0].toHex().toString();
			var sig1 = (txb.signatures[0].signatures[0]);
			// Show the signature transaction Hex
			this.pubkeys[field].signature = sig1.toDER().toString('hex')
			//console.log(JSON.stringify(sig1));
		},

		this.getPubKeys = function() {
			return this.pubkeys
		},

		this.newSignature = function() {
			this.signature.push({ index : '', signature : ''})
		},

		this.importTx = function(data) {
			var master = this;
			try {
				var qrData = JSON.parse(data);
				checkSumInit = sjcl.hash.sha256.hash(JSON.stringify(_.omit(qrData, 'p')))[0];
				console.log(checkSumInit);
				console.log(qrData.p);
				if (parseInt(checkSumInit) != parseInt(qrData.p)) {
					console.log('Something wrong with the QR, try again!');
					return
				}
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
			this.unspents = jsonCode.unspent;
			this.balance = cryptoscrypt.sumArray(_.pluck(jsonCode.unspent, 'value'));
			return true;
		}

		this.newImport = function() {
			this.qrPartials = {};
			this.qrTotal = 0;
			this.qrParts = 0;
			this.lastQrCode = false;
		},

		this.importData = function(code) {
			master = this;
			var jsonCode = JSON.parse(code);
			//jsonCode = JSON.parse(jsonCode);
			console.log(jsonCode);
			if (jsonCode.recipients) { this.recipients = jsonCode.recipients};
			if (jsonCode.unspent) { this.unspent = jsonCode.unspent};
			if (jsonCode.redeemscript) {
				this.multisig.redeemscript = jsonCode.redeemscript;
				this.loadRedeemscript(jsonCode.redeemscript);
			}
			if (jsonCode.signatures) {
				_.each(this.pubkeys, function(pubkey,index) {
					master.pubkeys[index].signature = jsonCode.signatures[index];
				});
			}
			this.balance = cryptoscrypt.sumArray(_.pluck(jsonCode.unspent, 'value'));
		},

		this.exportData = function() {
			this.findAddress();
			master = this;
			var recipientsExport = [];
			this.recipients.forEach(function(v){ 
				recipientsExport.push(_.pick(v,'address','amount'));
			});
			var unspentExport = [];
			this.unspents.forEach(function(v){ 
				unspentExport.push(_.pick(v,'transaction_hash','value','transaction_index'));
			});
			data = {
				recipients : recipientsExport,
				unspents : unspentExport,
				redeemscript : master.multisig.redeemscript,
				signatures: _.pluck(master.pubkeys, 'signatures')
			};
			return JSON.stringify(data);
		},

		this.exportTransaction = function() {
			master = this;
			var recipientsExport = [];
			this.recipients.forEach(function(v){ 
				recipientsExport.push(_.pick(v,'address','amount'));
			});
			var unspentExport = [];
			this.unspents.forEach(function(v){ 
				unspentExport.push(_.pick(v,'transaction_hash','value','transaction_index'));
			});
			data = {
				recipients : recipientsExport,
				unspents : unspentExport,
				redeemscript : master.multisig.redeemscript
			};
			data = JSON.stringify(data);
			var CHUNKLENGTH = 450;
			var fullCheck = sjcl.hash.sha256.hash(data)[0];
			var numChunks = Math.ceil(data.length / CHUNKLENGTH);
			CHUNKLENGTH = Math.ceil(data.length / numChunks);
			var chunks = [];
			_.times(Math.ceil(data.length/CHUNKLENGTH), function(i) {
				var toCheckSum = JSON.stringify(
					{
						i: i,
						t: numChunks,
						d: data.substr(i * CHUNKLENGTH, CHUNKLENGTH),
						c: fullCheck
					}
				)
				var partialCheckSum = sjcl.hash.sha256.hash(toCheckSum)[0]
				
				var toPush = JSON.stringify(
					{
						i: i,
						t: numChunks,
						d: data.substr(i * CHUNKLENGTH, CHUNKLENGTH),
						c: fullCheck,
						p: partialCheckSum
					}
				)
				chunks.push( toPush )
			})
			;

			return chunks
		},


		this.putAll = function(field) {
			var sumAmounts = cryptoscrypt.sumArray( 
				_.pluck(this.recipients, 'amount')
			);
			this.recipients[field][ 'amount' ] = Math.max(0, parseInt(this.balance - sumAmounts - this.fee + this.recipients[field][ 'amount' ]));
		},

		this.getAddressUnspent = function() {
			var master = this;
			success = function(data) {
				master.unspents = data.data.outputs;
				master.balance = cryptoscrypt.sumArray(_.pluck(data.data.outputs, 'value'))
			};
			fail = function() {console.log('couldnt find the unspent data')};
			if (this.multisig.address){
				return cryptoscrypt.getJSONrequest('https://api.biteasy.com/blockchain/v1/addresses/' + this.multisig.address + '/unspent-outputs?per_page=100&callback=?refreshSection', success, fail);
			} else {
				return $().promise();
			}
		},

		this.deleteRecipient = function(index) {
			if (this.recipients.length>1) {
				this.recipients.splice(index, 1);
			} else {
				this.recipients=[ { address:'', pubkey:0, thumb:'', onename:'', avatar:'' } ];
			}
		},

		this.addRecipient = function() {
			this.recipients.push({ address:'', amount:'', checkedAddress:'', thumb:'' });
		}

		this.addEntry = function() {
			if (this.pubkeys.length < 15) {
			this.pubkeys.push({ address:'', pubkey:'', signature:'', thumb:'', onename:'', avatar:'' })
			} else {
				window.alert('You cannot have more than 15 addresses for one multisig address')
			}
		},

		this.clearField = function(field) {

			this.pubkeys[field] =  { address:'', pubkey:'', thumb:'', onename:'', avatar:'' };
		},

		this.deletePubkey = function(index) {
			if (this.pubkeys.length>2) {
				this.pubkeys.splice(index, 1);
			} else {
				this.clearField(index);
			}
		},

		this.getPubKey = function(address) {
			var getRequest = function(url, success, error) {
				$.ajax({
					url : url,
					dataType : 'text',
					success : success,
					error : error
				});
			};
			var result = $.Deferred();
			var success = function(data) {
				result.resolve(data)
			};
			var error = function() {
				console.log("failure")
			};
			getRequest('https://blockchain.info/q/pubkeyaddr/' + address + '?cors=true', success, error);
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
			master = this;
			return $.getJSON('https://onename.com/' + input + '.json', function(data) {
				var address = data.bitcoin.address ? data.bitcoin.address : '';
				if (data.avatar) {
					master.pubkeys[field].avatar = data.avatar;
				};
				if (cryptoscrypt.validAddress(address)) {
						master.pubkeys[field].address = address;
					};
				}
			)
		},

		this.findAddress = function() {
			pubkeys = _.without(_.pluck(this.pubkeys,'pubkey'),'','unknown');
			if (_.contains(_.pluck(this.pubkeys,'pubkey'),'unknown')) {
				this.multisig['address'] = '';
				console.log('some addresses are unknown');
				return ;
			}
			if (pubkeys.length>1) {

				this.multisig = cryptoscrypt.getMultisigAddress(pubkeys, parseInt(this.numberOfSignatures))
			} else {
				this.multisig = '';
				//this.redeemscript = '';
				this.address = '';
				this.unspent = '';
				this.balance = undefined;
			}

		},

		this.findAddresses = function(pubkeys) {
			this.multisigs = cryptoscrypt.getMultisigAddresses(pubkeys, this.numberOfSignatures);
		},

		this.importRedeem = function(code) {
			//console.log(bitcoin.Script.fromHex(redeemscriptHex))
		},

		this.loadRedeemscript = function(redeemscript) {
			var addresses = cryptoscrypt.getAddressesFromRedeemscript(redeemscript);
			this.numberOfSignatures = cryptoscrypt.getNumberOfSignaturesFromRedeemscript(redeemscript);
			this.pubkeys = _.map(addresses,function(data) { 
				return {
				address:data.address, pubkey:data.pubkey, thumb:'', onename:'', avatar:'' }
			})
		}
	}
	return Multisig;
});

