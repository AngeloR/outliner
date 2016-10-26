function App() {
  this.settings = {
    productname: 'far2go',
    productnameForDisplay: 'Far2Go',
    domain: 'localhost',
    version: 1.0
  };

  this.userPreferences = {
    outlineFont: 'Arial',
    outlineFontSize: 16,
    outlineLineHeight: 24,
    authorName: '',
    authorEmail: '',
    autosaveDelay: 3 // defined in seconds
  };

  this.bindDefaultEvents();
  this.initializeStorage(localStorage);
}

App.prototype.bindDefaultEvents = function() {
  const self = this;
  $('body').on('click', '.command', function eventHandle(e){
    self.emit($(this).attr('data-event'), this, [e]);
  });

  setInterval(() => {
    this.emit('tick');
  }, this.userPreferences.autosaveDelay * 1000);
}

App.prototype.initializeStorage = function(storage) {
  if (storage.ctOpmlSaves == undefined) {
      storage.ctOpmlSaves = 0;
  }

  if (storage.whenLastSave == undefined) {
      storage.whenLastSave = new Date ().toString ();
  }

  if (storage.flTextMode == undefined) {
      storage.flTextMode = "true";
  }

  if(storage.currentFile === undefined) {
      storage.currentFile = 'outline';
  }

  // reset the last save time!
  storage.lastSaveTime = Date.now();
}

App.prototype.on = function(event, handler) {
  if(!this.events.hasOwnProperty(event)) {
    this.events[event] = [];
  }

  this.events[event].push(handler);
}

App.prototype.emit = function(event, scope, argArray) {
  if(this.events.hasOwnProperty(event)) {
    this.events[event].forEach((handler) => {
      handler.apply(scope, argArray);
    });
  }
}
