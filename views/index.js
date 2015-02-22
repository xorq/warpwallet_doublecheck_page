define([
  'backbone',
  'underscore',
  'jquery',
  'models/transaction',
  'qrcode'
], function(Backbone, _, $, Transaction, html5_qrcode){
  var QRSIZE = 300;
  var qrShown = 0;
  var checking = false;
  var IndexView = Backbone.View.extend({
    el: $('#contents'),
    model: Transaction,
    templateFrom: _.template($('#indexViewFromTemplate').text()),
    templateToAddressField: _.template($('#indexViewToAddressTemplate').text()),
    templateToThumb: _.template($('#indexViewToThumbTemplate').text()),
    template: _.template($('#indexViewTemplate').text()),
    events: {
      'click video' : 'import',
      'click button[name=btn-guidance]' : 'guidanceToggle',
      'click button[name^=btn-scan]' : 'import',
      'click li[name=btn-export]' : 'export',
      'click li[name=btn-import]' : 'import',
      'click button[name=nextQr]' : 'nextQr',
      'click button[name=previousQr]' : 'previousQr',
      'click div[name=qrcodeExport]' : 'clearExport',
      'click .btn-feemode' : 'changeFeeMode',
      'click .btn-add-recipient' : 'addOutput',
      'click button[name=btn-sign]' : 'sign',
      'blur input[name=to]' : 'lookup',
      'click button[name^=btn-remove]' : 'removeOutput',
      'blur input[name=sender]' : 'lookup',
      'keyup input[name^=amount]' : 'updateAmount',
      'keyup input[name=to]' : 'updateAddress',
      'keyup input[name=passphrase]' : 'updatePassphrase',
      'keyup input[name=salt]' : 'updateSalt',
      'click button[name^=btn-all]' : 'putAll',
      'blur input[name=fee]' : 'updateFee',
      'click select[name=qrSize]' : 'renderQrCode',
      'click li[name=guidance-tails]' : 'guidanceTails',
      'click li[name=guidance-dedicated]' : 'guidanceDediated',
      'click li[name=guidance-off]' : 'guidanceOff',
      'focus input[name=passphrase]' : 'internetChecker'
    },

    internetSingleCheck: function() {
      var iCheckDefer = $.Deferred();
      cryptoscrypt.internetCheck(iCheckDefer)
      .done
    },

    internetChecker: function() {
      var master = this;
      goodpage = function() {
       return ($('Title').html() == ('EasyBTC Send Bitcoin')) 
     }
      iCheck = function() {

        if (!this.goodpage()) {
          return
        }
        if (checking == true) {
          setTimeout(this.iCheck, 4000);
        };

        var iCheckDefer = $.Deferred();
        cryptoscrypt.internetCheck(iCheckDefer)
        .done(function(data) {
          if((data.result=='yes') & goodpage()) {
          $('div[id=contents]').css('border','5px solid red');
          $('div[id=warning]').html('<h3 style=color:red>You are online! You should never expose your secret passphrase while online, if you are unsure of what you are doing, please check the guidance</h3>')
        }
        })
        .fail(function() {
          if(goodpage()) {
            $('div[id=contents]').css('border','5px solid green');
            $('div[id=warning]').html('<h3 style=color:darkgreen>You seem to be offline, good !</h3>')
          }
        });
      }
      if (checking == false) {
        checking = true 
        iCheck();
      }    
    },

    guidanceToggle: function() {
      this.model.guidance = this.model.guidance == false && true;
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
        i = 0;
        this.drawExportQrcode(i);
        $('div[name=exportQrcode]', this.$el).attr('style','dislpay:true');
      } else {
        this.clearExport();
      }
    },

    drawExportQrcode: function(a) {
      var data = this.model.export();
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


    import: function(ev) {
      this.model.expectedField = ev.currentTarget.name == 'btn-scan-from' ? 'from' : $(ev.currentTarget).parents('.addressTo').attr('dataId')
      this.model.showImportQR = !this.model.showImportQR;
      this.render();
      if (!this.model.showImportQR) {
        return
      };
      var master = this;
      this.model.newImport();
      $('.qr-reader').html5_qrcode(
        function(code) {
          console.log(code);
          code = cryptoscrypt.findBtcAddress(code);
          console.log(code);
          if (master.model.import(code, master.model.expectedField)) {
            master.model.showImportQR = false;
            master.render();
          } else {
            console.log($('.qr-status', master.el));
            $('.qr-status', master.el).html("Got " + master.model.qrParts + ' out of ' + master.model.qrTotal + ' codes.');
          }
        }, function(error) {
          console.log('error');
        }, function(error) {
          console.log('error');
        }
      );

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

      dosign = function() {
        
        master.model.sign($('input[name=passphrase]', master.$el).val(), $('input[name=salt]', master.$el).val());
          if (master.model.from == master.model.signAddress) {
            master.render();
          } else {
            alert("the signature is invalid");
            master.render();
          }

      };

      var text = '..........Please wait, this should take few seconds on a normal computer..........';
      $('div[id=please-wait]', this.$el).html('<h3 id="please-wait" style="text-center">' + text + '</h3>');

      setTimeout(
        dosign
      ,100);

      setTimeout(
        function() {
          $('div[id=please-wait]', this.$el).html('')
        }
      ,200);

    },
     //   end of html5_qrcode

    render: function() {
      //function (base58Key, passphrase, compressed, callback)

      $('Title').html('EasyBTC Send Bitcoin');
      this.model.checking = false;
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

//      if (this.model.showImportQR) {
//      }
      $('div[id=contents]').css('border','5px solid black');
    }, 


    renderFrom: function() {
      $('.addressFrom', this.el).html(this.templateFrom( this.model.data() ));
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

      if ((fieldValue == '') & (fieldName == 'sender')) {
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
      if (fieldName == 'sender') {
        this.model.from = fieldValue;
      };

      if (fieldName == 'to') {
        this.model.recipients[recipientId].address = fieldValue;
      };

      this.model.lookup(fieldName,recipientId,fieldEntry).done(function(){

          if (ev.currentTarget.name == 'sender') {
            master.model.updateBalance().done(function() {
            master.renderFrom();
            master.updateFee();
            }).fail(function() {console.log('problem')});
          };

          if (ev.currentTarget.name == 'to') {
            master.renderAddressTo(recipientId);
            master.renderThumbTo(recipientId);
          };

      }).fail(function(){
        master.render()
        $('div[id=iStatus]').html('<h4 style="color:red">You have to be online to fill the sending address field</h4>')
      })
    },


  });
  return IndexView;
});
