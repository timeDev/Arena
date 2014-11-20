(function () {
  'use strict';
  var SeXHR,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  SeXHR = (function() {
    function SeXHR() {
      this.kill = __bind(this.kill, this);
      this.req = __bind(this.req, this);
      this.xhr = new XMLHttpRequest;
    }

    SeXHR.prototype.req = function(args) {
      var key, onload, onprogress, opts, val, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      onload = function(thisArg, options) {
        var response;
        response = {
          text: thisArg.responseText,
          status: thisArg.status,
          headers: (function(thisArg) {
            var headers;
            headers = {};
            thisArg.getAllResponseHeaders().split('\n').filter(function(header) {
              return header !== '';
            }).map(function(header) {
              return header.split(':');
            }).forEach(function(splitHeaders, idx, arr) {
              return headers[splitHeaders[0].trim()] = splitHeaders[1].trim();
            });
            return headers;
          })(thisArg)
        };
        if (((response.headers['Content-Type'] != null) && response.headers['Content-Type'] === 'application/json') || options.json) {
          response.json = JSON.parse(response.text);
        }
        return options.done(null, response);
      };
      onprogress = function(chunk, options) {
        return typeof options.progress === "function" ? options.progress({
          percent: chunk.loaded / chunk.total * 100,
          loaded: chunk.loaded,
          total: chunk.total,
          timestamp: chunk.timeStamp
        }) : void 0;
      };
      opts = {
        url: (_ref = args.url) != null ? _ref : null,
        method: (_ref1 = args.method) != null ? _ref1 : 'GET',
        json: (_ref2 = args.json) != null ? _ref2 : null,
        body: (_ref3 = args.body) != null ? _ref3 : null,
        mime: (_ref4 = args.mime) != null ? _ref4 : null,
        timeout: (_ref5 = args.timeout) != null ? _ref5 : 0,
        headers: (_ref6 = args.headers) != null ? _ref6 : null,
        username: (_ref7 = args.username) != null ? _ref7 : null,
        password: (_ref8 = args.password) != null ? _ref8 : null,
        async: (_ref9 = args.async) != null ? _ref9 : true,
        done: (_ref10 = args.done) != null ? _ref10 : null,
        loadstart: (_ref11 = args.loadstart) != null ? _ref11 : null,
        progress: (_ref12 = args.progress) != null ? _ref12 : null,
        loadend: (_ref13 = args.loadend) != null ? _ref13 : null
      };
      if (typeof opts.done === 'function') {
        this.xhr.addEventListener('load', (function(e) {
          return onload(this, opts);
        }), false);
        this.xhr.addEventListener('timeout', (function(e) {
          return opts.done({
            timeout: true
          }, null);
        }), false);
        this.xhr.addEventListener('abort', (function(e) {
          return opts.done(null, {
            abort: true
          });
        }), false);
        this.xhr.addEventListener('error', (function(e) {
          return opts.done({
            error: true
          }, null);
        }), false);
        this.xhr.addEventListener('loadstart', (function(e) {
          return typeof opts.loadstart === "function" ? opts.loadstart(e) : void 0;
        }), false);
        this.xhr.addEventListener('progress', (function(e) {
          if (e.lengthComputable) {
            return onprogress(e, opts);
          }
        }), false);
        this.xhr.addEventListener('loadend', (function(e) {
          return typeof opts.loadend === "function" ? opts.loadend(e) : void 0;
        }), false);
        if (opts.url) {
          if (opts.username && opts.password) {
            this.xhr.open(opts.method, opts.url, opts.async, opts.username, opts.password);
          } else {
            this.xhr.open(opts.method, opts.url, opts.async);
          }
          if (opts.timeout > 0 && opts.async) {
            this.xhr.timeout = opts.timeout;
          }
          if (opts.headers != null) {
            _ref14 = opts.headers;
            for (key in _ref14) {
              val = _ref14[key];
              this.xhr.setRequestHeader(key, val);
            }
          }
          if (opts.mime != null) {
            this.xhr.overrideMimeType(opts.mime);
          }
          return this.xhr.send(opts.body);
        } else {
          throw '[SeXHR] `url` is undefined.';
        }
      } else {
        throw '[SeXHR] `done` handler is undefined.';
      }
    };

    SeXHR.prototype.kill = function() {
      return this.xhr.abort();
    };

    return SeXHR;

  })();

  module.exports = SeXHR;

}).call(this);
