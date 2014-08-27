define([
  'jquery',
  'underscore',
  'backbone',
  'models/bitcoin'
], function($, _, Backbone,Bitcoin){
  var balance = '';
  var addressFrom = '';
  var addressTo = '';
  var alias = ''; 
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
      'blur input[name=from]': 'lookupFrom',
      'blur input[name=to]': 'lookupTo',
    },

    render : function() {
      this.$el.html(_.template(this.template));
    },

    visualize : function() {
      // TODO: visualize a transaction
    },

    sign : function() {
      // TODO: sign a transaction
    },

    doFeedback : function(aim,result) {

      success = ['has-success', 'glyphicon glyphicon-ok form-control-feedback'];
      failure = ['has-error', 'glyphicon glyphicon-remove form-control-feedback'];
      neutral = ['has-error has-success', 'glyphicon glyphicon-ok glyphicon-remove form-control-feedback'];

      var toAdd = (result == 'ok') ? success : (result == 'problem') ? failure : ['',''];
      var toRemove = (result == 'ok') ? failure : (result == 'problem') ? failure : neutral;

      $('div[name = div-' + aim + ']', this.$el).removeClass(toRemove[0]).addClass(toAdd[0]);
      $('span[name=glyphicon-' + aim + ']', this.$el).removeClass(toRemove[1]).addClass(toAdd[1]);

    },

    lookupFrom : function() {

      var master = this;
      var inputFrom = $('input[name=from]',master.$el)
      var inputFromValue = inputFrom.val().trim();
      var thumbFrom = $('.thumb-from', master.$el);

      if (master.addressFrom!=inputFromValue){
        thumbFrom.removeAttr('src');
        master.addressFrom=inputFromValue;
        if (cryptoscrypt.validAddress(master.addressFrom) == false && master.addressFrom != ''){
          $.getJSON('https://onename.io/' + inputFromValue + '.json', function(data) {
            if (data && data.avatar) {
              thumbFrom.attr({ src : data.avatar.url }).show();
              master.addressFrom = data.bitcoin.address;
              inputFrom.val(master.addressFrom);
              inputFromValue = data.bitcoin.address;
            } else {master.addressFrom = (data) ? data.bitcoin.address : ''; inputFrom.val(master.addressFrom) };
          })
          .error(function(){
            master.doFeedback('from','problem');
          })
          .done(function(){
            if (cryptoscrypt.validAddress(master.addressFrom) == true){
              master.doFeedback('from','ok');
              $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + master.addressFrom, function(dat2) {
              }).done(function(dat2){
                master.balance=(dat2.data.balance);
              }).error(function(){console.log('error');});
            } else {
              master.doFeedback('from','problem');
            } 
          });
        } else {
            if (master.addressFrom == ''){
            master.doFeedback('from','neutral')};
          };
      };
    },

    lookupTo : function() {

      master = this
      inputTo = $('input[name=to]',master.$el);
      inputToValue = inputTo.val().trim()

      if (master.addressTo!=inputToValue){
        $('.thumb-to', master.$el).removeAttr('src');
        master.addressTo=(inputTo.val()).trim();
        if (cryptoscrypt.validAddress(master.addressTo) == false && master.addressTo != ''){
          $.getJSON('https://onename.io/' + inputToValue + '.json', function(data) {
            if (data && data.avatar) {
              $('.thumb-to', master.$el).attr({ src: data.avatar.url }).show();
              master.addressTo = data.bitcoin.address;
              inputTo.val(master.addressTo);    
            } else {master.addressTo = (data) ? data.bitcoin.address : ''; inputTo.val(master.addressTo) };
          })
          .error(function(){master.doFeedback('to','problem');})
          .done(function(){
            if (cryptoscrypt.validAddress(master.addressTo) == true){
              master.doFeedback('to','ok');
            } else {
              master.doFeedback('to','problem');
            }
          })
        } else {
          if (master.addressFrom == ''){
            master.doFeedback('to','neutral')};
        };
      };
    }
  });
  return IndexView;
});
