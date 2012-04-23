//view for an individual file item
var FileView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#file-template').html()),

  // The DOM events specific to an item.
  events: {
    'dblclick .fileName'      : 'edit',
    'click    .fileDestroy'   : 'clear',
    'click    .close'         : 'close',
    'click    .opt-btn'       : 'toggleOpt',
    'click    .view-sol-btn'  : 'toggleSol',
    'click    .optimize .btn' : 'optimize',
    'click    .view-file-btn' : 'viewFile',
  },

  initialize: function() {
    _.bindAll(this, 'render', 'close', 'remove', 
      'viewFile', 'loadSolutionsModel', 'refreshSubviews');

    this.model.bind('change', this.render);
    this.model.bind('destroy', this.remove);

    //this manages the toggle()/display state of the file view's
    //sub views (solution list, and optimize form)
    this.subviewStates = {
      sol: false,
      opt: false
    };

  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    this.$nameField = this.$el.find('.nameField');
    this.$nameFieldError = this.$el.find('.nameFieldError');
    this.$descField = this.$el.find('.descField');
    this.$consumersField = this.$el.find('.consumersField');
    this.$consumersFieldError = this.$el.find('.consumersFieldError');
    this.refreshSubviews();

    return this;
  },

  refreshSubviews: function(){
    //Set whether the optimize form is open or closed
    var display = this.subviewStates.opt ? 'block' : 'none';
    this.$optForm = this.$el.find('.optimize')
                        .css('display', display);

    //This occurs when we fetch the solutions list before fetching the
    //file contents. When a file is fetched it's view gets redrawn,
    //which means we must redraw the solution list
    if (this.solutionListView){
      display = this.subviewStates.sol ? 'block' : 'none';
      var $solList = this.$el.find('.solutions-list').css('display', display)
      this.solutionListView.el = $solList.get(0);
      this.solutionListView.$el = $solList;
      this.solutionListView.render();
    }
  },

  // Switch this view into "editing" mode displaying the input fields.
  edit: function() {
    this.$el.addClass("editing");
    this.$nameField.focus();
  },

  // Close the "editing" mode, saving changes to the file
  close: function() {
    /////////////////////////////////////////////////
    //this is totally not the right spot for this...
    function handleError(model, err){
      this.$nameFieldError.html(err);
    }
    handleError = _.bind(handleError, this);
    this.model.on('error', handleError);
    /////////////////////////////////////////////////

    if (this.model.save({
      name: this.$nameField.val(),
      description: this.$descField.val()
    })) {
      this.$nameFieldError.html('');
      this.$el.removeClass("editing");
    }
  },

  // Remove the item, destroy the model.
  clear: function() {
    this.model.clear();
  },

  loadSolutionsModel: function(el, cb){
    var SolutionListView;

    if (!this.solutionsModel){
      this.solutionsModel = new Solutions();
      this.solutionsModel.fileId = this.model.id;

      if (cb) this.solutionsModel.bind('reset', cb);

      SolutionListView = SolutionListViewFactory(
          el, this.solutionsModel, this.model);
      this.solutionListView = new SolutionListView();
    }
  },

  toggleSol: function(){
    var $solList = this.$el.find('.solutions-list');

    //if solutions haven't already been loaded, load them
    if (!this.solutionsModel){
      this.loadSolutionsModel($solList.get(0));
    }
    this.subviewStates.sol = this.subviewStates.sol ? false : true;
    $solList.toggle();
  },

  toggleOpt: function(){
    this.subviewStates.opt = this.subviewStates.opt? false : true;
    this.$optForm.toggle();
  },

  optimize: function(){
    function create(){
      var sol = new Solution();

      /////////////////////////////////////////////////
      //this is totally not the right spot for this...
      function handleError(model, err){
        this.$consumersFieldError.html(err);
      }
      handleError = _.bind(handleError, this);
      sol.on('error', handleError);
      /////////////////////////////////////////////////

      if (sol.set({
        algorithm: this.$optForm.find('select').val(),
        consumers: this.$optForm.find('input').val()
      })){
        this.$consumersFieldError.html('');
        //Backbone does a PUT if there's an id on the model, 
        //even if it's an empty string, and the way I'm
        //initing this model it has an empty string, so
        //need to delete it.
        delete(sol.id);
        this.solutionsModel.create(sol);
      }
    }
    create = _.bind(create, this);

    //if solutions haven't already been loaded, load them and then
    //create the new solution, else don't load and just create
    !this.solutionsModel ?
      this.loadSolutionsModel(this.$el.find('.solutions-list'), create)
      : create();
  },

  viewFile: function(){
    function display(){
      var fileDisplayView,
          panelView;

      fileDisplayView = new FileDisplayView({
        data: this.model.get('content')
      });
      fileDisplayView.render();

      panelView = new PanelView({
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

