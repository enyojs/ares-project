/**
= fsLocal.js test suite
 */
// @see http://visionmedia.github.com/mocha/

var fs = require("fs");
var path = require("path");
var http = require("http");
var querystring = require("querystring");
var temp = require("temp");
var rimraf = require("rimraf");
var should = require("should");
var FormData = require('form-data');
var FsLocal = require("./fsLocal");
var util  = require("util");

function get(path, query, next) {
	var reqOptions = {
		hostname: "127.0.0.1",
		port: myPort,
		method: 'GET',
		headers: {},
		path: path
	};
	if (query && Object.keys(query).length > 0) {
		reqOptions.path += '?' + querystring.stringify(query);
	}
	call(reqOptions, undefined /*reqBody*/, next);
}

function post(path, query, content, contentType, next) {
	var reqContent, reqBody;
	var reqOptions = {
		hostname: "127.0.0.1",
		port: myPort,
		method: 'POST',
		headers: {},
		path: path
	};

	if (contentType && contentType.match(/text\/plain/)) {
		if (!content instanceof String) throw new Error("bad parameter: not a String");
		reqBody = content;
	} else if (contentType && contentType.match(/application\/xml/)) {
		if (!content instanceof String) throw new Error("bad parameter: not a String");
		reqBody = content;	// XXX or convert an Object to XML
	} else if (contentType && contentType === 'application/json') {
		if (!content instanceof Object) throw new Error("bad parameter: not an Object");
		reqBody = JSON.stringify(content);
	} else if (contentType && contentType === 'application/x-www-form-urlencoded') {
		query = query || {};
		if (content) {
			if (!Buffer.isBuffer(content)) throw new Error("bad parameter: not a Buffer");
			query.content = content.toString('base64');
		}	
		if (Object.keys(query).length > 0) {
			reqBody = querystring.stringify(query);
		}
		// every query parameters are passsed in the body, but
		// the '_method' (if any), that sticks into the URL
		if (query._method) {
			query = {_method: query._method};
		}
	} else if (contentType && contentType === 'multipart/form-data') {
		if (!content instanceof FormData) throw new Error("bad parameter: not a FormData");
		reqBody = content;
	} else if (content && contentType instanceof String) {
		contentType && reqOptions.headers['X-Content-Type'] = contentType; // original value
		contentType = 'text/plain; charset=x-binary';
		reqBody = content.toString('x-binary'); // do not decode/encode
	}

	reqOptions.headers['Content-Type'] = contentType;
	if (query && Object.keys(query).length > 0) {
		reqOptions.path += '?' + querystring.stringify(query);
	}

	call(reqOptions, reqBody, next);
}

function call(reqOptions, reqBody, next) {
	console.log("reqOptions="+util.inspect(reqOptions));
	console.log("reqBody="+util.inspect(reqBody));
	var req = http.request(reqOptions, function(res) {
		var bufs = [];
		res.on('data', function(chunk){
			bufs.push(chunk);
		});
		res.on('end', function() {
			var mime = res.headers['content-type'];
			var data = {
				statusCode: res.statusCode,
				headers: res.headers
			};
			if (mime) {
				data.mime = mime;
				data.buffer = Buffer.concat(bufs);
				if (mime === 'application/json; charset=utf-8') {
					data.json = JSON.parse(data.buffer.toString());
				}
				if (mime === 'text/plain') {
					data.text = data.buffer.toString();
				}
			}
			console.log("data="+util.inspect(data));
			if (data.statusCode < 200 || data.statusCode >= 300) {
				next(data);
			} else {
				next(null, data);
			}
		});
		res.on('close', function(err) {
			console.dir(err);
			next(err);
		});
	});
	if (reqBody) {
		if (reqBody instanceof FormData) {
			reqBody.pipe(req);
		} else {
			req.write(reqBody);
		}
	}
	req.end();
	req.on('error', next);
}

function encodeFileId(relPath) {
	if (relPath) {
		return encodeURIComponent(relPath);
	} else {
		return undefined;
	}
}

function decodeFileId(id) {
	if (id) {
		return decodeURIComponent(id);
	} else {
		return undefined;
	}
}

var myFs;
var myPort = 9009;
var myFsPath = temp.path({prefix: 'com.palm.ares.hermes.fsLocal'});
fs.mkdirSync(myFsPath);

describe("fsLocal...", function() {
	
	it("should start", function(done) {
		myFs = new FsLocal({
			pathname: "/",
			root: myFsPath,
			port: myPort
		}, function(err, service){
			console.log("service="+util.inspect(service));
			should.not.exist(err);
			should.exist(service);
			should.exist(service.origin);
			service.origin.should.match(/^http/);
			done();
		});
	});

	it("should have an empty root-level folder (depth=0)", function(done) {
		get('/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.not.exist(res.json.children);
			done();
		});
	});
	
	it("should have an empty root-level folder (depth=1)", function(done) {
		get('/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.children);
			should.exist(res.json.children.length);
			res.json.children.length.should.equal(0);

			done();
		});
	});
	
	it("should have an empty root-level folder (implicit id, depth=1)", function(done) {
		get('/id/', {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.children);
			should.exist(res.json.children.length);
			res.json.children.length.should.equal(0);

			done();
		});
	});
	
	it("should create a folder", function(done) {
		post('/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto");
			done();
		});
	});

	it("should have a single sub-folder", function(done) {
		get('/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.children);
			should.exist(res.json.children.length);
			res.json.children.length.should.equal(1);
			should.exist(res.json.children[0]);
			should.exist(res.json.children[0].isDir);
			res.json.children[0].isDir.should.equal(true);
			res.json.children[0].path.should.equal("/toto");
			done();
		});
	});

	it("should have an empty folder (depth=1)", function(done) {
		get('/id/' + encodeFileId('/toto'), {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.children);
			should.exist(res.json.children.length);
			res.json.children.length.should.equal(0);
			done();
		});
	});
	
	it("should fail to create a folder", function(done) {
		post('/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			err.statusCode.should.equal(409); // Conflict
			//should.exist(err.json);
			//should.exist(err.json.code);
			//err.json.code.should.equal('EEXIST');
			should.not.exist(res);
			done();
		});
	});

	it("should create a sub-folder", function(done) {
		post('/id/' + encodeFileId('/toto'), {_method: "MKCOL",name: "titi"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto/titi");
			done();
		});
	});

	it("should fail to download a folder", function(done) {
		get('/id/' + encodeFileId('/toto/titi'), null /*query*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(403); // Forbidden
			should.not.exist(res);
			done();
		});
	});

	var textContent = "This is a Text content!";
	var textContentType = "text/plain; charset=utf-8";

	it("should create a file (using 'application/x-www-form-urlencoded')", function(done) {
		post('/id/' + encodeFileId('/toto/titi'), {_method: "PUT",name: "tata"} /*query*/, new Buffer(textContent), 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json[0]);
			should.exist(res.json[0].isDir);
			res.json[0].isDir.should.equal(false);
			should.exist(res.json[0].path);
			res.json[0].path.should.equal("/toto/titi/tata");
			done();
		});
	});

	it("should download the same file", function(done) {
		get('/id/' + encodeFileId('/toto/titi/tata'), null /*query*/, function(err, res) {
			var contentStr;
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.buffer);
			contentStr = res.buffer.toString();
			contentStr.should.equal(textContent);
			done();
		});
	});

	var emptyContent = "";		//empty file

	it("should create an empty file (using 'application/x-www-form-urlencoded')", function(done) {
		post('/id/' + encodeFileId('/toto/titi'), {_method: "PUT",name: "empty"} /*query*/, emptyContent, 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json[0]);
			should.exist(res.json[0].isDir);
			res.json[0].isDir.should.equal(false);
			should.exist(res.json[0].path);
			res.json[0].path.should.equal("/toto/titi/empty");
			done();
		});
	});

	it("should download the same empty file", function(done) {
		get('/id/' + encodeFileId('/toto/titi/empty'), null /*query*/, function(err, res) {
			var emptyStr;
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.buffer);
			emptyStr = res.buffer.toString();
			emptyStr.should.equal(emptyContent);
			done();
		});
	});

	it("should fail to describe a non-existing file", function(done) {
		get('/id/' + encodeFileId('/toto/tutu/tata'), {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
			var emptyBuf, emptyStr;
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	it("should fail to download a non-existing file", function(done) {
		get('/id/' + encodeFileId('/toto/tutu/tata'), null /*query*/, function(err, res) {
			var contentBuf, contentStr;
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	it("should copy file in the same folder, as a new file", function(done) {
		post('/id/' + encodeFileId('/toto/titi/tata'), {_method: "COPY", name: "tata.1"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			done();
		});
	});

	it("should fail to copy file in the same folder, onto another one (no overwrite)", function(done) {
		post('/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "COPY", name: "tata"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(412); // Precondition-Failed
			should.not.exist(res);
			done();
		});
	});

	it("should fail to copy file as or to nothing", function(done) {
		post('/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "COPY"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400); // Bad-Request
			should.not.exist(res);
			done();
		});
	});

	it("should copy file in the same folder, onto another one (overwrite)", function(done) {
		post('/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "COPY", name: "tata", overwrite: true} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200); // Ok

			get('/id/' + encodeFileId('/toto/titi/tata'), null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get('/id/' + encodeFileId('/toto/titi/tata.1'), null /*query*/, function(err, res) {
					var contentStr;
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200);
					should.exist(res.buffer);
					contentStr = res.buffer.toString();
					contentStr.should.equal(contentStr);
					
					done();
				});
			});
		});
	});

	it("should fail to copy file in the same folder as the same name (overwrite)", function(done) {
		post('/id/' + encodeFileId('/toto/titi/tata'), {_method: "COPY",name: "tata", overwrite: true} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400);
			should.not.exist(res);
			done();
		});
	});

	it("should reccursively copy folder in the same folder, as a new folder", function(done) {
		post('/id/' + encodeFileId('/toto'), {_method: "COPY", name: "toto.1"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			get('/id/' + encodeFileId('/toto.1/titi/tata'), null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(textContent);
				done();
			});
		});
	});

	it("should rename folder in the same folder, as a new folder", function(done) {
		post('/id/' + encodeFileId('/toto.1'), {_method: "MOVE", name: "toto.2"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			get('/id/' + encodeFileId('/toto.2/titi/tata'), null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get('/id/' + encodeFileId('/toto.1/titi/tata'), {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
					var contentBuf, contentStr;
					should.exist(err);
					should.exist(err.statusCode);
					err.statusCode.should.equal(404);
					should.not.exist(res);

					done();
				});
			});
		});
	});

	it("should rename file in the same folder, as a new file", function(done) {
		post('/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "MOVE", name: "tata.2"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			get('/id/' + encodeFileId('/toto/titi/tata.2'), null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get('/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
					var contentBuf, contentStr;
					should.exist(err);
					should.exist(err.statusCode);
					err.statusCode.should.equal(404);
					should.not.exist(res);

					done();
				});
			});
		});
	});

	it("should fail to move file into a non-existing folder", function(done) {
		post('/id/' + encodeFileId('/toto/titi/tata'), {_method: "MOVE", folderId: encodeFileId("/tutu")} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	it("should fail to move folder into a non-existing folder", function(done) {
		post('/id/' + encodeFileId('/toto/titi'), {_method: "MOVE", folderId: encodeFileId("/tutu")} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	it("should move file into another folder", function(done) {
		post('/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto.3"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto.3");

			post('/id/' + encodeFileId('/toto/titi/tata'), {_method: "MOVE", folderId: encodeFileId("/toto.3")} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201); // Created

				get('/id/' + encodeFileId('/toto.3/tata'), null /*query*/, function(err, res) {
					var contentStr;
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200);
					should.exist(res.buffer);
					contentStr = res.buffer.toString();
					contentStr.should.equal(contentStr);

					done();
				});
			});
		});
	});

	it("should move folder into another folder", function(done) {
		post('/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto.4"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto.4");

			get('/id/' + encodeFileId('/toto.2/titi'), {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.json);
				should.exist(res.json.isDir);
				res.json.isDir.should.equal(true);
				should.exist(res.json.children);
				var nbChildren = res.json.children.length;

				post('/id/' + encodeFileId('/toto.2/titi'), {_method: "MOVE", folderId: encodeFileId("/toto.4")} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(201); // Created
					
					get('/id/' + encodeFileId('/toto.4/titi'), {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
						should.not.exist(err);
						should.exist(res);
						should.exist(res.statusCode);
						res.statusCode.should.equal(200);
						should.exist(res.json);
						should.exist(res.json.isDir);
						res.json.isDir.should.equal(true);
						should.exist(res.json.children);
						res.json.children.length.should.equal(nbChildren);
						
						done();
					});
				});
			});
		});
	});

	it("should stop", function(done) {
		myFs.quit();
		rimraf(myFsPath, {gently: myFsPath}, function() {
			done();
		});
	});

});
