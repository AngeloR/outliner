function mapHooks(app, dropboxSync) {
  var emptyDoc = "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?><opml version=\"2.0\"><head><title>Untitled</title></head><body><outline text=\"\"/></body></opml>";

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


  app.on('cmd.file.create', function(e) {
    e.preventDefault();
    let filename = prompt('Please enter a filename to open');
    if(!filename) {
      return;
    }

    dropboxSync.create(filename, emptyDoc, function(err, response){
      if(err) {
        if(err.status !== 409) {
          return console.error(err);
        }

        return alert('Sorry, that file already exists!');
      }

      saveOutlineNow(function(err){
        if(err) {
          return console.error(err);
        }

        localStorage.currentFile = filename;
        opXmlToOutline(emptyDoc);
      });
    });
  })
}
