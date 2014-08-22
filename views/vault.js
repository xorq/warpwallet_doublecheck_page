define([
  'jquery',
  'underscore',
  'backbone',
  'wordlist'
], function($, _, Backbone, WordList){
  var VaultView = Backbone.View.extend({
    el: $('#contents'),
    template: "\
      <form role='form'>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>Passphrase</label>\
          </div>\
          <div class='col-xs-6'>\
            <input type='text' class='form-control' name='passphrase' placeholder='Type your passphrase here' />\
          </div>\
          <div class='col-xs-2'>\
            <select class='form-control' name='count_words'>\
              <option value='1'>1</option>\
              <option value='2'>2</option>\
              <option value='3'>3</option>\
              <option selected value='4'>4</option>\
              <option value='5'>5</option>\
              <option value='6'>6</option>\
              <option value='7'>7</option>\
              <option value='8'>8</option>\
            </select>\
          </div>\
          <div class='col-xs-2'>\
            <button type='button' class='btn btn-primary btn-random'>Random</button>\
          </div>\
        </div>\
        <div class='form-group row'>\
          <div class='col-xs-2'>\
            <label>Email</label>\
          </div>\
          <div class='col-xs-10'>\
            <input type='text' class='form-control' name='email' placeholder='Enter your email/salt here' />\
          </div>\
        </div>\
        <button type='button' class='btn btn-primary btn-generate'>Generate Vault</button>\
    ",
    events: {
      'click .btn-random': 'random',
      'click .btn-generate': 'generate'
    },
    render: function() {
      this.$el.html(_.template(this.template));
    },
    random: function() {
        $('input[name=passphrase]', this.$el).val(
          WordList.random($('select[name=count_words]', this.$el).val())
        );
    },
    generate: function() {
      // TODO: generate vault
      console.log('Generating Vault');
    }
  });

  return VaultView;
});

function jQuery(query, scope) {
  // look for 'query' element within 'scope'
}
