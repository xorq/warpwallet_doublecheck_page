define(['underscore'], function(_) {

	var currencies = [{'code':'AED','name':'United Arab Emirates Dirham'},{'code':'ARS','name':'Argentine Peso'},{'code':'AUD','name':'Australian Dollar'},{'code':'BGN','name':'Bulgarian Lev'},{'code':'BND','name':'Brunei Dollar'},{'code':'BOB','name':'Bolivian Boliviano'},{'code':'BRL','name':'Brazilian Real'},{'code':'CAD','name':'Canadian Dollar'},{'code':'CHF','name':'Swiss Franc'},{'code':'CLP','name':'Chilean Peso'},{'code':'CNY','name':'Chinese Yuan Renminbi'},{'code':'COP','name':'Colombian Peso'},{'code':'CZK','name':'Czech Republic Koruna'},{'code':'DKK','name':'Danish Krone'},{'code':'EGP','name':'Egyptian Pound'},{'code':'EUR','name':'Euro'},{'code':'FJD','name':'Fijian Dollar'},{'code':'GBP','name':'British Pound Sterling'},{'code':'HKD','name':'Hong Kong Dollar'},{'code':'HRK','name':'Croatian Kuna'},{'code':'HUF','name':'Hungarian Forint'},{'code':'IDR','name':'Indonesian Rupiah'},{'code':'ILS','name':'Israeli New Sheqel'},{'code':'INR','name':'Indian Rupee'},{'code':'JPY','name':'Japanese Yen'},{'code':'KES','name':'Kenyan Shilling'},{'code':'KRW','name':'South Korean Won'},{'code':'LTL','name':'Lithuanian Litas'},{'code':'MAD','name':'Moroccan Dirham'},{'code':'MXN','name':'Mexican Peso'},{'code':'MYR','name':'Malaysian Ringgit'},{'code':'NOK','name':'Norwegian Krone'},{'code':'NZD','name':'New Zealand Dollar'},{'code':'PEN','name':'Peruvian Nuevo Sol'},{'code':'PHP','name':'Philippine Peso'},{'code':'PKR','name':'Pakistani Rupee'},{'code':'PLN','name':'Polish Zloty'},{'code':'RON','name':'Romanian Leu'},{'code':'RSD','name':'Serbian Dinar'},{'code':'RUB','name':'Russian Ruble'},{'code':'SAR','name':'Saudi Riyal'},{'code':'SEK','name':'Swedish Krona'},{'code':'SGD','name':'Singapore Dollar'},{'code':'THB','name':'Thai Baht'},{'code':'TRY','name':'Turkish Lira'},{'code':'TWD','name':'New Taiwan Dollar'},{'code':'UAH','name':'Ukrainian Hryvnia'},{'code':'USD','name':'US Dollar'},{'code':'VEF','name':'Venezuelan Bolí­var Fuerte'},{'code':'VND','name':'Vietnamese Dong'},{'code':'ZAR','name':'South African Rand'}];
	
	return window.currencyList = {
		codes : function() {
			return _.pluck(currencies,'code')
		},
		names : function() {
			return _.pluck(currencies,'names')
		}
	}
})

