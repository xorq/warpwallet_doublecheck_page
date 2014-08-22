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
      'vault': 'vault'
    },
    index: function() {
      var indexView = new IndexView;
      indexView.render();
      $('.nav > li').removeClass('active').filter('[name=create]').addClass('active');
    },
    vault: function() {
      var vaultView = new VaultView();
      vaultView.render();
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
