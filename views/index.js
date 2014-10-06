define([
  'jquery',
  'underscore',
  'backbone',
  'models/bitcoin',
  'models/qrcode',
  'models/transaction'
], function($, _, Backbone,Bitcoin,qrcode, Transaction){
  var balance = 0;
  var addresses = {"From":"","To":""};
  var unspentHashsIndex = [];
  var unspentHashs = [];
  var unspentValues = [];
  var inputsCount = 0;
  var tx = new Bitcoin.Transaction();
  var outputList = {};
  var IndexView = Backbone.View.extend({
    el: $('#contents'),
    model: Transaction,
    template: _.template("\
      <form role='form'>\
        <div class='form-group row'>\
          <div class='col-xs-1'>\
            <label>From</label> \
          </div>\
          <div class='col-xs-10 form-group has-feedback input-prepend <% if (cryptoscrypt.validAddress(from)) {%>has-success<%} else { if (from) {%>has-error<%} else{}}%>' name='div-from'>\
            <input type='text' class='col-xs-10 form-control' name='from' placeholder='Enter sender name or Bitcoin address' value='<%= from %>'/>\
            <span class='col-xs-10 add-on name='amount-balance-from' id='amount-balance-from'>Balance: <%= balance/100000000 %></span>\
            <span class='col-xs-10 glyphicon form-control-feedback <% if (cryptoscrypt.validAddress(from)) {%>glyphicon glyphicon-ok form-control-feedback<%} else { if (from) {%>glyphicon glyphicon-remove form-control-feedback<%} else{}}%>' name='glyphicon' id='glyphicon'></span>\
          </div>\
          <div class='col-xs-1' id='thumb'>\
            <img id='thumb' class='thumb' width='64' src='<%= thumbFrom %>' <% if (thumbFrom) {%>style='display:true'<%} else {%>style='display:none'<%}%>/> \
          </div>\
        </div>\
        <% _.each(recipients, function(recipient,index) { %> \
          <div class='form-group row form-group-to' data-id='<%= index %>'> \
            <div class='col-xs-1'>\
              <label>To</label>\
            </div>\
            <div class='col-xs-5 form-group has-feedback input-field-to <% if (cryptoscrypt.validAddress(recipient.address)) {%>has-success<%} else { if (recipient.address) {%>has-error<%} else {}}%>' name='div-to'>\
              <input type='text' class='col-xs-6 form-control' name='to' value='<%= recipient.address %>' placeholder='Enter recipient name or Bitcoin address' />\
              <span class='col-xs-6 <% if (cryptoscrypt.validAddress(recipient.address)) {%>glyphicon glyphicon-ok form-control-feedback<%} else { if (recipient.address) {%>glyphicon glyphicon-remove form-control-feedback<%} else{}}%>' name='glyphicon'></span>\
            </div>\
            <div class='col-xs-2'>\
              <input type='text' class='form-control' name='amount' value='<%= recipient.amount/100000000 %>' placeholder='Enter BTC amount to send' />\
            </div>\
            <div class='col-xs-2'>\
              <button type='button' class='form-control btn btn-primary btn-remove' name='btn-remove'>Remove</button>\
            </div>\
            <div class='col-xs-1'>\
              <button type='button' class='form-control btn btn-primary btn-putall' name='btn-all'>All</button>\
            </div>\
            <div class='col-xs-1' id='thumb'>\
              <img id='thumb' name='thumb' class='thumb' width='50' <% if (recipient.thumb) {%>src='<%= recipient.thumb %>' style='display:true'<%} else {%>style='display:none'<%}%>/> \
            </div>\
          </div>\
        <% }); %> \
        <div class='form-group row form-group-recipient'>\
          <div class='col-xs-1'>\
            <label>Fee</label>\
          </div>\
          <div class='col-xs-3'>\
            <button type='button' name='btn-feemode' class='btn <% if (feeMode == 'auto') {%>btn-primary<%} else {%>btn-danger<%}%> btn-feemode'>Fee Mode : <%=feeMode%></button>\
          </div>\
          <div class='col-xs-5'>\
            <input type='text' class='form-control ' <% if (feeMode == 'auto') {%>readonly<%}%> name='fee' placeholder='Enter transaction fee' value='<%= getFee/100000000 %>' />\
          </div>\
          <div class='col-xs-3'>\
            <button type='button' class='btn btn-primary btn-add-recipient'>Add recipient</button>\
          </div>\
        </div>\
        <div class='form-group row form-group-recipient'>\
          <div class='form-group row'>\
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-1 <% if (this.model.getTotal()>balance){%>bg-danger<%}%>'>\
            <label>Total</label>\
          </div>\
          <div class='col-xs-6'>\
            <input type='text' name='total' class='form-control <% if (this.model.getTotal()>balance){%>text-danger<%}%>' readonly value='<%= total/100000000 %>' />\
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
      <div class='text-left col-xs-4' name='label-qrcode' id='label-qrcode'><% if (qrcode) {%><label class='control-label'>Raw Transaction QRCode</label><%}%>\
      </div>\
      <div class='col-xs-12' name='qrcode' id='qrcode'>\
      </div>\
      <br>\
      <div class='col-xs-10' name='rawtx' id='rawtx'>\
        <% if (qrcode) {%><label class='control-label' for='rawTx'>Raw Transaction Hex</label>\
         <textarea class='form-control' rows='3'><%=qrcode%></textarea>\
         <%}%>\
      </div>\
      <br>\
      <br>\
    "),
    events: {
      'click .btn-feemode': 'changeFeeMode',
      'click .btn-add-recipient': 'addOutput',
      'click .btn-sign': 'sign',
      'blur input[name^=to]': 'lookup',
      'click button[name^=btn-remove]': 'removeOutput',
      'blur input[name=from]': 'lookup',
      'blur input[name^=amount]': 'render',
      'keyup input[name^=amount]': 'updateAmount',
      'click button[name^=btn-all]': 'putAll',
      'blur input[name=fee]': 'updateFee'
    },

    changeFeeMode : function() {

      this.model.changeFeeMode();
      this.updateFee();
      this.render();
    },

    sign : function() {

      this.model.sign($('input[name=passphrase]', this.$el),$('input[name=salt]', this.$el));
      this.render();
      this.model.qrcode = '';
    },


    render : function() {

      this.$el.html(this.template(this.model.data()));

      if (this.model.qrcode){
        var qrcode = new QRCode('qrcode', { width: 350, height: 350, correctLevel : QRCode.CorrectLevel.L } );
        qrcode.makeCode(this.model.qrcode);
      }
    },    

    updateAmount : function(ev) {
      var recipientId = parseInt($(ev.currentTarget).parents('.row').attr('data-id'));
      this.model.recipients[recipientId]['amount'] = parseInt(100000000 * $('input[name=amount]', this.$el)[recipientId].value);
    },   


    putAll : function(ev) {

      this.model.putAll($(ev.currentTarget).parents('.row').attr('data-id'));
      this.render();
    }, 


    removeOutput : function(ev) { 

      this.model.removeRecipient($(ev.currentTarget).parents('.row').attr('data-id'));
      this.render();
      
    },


    addOutput : function() {

      this.model.addRecipient();
      this.render();
    },


    updateFee : function () {

      if (this.model.feeMode == 'auto') {
        this.model.getFee();
      }
      if (this.model.feeMode == 'custom') {
        this.model.fee = parseInt(100000000 * parseFloat(($('input[name=fee]', this.$el).val())));
      }
      this.render();
    },


    lookup : function(ev) {
      var master = this;
      var address = ev.currentTarget.value.trim();
      var fieldName = ev.currentTarget.name;
      var fieldValue = ev.currentTarget.value;
      var recipientId = $(ev.currentTarget).parents('.row').attr('data-id');
      var fieldEntry = ev.currentTarget.value.trim();

      this.model.lookup(fieldName,fieldValue,recipientId,fieldEntry).done(

        function(){
          if (ev.currentTarget.name == 'from') {
            master.model.updateBalance(master.model.from).success(function(){master.render()});
          } else {
          master.render(ev);
          }
        }
      ).fail(
          master.render(ev)
      );
    },

  });
  return IndexView;
});
