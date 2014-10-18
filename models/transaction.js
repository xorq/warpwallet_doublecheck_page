	define([
  'jquery',
  'underscore',
  'backbone',
  'models/bitcoin',
], function($, _, Backbone,Bitcoin) {
	function Transaction() {
		this.guidance = 'Hide';
		this.from = '';
		this.checkedFrom = '';
		this.thumbFrom = '';
		this.recipients = [ { address:'', amount:0, checkedAddress:'' } ];
		this.fee = 0;
		this.passphrase = '';
		this.salt = '';
		this.balance = '';
		this.unspent = [ { } ];
		this.qrcode = '';
		this.feeMode = 'auto';
		this.showImportQR = false;

		this.changeFeeMode = function() {
			var modes = [ 'auto', 'custom' ];
			this.feeMode = modes[ (modes.indexOf(this.feeMode) + 1) % modes.length ];
		}

		this.addRecipient = function() {
			this.recipients.push({ address : '', amount : 0 });
		}

		this.addSender = function(from) {
			this.from = from;
		}

		this.removeRecipient = function(index) {
			this.recipients.splice(index, 1);
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
				qrParts: this.qrParts
			};
		}

		this.export = function() {

			recipientsExport = [];
			this.recipients.forEach(function(v){ 
			recipientsExport.push(_.pick(v,'address','amount'));//_.pick(v,'good'); console.log(v); 
			});

			unspentExport = [];
			this.unspent.forEach(function(v){ 
			unspentExport.push(_.pick(v,'transaction_hash','value','transaction_index'));//_.pick(v,'good'); console.log(v); 
			});

			data = {
				recipients : recipientsExport,
				from : this.from,
				balance : this.balance,
				unspent : unspentExport
			};

			data = JSON.stringify(data);
			
			var chunkLength = 190;
			var fullCheck = sjcl.hash.sha256.hash(data)[0];
			var numChunks = Math.ceil(data.length / chunkLength);
			chunkLength = Math.ceil(data.length / numChunks);

			var chunks = [];
			for (var i = 0; i < data.length; i += chunkLength) {
				chunks.push(JSON.stringify({
					i: Math.floor(i / chunkLength), // index
					t: numChunks, // total
					d: data.substr(i, chunkLength), // data
					c: fullCheck // checksum
				}));
			}
			console.log(chunks);

			// do a self-check
/*			var dataStr = '';
			_.each(chunks, function(chunk) {
				dataStr += JSON.parse(chunk).d;
			});
			if (dataStr == data) {
				console.log('integrity check passed');
			} else {
				console.log('FAILED int check');
			}
*/

			return chunks
		}

//{ i: 0, t: 3, c: 'abcd', d: '{123123123123123123...'}
//{ i: 1, t: 3, c: 'abcdff', d: '...123123123123123123...'}
//{ i: 2, t: 3, c: 'abcdfffff', d: '...123123123123123123}'}

		this.newImport = function() {
			this.qrPartials = {};
			this.qrTotal = 0;
			this.qrParts = 0;
			this.lastQrCode = false;
		},

		this.import = function(data) {
			console.log('import called width ' + data);

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

/*
			function read(a) {
				$("#qr-value").text(a);
				try {console.log(JSON.parse(results.join('')))} catch(err) {};;
				$("#title").html(got.toString());

				if (hashCode(a.split("&")[1]) == a.split("&")[2]) {

					got[a.split("&")[0]] = a.split("&")[0];

					$("#title").html("OK Got Numbers " +a.split("&")[0] +"Got those :"+ got);
					try {
						results[a.split("&")[0]] = a.split('&')[1];
						} catch(err) {

					}
				};

				try{
					console.log(JSON.parse(results.join('')));
					$("#big-result").text("OK GOT IT : "+(results.join('')));
					//copyToClipboard(results.join(''));
				} catch(err) {};
			}

			data = $.parseJSON(data);
			if (!data) { return; }

			console.log(data);

			this.recipients = data.recipients;
			this.from = data.from;
			this.unspent = data.unspent;
			this.balance = data.balance;
*/
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

			// Perform the signatures

			tx = cryptoscrypt.signTx(tx, pkey);

			//Create the QR code

			this.qrcode = tx[0].toHex().toString();

			// Show the signed transaction Hex

			console.log(tx[0].toHex());
		}

		this.updateUnspent = function() {
			master = this;
			return $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + master.from + '/unspent-outputs?per_page=100', function(data) {
	        	master.unspent = data.data.outputs;
	    	})
		}

	    this.updateBalance = function() {

			var master = this;
			return this.updateUnspent(master.from).done(function(){
				master.balance = cryptoscrypt.sumArray(_.pluck(master.unspent, 'value'))
			});
	    }

		this.lookup = function(field,value,dataId,inputValue) {

			var master = this;
			var address = inputValue;

		  	// If nothing

			if (inputValue == '') {
			  return $().promise(); 
			}

			// Stop function if nothing has changed

			check = (field == 'from') ? this.checkedFrom : master.recipients[dataId].checkedAddress;
			if (inputValue == check) {
			  return $().promise();
			}

			//reset values if anything changed

		    if (field == 'from') {
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
			      this.updateBalance();
			    } 

			    if (field == 'to') {
			      this.recipients[dataId].address = inputValue;
			      this.recipients[dataId].thumb = '';
			    }
			    
			    return $().promise();
		    }
		  // If not valid address, lookup on onename.io

			return $.getJSON('https://onename.io/' + inputValue + '.json', function(data) {

			    address = data.bitcoin.address ? data.bitcoin.address : '';

			    if (data.avatar) {

			      if (field == 'from') {
			      	master.thumbFrom = data.avatar.url
			      } else {
			      	master.recipients[dataId].thumb = data.avatar.url
			      }

			    };

			    address = data.bitcoin.address ? data.bitcoin.address : '';

			    // Double check that whatever onename.io sent is valid

			    if (cryptoscrypt.validAddress(address) == true) {
			    	if (field == 'from'){
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

