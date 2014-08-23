define([
	'models/scrypt',
	'models/pbkdf2',
	'models/bitcoin',
	'models/biginteger'
], function(Scrypt, PBKDF2, Bitcoin, BigInteger) {
	var scrypt = scrypt_module_factory(Math.pow(2,29));

	return window.cryptoscrypt = cryptoscrypt = {

		scrypto: function() {

			var result = scrypt.to_hex(
				scrypt.crypto_scrypt(
					scrypt.encode_utf8("ER8FT+HFjk0" + String.fromCharCode(0x01)),
					scrypt.encode_utf8("7DpniYifN6c" + String.fromCharCode(0x01)),
					Math.pow(2, 18), 8, 1, 32
				)
			);

			return result
		},

		pbkdf2o: function() {
			var res = sjcl.misc.pbkdf2(
				'ER8FT+HFjk0' + String.fromCharCode(0x02),
				'7DpniYifN6c' + String.fromCharCode(0x02), 
				Math.pow(2, 16), 256
			);
			return sjcl.codec.hex.fromBits(res);
		},

		warp: function() {
			var hex1 = cryptoscrypt.scrypto();
			var hex2 = cryptoscrypt.pbkdf2o();
			var out = '';
			for (var i = 0; i < 64; ++i) {
				out += (parseInt(hex1[i], 16) ^ parseInt(hex2[i], 16)).toString(16);
			}
			console.log(out);
			key = new Bitcoin.ECKey(BigInteger.fromHex(out), false);
			return key.toWIF();
		}
	}
});
