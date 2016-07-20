define([
  'jquery',
  'underscore',
  'backbone',
  'views/index',
  'views/vault'
], function($, _, Backbone, IndexView, VaultView){

  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'index',
      'vault' : 'vault',
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
