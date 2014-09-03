define([
  'jquery',
  'underscore',
  'backbone',
  'models/bitcoin',
  'models/qrcode'
], function($, _, Backbone,Bitcoin,qrcode){
  var balance = '';
  var addresses = {"From":"","To":""};
  var unspentHashsIndex = [];
  var unspentHashs = [];
  var unspentValues = [];
  var inputsCount = 0;
  var tx = new Bitcoin.Transaction();
  var IndexView = Backbone.View.extend({
    el: $('#contents'),
    template: "\
      <form role='form'>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>From</label> \
          </div>\
          <div class='col-xs-9 form-group has-feedback input-prepend' name='div-from'>\
            <input type='text' class='col-xs-9 form-control' name='from' placeholder='Enter sender name or Bitcoin address' />\
            <span class='col-xs-9 add-on name='amount-balance-from' id='amount-balance-from'></span>\
            <span class='col-xs-9 glyphicon form-control-feedback' name='glyphicon-from' id='glyphicon-from'></span>\
          </div>\
          <div class='col-xs-1'>\
            <img style='display: none' class='thumb-from' width='64' /> \
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>To</label>\
          </div>\
          <div class='col-xs-9 form-group has-feedback' name='div-to'>\
            <input type='text' class='col-xs-9 form-control' name='to' placeholder='Enter recipient name or Bitcoin address' />\
            <span class='col-xs-9' name='glyphicon-to'></span>\
          </div>\
          <div class='col-xs-1'>\
            <img style='display: none' class='thumb-to' width='64' /> \
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>Amount</label>\
          </div>\
          <div class='col-xs-10'>\
            <input type='text' class='form-control' name='amount' placeholder='Enter amount of Bitcoins to send' />\
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>Transaction Fee</label>\
          </div>\
          <div class='col-xs-10'>\
            <input type='text' class='form-control' name='fee' placeholder='Enter transaction fee' />\
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>Total</label>\
          </div>\
          <div class='col-xs-6'>\
            <input type='text' class='form-control' readonly value='...' />\
          </div>\
          <div class='col-xs-4 text-right'>\
            <button type='button' class='btn btn-primary btn-visualize'>Visualize Transaction</button>\
          </div>\
        </div>\
        <hr />\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>Passphrase</label>\
          </div>\
          <div class='col-xs-10'>\
            <input type='text' class='form-control' name='passphrase' placeholder='Type your passphrase here' />\
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>Salt</label>\
          </div>\
          <div class='col-xs-10'>\
            <input type='text' class='form-control' name='salt' placeholder='Type your email or other salt here' />\
          </div>\
        </div>\
        <button type='button' class='btn btn-primary btn-sign'>Sign Transaction</button>\
      </form>\
      <br>\
      <div class='text-left col-xs-4' name='label-qrcode' id='label-qrcode'></div>\
      <br>\
      <br>\
      <div class='col-xs-3' name='qrcode' id='qrcode'>\
      </div>\
      <br>\
      <br>\
      <br>\
    ",
    events: {
      'click .btn-visualize': 'visualize',
      'click .btn-sign': 'sign',
      'blur input[name=from]': 'lookup',
      'blur input[name=to]': 'lookup',
      'focus input[name=from]': 'initialData',
      'focus input[name=to]': 'initialData',
      'keydown input[name=amount]': 'makeTx',
      'keydown input[name=fee]': 'makeTx'
    },

    render : function() {
      this.$el.html(_.template(this.template));
    },

    visualize : function() {

    //$('div[id=label-qrcode]').text('0100000001f7e4a3501be5c0090760405042934c3e9e8bb04085c462e51393f52c1faf0c0d010000008a4730440220397038dc3cfe556b720a0b785610542e7b4f1a1d41a66f65965b03e77736aaa80220561539e4145a0cbfac88ddc0de6e73c5ef8add8b03a90e852312f23e921f4c0f0141049ad6fc1c79a15ce6c84fbf28a6507da5972df0bb8c8d2687a6462c80f15abf04596ada4bdf30d5e93d43161f4e783f05c848303f7ff98c9a9f6e6ee89ff7739fffffffff02a0860100000000001976a9145f6dd575c0cf174dd3e60774f3fb3054f54cf6ba88acf9350e00000000001976a91405d3984a91e60d677b32145a1b5ad586da50a7ae88ac00000000');
    },

    sign : function() {
      // TODO: sign a transaction
      pkey = Bitcoin.ECKey.fromWIF(cryptoscrypt.warp(
        $('input[name=passphrase]', this.$el).val(),
        $('input[name=salt]', this.$el).val()
      )[0]);
      for ( var i = 0; i < this.inputsCount; i++){
        this.tx.sign(i,pkey);
      }

      $('div[id=qrcode]').text('');
      $('div[id=label-qrcode]').text('');
      $('div[id=label-qrcode]').text('Full Transaction :');
      var qrcode = new QRCode("qrcode", {width: 350, height: 350});
      qrcode.makeCode(this.tx.toHex().toString());
      $('label-qrcode', this.$el).text(this.tx.toHex().toString());

      console.log(this.tx.toHex());
    },

    makeTx : function() {
      var transaction = cryptoscrypt.buildTx(
        this.unspentHashs,
        this.unspentHashsIndex,
        this.unspentValues,
        $('input[name=to]', this.$el).val(),
        $('input[name=from]', this.$el).val(),
        parseInt(100000000 * $('input[name=amount]', this.$el).val()),
        parseInt(100000000 * $('input[name=fee]', this.$el).val())
        );
      this.tx = transaction[0];
      this.inputsCount = transaction[1];
      console.log(this.tx.toHex());
    },

    doFeedback : function(aim,result) {

      success = ['has-success', 'glyphicon glyphicon-ok form-control-feedback'];
      failure = ['has-error', 'glyphicon glyphicon-remove form-control-feedback'];
      neutral = ['has-error has-success', 'glyphicon glyphicon-ok glyphicon-remove form-control-feedback'];

      var toAdd = (result == 'ok') ? success : (result == 'problem') ? failure : ['', ''];
      var toRemove = (result == 'ok') ? failure : (result == 'problem') ? failure : neutral;

      $('div[name = div-' + aim + ']', this.$el).removeClass(toRemove[0]).addClass(toAdd[0]);
      $('span[name=glyphicon-' + aim + ']', this.$el).removeClass(toRemove[1]).addClass(toAdd[1]);

    },

    initialData: function(ev) {
      var field = ev.currentTarget.name;
      addresses[field] = $('input[name=' + field + ']', this.$el).val().trim();
    },

    lookup : function(ev) {

      var field = ev.currentTarget.name
      var master = this;
      var input = $('input[name=' + field + ']', master.$el)
      var inputValue = input.val().trim();
      var thumb = $('.thumb-' + field, master.$el);
      var address = inputValue;

      if (inputValue == addresses[field]) {
        return;
      };

      thumb.removeAttr('src');
      $('span[name=glyphicon-from]', this.$el).text('');

      if (cryptoscrypt.validAddress(address) == true) {
        master.doFeedback(field, 'ok');
        return;
      };

      if (address == '') {
        master.doFeedback(field, 'neutral');
        return;
      };
 
      $.getJSON('https://onename.io/' + inputValue + '.json', function(data) {

        if (data.avatar) {
          thumb.attr({ src : data.avatar.url }).show();
        };
      }).error(function() { master.doFeedback(field, 'problem');
      }).done(function(data) {

        address = data.bitcoin.address ? data.bitcoin.address : '';
        input.val(address);

        //Possibly unnecessary double check if Onename.io already checks that the bitcoin address is valid
        if (cryptoscrypt.validAddress(address) == true){
          if (field == 'from') {
            $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + address, function(data) {
            }).done(function(data) {
              master.balance = (data.data.balance);
              $('span[id=amount-balance-from]', master.$el).text('Balance : ' + master.balance/100000000 + ' BTC');
            });
            $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + address + '/unspent-outputs?per_page=100', function(data) {
            }).done(function(data) {
              master.unspentHashs = [];
              master.unspentHashsIndex = [];
              master.unspentValues = [];
              $.each( data.data.outputs, function(idx,obj ) {
                master.unspentHashs.push(obj.transaction_hash );
                master.unspentHashsIndex.push( parseInt( obj.transaction_index ) );
                master.unspentValues.push(obj.value);              
              });
              console.log( master.unspentHashs );
            });
          };
          master.doFeedback(field, 'ok');
        } else {
          master.doFeedback(field, 'problem');
          return;
        };
      });
    }
  });
  return IndexView;
});
