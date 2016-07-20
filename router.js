define([
  'jquery',
  'underscore',
  'backbone',
  'views/vault'
], function($, _, Backbone, VaultView){

  var AppRouter = Backbone.Router.extend({
    routes: {
      'vault' : 'vault',
    },
    currentView: false,
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
