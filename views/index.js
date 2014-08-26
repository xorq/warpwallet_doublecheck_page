define([
  'jquery',
  'underscore',
  'backbone',
  'models/bitcoin'
], function($, _, Backbone,Bitcoin){
  var balance = '';
  var btcFrom = '';
  var btcTo = '';
  var alias = '';
  //var master = this;

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
    render: function() {
      this.$el.html(_.template(this.template));
    },
    visualize: function() {
      // TODO: visualize a transaction
    },
    sign: function() {
      // TODO: sign a transaction
    },
    doFeedback: function(aim,result) {

      success = ['has-success','glyphicon glyphicon-ok form-control-feedback'];
      failure = ['has-error','glyphicon glyphicon-remove form-control-feedback'];

      var toAdd = (result=='ok') ? success:failure;
      var toRemove = (result=='ok') ? failure:success;

      $('div[name=div-'+aim+']',this.$el).removeClass(toRemove[0]).addClass(toAdd[0]);
      $('span[name=glyphicon-'+aim+']',this.$el).removeClass(toRemove[1]).addClass(toAdd[1]);
      
    },

    lookupFrom: function() {

      master = this
      if (master.btcFrom!=$('input[name=from]',this.$el).val().trim()){
        $('.thumb-from', master.$el).removeAttr('src');
        master.btcFrom=($('input[name=from]',master.$el).val()).trim();
        if (cryptoscrypt.validAddress(master.btcFrom) == false && master.btcFrom != ''){
          $.getJSON('https://onename.io/' + $('input[name=from]', master.$el).val().trim() + '.json', function(data) {
            if (data && data.avatar) {
              $('.thumb-from', master.$el).attr({ src: data.avatar.url }).show();
              master.btcFrom=data.bitcoin.address;
              $('input[name=from]',master.$el).val(master.btcFrom);
            };
          })
          .error(function(){
            master.doFeedback('from','problem');
          })
          .done(function(){
            if (cryptoscrypt.validAddress($('input[name=from]',master.$el).val().trim()) == true){
              master.doFeedback('from','ok');

              $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + master.btcFrom, function(dat2) {
              }).done(function(dat2){
                master.balance=(dat2.data.balance)
              });
            } else {
              master.doFeedback('from','problem');
            } 
          })
        } else {
          master.feedback('from','ok');
        };
      };
    },

    lookupTo: function() {

      master = this

      if (btcTo!=$('input[name=to]',this.$el).val().trim()){
        $('.thumb-to', master.$el).removeAttr('src');
        btcTo=($('input[name=to]',master.$el).val()).trim();
        if (cryptoscrypt.validAddress(btcTo) == false && btcTo != ''){
          $.getJSON('https://onename.io/' + $('input[name=to]', master.$el).val().trim() + '.json', function(data) {
            if (data && data.avatar) {
              $('.thumb-to', master.$el).attr({ src: data.avatar.url }).show();
              btcTo=data.bitcoin.address;
              $('input[name=to]',master.$el).val(btcTo);    
            };
          })
          .error(function(){master.doFeedback('to','problem');})
          .done(function(){
            if (cryptoscrypt.validAddress($('input[name=to]',master.$el).val().trim()) == true){
              master.doFeedback('to','ok');
            } else {
              master.doFeedback('to','problem');
            }
          })
        } else {
          master.doFeedback('to','ok');
        };
      };
    }
  });
  return IndexView;
});
