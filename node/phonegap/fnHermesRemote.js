var url = require('url'),
	pathLib = require('path'),
	streamer = require('streamer'),
	request = require('request'),
	error = require('./errorHandler'),
	fnFs = require('./fnFs');

var s = { fn: Object.create(streamer) };

for (var i in fnFs.fn) {
	if (typeof s.fn[i] === 'undefined') {
		s.fn[i] = fnFs.fn[i];
	}
}
fnFs.fn = s.fn;

s.fn.ls = function(path) {
  return function stream(next, stop) {
  	var uri = { url: path+'' };
  	if (path.cookie) {
  		if (typeof path.cookie === 'string') {
  			path.cookie = request.cookie(path.cookie);
  		}
			var jar = request.jar();
			jar.add(path.cookie);
			uri.jar = jar;
  	}
  	console.log('Listing: '+path,uri.url);
  	
  	request(uri, error(stop)(function(res, body) {
  		try {
  			var entries = JSON.parse(body).contents;
  		} catch (e) {
  			return stop(e);
  		}
  		var entry;
      while (entry = entries.shift()) {
        console.log('to get: ', url.resolve(path+'/', encodeURI(pathLib.basename(entry.path))))
      	next({
    			url: url.resolve(path+'/', encodeURI(pathLib.basename(entry.path))),
    			path: url.resolve(path+'/', encodeURI(pathLib.basename(entry.path))),
    			cookie: path.cookie,
    			toString: function() {return this.url;},
      		isDir: entry.isDir,
      		isDirectory: isDir
      	});
      }
      stop();
    }));
  };
  
  function isDir() {
  	return !!this.isDir;
  }
};

s.fn.get = function(path) {
  return function stream(next, stop) {
  	var uri = { url: path+'' };
  	if (path.cookie) {
  		if (typeof path.cookie === 'string') {
  			path.cookie = request.cookie(path.cookie);
  		}
			var jar = request.jar();
			jar.add(path.cookie);
			uri.jar = jar;
  	}
		uri.url = uri.url.replace('/list/', '/get/');
		console.log('get\'ing: '+uri.url);
		
		request(uri, error(stop)(function(res, body) {
			next({path: path+'', content: body});
      stop();
    }));
  };
};

s.fn.gettree = function(path) {
	console.log('Getting directory: ',path);
	if (typeof path.cookie === 'string') {
		path.cookie = request.cookie(path.cookie);
	}
  var entries = s.fn.paths(path);
  var nested = s.fn.merge(s.fn.map(s.fn.lstree, s.fn.dirs(entries)));
  return s.fn.merge(s.fn.map(s.fn.get, s.fn.map(function(entry) {
  	console.log(path+'');
  	entry.cookie = path.cookie;
  	entry.toString = path.toString;
  	return entry;
  }, s.fn.merge(s.fn.map(s.fn.files, s.fn.list(entries, nested))))));
};

s.fn.paths = s.fn.ls;

module.exports = s;