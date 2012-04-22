window.gfiles;
window.gfileviews;

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
      if(!this.fetched){
        //there's probably a more Backboney way to do this...
        Backbone.Model.prototype.fetch.call(this, opts);
        this.fetched = true;
      }
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
      _.bindAll(this, 'render', 'close', 'remove', 'showFile', 'loadSolutions');
      this.model.bind('change', this.render);
      //this.remove is built in to views
      this.model.bind('destroy', this.remove);
    },

    del:function(){console.log('del');},

    render: function(e) {
      $(this.el).html(this.template(this.model.toJSON()));
      this.updateName = this.$('.updateName');
      this.updateDescription = this.$('.updateDescription');

      //Need to redraw solution list
      //I don't like this. If this conditional runs, it's b/c
      //the file was redrawn after the fetch to get file
      //contents
      if (this.solutionListView){
        //but the original element is gone, so need to 
        //add a new one
        this.solutionListView.el = this.$el.find('.solutions-list')[0];
        this.solutionListView.$el = this.$el.find('.solutions-list');
        this.solutionListView.render();
      }
      /////////////////////////////////

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
        this.solutionListView = solutionListView;
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

  var SolutionDisplayView = Backbone.View.extend({
    className: 'solutionDisplay',
    template: _.template($('#solutionDisplay-template').html()),
    render: function(){
      this.$el.html(this.template({data:this.data}));
      return this;
    }
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
    events: {
      'click    .solDetails'      : 'showSolution',
    },
    initialize: function() {
      //_.bindAll(this, 'render', 'close', 'remove');
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
      //this.remove is built in to views
      this.model.bind('destroy', this.remove);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },
    showSolution: function(){
      var self = this,
          file = resourceFiles._byId[this.model.get('blobKey')];
      function cb(){
        var solutionDisplay = new SolutionDisplayView(),
            resources = _.clone(file.get('content')),
            matrix = [],
            rowState = [],
            blankRow = [],
            panelView = new PanelView(),
            i,j;

        solutionDisplay.data = self.model.toJSON();

        resources.shift();
        //console.log(resources);
        for (i=0, l=self.model.get('consumers').length; i<l; i+=1){
          rowState.push(0);
          blankRow.push(null);
        }

        //v is one of [0,0,1,2,1,0,0,2,1]
        //rowState starts at [0,0,0]
        //ends up like       [2,1,0]

        matrix.push(_.clone(blankRow));
        i = 0;
        _.each(self.model.get('vector'),function(v){
          if (rowState[v] > matrix.length - 1)
            matrix.push(_.clone(blankRow));
          //console.log('assigning to row',rowState[v],'slot ',v,'value',i);
          matrix[rowState[v]][v]=resources[i].substr(0,resources[i].indexOf(','));
          rowState[v] += 1;
          i += 1;
        });

        //console.log(matrix);

        solutionDisplay.data.resMatrix = matrix;
        solutionDisplay.render();

        panelView.title = file.get('name');
        panelView.content = solutionDisplay.el;
        panelView.render();

        $('body').prepend(panelView.el);
      }

      //kinda smells...
      if (!file.fetched){
        file.fetch({success:cb});
      } else {
        cb();
      }
    }
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
        //What's the deal with the "all" event?
        //I don't like the sounds of it...
        //this.solutions.bind('all',     this.render);

        this.solutions.fetch();
      },
      render: function() {
        console.log('render()');
        this.addAll();
      },
      // Add a single resource file item to the list by creating a view for it, and
      // appending its element to the `<ul>`.
      addOne: function(solution) {
        console.log('addOne()');
        var view = new SolutionView({model: solution});
        this.$el.append(view.render().el);
      },
      // Add all items in the **Todos** collection at once.
      addAll: function() {
        //reset wrapper el
        console.log('addAll()');
        console.log(this.el);
        this.$el.html('');
        this.solutions.each(this.addOne);
      },
    });
  }


  var resourceFiles  = new ResourceFileList();
  var resourceFilesView = new ResourceFileListView();

  //make a global to access in the console
  gfiles = resourceFiles;
  gfileviews = resourceFilesView;


});

