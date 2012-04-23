var Solution = Backbone.Model.extend({
  defaults: {
    cost:0,
    vector:[],
    consumers:[],
    algorithm:'',
    blobKey:'',
    solKey:''
  },

  idAttribute: 'solKey',

  validate: function(attrs){
    if (attrs.consumers.length < 2){
      return 'Enter more than one consumer';
    }
  }
});

var Solutions = Backbone.Collection.extend({
  url: function(){
    return '/resources/' + this.fileId + '/solutions';
  },
  model: Solution
});

var File = Backbone.Model.extend({
  defaults: {
    blobKey: '',
    name: '',
    description: '',
    content: ''
  },

  idAttribute: 'blobKey',

  // Remove the item, destroy the model.
  clear: function() {
    this.destroy();
  },

  //override Model.fetch()
  fetch: function(opts){
    if(!this.fetched){
      //there's probably a more Backboney way to do this...
      Backbone.Model.prototype.fetch.call(this, opts);
      this.fetched = true;
    }
  },

  validate: function(attrs){
    if (!$.trim(attrs.name)){
      return 'Come on, enter something!';
    }
  }

});

var FileList = Backbone.Collection.extend({
  url: '/resources',
  model: File
});
