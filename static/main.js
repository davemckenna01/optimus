$(function(){

  var ResourceFile = Backbone.Model.extend({
    defaults: {
      blobKey: '',
      name: '',
      content: ''
    },
    idAttribute: 'blobKey'
  });

  var ResourceFiles = Backbone.Collection.extend({
    url: '/resources',
    model: ResourceFile
  });

  var files = new ResourceFiles();

  //note: this is bad, should bootstrap on page load
  files.fetch();


});
