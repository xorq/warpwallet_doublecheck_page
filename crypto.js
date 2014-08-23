define([
	'models/scrypt',
	'models/pbkdf2'
], function() {
	var scrypt = scrypt_module_factory(Math.pow(2,29));

	return window.cryptoscrypt = {

		scrypto: function() {

			var result = scrypt.to_hex(
				scrypt.crypto_scrypt(scrypt.encode_utf8("test" + 0x01),
				scrypt.encode_utf8("" + 0x01),
				Math.pow(2, 18), 8, 1, 32)
			);

			return result
		},

		pbkdf2o: function() {
		    var key512Bits1000Iterations = CryptoJS.PBKDF2(
		    	"test" + 0x02, '' + 0x02, { keySize: 512/32, iterations: 1000 }
		    );

			return key512Bits1000Iterations;
		}
	}
});



