require.config({
  shim: {

  },
  paths: {
  	jquery: "bower_components/jquery/dist/jquery.min",
  	underscore: "bower_components/underscore/underscore",
    backbone: "bower_components/backbone/backbone",
    bootstrap: "bower_components/bootstrap/dist/js/bootstrap",
    qrcode: "bower_components/jsqrcode/html5-qrcode.min",
    requirejs: "bower_components/requirejs/require"
  },
  packages: [

  ]
});

require([
	'easybtc'
], function(EasyBTC) {
	EasyBTC.initialize();
});
