requirejs.config({
  waitSeconds: 200,
});

define([
  'backbone',
  'underscore',
  'jquery',
  'qrcode',
  'models/transaction'
], function(Backbone, _, $, Transaction){
  var addresses = { "From":"", "To":"" };
  var qrSize = 300;
  var qrShown = 0;
  var IndexView = Backbone.View.extend({
    el: $('#contents'),
    model: Transaction,
    templateFrom: _.template($('#indexViewFromTemplate').text()),
    templateToAddressField: _.template($('#indexViewToAddressTemplate').text()),
    templateToThumb: _.template($('#indexViewToThumbTemplate').text()),
    template: _.template($('#indexViewTemplate').text()),
    events: {
      'click button[name=btn-guidance]': 'guidanceToggle',
      'click button[name=btn-export]': 'export',
      'click button[name=btn-import]': 'import',
      'click button[name=nextQr]': 'nextQr',
      'click button[name=previousQr]': 'previousQr',
      'click div[name=qrcodeExport]': 'clearExport',
      'click .btn-feemode': 'changeFeeMode',
      'click .btn-add-recipient': 'addOutput',
      'click button[name=btn-sign]': 'sign',
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
      'click li[name=guidance-tails]': 'guidanceTails',
      'click li[name=guidance-dedicated]': 'guidanceDediated',
      'click li[name=guidance-off]': 'guidanceOff'
    },

    guidanceToggle: function() {
//'<%= showImportQR || 'display: none;'
      this.model.guidance = this.model.guidance == false && true;
      //this.model.guidance = this.model.guidance=='Show' ? 'Hide' : 'Show';

      this.render();

    },

    guidanceTails: function() {
      this.model.guidance = 'tails'
      this.render();
    },

    guidanceDediated: function() {
      this.model.guidance = 'dedicated'
      this.render();
    },

    guidanceOff: function() {
      this.model.guidance = ''
      this.render();
    },

    export: function() {


      $('button[name=btn-export]', this.$el).toggleClass('btn-danger');
      $('button[name=btn-export]', this.$el).toggleClass('btn-primary');

      if (($('div[name=exportQrcode]', this.$el)).attr('style') == 'display:none') {
        data = this.model.export();
        i=0;
        this.drawExportQrcode(i);
      
      $('div[name=exportQrcode]', this.$el).attr('style','dislpay:true');

      } else {

        this.clearExport();

      }

    },


    drawExportQrcode: function(a) {

      data = this.model.export();
      $('div[name=qrcodeExport]',this.$el).children().remove();
      $('h5[name=titleQrcode]', this.$el).html('QRcode '+ ( 1 + a ).toString()+' / '+data.length.toString());

      var qrcode = new QRCode('qrcodeExport', { 
        width: 300, 
        height: 300, 
        correctLevel : QRCode.CorrectLevel.L
      });
      this.qrShown = a;
      qrcode.makeCode( data[a] );

    },


    clearExport: function() {

      $('div[name=exportQrcode]', this.$el).attr('style','dislpay:none');
      this.render();
    },


    previousQr: function() {

      if (this.qrShown) {
        this.drawExportQrcode(this.qrShown - 1);
      }

    },


    nextQr: function() {

      if (this.qrShown < this.model.export().length-1) {
        this.drawExportQrcode(this.qrShown + 1);
      }

    },


    import: function() {
      this.model.showImportQR = !this.model.showImportQR;
      this.render();

      /*
      data = window.prompt("Enter the string here", '');
      //data = '{"recipients":[{"address":"19hamcVvuHyG8KoQvS5ekHCfr4MZrNs17L","amount":10000000},{"address":"1MadcatHTGAZTJwNaTSnko15sbrPTBdBv3","amount":12000000}],"from":"1Xorq87adKn12bheqPFuwLZgZi5TyUTBq","balance":25324003,"unspent":[{"transaction_hash":"f658c8df61b375cd020ccc9516f505d1886dfeb1c090f3455aaf5b5a3f557a46","value":5838198,"transaction_index":1},{"transaction_hash":"7996f19fec1d6488befc70c573827457add2676fac312e6f31d258a8e2e46721","value":31321,"transaction_index":1},{"transaction_hash":"480216e2312caa8a02344799d4b0fb5d65655da40c141be463744483c33b902f","value":8000000,"transaction_index":1},{"transaction_hash":"f70d979f4474b8775b3f66d8642726f29a367388250baed1f23a04fe583f1691","value":11454484,"transaction_index":1}]}'
      this.model.import(data);
      this.render();*/
    },


    successClass: function(address) {
      if (cryptoscrypt.validAddress(address)) {
        return 'has-success';
      } else if (address) {
        return 'has-error';
      }
    },


    changeFeeMode: function() {

      this.model.changeFeeMode();
      this.updateFee();
      this.render();

    },


    sign: function() {
      var master = this;
      this.model.sign($('input[name=passphrase]', this.$el).val(), $('input[name=salt]', this.$el).val());
        if (this.model.from == this.model.signAddress) {
          master.render();
        } else {
          alert("the signature is invalid");
          master.render();
        }
    },

     //   end of html5_qrcode

    render: function() {
      
      console.log(navigator.userAgent);

      if (typeof(localMediaStream) != 'undefined' && localMediaStream) {
        localMediaStream.stop();
        localMediaStream.src = null;
        localMediaStream.mozSrcObject = null;
        localMediaStream = null;
      } 

      var master = this;
      this.$el.html(this.template(this.model.data()));
      this.renderQrCode();
      this.updateTotal();

      if (this.model.showImportQR) {
        this.model.newImport();
        $('.qr-reader').html5_qrcode(
          function(code) {
            if (master.model.import(code)) {
              master.model.showImportQR = false;
              master.render();
            } else {
              console.log($('.qr-status', master.el));
              $('.qr-status', master.el).html("Got " + master.model.qrParts + ' out of ' + master.model.qrTotal + ' codes.');
            }
          }, function(error) {
          //  console.log(error);
          }, function(error) {
            //console.log(error);
          }
        );
      }
    }, 


    renderFrom: function() {

      $('.addressFrom', this.el).html(this.templateFrom(this.model.data()));

    },


    renderAddressTo: function(dataId) {
      recipient = this.model.recipients[dataId];
      index = dataId;
      $('[class=fieldAddressTo][dataId='+index+']').html(
        this.templateToAddressField()
      );

    },


    renderThumbTo: function(dataId) {

      recipient = this.model.recipients[dataId];
      index = dataId;
      $('[dataId=' + dataId + '] > div[name=thumb]',this.el).html(
        this.templateToThumb()
      );

    },


    renderQrCode: function() {

      if (this.model.qrcode==''){ return };

      $('div[name=qrcode]', this.$el).children().remove();

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


    updateTotal: function() {

      $('input[name=total]', this.$el).val(this.model.getTotal()/100000000);

    },


    updateAmount: function(ev) {

      var recipientId = parseInt($(ev.currentTarget).parents('.addressTo').attr('dataId'));

      this.model.recipients[recipientId][ 'amount' ] = parseInt(100000000 * ev.currentTarget.value);
      this.updateTotal();
      
    },   


    updateAddress: function(ev) {
      var recipientId = parseInt($(ev.currentTarget).parents('.row.addressTo').attr('dataId'));
      this.model.recipients[recipientId][ 'address' ] = ev.currentTarget.value;
    },   


    putAll: function(ev) {

      this.model.putAll($(ev.currentTarget).parents('.row.addressTo').attr('dataId'));
      this.render();

    }, 


    removeOutput: function(ev) { 

      this.model.removeRecipient(
        $(ev.currentTarget).parents('.row.addressTo').attr('dataId')
      );
      this.render();
      
    },


    addOutput: function() {

      this.model.addRecipient();
      this.render();

    },


    updateFee: function () {

      if (this.model.feeMode == 'auto') {
        $('input[name=fee]', this.$el).val(this.model.getFee() / 100000000 );
      }
      if (this.model.feeMode == 'custom') {
        this.model.fee = parseInt(100000000 * parseFloat(($('input[name=fee]', this.$el).val())));
      }

      this.updateTotal();

    },


    getTotal: function() {

      return (cryptoscrypt.sumArray(
        (_.map($('input[name^=amount]', this.$el),function(str){return (100000000 * str['value'])/2}
        )))+parseInt(this.model.fee))/100000000    

    },


    lookup: function(ev) {

      var master = this;
      var address = ev.currentTarget.value.trim();
      var fieldName = ev.currentTarget.name;
      var fieldValue = ev.currentTarget.value;
      var recipientId = $(ev.currentTarget).parents('.row.addressTo').attr('dataId');
      var fieldEntry = ev.currentTarget.value.trim();

      //Initialize if nothing is entered

      if ((fieldValue == '') & (fieldName == 'from')) {
        this.model.from = '';
        this.model.thumbFrom = '';
        this.model.balance = '';
        this.renderFrom();
        return
      };

      if ((fieldValue == '') & (fieldName == 'to')) {
        this.model.recipients[ recipientId ].address = '';
        this.model.recipients[ recipientId ].thumb = '';
        this.renderAddressTo(recipientId);
        this.renderThumbTo(recipientId);
        return
      };

      //Initialize if something is entered
      if (fieldName == 'from') {
        this.model.from = fieldValue;
      };

      if (fieldName == 'to') {
        this.model.recipients[recipientId].address = fieldValue;
      };

      this.model.lookup(fieldName,fieldValue,recipientId,fieldEntry).done(function(){

          if (ev.currentTarget.name == 'from') {

            master.model.updateBalance().done(function() {  
            master.renderFrom();
            master.updateFee();

            });

          };

          if (ev.currentTarget.name == 'to') {

            master.renderAddressTo(recipientId);
            master.renderThumbTo(recipientId);
          };

      }).fail(function(){
        master.render()
      })
    },


  });
  return IndexView;
});
