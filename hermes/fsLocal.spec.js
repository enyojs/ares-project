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
var FsLocal = require("./fsLocal");
var util  = require("util");

function call(method, path, query, data, next) {
	var reqContent, reqBody;
	var reqOptions = {
		hostname: "127.0.0.1",
		port: myPort,
		method: method,
		headers: {}
	};
	// XXX replace/enhance application/json body by
	// - direct upload using multipart/form-data + express.bodyParser()
	// - straight binary in body (+streamed pipes)
	if (data) {
		if (Buffer.isBuffer(data)) {
			reqContent = data.toString('base64');
		} else if (typeof data === 'object') {
			reqContent = data;
		} else {
			throw new Error("data can only be 'Buffer' or 'Object'");
		}
	}
	if (method === 'POST') {
		reqOptions.path = path + '?' + querystring.stringify({_method: query._method});
		delete query._method;
		if (reqContent) {
			query.content = reqContent;
		}
		if (Object.keys(query).length > 0) {
			reqBody = querystring.stringify(query);
			reqOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}
	} else if (method === 'GET') {
		reqOptions.path = path + '?' + querystring.stringify(query);
		if (reqContent) {
			reqBody = JSON.stringify({content: reqContent});
			reqOptions.headers['Content-Type'] = 'application/json; charset=utf-8';
		}
	} else {
		throw new Error("method can only be 'GET' or 'POST'");
	}
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
		req.write(reqBody);
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
 			urlPrefix: "/",
 			root: myFsPath,
 			port: myPort
		}, function(err, service){
			console.log("service="+util.inspect(service));
			should.not.exist(err);
			should.exist(service);
			should.exist(service.url);
			service.url.should.match(/^http/);
			done();
		});
	});

	it("should have an empty root-level folder (depth=0)", function(done) {
		call('GET', '/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 0} /*query*/, undefined /*data*/, function(err, res) {
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
		call('GET', '/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 1} /*query*/, undefined /*data*/, function(err, res) {
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
		call('GET', '/id/', {_method: "PROPFIND", depth: 1} /*query*/, undefined /*data*/, function(err, res) {
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
		call('POST', '/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto"} /*query*/, undefined /*data*/, function(err, res) {
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
		call('GET', '/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 1} /*query*/, undefined /*data*/, function(err, res) {
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
		call('GET', '/id/' + encodeFileId('/toto'), {_method: "PROPFIND", depth: 1} /*query*/, undefined /*data*/, function(err, res) {
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
		call('POST', '/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto"} /*query*/, undefined /*data*/, function(err, res) {
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
		call('POST', '/id/' + encodeFileId('/toto'), {_method: "MKCOL",name: "titi"} /*query*/, undefined /*data*/, function(err, res) {
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
		call('GET', '/id/' + encodeFileId('/toto/titi'), null /*query*/, null /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(403); // Forbidden
			should.not.exist(res);
			done();
		});
	});

	var content = "This is Tata content!";

	it("should create file", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi'), {_method: "PUT",name: "tata"} /*query*/, new Buffer(content) /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(false);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto/titi/tata");
			done();
		});
	});

	it("should download the same file", function(done) {
		call('GET', '/id/' + encodeFileId('/toto/titi/tata'), null /*query*/, null /*data*/, function(err, res) {
			var contentStr;
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.buffer);
			contentStr = res.buffer.toString();
			contentStr.should.equal(content);
			done();
		});
	});

	it("should fail to describe a non-existing file", function(done) {
		call('GET', '/id/' + encodeFileId('/toto/tutu/tata'), {_method: "PROPFIND", depth: 0} /*query*/, null /*data*/, function(err, res) {
			var contentBuf, contentStr;
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	it("should fail to download a file", function(done) {
		call('GET', '/id/' + encodeFileId('/toto/tutu/tata'), null /*query*/, null /*data*/, function(err, res) {
			var contentBuf, contentStr;
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	it("should copy file in the same folder, as a new file", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi/tata'), {_method: "COPY", name: "tata.1"} /*query*/, null /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			done();
		});
	});

	it("should fail to copy file in the same folder, onto another one (no overwrite)", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "COPY", name: "tata"} /*query*/, null /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(412); // Precondition-Failed
			should.not.exist(res);
			done();
		});
	});

	it("should fail to copy file as or to nothing", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "COPY"} /*query*/, null /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400); // Bad-Request
			should.not.exist(res);
			done();
		});
	});

	it("should copy file in the same folder, onto another one (overwrite)", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "COPY", name: "tata", overwrite: true} /*query*/, null /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200); // Ok

			call('GET', '/id/' + encodeFileId('/toto/titi/tata'), null /*query*/, null /*data*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(content);

				call('GET', '/id/' + encodeFileId('/toto/titi/tata.1'), null /*query*/, null /*data*/, function(err, res) {
					var contentStr;
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200);
					should.exist(res.buffer);
					contentStr = res.buffer.toString();
					contentStr.should.equal(content);
					
					done();
				});
			});
		});
	});

	it("should fail to copy file in the same folder as the same name (overwrite)", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi/tata'), {_method: "COPY",name: "tata", overwrite: true} /*query*/, new Buffer(content) /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400);
			should.not.exist(res);
			done();
		});
	});

	var totoContents;

	it("should reccursively copy folder in the same folder, as a new folder", function(done) {
		call('POST', '/id/' + encodeFileId('/toto'), {_method: "COPY", name: "toto.1"} /*query*/, null /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			call('GET', '/id/' + encodeFileId('/toto.1/titi/tata'), null /*query*/, null /*data*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(content);
				done();
			});
		});
	});

	it("should rename folder in the same folder, as a new folder", function(done) {
		call('POST', '/id/' + encodeFileId('/toto.1'), {_method: "MOVE", name: "toto.2"} /*query*/, null /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			call('GET', '/id/' + encodeFileId('/toto.2/titi/tata'), null /*query*/, null /*data*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(content);

				call('GET', '/id/' + encodeFileId('/toto.1/titi/tata'), {_method: "PROPFIND", depth: 0} /*query*/, null /*data*/, function(err, res) {
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
		call('POST', '/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "MOVE", name: "tata.2"} /*query*/, null /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			call('GET', '/id/' + encodeFileId('/toto/titi/tata.2'), null /*query*/, null /*data*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(content);

				call('GET', '/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "PROPFIND", depth: 0} /*query*/, null /*data*/, function(err, res) {
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
		call('POST', '/id/' + encodeFileId('/toto/titi/tata'), {_method: "MOVE", folderId: encodeFileId("/tutu")} /*query*/, null /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	it("should fail to move folder into a non-existing folder", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi'), {_method: "MOVE", folderId: encodeFileId("/tutu")} /*query*/, null /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	it("should move file into another folder", function(done) {
		call('POST', '/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto.3"} /*query*/, undefined /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto.3");

			call('POST', '/id/' + encodeFileId('/toto/titi/tata'), {_method: "MOVE", folderId: encodeFileId("/toto.3")} /*query*/, null /*data*/, function(err, res) {
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201); // Created

				call('GET', '/id/' + encodeFileId('/toto.3/tata'), null /*query*/, null /*data*/, function(err, res) {
					var contentStr;
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200);
					should.exist(res.buffer);
					contentStr = res.buffer.toString();
					contentStr.should.equal(content);

					done();
				});
			});
		});
	});

	it("should move folder into another folder", function(done) {
		call('POST', '/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto.4"} /*query*/, undefined /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto.4");

			call('POST', '/id/' + encodeFileId('/toto.2/titi'), {_method: "MOVE", folderId: encodeFileId("/toto.4")} /*query*/, null /*data*/, function(err, res) {
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201); // Created

				call('GET', '/id/' + encodeFileId('/toto.4/titi'), {_method: "PROPFIND", depth: 1} /*query*/, null /*data*/, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200);
					should.exist(res.json);
					should.exist(res.json.isDir);
					res.json.isDir.should.equal(true);
					should.exist(res.json.children);
					res.json.children.length.should.equal(2);

					done();
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
