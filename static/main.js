window.gfiles;
window.gsols;
window.afile;

$(function(){
  var tpls = {
    'list': '<ul><% _.each(list, function(item) { %><li><%=item%></li><% }) %></ul>'
  }

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
      content: ''
    },
    idAttribute: 'blobKey'
  });

  var ResourceFiles = Backbone.Collection.extend({
    url: '/resources',
    model: ResourceFile
  });

  var files = new ResourceFiles();

  files.on('reset', function(model, resp){
    var afile = files.at(3);
    var sols = new Solutions();
    sols.blobKey = afile.get('blobKey');
    sols.fetch();
    sols.on('reset', function(model, resp){

      gafile = afile;
      gsols = sols;

      var DocumentRow = Backbone.View.extend({

        template: _.template,

        tagName: "div",

        className: "document-row",

        //events: {
        //  "click .icon":          "open",
        //  "click .button.edit":   "openEditDialog",
        //  "click .button.delete": "destroy"
        //},

        render: function() {
          //$(this.el).html(this.template(frag, this.model.toJSON()));
          $(this.el).html(this.template(tpls.list, {'list': this.model.get('vector')}));
          $('body').append(this.el);
          return this;
        }
      });

      var docrow = new DocumentRow({
        model: sols.at(2),
        id: "solution-" + sols.at(2).id
      });

      docrow.render();
    });


  });

  //note: this is bad, should bootstrap on page load
  files.fetch();

  gfiles = files;

});

