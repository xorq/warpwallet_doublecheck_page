define([
	'models/scrypt',
	'models/pbkdf2',
	'models/bitcoin',
	'models/biginteger'
], function(Scrypt, PBKDF2, Bitcoin, BigInteger) {
	var scrypt = scrypt_module_factory(Math.pow(2,29));
	return window.cryptoscrypt = cryptoscrypt = {

		scrypto: function(passphrase,salt) {

			var result = scrypt.to_hex(
				scrypt.crypto_scrypt(
					scrypt.encode_utf8(passphrase + String.fromCharCode(0x01)),
					scrypt.encode_utf8(salt + String.fromCharCode(0x01)),
					Math.pow(2, 18), 8, 1, 32
				)
			);
			return result
		},

		pbkdf2o: function(passphrase,salt) {
			var res = sjcl.misc.pbkdf2(
				passphrase + String.fromCharCode(0x02),
				salt + String.fromCharCode(0x02), 
				Math.pow(2, 16), 256
			);
			return sjcl.codec.hex.fromBits(res);
		},

		warp: function(passphrase,salt) {
			var hex1 = cryptoscrypt.scrypto(passphrase,salt);
			var hex2 = cryptoscrypt.pbkdf2o(passphrase,salt);
			var out = '';
			for (var i = 0; i < 64; ++i) {
				out += (parseInt(hex1[i], 16) ^ parseInt(hex2[i], 16)).toString(16);
			}
			key = new Bitcoin.ECKey(BigInteger.fromHex(out), false);
			return [key.toWIF(),key.pub.getAddress()];
		},
		validAddress: function(address){
			try{
				Bitcoin.Address.fromBase58Check(address);
				return true;
			}
			catch(err){
				return false;
			}
		},
		sumArray: function(a) {
			var result = 0;
			for (i = 0; i < a.length; i++) {
				result += a[i];
			} 
			return result
		},

		combine: function(a,min) {
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

		bestCombination: function (index,aim) {

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

		buildTx: function (unspentHashs,unspentHashsIndex,unspentValues,toAddress,fromAddress,amount,fee) {

			tx = new Bitcoin.Transaction();
			tx.addOutput(toAddress, amount);
			var totalRedeemed = 0;
			selectedComb = cryptoscrypt.bestCombination(unspentValues, amount);

			$.each(selectedComb,function( idx, obj ){
		        tx.addInput( unspentHashs[ obj ],unspentHashsIndex[ obj ]);
		        totalRedeemed += parseInt( unspentValues[ obj ]);
	      	});

			if ( totalRedeemed > amount + fee ) {
				tx.addOutput(fromAddress,totalRedeemed - ( amount + fee ));
			};

	        return [tx,selectedComb.length]
    	}
		
	}
});
