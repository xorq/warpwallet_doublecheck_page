({
    appDir: "../",
    baseUrl: "models",
    dir: "../../appdirectory-build",
    modules: [
        {
            name: "bigi"
        },
        {
            name: "biginteger"
        },
        {
            name: "embed"
        },
        {
            name: "pbkdf2"
        },
		{
            name: "qrcode"
        },
		{
            name: "wordlist"
        }
    ],

        paths: {

        jquery: '../bower_components/jquery/jquery.min.js',
        underscore: '../bower_components/underscore/underscore/underscore.js',
        backbone: '../bower_components/backbone/backbone.js',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap.min.js',
        jsqrcode: '../bower_components/jsqrcode/html5-qrcode.min.js',
        requirejs: '../bower_components/requirejs/require.js',
    },
})