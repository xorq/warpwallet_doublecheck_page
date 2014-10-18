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
				showImportQR: this.showImportQR
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

			String.prototype.chunk = function(size) {
				console.log(cryptoscrypt.hashCode(this.slice(0,0+size)));
				return [].concat.apply([],
					this.split('').map(function(x,i){ return i%size ? [] : ((i/size).toString()+'&'+this.slice(i,i+size)+'&'+cryptoscrypt.hashCode(this.slice(i,i+size)).toString()) }, this)
				)
      		}

			numberOfChunks = Math.ceil((data.length)/200);
			chunkSize = Math.ceil(data.length / numberOfChunks);
			chunks = data.chunk(chunkSize);

			return chunks
		}


		this.import = function(data) {

			data = $.parseJSON(data);
			if (!data) { return; }

			console.log(data);

			this.recipients = data.recipients;
			this.from = data.from;
			this.unspent = data.unspent;
			this.balance = data.balance;

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

