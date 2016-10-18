(function(window){
  window.utils = {
    parseQueryString: function(str) {
      var ret = Object.create(null);

      if (typeof str !== 'string') {
        return ret;
      }

      str = str.trim().replace(/^(\?|#|&)/, '');

      if (!str) {
        return ret;
      }

      str.split('&').forEach(function (param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        var key = parts.shift();
        var val = parts.length > 0 ? parts.join('=') : undefined;

        key = decodeURIComponent(key);
        val = val === undefined ? null : decodeURIComponent(val);

        if (ret[key] === undefined) {
          ret[key] = val;
        } else if (Array.isArray(ret[key])) {
          ret[key].push(val);
        } else {
          ret[key] = [ret[key], val];
        }
      });

      return ret;
    }
  };
})(window);

function DropboxSync() {
  let params = {};
  this.ACCESS_TOKEN = localStorage.accessToken || '';
  if(!this.ACCESS_TOKEN.length) {
    this.active = false;
    params.clientId = 'vukdu3f3w12ooco';
  }
  else {
    this.active = true;
    params.accessToken = this.ACCESS_TOKEN;
  }

  this.dbx = new Dropbox(params);

  this.setActive();
}

DropboxSync.prototype.setActive = function() {
  if(!this.isActive()) {
    let access_token = this.getAccessTokenFromUrl();
    if(access_token && access_token.length) {
      this.ACCESS_TOKEN = access_token;
      this.dbx.setAccessToken(this.ACCESS_TOKEN);
      localStorage.accessToken = this.ACCESS_TOKEN;
      this.active = true;
    }
    else {
      this.ACCESS_TOKEN = '';
      this.active = false;
    }
  }
}

DropboxSync.prototype.getAccessTokenFromUrl = function() {
  return utils.parseQueryString(window.location.hash).access_token;
}

DropboxSync.prototype.isActive = function() {
  return this.active;
}

DropboxSync.prototype.activate = function() {
  let authUrl = this.dbx.getAuthenticationUrl('http://localhost:8080/');
  $('#authDropbox').on('click', function(e){
    window.location = authUrl;
  });
  $('#welcomeModal').modal();
}

DropboxSync.prototype.save = function(name, data) {
  let path = '/' + name + '.opml';
  var blob = new Blob([data], {
    type: 'application/xml'
  });
  this.dbx.filesUpload({
    path: path,
    contents: blob,
    mode: {
      '.tag': 'overwrite'
    }
  }).then(function(response) {
      console.log(response);
  }).catch(function(e){
    console.error(error);
    alert('Error saving to dropbox');
  });
}
