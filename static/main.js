window.gfiles;
window.gsols;
window.afile;

$(function(){

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

  var ResourceFile = Backbone.Model.extend({
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
      this.fetched = true;
      Backbone.Model.prototype.fetch.call(this, opts);
    }
  });

  var ResourceFileList = Backbone.Collection.extend({
    url: '/resources',
    model: ResourceFile
  });


  //view for an individual resource item
  var ResourceFileView = Backbone.View.extend({

    tagName: 'li',

    template: _.template($('#resource-template').html()),

    // The DOM events specific to an item.
    events: {
      'dblclick .fileName'     : 'edit',
      'click    .fileDestroy'  : 'clear',
      'click    .close'        : 'close',
      'click    .optBtn'       : 'toggleOpt',
      'click    .viewSolBtn'   : 'toggleSol',
      'click    .optimize .btn': 'optimize',
      'click    .viewFile'     : 'fetchFileContent',
    },

    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove', 'showFile');
      this.model.bind('change', this.render);
      //this.remove is built in to views
      this.model.bind('destroy', this.remove);
    },

    del:function(){console.log('del');},

    render: function() {
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
    },

    toggleOpt: function(){
      //we should insert the horribly repeated code here,
      //maybe? Even that seems bad somehow...
      this.$el.find('.optimize').toggle();
    },

    loadSolutions: function($el){
      if (!this.solutions){
        var solutions = new Solutions();
        solutions.blobKey = this.model.id;
        this.solutions = solutions;
        var SolutionListView = SolutionListViewFactory($el, this.solutions);
        var solutionListView = new SolutionListView();
        this.solutionsListView = solutionListView;
      }
    },

    toggleSol: function(){
      var $solList = this.$el.find('.solutions-list');
      //need to actually load solutions before we can
      //create more of them
      if (!this.solutions){
        this.loadSolutions($solList);
      }
      $solList.toggle();
    },

    optimize: function(){
      var $solList = this.$el.find('.solutions-list');
      //need to actually load solutions before we can
      //create more of them
      if (!this.solutions){
        this.loadSolutions($solList);
      }
      var sol = new Solution({
        algorithm: this.$el.find('.optimize select').val(),
        consumers: this.$el.find('.optimize input').val()
      });
      //BB does a PUT if there's an id on the model, even if it's
      //an empty string
      delete(sol.id);

      this.solutions.create(sol);
    },

    fetchFileContent: function(){
      if (!this.model.fetched){
        this.model.fetch({
          success:this.showFile
        });
      } else {
        this.showFile();
      }
    },

    showFile: function(){
      var fileDisplay = new FileDisplayView();
      fileDisplay.data = this.model.get('content');
      fileDisplay.render();
      var panelView = new PanelView();
      panelView.title = this.model.get('name');
      panelView.content = fileDisplay.el;
      panelView.render();
      console.log(panelView);
      $('body').prepend(panelView.el);
    }

  });

  var ResourceFileListView = Backbone.View.extend({
    el: $('#files-list'),
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
      this.$el.append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      resourceFiles.each(this.addOne);
    },
  });

  var FileDisplayView = Backbone.View.extend({
    className: 'fileDisplay',
    template: _.template($('#fileDisplay-template').html()),
    render: function(){
      this.$el.html(this.template({data:this.data}));
      return this;
    }
  });

  var PanelView = Backbone.View.extend({
    el: $($('#panel-template').html()),
    content:'',
    title:'No title',
    events: {
      'click    .close'        : 'remove'
    },
    //template: _.template($('#panel-template').html()),
    render: function(){
      //this.$el.html(this.content);
      this.$el.find('h1').html(this.title);
      this.$el.find('.panel-content').html(this.content);
      return this;
    },
    close: function(){

    }
  });

  //view for an individual solution item
  var SolutionView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#solution-template').html()),
    // The DOM events specific to an item.
    //events: {
    //  'click    .optBtn'      : 'toggleOpt',
    //},
    initialize: function() {
      //_.bindAll(this, 'render', 'close', 'remove');
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      //this.remove is built in to views
      this.model.bind('destroy', this.remove);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      //this.updateName = this.$('.updateName');
      //this.updateDescription = this.$('.updateDescription');
      return this;
    },
  });

  //this needs to be passed a list of solutions (a bb collection)
  function SolutionListViewFactory($el, solutions) {
    return Backbone.View.extend({
      el: $el,
      solutions: solutions,
      initialize: function() {
        _.bindAll(this, 'addOne', 'addAll', 'render');

        this.solutions.bind('add',     this.addOne);
        this.solutions.bind('reset',   this.addAll);
        this.solutions.bind('all',     this.render);

        this.solutions.fetch();
      },
      render: function() {
      },
      // Add a single resource file item to the list by creating a view for it, and
      // appending its element to the `<ul>`.
      addOne: function(solution) {
        var view = new SolutionView({model: solution});
        this.$el.append(view.render().el);
      },
      // Add all items in the **Todos** collection at once.
      addAll: function() {
        this.solutions.each(this.addOne);
      },
    });
  }


  var resourceFiles  = new ResourceFileList();
  var resourceFilesView = new ResourceFileListView();

  //make a global to access in the console
  gfiles = resourceFiles;


});

