define([
  'jquery',
  'underscore',
  'backbone',
  'models/qrcode',
  'models/transaction'
], function($, _, Backbone, qrcode, Transaction){
  var balance = 0;
  var addresses = { "From":"", "To":"" };
  var qrSize = 300;
  var IndexView = Backbone.View.extend({
    el: $('#contents'),
    model: Transaction,
    templateFrom: _.template("\
      <div class='col-xs-1'>\
        <label>From</label> \
      </div>\
      <div class='col-xs-10 form-group has-feedback input-prepend <%= this.successClass(from) %>' name='div-from'>\
        <input type='text' tabindex=1 class='col-xs-10 form-control' name='from' placeholder='Enter sender name or Bitcoin address' value='<%= from %>'/>\
        <span class='col-xs-10 add-on name='amount-balance-from' id='amount-balance-from'>Balance: <%= balance/100000000 %></span>\
        <span class='col-xs-10 glyphicon form-control-feedback <% if (cryptoscrypt.validAddress(from)) {%>glyphicon glyphicon-ok form-control-feedback<%} else { if (from) {%>glyphicon glyphicon-remove form-control-feedback<%} else{}}%>' name='glyphicon' id='glyphicon'></span>\
      </div>\
      <div class='col-xs-1' id='thumb'>\
        <img id='thumb' class='thumb' width='64' src='<%= thumbFrom %>' <% if (thumbFrom) {%>style='display:true'<%} else {%>style='display:none'<%}%>/> \
      </div>\
    "),
    templateToAddressField: _.template("\
      <div class='col-xs-5 form-group has-feedback field-to <% if (cryptoscrypt.validAddress(recipient.address)) {%>has-success<%} else { if (recipient.address) {%>has-error<%} else {}}%>' name='div-to'>\
        <input type='text' tabindex=<%=index*2+2%> class='col-xs-6 form-control' name='to<%=index%>' value='<%= recipient.address %>' placeholder='Enter recipient name or Bitcoin address' />\
        <span class='col-xs-6 <% if (cryptoscrypt.validAddress(recipient.address)) {%>glyphicon glyphicon-ok form-control-feedback<%} else { if (recipient.address) {%>glyphicon glyphicon-remove form-control-feedback<%} else{}}%>' name='glyphicon'></span>\
      </div>\
    "),
    templateToThumb: _.template("\
      <div class='col-xs-1' id='thumb'>\
        <img id='thumb' name='thumb' class='thumb' width='50' <% if (recipient.thumb) {%>src='<%= recipient.thumb %>' style='display:true'<%} else {%>style='display:none'<%}%>/> \
      </div>\
    "),
    template: _.template("\
      <div class='col-xs-12'>\
        <h5>This page is compatible with <a href='http://www.onename.io'>onename.io</a>'s nicknames, the passphrase and salt are those of your <a href='https://keybase.io/warp'>warp wallet</a>, but you can also insert a normal private key in the passphrase field.</h5> \
        <br>\
      </div>\
      <form role='form'>\
        <div class='form-group row from-section'>\
          <div class='col-xs-1'>\
            <label>From</label> \
          </div>\
          <div class='col-xs-10 form-group has-feedback input-prepend <%= this.successClass(from) %>' name='div-from'>\
            <input type='text' tabindex=1 class='col-xs-10 form-control' name='from' placeholder='Enter sender name or Bitcoin address' value='<%= from %>'/>\
            <span class='col-xs-10 add-on name='amount-balance-from' id='amount-balance-from'>Balance: <%= balance/100000000 %></span>\
            <span class='col-xs-10 glyphicon form-control-feedback <% if (cryptoscrypt.validAddress(from)) {%>glyphicon glyphicon-ok form-control-feedback<%} else { if (from) {%>glyphicon glyphicon-remove form-control-feedback<%} else{}}%>' name='glyphicon' id='glyphicon'></span>\
          </div>\
          <div class='col-xs-1' id='thumb'>\
            <img id='thumb' class='thumb' width='64' src='<%= thumbFrom %>' <% if (thumbFrom) {%>style='display:true'<%} else {%>style='display:none'<%}%>/> \
          </div>\
        </div>\
        <% _.each(recipients, function(recipient, index) { %> \
          <div class='form-group row form-group-to' data-id='<%= index %>'> \
            <div class='col-xs-1'>\
              <label>To</label>\
            </div>\
            <div class='addressTo<%= index %>'>\
              <div class='col-xs-5 form-group has-feedback field-to <% if (cryptoscrypt.validAddress(recipient.address)) {%>has-success<%} else { if (recipient.address) {%>has-error<%} else {}}%>' name='div-to'>\
                  <input type='text' tabindex=<%=index*2+2%> class='col-xs-6 form-control <% if (cryptoscrypt.validAddress(recipient.address)) {%>has-success<%} else { if (recipient.address) {%>has-error<%} else {}}%>' name='to<%=index%>' value='<%= recipient.address %>' placeholder='Enter recipient name or Bitcoin address' />\
                  <span class='col-xs-6 <% if (cryptoscrypt.validAddress(recipient.address)) {%>glyphicon glyphicon-ok form-control-feedback<%} else { if (recipient.address) {%>glyphicon glyphicon-remove form-control-feedback<%} else{}}%>' name='glyphicon'></span>\
              </div>\
            </div>\
              <div class='col-xs-2'>\
                <input type='text' class='form-control' tabindex=<%=index*2+3%> name='amount<%=index%>' value='<%= recipient.amount/100000000 %>' placeholder='Enter BTC amount to send' />\
              </div>\
            <div class='col-xs-2'>\
              <button type='button' class='form-control btn btn-primary btn-remove' name='btn-remove<%=index%>'>Remove</button>\
            </div>\
            <div class='col-xs-1'>\
              <button type='button' class='form-control btn btn-primary btn-putall' name='btn-all<%=index%>'>All</button>\
            </div>\
            <div class='col-xs-1 thumbTo<%= index %>' id='thumb'>\
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
          <div class='col-xs-1 <% if (this.getTotal()>balance){%>bg-danger<%}%>'>\
            <label>Total</label>\
          </div>\
          <div class='col-xs-6'>\
            <input type='text' name='total' class='form-control <% if (this.getTotal()>balance){%>text-danger<%}%>' readonly value=<%=this.getTotal()%> />\
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
      <div class='col-xs-12' name='rawtx' id='rawtx'>\
        <% if (qrcode) {%>\
          <label class='control-label' for='rawTx' name='qrSize'>QRCode size</label>\
          <select class='form-control' name='qrSize'>\
            <option value='200'>200 pixels</option>\
            <option selected='selected' value='300'>300 pixels</option>\
            <option value='400'>400 pixels</option>\
            <option value='500'>500 pixels</option>\
          </select>\
          <div class='text-left col-xs-12' name='label-qrcode' id='label-qrcode'><% if (qrcode) {%><label class='control-label'>Raw Transaction QRCode</label><%}%>\
          </div>\
          <div class='col-xs-12' name='qrcode' id='qrcode'>\
          </div>\
          <label class='control-label' for='rawTx'>Raw Transaction Hex (You can then use http://www.blockchain.info/pushtx to broadcast this transaction)</label>\
          <textarea class='form-control' rows='3'><%=qrcode%></textarea>\
         <%}%>\
      </div>\
      </div>\
      <br>\
    "),
    events: {
      'click .btn-feemode': 'changeFeeMode',
      'click .btn-add-recipient': 'addOutput',
      'click .btn-sign': 'sign',
      'blur input[name^=to]': 'lookup',
      'click button[name^=btn-remove]': 'removeOutput',
      'blur input[name=from]': 'lookup',
      'keyup input[name^=amount]': 'updateAmount',
      'keyup input[name^=to]': 'updateAddress',
      'keyup input[name=passphrase]': 'updatePassphrase',
      'keyup input[name=salt]': 'updateSalt',
      'click button[name^=btn-all]': 'putAll',
      'blur input[name=fee]': 'updateFee',
      'click select[name=qrSize]': 'renderQrCode',
    },


    successClass: function(from) {
      if (cryptoscrypt.validAddress(from)) {
        return 'has-success';
      } else if (from) {
        return 'has-error';
      }
    },


    changeFeeMode : function() {

      this.model.changeFeeMode();
      this.updateFee();
      this.render();

    },


    sign : function() {

      this.model.sign($('input[name=passphrase]', this.$el).val(), $('input[name=salt]', this.$el).val());
      this.render();

    },


    render : function() {
      var master = this;

      this.$el.html(this.template(this.model.data()));

      this.renderQrCode();

      this.getTotal();

    }, 


    renderFrom: function() {

      $('.from-section', this.el).html(this.templateFrom(this.model.data()));

    },


    renderAddressTo: function(dataId) {

      recipient = this.model.data().recipients[dataId];
      index = dataId;
      $('.addressTo'+dataId, this.el).html(
        this.templateToAddressField(
          this.model.data()
        )
      );

    },


    renderThumbTo: function(dataId) {

      recipient = this.model.data().recipients[dataId];
      index = dataId;
      $('.thumbTo'+dataId, this.el).html(
        this.templateToThumb(
          this.model.data()
        )
      );

    },


    renderQrCode : function() {

      if (this.model.qrcode==''){ return };

      $('div[id=qrcode]', this.$el).children().remove();

      if ($('select[name=qrSize]', this.$el).length > 0) {

        qrSize = parseInt($('select[name=qrSize]', this.$el).val());

      };

      qrcode = new QRCode('qrcode', { 
        width: qrSize, 
        height: qrSize, 
        correctLevel : QRCode.CorrectLevel.L
      });

      qrcode.makeCode(this.model.qrcode);

    },


    updateTotal : function() {

      $('input[name=total]', this.$el).val(this.getTotal());

    },


    updateAmount : function(ev) {

      var recipientId = parseInt($(ev.currentTarget).parents('.row').attr('data-id'));
      this.model.recipients[recipientId][ 'amount' ] = parseInt(100000000 * ev.currentTarget.value);
      
    },   


    updateAddress : function(ev) {

      var recipientId = parseInt($(ev.currentTarget).parents('.row').attr('data-id'));
      this.model.recipients[recipientId][ 'address' ] = ev.currentTarget.value;

    },   


    putAll : function(ev) {

      this.model.putAll($(ev.currentTarget).parents('.row').attr('data-id'));
      this.render();

    }, 


    removeOutput : function(ev) { 

      this.model.removeRecipient(
        $(ev.currentTarget).parents('.row').attr('data-id')
      );
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


    getTotal : function() {

      return (cryptoscrypt.sumArray(
        (_.map($('input[name^=amount]', this.$el),function(str){return 100000000 * str['value']}
        )))+parseInt(this.model.fee))/100000000    

    },


    lookup : function(ev) {

      var master = this;
      var address = ev.currentTarget.value.trim();
      var fieldName = ev.currentTarget.name;
      var fieldValue = ev.currentTarget.value;
      var recipientId = $(ev.currentTarget).parents('.row').attr('data-id');
      var fieldEntry = ev.currentTarget.value.trim();

      this.model.lookup(fieldName,fieldValue,recipientId,fieldEntry).done(function(){

          if (ev.currentTarget.name == 'from') {

            if (master.model.checkedFrom == fieldValue) { return };
            master.model.updateBalance().done(function() {  
              master.renderFrom();

            });

          };

          if (ev.currentTarget.name.substring(0,2) == 'to') {

            if (master.model.recipients[ recipientId ].checkedAddress == fieldValue) { return };
            master.renderAddressTo(recipientId);
            master.renderThumbTo(recipientId);
          };

        })
    },


  });
  return IndexView;
});
