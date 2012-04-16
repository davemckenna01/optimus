$(function(){

  var File = Backbone.Model.extend({
    defaults: {
      blobKey: '',
      name: ''
    },
    idAttribute: 'blobKey'
  });

  var Files = Backbone.Collection.extend({
    url: '/files',
    model: File
  });

  var files = new Files();

  //note: this is bad, should bootstrap on page load
  files.fetch();

  //Upload URL (GAE requires this to be unique for each upload)
  //...hence the need to keep fetching it.
  var UploadUrl = Backbone.Model.extend({
    defaults: {
      uploadUrl: ''
    },
    url: '/uploadUrl'
  });

  var uploadUrl = new UploadUrl();

  //this is a proper usage of fetch()
  uploadUrl.fetch();

});
