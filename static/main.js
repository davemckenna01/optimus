$(function(){
  var files  = new FileList();
  var filesView = new FileListView({
    files: files
  });
  window.gfiles = files;
});
