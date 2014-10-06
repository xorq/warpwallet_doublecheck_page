	define([
  'jquery',
  'underscore',
  'backbone',
  'models/bitcoin',
], function($, _, Backbone,Bitcoin) {
	function Transaction() {
		this.from = '';
		this.thumbFrom = '';
		this.senders = [ {address:''} ]
		this.recipients = [ {address:'',amount:0} ];
		this.fee = 0;
		this.passphrase = '';
		this.salt = '';
		this.balance = '';
		this.unspentHashs = [];
		this.unspentHashsIndex = [];
		this.unspentValues = [];
		this.qrcode = '';
		this.feeMode = 'auto';

		this.changeFeeMode = function() {
			var modes = ['auto','custom'];
			this.feeMode = modes[(modes.indexOf(this.feeMode) + 1) % modes.length];
			//console.log(modes[(modes.indexOf(this.feeMode)+ 1 ) % modes.length]);

		}

		this.addRecipient = function() {
			this.recipients.push({address:'',amount:0});
		}

		this.addSender = function(from) {
			this.from = from;
		}

		this.removeRecipient = function(index) {
			this.recipients.splice(index, 1);
			//this.updateFee();
		}

		this.pushTransaction = function() {
			// todo
		}

		// we can represent a transaciton in JSON fformat
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
				feeMode : this.feeMode
			};
		}

		this.putAll = function(recipientId) {

			var outputAmounts = [];
			var master = this;

			$.each(
			this.recipients,function(i,obj){
			  if (i!=parseInt(recipientId)){
			    outputAmounts.push(parseInt(obj['amount']))
			  }
			});
			this.recipients[recipientId]['amount'] = (parseInt(this.balance) - cryptoscrypt.sumArray(outputAmounts))-this.fee;
		}

		this.fromData = function(data) {
			this.from = data.from;
			this.recipients = data.recipients;
			this.fee = data.fee;
			this.passphrase = data.passphrase;
			this.salt = data.salt;
		}

		this.getFee = function() {

			if (this.from == '') { return 0 }

			if (this.feeMode == 'custom') {
				return this.fee
			}

			var outputAmounts = [];
			$.each(this.recipients, function(i, recipient) {
				outputAmounts[i] = recipient.amount ;
			});
			var sumAmounts = cryptoscrypt.sumArray( outputAmounts );

			if (this.unspentHashs) {
				var numOfInputs = cryptoscrypt.bestCombination( this.unspentValues, sumAmounts ).length;
				this.fee = parseInt(( 140 * numOfInputs + 100 * this.recipients.length + 150 ) /1000) * 10000 + 10000;
			};
		return this.fee;
		//this.updateTotal();
		}

		this.getTotal = function() {
			var outputAmounts = [];
			var master = this;
			$.each( master.recipients, function(i, obj) {
				outputAmounts[i] = parseInt(parseFloat(obj['amount'])) ;
			});
			return cryptoscrypt.sumArray( outputAmounts )+this.fee;
		}

		this.sign = function(passphrase,salt) {

			if (this.getTotal()>this.balance) {
				window.alert('There is not enough money available');
				return 'There is not enough money available';
			}

			var outputAmounts = [];
			var outputAddresses = [];
			$.each(this.recipients, function(i, recipient) {
				if (recipient.address != '') {
					outputAddresses.push(recipient.address) ;
				};
				if (recipient.amount != '') {
					outputAmounts.push(recipient.amount) ;
				};
			});
			// Build the unsigned transaction;

			var tx = cryptoscrypt.buildTx(
			  this.unspentHashs,
			  this.unspentHashsIndex,
			  this.unspentValues,
			  outputAddresses,
			  this.from,
			  outputAmounts,
			  this.fee
			);

			//console.log(tx[0].toHex());
			
			// Calculate the private key;

			pkey = cryptoscrypt.getPkey(passphrase,salt);

			// Perform the signatures

			tx = cryptoscrypt.signTx(tx,pkey);

			//Create the QR code

			this.qrcode = tx[0].toHex().toString();

			// Show the transaction Hex

			console.log(tx[0].toHex());
		}

	    this.updateBalance = function(address) {

	      var master = this;

	      return $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + address + '/unspent-outputs?per_page=100', function(data) {
	        
	        master.unspentHashs = [];
	        master.unspentHashsIndex = [];
	        master.unspentValues = [];

	        $.each( data.data.outputs, function(idx,obj ) {
	          master.unspentHashs.push(obj.transaction_hash );
	          master.unspentHashsIndex.push( parseInt( obj.transaction_index ) );
	          master.unspentValues.push(obj.value);             
	        })

	        master.balance = cryptoscrypt.sumArray(master.unspentValues);

	      });
	    }

		this.lookup = function(field,value,dataId,inputValue) {

			var master = this;
			var address = inputValue;

			// Check if value has been modified

			check = (field == 'from') ? this.from : master.recipients[dataId].address;
			if (inputValue == check) {
			  return $().promise();
			};

		    if (field == 'from') {
		      this.balance = '';
		      this.from = inputValue;
		      this.thumbFrom = '';
		    } 

		    if (field == 'to') {
		      master.recipients[dataId].address = inputValue;
		      master.recipients[dataId].thumb = '';
		    } 

		  	// If nothing

			if (inputValue == '') {
			  return $().promise(); 
			}

		  	//If address is already valid

		  	if (cryptoscrypt.validAddress(inputValue) == true) {

			    if (field == 'from') {
			      this.from = address;
			      this.thumbFrom = '';
			      return this.updateBalance(inputValue);
			    } 

			    if (field == 'to') {
			      master.recipients[dataId].address = inputValue;
			      master.recipients[dataId].thumb = '';
			    }
			    
			    ////master.render();
			    return $().promise();
		    }

		  // If not valid address, lookup on onename.io

			return $.getJSON('https://onename.io/' + inputValue + '.json', function(data) {

			    address = data.bitcoin.address ? data.bitcoin.address : '';

			    if (data.avatar) {

			      if (field == 'from') {master.thumbFrom = data.avatar.url} else {master.recipients[dataId].thumb = data.avatar.url}

			    };

			    address = data.bitcoin.address ? data.bitcoin.address : '';

			    if (cryptoscrypt.validAddress(address) == true) {
			    	if (field == 'from'){master.from = address};
			    	if (field == 'to'){master.recipients[dataId].address = address};
			  	}
			})
		}
	}
	return Transaction;
});

