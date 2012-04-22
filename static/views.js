//view for an individual file item
var FileView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#file-template').html()),

  // The DOM events specific to an item.
  events: {
    'dblclick .fileName'     : 'edit',
    'click    .fileDestroy'  : 'clear',
    'click    .close'        : 'close',
    'click    .opt-btn'       : 'toggleOpt',
    'click    .view-sol-btn'   : 'toggleSol',
    'click    .optimize .btn': 'optimize',
    'click    .view-file-btn'     : 'fetchFileContent',
  },

  initialize: function() {
    _.bindAll(this, 'render', 'close', 'remove', 'showFile', 'loadSolutions');
    this.model.bind('change', this.render);
    //this.remove is built in to views
    this.model.bind('destroy', this.remove);
    this.subViewStates = {
      sol: false,
      opt: false
    };
  },

  render: function(e) {
    $(this.el).html(this.template(this.model.toJSON()));
    this.updateName = this.$('.updateName');
    this.updateDescription = this.$('.updateDescription');
    var display = this.subViewStates.opt ? 'block' : 'none';
    this.$optForm = this.$el.find('.optimize')
                        .css('display', display);

    //Need to redraw solution list
    //I don't like this. If this conditional runs, it's b/c
    //the file view was redrawn after the fetch() to get file
    //contents
    if (this.solutionListView){
      //but the original element is gone, so need to 
      //add a new one
      var display = this.subViewStates.sol ? 'block' : 'none';
      this.solutionListView.el = this.$el.find('.solutions-list')
                                .css('display', display)[0];
      this.solutionListView.$el = this.$el.find('.solutions-list')
                                .css('display', display);
      this.solutionListView.render();
    }
    /////////////////////////////////

    return this;
  },

  // Switch this view into `"editing"` mode, displaying the input fields.
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

  loadSolutions: function($el){
    if (!this.solutions){
      var solutions = new Solutions();
      solutions.blobKey = this.model.id;
      this.solutions = solutions;
      var SolutionListView = SolutionListViewFactory($el, this.solutions, this.model);
      this.solutionListView = new SolutionListView();
    }
  },

  toggleSol: function(){
    var $solList = this.$el.find('.solutions-list');
    //need to actually load solutions before we can
    //create more of them
    if (!this.solutions){
      this.loadSolutions($solList);
    }
    this.subViewStates.sol = this.subViewStates.sol ? false : true;
    $solList.toggle();
  },

  toggleOpt: function(){
    this.subViewStates.opt = this.subViewStates.opt? false : true;
    this.$optForm.toggle();
  },

  optimize: function(){
    var $solList = this.$el.find('.solutions-list');
    //need to actually load solutions before we can
    //create more of them
    if (!this.solutions){
      this.loadSolutions($solList);
    }
    var sol = new Solution({
      algorithm: this.$optForm.find('select').val(),
      consumers: this.$optForm.find('input').val()
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

var FileListView = Backbone.View.extend({
  el: $('#files-list'),

  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll', 'render');

    this.files = this.options.files;

    this.files.bind('add',     this.addOne);
    this.files.bind('reset',   this.addAll);
    this.files.bind('all',     this.render);

    this.files.fetch();
  },

  render: function() {
  },

  // Add a single file item to the list by creating a view for it, and
  // appending its element to the `<ul>`.
  addOne: function(file) {
    var view = new FileView({model: file});
    this.$el.append(view.render().el);
  },

  // Add all items in the **Todos** collection at once.
  addAll: function() {
    this.files.each(this.addOne);
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
    'click    .sol-details-btn'      : 'showSolution',
  },
  initialize: function() {
    _.bindAll(this, 'render', 'showSolution');
    this.model.bind('change', this.render);
    //this.remove is built in to views
    this.model.bind('destroy', this.remove);
    this.fileModel = this.options.fileModel;
  },
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },
  showSolution: function(){
    var self = this;
    function cb(){
      var solutionDisplay = new SolutionDisplayView(),
          resources = _.clone(self.fileModel.get('content')),
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
        blankRow.push("");
      }

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

      panelView.title = self.fileModel.get('name');
      panelView.content = solutionDisplay.el;
      panelView.render();

      $('body').prepend(panelView.el);
    }

    //kinda smells...
    if (!this.fileModel.fetched){
      this.fileModel.fetch({success:cb});
    } else {
      cb();
    }
  }
});

//this needs to be passed a list of solutions (a bb collection)
function SolutionListViewFactory($el, solutions, fileModel) {
  console.log(fileModel);
  return Backbone.View.extend({
    fileModel: fileModel,
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
    // Add a single file item to the list 
    // by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(solution) {
      console.log('addOne()');
      var view = new SolutionView({
        model: solution,
        fileModel: this.fileModel
      });
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

