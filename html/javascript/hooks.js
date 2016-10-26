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

  app.on('cmd.file.save', function(err, doc) {
    if(err) {
      return console.error(err);
    }

    console.log('Saved ' + doc.length + ' characters');
  });
});
}
