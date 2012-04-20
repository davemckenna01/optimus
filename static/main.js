window.gfiles;
window.gsols;
window.afile;

$(function(){

  var ResourceFile = Backbone.Model.extend({
    defaults: {
      blobKey: '',
      name: '',
      description: '',
      content: ''
    },
    idAttribute: 'blobKey'
  });

  var ResourceFileList = Backbone.Collection.extend({
    url: '/resources',
    model: ResourceFile
  });

  var resourceFiles  = new ResourceFileList();

  //view for an individual resource item
  var ResourceFileView = Backbone.View.extend({

    tagName: 'li',

    template: _.template($('#resource-template').html()),

    // The DOM events specific to an item.
    events: {
      'dblclick .fileName' : 'edit',
    //  "click .fileDestroy"   : "clear",
      'click .close'          : 'close'
    },

    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    render: function() {
      //this.$el.html(this.template(tpls.resourceList, {'list': this.model.models})).attr('id',this.id);
      $(this.el).html(this.template(this.model.toJSON()));
      this.updateName = this.$('.updateName');
      this.updateDescription = this.$('.updateDescription');
      return this;
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.updateName.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      this.model.save({name: this.updateName.val(), 
                       description: this.updateDescription.val()});
      $(this.el).removeClass("editing");
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.clear();
    }
  });

  //var resourceItem = new ResourceItem({
  //  model: ResourceFile
  //  //id: ''
  //});


  var ResourceFilesView = Backbone.View.extend({
    el: $('#resourceFiles'),
    ////resourceFilesTemplate

    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'render');

      resourceFiles.bind('add',     this.addOne);
      resourceFiles.bind('reset',   this.addAll);
      resourceFiles.bind('all',     this.render);

      resourceFiles.fetch();
    },

    render: function() {
    },

    // Add a single resource file item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(resourceFile) {
      var view = new ResourceFileView({model: resourceFile});
      this.$("#files-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      resourceFiles.each(this.addOne);
    },
  });

  var resourceFilesView = new ResourceFilesView();

  //make a global to access in the console
  gfiles = resourceFiles;

























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
});

