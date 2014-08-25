define([
  'jquery',
  'underscore',
  'backbone',
], function($, _, Backbone){
  var IndexView = Backbone.View.extend({
    el: $('#contents'),
    template: "\
      <form role='form'>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>From</label> \
          </div>\
          <div class='col-xs-9'>\
            <input type='text' class='form-control' name='from' placeholder='Enter sender name or Bitcoin address' />\
          </div>\
          <div class='col-xs-1'>\
            <img style='display: none' class='thumb-from' width='32' /> \
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>To</label>\
          </div>\
          <div class='col-xs-9'>\
            <input type='text' class='form-control' name='to' placeholder='Enter recipient name or Bitcoin address' />\
          </div>\
          <div class='col-xs-1'>\
            <img style='display: none' class='thumb-to' width='32' /> \
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
      'blur input[name=to]': 'lookupTo'
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
    lookupFrom: function() {
      $.getJSON('https://onename.io/' + $('input[name=from]', this.$el).val() + '.json', function(data) {
        if (data && data.avatar) {
          $('.thumb-from', this.$el).attr({ src: data.avatar.url }).show();
          this.btcFrom=$('input[name=from]',this.$el).val();
          $('input[name=from]',this.$el).val(data.bitcoin.address);
        }
      })
      .done(function(data){
        this.btcFrom=data.bitcoin.address;
        $.getJSON('https://api.biteasy.com/blockchain/v1/addresses/' + this.btcFrom, function(dat2) {
        })
        .done(function(dat2){
          this.balance=(dat2.data.balance)
        });
      });
    },
    lookupTo: function() {
      $.getJSON('https://onename.io/' + $('input[name=to]', this.$el).val() + '.json', function(data) {
        if (data && data.avatar) {
          $('.thumb-to', this.$el).attr({ src: data.avatar.url }).show();
          this.btcTo=data.bitcoin.address
         $('input[name=to]',this.$el).val(this.btcTo)
        }
      });
    }
  });
  return IndexView;
});
