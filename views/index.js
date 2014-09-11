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
          <div class='col-xs-1'>\
            <label>From</label> \
          </div>\
          <div class='col-xs-10 form-group has-feedback input-prepend' name='div-from'>\
            <input type='text' class='col-xs-10 form-control' name='from' placeholder='Enter sender name or Bitcoin address' />\
            <span class='col-xs-10 add-on name='amount-balance-from' id='amount-balance-from'></span>\
            <span class='col-xs-10 glyphicon form-control-feedback' name='glyphicon-from' id='glyphicon-from'></span>\
          </div>\
          <div class='col-xs-1'>\
            <img style='display: none' class='thumb-from' width='64' /> \
          </div>\
        </div>\
        <div class='form-group row form-group-to0'>\
          <div class='col-xs-1'>\
            <label>To</label>\
          </div>\
          <div class='col-xs-5 form-group has-feedback input-field-to0' name='div-to0'>\
            <input type='text' class='col-xs-6 form-control' name='to0' placeholder='Enter recipient name or Bitcoin address' />\
            <span class='col-xs-6' name='glyphicon-to0'></span>\
          </div>\
          <div class='col-xs-2'>\
            <input type='text' class='form-control' name='amount0' placeholder='Enter BTC amount to send' />\
          </div>\
          <div class='col-xs-2'>\
            <button type='button' class='form-control btn btn-primary btn-remove' name='btn-remove0'>Remove</button>\
          </div>\
          <div class='col-xs-1'>\
            <button type='button' class='form-control btn btn-primary btn-remove' name='btn-all0'>All</button>\
          </div>\
          <div class='col-xs-1'>\
            <img style='display: none' class='thumb-to0' width='50' /> \
          </div>\
        </div>\
        <div class='form-group row form-group-recipient'>\
          <div class='col-xs-1'>\
            <label>Fee</label>\
          </div>\
          <div class='col-xs-6'>\
            <input type='text' class='form-control' name='fee' placeholder='Enter transaction fee' />\
          </div>\
          <div class='col-xs-5'>\
            <button type='button' class='btn btn-primary btn-add-recipient'>Add recipient</button>\
          </div>\
        </div>\
        <div class='form-group row form-group-recipient'>\
          <div class='form-group row'>\
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-1'>\
            <label>Total</label>\
          </div>\
          <div class='col-xs-6'>\
            <input type='text' name='total' class='form-control' readonly value='...' />\
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
      'click .btn-add-recipient': 'addOutput',
      'click .btn-sign': 'sign',
      'blur input[name=from]': 'lookup',
      'blur input[name^=to]': 'lookup',
      'focus input[name=from]': 'initialData',
      'focus input[name^=to]': 'initialData',
      'focusout input[name^=amount]': 'updateFee',
      'blur input[name^=amount]': 'updateFee',
      'focus input[name^=amount]': 'updateFee',
      'click button[name^=btn-remove]': 'removeOutput',
      'click button[name^=btn-all]': 'putAll'
    },

    render : function() {
      this.$el.html(_.template(this.template));
    },    

    putAll : function(ev) {
      var fieldNumber = (ev.currentTarget.name).slice(-1);
      var outputAddresses = [];
      var outputAmounts = [];
      var fee = parseInt(100000000 * $('input[name=fee]', this.$el).val());
      $.each( $('input[name^=amount]', this.$el), function(i, obj) {
        var index = obj['name'].slice(-1);
        if (index != fieldNumber) {
          outputAddresses.push( $('input[name=to' + index + ']', this.$el).val().trim() );
          outputAmounts.push( 100000000 * $('input[name=amount' + index + ']',this.$el).val().trim() );
        }
      });

      var totalUnspent = cryptoscrypt.sumArray(unspentValues);
      var total = cryptoscrypt.sumArray(outputAmounts) + fee;
      $('input[name=amount' + fieldNumber + ']', this.$el).val((this.balance - total)/100000000);
      this.updateFee();

    }, 

    removeOutput : function(ev) { 
      if ($('input[name^=amount]', this.$el).length > 1) {
        var fieldNumber = (ev.currentTarget.name).slice(-1);
        $(".form-group-to"+fieldNumber ).remove();
      }
      this.updateFee();
    },

    addOutput : function() {

      var lastFieldNumber = $('input[name^=amount]', this.$el).length;
      var index = parseInt($('input[name^=amount]',this.$el)[lastFieldNumber - 1]['name'].slice(-1));

      var outputsFieldsNumber = index + 1;

      var init = index;
      $(".form-group-to"+ init ).after("\
      <div class='form-group row form-group-to" + outputsFieldsNumber + "'>\
        <div class='col-xs-1'>\
          <label>To</label>\
        </div>\
        <div class='col-xs-5 form-group has-feedback field-to" + outputsFieldsNumber + "' name='div-to" + outputsFieldsNumber + "'>\
          <input type='text' class='col-xs-6 form-control' name='to" + outputsFieldsNumber + "' placeholder='Enter recipient name or Bitcoin address' />\
          <span class='col-xs-6' name='glyphicon-to" + outputsFieldsNumber + "'></span>\
        </div>\
        <div class='col-xs-2'>\
          <input type='text' class='form-control' name='amount" + outputsFieldsNumber + "' placeholder='Enter BTC amount to send' />\
        </div>\
        <div class='col-xs-2'>\
          <button type='button' class='form-control btn btn-primary btn-remove" + outputsFieldsNumber + "' name='btn-remove" + outputsFieldsNumber + "'>Remove</button>\
        </div>\
        <div class='col-xs-1'>\
          <button type='button' class='form-control btn btn-primary btn-remove' name='btn-all" + outputsFieldsNumber + "'>All</button>\
        </div>\
        <div class='col-xs-1'>\
          <img style='display: none' class='thumb-to" + outputsFieldsNumber + "' width='50' /> \
        </div>\
      </div>\
       ");
    },

    sign : function() {

      // Collect addresses and amounts;

      var outputAddresses = [ ];
      var outputAmounts = [ ];
      var fee = parseInt(100000000 * $('input[name=fee]', this.$el).val());

      $.each( $('input[name^=amount]', this.$el), function(i, obj) {
        var index = obj['name'].slice(-1);    
        outputAddresses[i] = $('input[name=to' + index + ']', this.$el).val().trim() ;
        outputAmounts[i] = 100000000 * $(obj,this.$el).val().trim() ;
      });

      // Stop if too much is spent

      if ( cryptoscrypt.sumArray(outputAmounts) + fee > cryptoscrypt.sumArray(this.unspentValues) ) {
        
        return
      }

      // Build the unsigned transaction;

      var tx = cryptoscrypt.buildTx(
        this.unspentHashs,
        this.unspentHashsIndex,
        this.unspentValues,
        outputAddresses,
        $('input[name=from]', this.$el).val(),
        outputAmounts,
        fee
      );

      // Calculate the private key;

      inputPassphrase = $('input[name=passphrase]', this.$el).val();

      if (cryptoscrypt.validPkey(inputPassphrase) == false) {
        pkey = Bitcoin.ECKey.fromWIF(cryptoscrypt.warp(
          inputPassphrase,
          $('input[name=salt]', this.$el).val()
        )[0])
      } else {
        pkey = Bitcoin.ECKey.fromWIF(inputPassphrase)
      };

      // Perform the signatures

      for ( var i = 0; i < tx[1]; i++) {
        tx[0].sign(i,pkey);
      };

      //Create the QR code
      $('div[id=qrcode]').text('');
      $('div[id=label-qrcode]').text('');
      $('div[id=label-qrcode]').text('Full Transaction :');
      var qrcode = new QRCode("qrcode", { width: 350, height: 350, correctLevel : QRCode.CorrectLevel.L } );
      qrcode.makeCode(tx[0].toHex().toString());

      // Show the transaction Hex

      console.log(tx[0].toHex());
      
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

    updateFee : function () {

      var outputAmounts = [];
      $.each( $('input[name^=amount]', this.$el), function(i, obj) {
        outputAmounts[i] = 100000000 * $(obj,this.$el).val().trim() ;
      });
      var sumAmounts = cryptoscrypt.sumArray( outputAmounts );

      if (this.unspentHashs) {
        var numOfInputs = cryptoscrypt.bestCombination( this.unspentValues, sumAmounts ).length;
        $('input[name=fee]', this.$el).val( parseInt(( 140 * numOfInputs + 100 * $('input[name^=amount]', this.$el).length + 150 ) / 100000) * 1000 + 0.0001);
      };

      this.updateTotal();
    },

    updateTotal : function() {

      var outputAmounts = [];
      $.each( $('input[name^=amount]', this.$el), function(i, obj) {
        outputAmounts[i] = 100000000 * $(obj,this.$el).val().trim() ;
      });
      var sumAmounts = cryptoscrypt.sumArray( outputAmounts );

    $('input[name=total]', this.$el).val( ( sumAmounts + 100000000 * $('input[name=fee]', this.$el).val() )/100000000 + ' BTC');
 
    },

    lookup : function(ev) {

      this.updateFee();

      var field = ev.currentTarget.name
      var master = this;
      var input = $('input[name=' + field + ']', master.$el)
      var inputValue = input.val().trim();
      var thumb = $('.thumb-' + field, master.$el);
      var address = inputValue;

      if (inputValue == addresses[field]) {
        return;
      };
      if (field == 'from') { $('span[id=amount-balance-from]', master.$el).text( '' ) };
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
              master.updateFee();
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
