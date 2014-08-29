define([
  'jquery',
  'underscore',
  'backbone',
  'models/bitcoin'
], function($, _, Backbone,Bitcoin){
  var balance = '';
  var addresses = {"From":"","To":""};
  var alias = 'z'; 
  //var imageBitcoinData = [];
  var IndexView = Backbone.View.extend({
    el: $('#contents'),
    template: "\
      <form role='form'>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>From</label> \
          </div>\
          <div class='col-xs-9 form-group has-feedback' name='div-from'>\
            <input type='text' class='col-xs-9 form-control' name='from' placeholder='Enter sender name or Bitcoin address' />\
            <span class='col-xs-9 glyphicon form-control-feedback' name='glyphicon-from'></span>\
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
    ",
    events: {
      'click .btn-visualize': 'visualize',
      'click .btn-sign': 'sign',
      'blur input[name=from]': 'lookup',
      'blur input[name=to]': 'lookup',
      'focus input[name=from]': 'initialData',
      'focus input[name=to]': 'initialData'
    },

    render : function() {
      this.$el.html(_.template(this.template));
    },

    visualize : function(ev) {
      // TODO: visualize a transaction
    },

    sign : function() {
      // TODO: sign a transaction
    },

    doFeedback : function(aim,result) {

      success = ['has-success', 'glyphicon glyphicon-ok form-control-feedback'];
      failure = ['has-error', 'glyphicon glyphicon-remove form-control-feedback'];
      neutral = ['has-error has-success', 'glyphicon glyphicon-ok glyphicon-remove form-control-feedback'];

      var toAdd = (result == 'ok') ? success : (result == 'problem') ? failure : ['', ''];
      var toRemove = (result == 'ok') ? failure : (result == 'problem') ? failure : neutral;

      $('div[name = div-' + aim + ']', this.$el).removeClass(toRemove[0]).addClass(toAdd[0]);
      $('span[name=glyphicon-' + aim + ']', this.$el).removeClass(toRemove[1]).addClass(toAdd[1]);

      return;
    },

    initialData: function(ev) {
      var field = ev.currentTarget.name;
      addresses[field] = $('input[name=' + field + ']',this.$el).val().trim();
    },

    lookup : function(ev) {

      var field = ev.currentTarget.name
      var master = this;
      var input = $('input[name=' + field + ']',master.$el)
      var inputValue = input.val().trim();
      var thumb = $('.thumb-' + field , master.$el);
      var address = inputValue;

      if (inputValue == addresses[field]){
        return;
      };

      thumb.removeAttr('src');

      if (cryptoscrypt.validAddress(address) == true){
        master.doFeedback(field,'ok');
        return;
      };

      if (address == ''){
        master.doFeedback(field,'neutral');
        return;
      };
 
      $.getJSON('https://onename.io/' + inputValue + '.json', function(data) {

        if (data.avatar) {
          thumb.attr({ src : data.avatar.url }).show();
        };
      }).error(function(){
        master.doFeedback(field,'problem');
      }).done(function(data){

        address = data.bitcoin.address ? data.bitcoin.address : '';
        input.val(address);

        if (cryptoscrypt.validAddress(address) == true){
          master.doFeedback(field,'ok');
        } else {
          master.doFeedback(field,'problem');
          return;
        };

        if (field == 'from'){
          $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + address, function(dat2) {
          }).done(function(dat2){
            master.balance = (dat2.data.balance);
          });
        };
      });
    }
  });
  return IndexView;
});
