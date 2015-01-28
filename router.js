define([
  'jquery',
  'underscore',
  'backbone',
  'views/index',
  'views/vault',
  'views/coinvoice',
  'models/transaction'
], function($, _, Backbone, IndexView, VaultView, Coinvoice, Transaction){

  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'index',
      'vault': 'vault',
      'coinvoice': 'easyQr'
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
    easyQr: function() {
      if (this.currentView) {
        this.currentView.undelegateEvents();
      }
      this.currentView = new Coinvoice();
      this.currentView.render();
      $('.nav > li').removeClass('active').filter('[name=easyQr]').addClass('active');
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
