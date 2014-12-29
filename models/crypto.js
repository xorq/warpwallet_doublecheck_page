define([
	'models/scrypt',
	'models/pbkdf2',
	'models/bitcoin',
	'models/biginteger'
], function(Scrypt, PBKDF2, Bitcoin, BigInteger) {
	
	return window.cryptoscrypt = cryptoscrypt = {


		hashCode : function(str) {
		    var hash = 0;
		    for (var i = 0; i < str.length; i++) {
		        hash = str.charCodeAt(i) + ((hash << 5) - hash);
		    }
		    return hash;
		},


		pkeyToAddress : function(pkey) {
			return Bitcoin.ECKey.fromWIF(pkey.toWIF()).pub.getAddress().toString();
		},


		reverseHex : function(hex) {

			var result = '';
		    for (var i = 0; i <=hex.length-2; i=i+2) {
    			result+=hex.substring(i,i+2);
 			}
 			return result;

		},

		scrypto : function(passphrase,salt) {
			var scrypt = scrypt_module_factory(Math.pow(2,29));
			var result = scrypt.to_hex(
				scrypt.crypto_scrypt(
					scrypt.encode_utf8(passphrase + String.fromCharCode(0x01)),
					scrypt.encode_utf8(salt + String.fromCharCode(0x01)),
					Math.pow(2, 18), 8, 1, 32
				)
			);
			return result

		},

		pbkdf2o : function(passphrase,salt) {

			var res = sjcl.misc.pbkdf2(
				passphrase + String.fromCharCode(0x02),
				salt + String.fromCharCode(0x02), 
				Math.pow(2, 16), 256
			);

			var stepsDone = 0;
			var calcStep = function(input) {
				var res = sjcl.misc.pbkdf2(
					input,
					Math.pow(2, 6), 256
				);
				if (stepsDone++ < 1024) {
					//setTimeout(function() {
						calcStep(res);
					//});
				}
			}

			return sjcl.codec.hex.fromBits(res);
		},

		warp : function(passphrase,salt) {

			var hex1 = cryptoscrypt.scrypto(passphrase,salt);
			var hex2 = cryptoscrypt.pbkdf2o(passphrase,salt);
			var out = '';
			for (var i = 0; i < 64; ++i) {
				out += (parseInt(hex1[i], 16) ^ parseInt(hex2[i], 16)).toString(16);
			}
			key = new Bitcoin.ECKey(BigInteger.fromHex(out), false);
			return [key.toWIF(),key.pub.getAddress().toString()];

		},

		validAddress : function(address) {

			try{
				Bitcoin.Address.fromBase58Check(address);
				return true;
			}
			catch(err){
				return false;
			}

		},

		validPkey : function(data) {

			try{
				Bitcoin.ECKey.fromWIF(data);
				return true;
			}
			catch(err){
				return false;
			}

		},

		getPkey : function(passphrase,salt) {

			if (cryptoscrypt.validPkey(passphrase) == false) {
				pkey = Bitcoin.ECKey.fromWIF(cryptoscrypt.warp(
					passphrase,
					salt
				)[0])
			} else {
				pkey = Bitcoin.ECKey.fromWIF(passphrase)
			};
			return pkey

		},


		signTx : function(tx,pkey) {
			for ( var i = 0; i < tx[1]; i++) {
				tx[0].sign(i,pkey);
			};
			return tx

		},

		sumArray : function(a) {

			return _.reduce(a, function(memo, num){ return 1*memo + 1*num; }, 0) ;
		
		},

		combine : function(a,min) {

	    	var fn = function(n, src, got, all) {
		        if (n == 0) {
		            if (got.length > 0) {
		                all[all.length] = got;
		            }
		            return;
		        }
		        for (var j = 0; j < src.length; j++) {
		            fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
		        }
		        return;
	    	}
	    	var all = [];
	    	for (var i = min; i < a.length; i++) {
	        	fn(i, a, [], all);
	    	}
	    	all.push(a);
	    	return all;

		},

		bestCombination : function (index,aim) {

			var a = cryptoscrypt.combine(index,0);
			var distancesArray = [];
			smallestDistance = cryptoscrypt.sumArray(a[0]) - aim;
			var current = 0;
			var result = [];

			for (var k = 0; k < a.length; k++) {
				current = cryptoscrypt.sumArray(a[k]) - aim;
				distancesArray.push(current);
				smallestDistance = ((smallestDistance >= current) && (current >= 0)) | (smallestDistance <0) ? current : smallestDistance;
			}

			winningArray = a[distancesArray.indexOf(smallestDistance)];

			for (var g = 0; g < winningArray.length; g++) {
				result.push(index.indexOf(parseInt(winningArray[g])));
			}
			return result;

		},

		buildTx : function (unspentHashs,unspentHashsIndex,unspentValues,toAddresses,fromAddress,amounts,fee) {

			if ( cryptoscrypt.sumArray(amounts) + fee > cryptoscrypt.sumArray(unspentValues) ) {
				return
			};

			var totalRequested = 0;

			tx = new Bitcoin.Transaction();
			for (var i = 0 ; i < toAddresses.length ; i++) {
				tx.addOutput(toAddresses[i], amounts[i]);
				totalRequested += amounts[i]
			}
			var totalRedeemed = 0;
			selectedComb = cryptoscrypt.bestCombination(unspentValues, totalRequested);

			$.each(selectedComb,function( idx, obj ){
		        tx.addInput( unspentHashs[ obj ],unspentHashsIndex[ obj ]);
		        totalRedeemed += parseInt( unspentValues[ obj ]);
	      	});

			if ( totalRedeemed > totalRequested + fee ) {
				tx.addOutput(fromAddress,totalRedeemed - ( totalRequested + fee ));
			};

	        return [tx,selectedComb.length];
	        		
    	},
		
		makeTx : function() {

			outputAddresses = [ ];
			outputAmounts = [ ];

			var transaction = cryptoscrypt.buildTx(
				this.unspentHashs,
				this.unspentHashsIndex,
				this.unspentValues,
				outputAddresses,
				$('input[name=from]', this.$el).val(),
				outputAmounts,
				parseInt(100000000 * $('input[name=fee]', this.$el).val())
			);

			return transaction;
		},

	}
});
