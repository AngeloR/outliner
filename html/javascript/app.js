function App() {
  this.events = {
    'cmd.file.list': []
  };

  this.bindDefaultEvents();
}

App.prototype.bindDefaultEvents = function() {
  const self = this;
  Object.keys(this.events).forEach((event) => {
    let selector = '.command[data-event="'+event+'"]';
    $(selector).on('click', function eventHandler(e) {
      self.emit($(this).attr('data-event'), this, e);
    });
  });
}

App.prototype.on = function(event, handler) {
  if(!this.events.hasOwnProperty(event)) {
    this.events[event] = [];
  }

  this.events[event].push(handler);
}

App.prototype.emit = function(event, scope, eventObject) {
  if(this.events.hasOwnProperty(event)) {
    this.events[event].forEach((handler) => {
      handler(scope, eventObject);
    });
  }
}
