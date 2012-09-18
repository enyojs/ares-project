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

function call(method, path, query, reqBody, next) {
	var reqContent;
	var req = http.request({
		hostname: "127.0.0.1",
		port: myPort,
		method: method,
		path: path + '?' + querystring.stringify(query)
	}, function(res) {
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
			}
			console.log("data=");
			console.dir(data);
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

	// XXX replace/enhance application/json body by
	// - direct upload using multipart/form-data + express.bodyParser()
	// - straight binary in body (+streamed pipes)

	if (reqBody) {
		if (Buffer.isBuffer(reqBody)) {
			reqContent = reqBody.toString('base64');
		} else if (typeof reqBody === 'object') {
			reqContent = reqBody;
		}
		req.write(JSON.stringify({content: reqContent}));
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
			console.dir(service);
			should.not.exist(err);
			should.exist(service);
			should.exist(service.url);
			service.url.should.match(/^http/);
			done();
		});
	});

	it("should have an empty root-level directory (depth=0)", function(done) {
		call('GET', '/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 0} /*query*/, undefined /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.not.exist(res.json.contents);
			done();
		});
	});
	
	it("should have an empty root-level directory (depth=1)", function(done) {
		call('GET', '/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 1} /*query*/, undefined /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.contents);
			should.exist(res.json.contents.length);
			res.json.contents.length.should.equal(0);
			done();
		});
	});
	
	it("should create a directory", function(done) {
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

	it("should have a single sub-directory", function(done) {
		call('GET', '/id/' + encodeFileId('/'), {_method: "PROPFIND", depth: 1} /*query*/, undefined /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.contents);
			should.exist(res.json.contents.length);
			res.json.contents.length.should.equal(1);
			should.exist(res.json.contents[0]);
			should.exist(res.json.contents[0].isDir);
			res.json.contents[0].isDir.should.equal(true);
			res.json.contents[0].path.should.equal("/toto");
			done();
		});
	});

	it("should have an empty directory (depth=1)", function(done) {
		call('GET', '/id/' + encodeFileId('/toto'), {_method: "PROPFIND", depth: 1} /*query*/, undefined /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.contents);
			should.exist(res.json.contents.length);
			res.json.contents.length.should.equal(0);
			done();
		});
	});
	
	it("should fail to create a directory", function(done) {
		call('POST', '/id/' + encodeFileId('/'), {_method: "MKCOL",name: "toto"} /*query*/, undefined /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.json);
			should.exist(err.json.code);
			err.json.code.should.equal('EEXIST');
			should.not.exist(res);
			done();
		});
	});

	it("should create a sub-directory", function(done) {
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

	it("should fail to download a directory", function(done) {
		call('GET', '/id/' + encodeFileId('/toto/titi'), null /*query*/, null /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(405);
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
			var contentBuf, contentStr;
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.content);
			contentBuf = new Buffer(res.json.content, 'base64');
			contentStr = contentBuf.toString();
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

	it("should copy file in the same folder, onto another one (overwrite)", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi/tata.1'), {_method: "COPY", name: "tata", overwrite: true} /*query*/, null /*data*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(204); // No-Content
			done();
		});
	});

	it("should fail to copy file in the same folder as the same name (overwrite)", function(done) {
		call('POST', '/id/' + encodeFileId('/toto/titi/tata'), {_method: "COPY",name: "tata", overwrite: true} /*query*/, new Buffer(content) /*data*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(405);
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
				var contentBuf, contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.json);
				should.exist(res.json.content);
				contentBuf = new Buffer(res.json.content, 'base64');
				contentStr = contentBuf.toString();
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
				var contentBuf, contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.json);
				should.exist(res.json.content);
				contentBuf = new Buffer(res.json.content, 'base64');
				contentStr = contentBuf.toString();
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
				var contentBuf, contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.json);
				should.exist(res.json.content);
				contentBuf = new Buffer(res.json.content, 'base64');
				contentStr = contentBuf.toString();
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

	it("should stop", function(done) {
		myFs.quit();
		rimraf(myFsPath, {gently: myFsPath}, function() {
			done();
		});
	});

});
