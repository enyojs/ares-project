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

function call(verb, path, query, body, next) {
	console.log("calling...");
	var req = http.request({
		hostname: "127.0.0.1",
		port: myPort,
		method: verb,
		path: path + '?' + querystring.stringify(query)
	}, function(res) {
		var bufs = [];
		res.on('data', function(chunk){
			//console.log('BODY: ' + chunk);
			var length = parseInt(res.headers['content-length'], 10);
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
	if (body) {
		req.write(body);
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

	it("should stop", function(done) {
		myFs.quit();
		rimraf(myFsPath, {gently: myFsPath}, function() {
			done();
		});
	});

});
