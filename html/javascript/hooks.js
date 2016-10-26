function mapHooks(app, dropboxSync) {

  app.on('cmd.file.list', function(e) {
    e.preventDefault();
    let filename = prompt('Please enter a filename to open');
    if(!filename) {
      return;
    }
    saveOutlineNow(function(err){
      if(err) {
        return;
      }
      dropboxSync.load(filename, function(err, response) {
        if(err) {
          return console.error(err);
        }

        localStorage.currentFile = filename;
        opXmlToOutline(response);
      });
    });
  });


  app.on('cmd.file.create', function(e) {
    e.preventDefault();
    let filename = prompt('Please enter a new file');
    if(!filename) {
      return;
    }
  });
}
