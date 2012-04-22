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
    'click    .view-file-btn'     : 'viewFile',
  },

  initialize: function() {
    _.bindAll(this, 'render', 'close', 'remove', 
              'viewFile', 'loadSolutionsModel', 'refreshSubViews');

    this.model.bind('change', this.render);
    this.model.bind('destroy', this.remove);

    //this manages the toggle()/display state of the file view's
    //sub views (solution list, and optimize form)
    this.subViewStates = {
      sol: false,
      opt: false
    };
  },

  render: function(e) {
    this.$el.html(this.template(this.model.toJSON()));
    this.$updateName = this.$el.find('.updateName');
    this.$updateDescription = this.$el.find('.updateDescription');
    this.refreshSubViews();
    return this;
  },

  refreshSubViews: function(){
    var display = this.subViewStates.opt ? 'block' : 'none';

    this.$optForm = this.$el.find('.optimize')
                        .css('display', display);

    //Need to redraw solution list
    //I don't like this. If this conditional runs, it's b/c
    //the file view was redrawn after the fetch() to get file
    //contents.
    if (this.solutionListView){
      //but the original element is gone, so need to 
      //add a new one
      display = this.subViewStates.sol ? 'block' : 'none';

      this.solutionListView.el = this.$el.find('.solutions-list')
                                .css('display', display)[0];
      this.solutionListView.$el = this.$el.find('.solutions-list')
                                .css('display', display);
      this.solutionListView.render();
    }
  },

  // Switch this view into `"editing"` mode, displaying the input fields.
  edit: function() {
    this.$el.addClass("editing");
    this.$updateName.focus();
  },

  // Close the `"editing"` mode, saving changes to the todo.
  close: function() {
    this.model.save({
      name: this.$updateName.val(),
      description: this.$updateDescription.val()
    });
    this.$el.removeClass("editing");
  },

  // Remove the item, destroy the model.
  clear: function() {
    this.model.clear();
  },

  loadSolutionsModel: function(el){
    if (!this.solutionsModel){
      this.solutionsModel = new Solutions();
      this.solutionsModel.fileId = this.model.id;
      var SolutionListView = SolutionListViewFactory(el, this.solutionsModel, this.model);
      this.solutionListView = new SolutionListView();
    }
  },

  toggleSol: function(){
    var $solList = this.$el.find('.solutions-list');
    //if solutions haven't already been loaded, load them
    if (!this.solutionsModel){
      this.loadSolutionsModel($solList.get(0));
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
    //if solutions haven't already been loaded, load them
    if (!this.solutionsModel){
      this.loadSolutionsModel($solList);
    }
    var sol = new Solution({
      algorithm: this.$optForm.find('select').val(),
      consumers: this.$optForm.find('input').val()
    });
    //Backbone does a PUT if there's an id on the model, 
    //even if it's an empty string, and the way I'm
    //initing this model it has an empty string, so
    //need to delete it.
    delete(sol.id);

    this.solutionsModel.create(sol);
  },

  viewFile: function(){
    function display(){
      var fileDisplayView = new FileDisplayView({
        data: this.model.get('content')
      });
      fileDisplayView.render();

      var panelView = new PanelView({
        title: this.model.get('name'),
        content: fileDisplayView.el
      });
      panelView.render();

    }
    display = _.bind(display, this);

    //We need to have fetched the file contents to display it,
    //so if the file hasn't been fetched, fetch and then display it,
    //else don't fetch and just display
    !this.model.fetched ? this.model.fetch({success:display}) : display();
  }

});

var FileListView = Backbone.View.extend({
  el: $('#files-list').get(0),

  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll', 'render');

    this.files = this.options.files;

    this.files.bind('add',     this.addOne);
    this.files.bind('reset',   this.addAll);
    this.files.bind('all',     this.render);

    //essentially triggering rendering on fetch complete
    //(b/c fetch fires a 'reset' event)
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

  // Add all items in the collection at once.
  addAll: function() {
    this.files.each(this.addOne);
  },
});

var SolutionDisplayView = Backbone.View.extend({
  className: 'solution-display',
  template: _.template($('#solution-display-template').html()),
  render: function(){
    this.$el.html(this.template({data:this.options.data}));
    return this;
  }
});

var FileDisplayView = Backbone.View.extend({
  className: 'file-display',
  template: _.template($('#file-display-template').html()),
  render: function(){
    this.$el.html(this.template({data:this.options.data}));
    return this;
  }
});

var PanelView = Backbone.View.extend({
  el: $($('#panel-template').html()).get(0),
  events: {
    'click .close': 'remove'
  },
  render: function(){
    this.$el.find('h1').html(this.options.title);
    this.$el.find('.panel-content').html(this.options.content);
    $('body').prepend(this.el);
    return this;
  }
});

//view for an individual solution item
var SolutionView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#solution-template').html()),
  events: {
    'click .sol-details-btn': 'viewSolution',
  },
  initialize: function() {
    _.bindAll(this, 'render', 'viewSolution');
    this.model.bind('change', this.render);
    this.model.bind('destroy', this.remove);
    this.fileModel = this.options.fileModel;
  },
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },
  viewSolution: function(){

    //creates a matrix from a list + vector that can be
    //easily inserted into an html table
    function createMatrix(list, vector, domain){
      var matrix = [],
        rowState = [],
        blankRow = [],
        i, j, l;

      //get rid of first row (labels)
      list.shift();

      //rowState keeps track of matrix row + column positions
      for (i = 0, l = domain; i < l; i += 1){
        rowState.push(0);
        blankRow.push('');
      }
      //start things off by having 1 row in the matrix
      matrix.push(_.clone(blankRow));
      i = 0;
      _.each(vector,function(v){
        if (rowState[v] > matrix.length - 1)
          matrix.push(_.clone(blankRow));

        //console.log('assigning to row',rowState[v],'slot ',v,'value',i);
        matrix[rowState[v]][v] = list[i].substr(0, list[i].indexOf(','));
        rowState[v] += 1;
        i += 1;
      });

      //console.log(matrix);
      return matrix;
    }

    function display(){
      var solutionDisplayView,
          panelView,
          resources = _.clone(this.fileModel.get('content')),
          matrix = createMatrix(
            resources, 
            this.model.get('vector'),
            this.model.get('consumers').length
          );

      solutionDisplayView = new SolutionDisplayView({
        data: _.extend(this.model.toJSON(), {matrix: matrix})
      }),
      solutionDisplayView.render();

      panelView = new PanelView({
        title: this.fileModel.get('name'),
        content: solutionDisplayView.el
      }),
      panelView.render();

    }

    display = _.bind(display, this);

    //We need to have fetched the file contents to display the solution,
    //so if the file hasn't been fetched, fetch and then display solution,
    //else don't fetch and just display
    !this.fileModel.fetched ? 
      this.fileModel.fetch({success:display}) : display();
  }
});

function SolutionListViewFactory(el, solutions, fileModel) {
  return Backbone.View.extend({
    el: el,
    solutions: solutions,
    fileModel: fileModel,
    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'render');

      this.solutions.bind('add',     this.addOne);
      this.solutions.bind('reset',   this.addAll);
      //this.solutions.bind('all',     this.render);

      //essentially triggering rendering on fetch complete
      //(b/c fetch fires a 'reset' event)
      this.solutions.fetch();
    },
    render: function() {
      this.addAll();
    },
    // Add a single file item to the list 
    // by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(solution) {
      var view = new SolutionView({
        model: solution,
        fileModel: this.fileModel
      });
      this.$el.append(view.render().el);
    },
    // Add all items in the collection at once.
    addAll: function() {
      //reset wrapper el
      this.$el.html('');
      this.solutions.each(this.addOne);
    },
  });
}

