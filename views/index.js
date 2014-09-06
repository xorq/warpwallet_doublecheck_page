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
  var outputList = {};
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
          <div class='col-xs'>\
            <img style='display: none' class='thumb-from' width='64' /> \
          </div>\
        </div>\
        <div class='form-group row form-group-to0'>\
          <div class='col-xs-2'>\
            <label>To</label>\
          </div>\
          <div class='col-xs-5 form-group has-feedback input-field-to0' name='div-to0'>\
            <input type='text' class='col-xs-5 form-control' name='to0' placeholder='Enter recipient name or Bitcoin address' />\
            <span class='col-xs-5' name='glyphicon-to0'></span>\
          </div>\
          <div class='col-xs-2'>\
            <input type='text' class='form-control' name='amount0' placeholder='Enter BTC amount to send' />\
          </div>\
          <div class='col-xs-2'>\
            <button type='button' class='btn btn-primary btn-remove' name='btn-remove0'>Remove</button>\
          </div>\
          <div class='col-xs-1'>\
            <img style='display: none' class='thumb-to0' width='50' /> \
          </div>\
        </div>\
        <div class='col-xs-12 text-right'>\
          <button type='button' class='btn btn-primary btn-visualize'>Add recipient</button>\
        </div>\
        <div class='col-xs-12 text-right'>\
        <br>\
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
      'click .btn-visualize': 'addOutput',
      'click .btn-sign': 'sign',
      'blur input[name=from]': 'lookup',
      'blur input[name^=to]': 'lookup',
      'focus input[name=from]': 'initialData',
      'focus input[name^=to]': 'initialData',
      'keydown input[name^=amount]': 'outputsToJson',
      'click button[name^=btn-remove]': 'removeLine'
    },

    render : function() {
      this.$el.html(_.template(this.template));
    },    

    removeLine : function(ev) { 
      if ($('input[name^=amount]', this.$el).length > 1) {
        var fieldNumber = (ev.currentTarget.name).slice(-1);
        $(".form-group-to"+fieldNumber ).remove();
      }
    },

    addOutput : function() {

      var lastFieldNumber = $('input[name^=amount]', this.$el).length;
      var index = parseInt($('input[name^=amount]',this.$el)[lastFieldNumber - 1]['name'].slice(-1));

      var outputsFieldsNumber = index + 1;

      var init = outputsFieldsNumber - 1
      $(".form-group-to"+ init ).after("\
      <div class='form-group row form-group-to" + outputsFieldsNumber + "'>\
        <div class='col-xs-2'>\
          <label>To</label>\
        </div>\
        <div class='col-xs-5 form-group has-feedback field-to" + outputsFieldsNumber + "' name='div-to" + outputsFieldsNumber + "'>\
          <input type='text' class='col-xs-5 form-control' name='to" + outputsFieldsNumber + "' placeholder='Enter recipient name or Bitcoin address' />\
          <span class='col-xs-5' name='glyphicon-to" + outputsFieldsNumber + "'></span>\
        </div>\
        <div class='col-xs-2'>\
          <input type='text' class='form-control' name='amount" + outputsFieldsNumber + "' placeholder='Enter BTC amount to send' />\
        </div>\
        <div class='col-xs-2'>\
          <button type='button' class='btn btn-primary btn-remove" + outputsFieldsNumber + "' name='btn-remove" + outputsFieldsNumber + "'>Remove</button>\
        </div>\
        <div class='col-xs-1'>\
          <img style='display: none' class='thumb-to" + outputsFieldsNumber + "' width='50' /> \
        </div>\
      </div>\
       ");
    },

    sign : function() {

      this.makeTx();
      
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
      var qrcode = new QRCode("qrcode", { width: 350, height: 350, correctLevel : QRCode.CorrectLevel.L } );
      qrcode.makeCode(this.tx.toHex().toString());
      $('label-qrcode', this.$el).text(this.tx.toHex().toString());

      console.log(this.tx.toHex());
      
    },

    makeTx : function() {
      this.outputsToJson();
      outputAddresses = [ ];
      outputAmounts = [ ];
      for ( var i = 0 ; i < $('input[name^=amount]', this.$el).length ; i++ ) {
        outputAddresses[i] = (outputList[i].address) ;
        outputAmounts[i] = (outputList[i].value) ;
      };
      var transaction = cryptoscrypt.buildTx(
        this.unspentHashs,
        this.unspentHashsIndex,
        this.unspentValues,
        outputAddresses,
        $('input[name=from]', this.$el).val(),
        outputAmounts,
        parseInt(100000000 * $('input[name=fee]', this.$el).val())
        );
      this.tx = transaction[0];
      this.inputsCount = transaction[1];
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

    outputsToJson: function() {

      for (var i = 0; i < $('input[name^=amount]').length ; i++) {
        var index = $('input[name^=amount]',this.$el)[i]['name'].slice(-1);
        outputList[i] = {'address' :  $('input[name=to' + index + ']', this.$el).val().trim() ,'value' : 100000000 * $('input[name=amount' + index + ']', this.$el).val().trim()};
      };
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

      $('span[id=amount-balance-from]', master.$el).text('');
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
        if (cryptoscrypt.validAddress(address) == true) {
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
            });
          }
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
