define([
  'jquery',
  'underscore',
  'backbone',
  'views/index',
  'views/vault',
  'views/coinvoice',
  'views/multisig',
  'models/multisig',
  'models/transaction'
], function($, _, Backbone, IndexView, VaultView, Coinvoice, MultisigView, Multisig, Transaction){

  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'index',
      'vault' : 'vault',
      'coinvoice' : 'coinvoice',
      'multisig' : 'multisig'
    },
    currentView: false,
    index: function() {
      if (this.currentView) {
        this.currentView.undelegateEvents();
      }
      this.currentView = new IndexView({ model: new Transaction });
      this.currentView.render();
      $('.nav > li').removeClass('active').filter('[name=create]').addClass('active');
    },
    vault: function() {
      if (this.currentView) {
        this.currentView.undelegateEvents();
      }
      this.currentView = new VaultView({ });
      this.currentView.render();
      $('.nav > li').removeClass('active').filter('[name=vault]').addClass('active');
    },
    coinvoice: function() {
      if (this.currentView) {
        this.currentView.undelegateEvents();
      }
      this.currentView = new Coinvoice();
      this.currentView.render();
      $('.nav > li').removeClass('active').filter('[name=coinvoice]').addClass('active');
    }, 
    multisig: function() {
      if (this.currentView) {
        this.currentView.undelegateEvents();
      }
      this.currentView = new MultisigView({ model: new Multisig });
      this.currentView.init();
      $('.nav > li').removeClass('active').filter('[name=multisig]').addClass('active');
    } 
  });

  var initialize = function(){
    var app_router = new AppRouter;
    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});
