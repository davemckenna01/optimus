var Solution = Backbone.Model.extend({
  defaults: {
    cost:0,
    vector:[],
    consumers:[],
    algorithm:'',
    blobKey:'',
    solKey:''
  },
  idAttribute: 'solKey'
});

var Solutions = Backbone.Collection.extend({
  url: function(){
    return '/resources/' + this.blobKey + '/solutions';
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
  }
});

var FileList = Backbone.Collection.extend({
  url: '/resources',
  model: File
});
