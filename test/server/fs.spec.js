/* jshint node:true */
/* global it */
/**
 * fsXXX.js test suite
 */
// @see http://visionmedia.github.com/mocha/

var path = require("path"),
    fs = require("graceful-fs"),
    http = require("http"),
    querystring = require("querystring"),
    npmlog = require('npmlog'),
    should = require("should"),
    util = require("util"),
    async = require("async");

module.exports = FsSpec;

function FsSpec(argv) {

	var log = npmlog;

	log.info("fs.spec.js", "FsSpec()");

	argv.port = argv.port || 0;
	argv.name = argv.name || path.basename(argv.filesystem);

	log.verbose("fs.spec.js", "argv:", argv);

	var Fs = require(argv.filesystem);
	var myFs;

	function get(prefix, path, query, next) {
		var reqOptions = {
			hostname: "127.0.0.1",
			port: argv.port,
			method: 'GET',
			headers: {},
			path: path
		};

		if (query && query._method) {
			reqOptions.headers['x-http-method-override'] = query._method;
			delete query._method;
		}

		if (argv.auth) {
			query.auth = JSON.stringify(argv.auth);
		}

		if (query && Object.keys(query).length > 0) {
			reqOptions.path += '?' + querystring.stringify(query);
		}

		call(prefix, reqOptions, undefined /*reqBody*/, undefined /*reqParts*/, next);
	}

	function post(prefix, path, query, content, contentType, next) {
		var reqBody, reqParts;
		var reqOptions = {
			hostname: "127.0.0.1",
			port: argv.port,
			method: 'POST',
			headers: {},
			path: path
		};

		if (query && query._method) {
			reqOptions.headers['x-http-method-override'] = query._method;
			delete query._method;
		}

		if (contentType) {
			if (!contentType instanceof String) {
				throw new Error("bad parameter: missing contentType");
			}
			reqOptions.headers['content-type'] = contentType;

			if (contentType.match(/^text\/plain/)) {
				if (!content instanceof String) {
					throw new Error("bad parameter: not a String");
				}
				reqBody = content;
			} else if (contentType.match(/^application\/xml/)) {
				if (!content instanceof String) {
					throw new Error("bad parameter: not a String");
				}
				reqBody = content;	// XXX or convert an Object to XML
			} else if (contentType.match(/^application\/json/)) {
				if (!content instanceof Object) {
					throw new Error("bad parameter: not an Object");
				}
				reqBody = JSON.stringify(content);
			} else if (contentType === 'application/x-www-form-urlencoded') {
				query = query || {};
				if (content) {
					if (!Buffer.isBuffer(content)) {
						throw new Error("bad parameter: not a Buffer");
					}
					query.content = content.toString('base64');
				}
				if (Object.keys(query).length > 0) {
					reqBody = querystring.stringify(query);
				}
			} else if (contentType.match(/multipart\/form-data/)) {
				reqParts = content;
			} else if (content && contentType instanceof String) {
				if (contentType) {
					reqOptions.headers['x-content-type'] = contentType; // original value
				}
				reqOptions.headers['content-type'] = 'text/plain; charset=x-binary';
				reqBody = content.toString('x-binary'); // do not decode/encode
			}
		}

		if (argv.auth) {
			query.auth = JSON.stringify(argv.auth);
		}

		if (query && Object.keys(query).length > 0) {
			reqOptions.path += '?' + querystring.stringify(query);
		}

		call(prefix, reqOptions, reqBody, reqParts, next);
	}

	function call(prefix, reqOptions, reqBody, reqParts, next) {
		log.verbose(prefix, "reqOptions="+util.inspect(reqOptions));
		log.verbose(prefix, "reqBody="+util.inspect(reqBody));
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
					if (mime.match('^application/json')) {
						data.json = JSON.parse(data.buffer.toString());
					}
					if (mime.match('^text/plain')) {
						data.text = data.buffer.toString();
					}
				}
				log.verbose(prefix, "response: "+util.inspect(data));
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
		if (reqParts) {
			var boundaryKey = generateBoundary();
			req.setHeader('Content-Type', 'multipart/form-data; boundary="'+boundaryKey+'"');
			if (Array.isArray(reqParts)) {
				reqParts.forEach(function(part) {
					sendOnePart(req, part.name, part.filename, part.input, boundaryKey);
				});
			} else {
				sendOnePart(req, reqParts.name, reqParts.filename, reqParts.input, boundaryKey);
			}
			sendClosingBoundary(req, boundaryKey);
		} else {
			req.end();
		}
		req.on('error', next);
	}

	function generateBoundary() {
		// This generates a 50 character boundary similar to those used by Firefox.
		// They are optimized for boyer-moore parsing.
		var boundary = '--------------------------';
		for (var i = 0; i < 24; i++) {
			boundary += Math.floor(Math.random() * 10).toString(16);
		}
		return boundary;
	}

	function sendOnePart(req, name, filename, input, boundaryKey, contentTransferEncoding) {
		req.write('--' + boundaryKey + '\r\n' +
				  // use your file's mime type here, if known
				  'Content-Type: application/octet-stream\r\n' +
				  // "name" is the name of the form field
				  // "filename" is the name of the original file
				  'Content-Disposition: form-data; name="' + name + '"; filename="' + filename + '"\r\n');
		contentTransferEncoding = false /*'base64'*/;
		if (contentTransferEncoding) {
			req.write('Content-Transfer-Encoding: ' + contentTransferEncoding + '\r\n');
			req.write('\r\n');
			req.write(input.toString(contentTransferEncoding));
		} else {
			req.write('\r\n');
			req.write(input);
		}
		req.write('\r\n');
	}

	function sendClosingBoundary(req, boundaryKey) {
		req.end('--' + boundaryKey + '--');
	}

	function checkBuffer(buf, ref) {
		for (var i = 0; i < ref.length; ++i) {
			should.exist(buf[i]);
			should.exist(ref[i]);
			buf[i].should.equal(ref[i]);
		}
	}

	it("t0. should start", function(done) {
		myFs = new Fs(argv, function(err, service) {
			should.not.exist(err);
			should.exist(service);
			should.exist(service.origin);
			service.origin.should.match(/^http/);
			done();
		});
	});

	var fsRootId;

	it("t0.1. fs root is the same as root folder", function(done) {
		async.series([
			function(next) {
				get("t0.1/1", '/id/', {_method: "PROPFIND", depth: 0}, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200, 'statusCode === 200');
					should.exist(res.json);
					should.exist(res.json.id);
					fsRootId = res.json.id;
					next();
				});
			},
			function(next) {
				get("t0.1/2", '/id/' + fsRootId, {_method: "PROPFIND", depth: 0}, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200, 'statusCode === 200');
					should.exist(res.json);
					should.exist(res.json.isDir);
					res.json.isDir.should.equal(true, 'res.json.isDir === true');
					should.not.exist(res.json.children);
					should.exist(res.json.id);
					res.json.id.should.equal(fsRootId);
					next();
				});
			}
		], done);
	});

	var rootId, rootName = argv.dir, rootPath = '/' + rootName;

	it("t0.2. should create test root folder", function(done) {
		async.waterfall([
			function(next) {
				get("t0.2/1", '/id/' + fsRootId, {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200);
					should.exist(res.json);
					should.exist(res.json.isDir);
					res.json.isDir.should.equal(true);
					should.not.exist(res.json.children);
					should.exist(res.json.id);
					next(null, res.json.id);
				});
			},
			function(fsId, next) {
				post("t0.2/2", '/id/' + fsId, {_method: "MKCOL", name: rootName} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(201);
					should.exist(res.json);
					should.exist(res.json.isDir);
					res.json.isDir.should.equal(true);
					should.exist(res.json.path);
					should.exist(res.json.id);
					res.json.path.should.equal(rootPath);
					rootId = res.json.id;
					next();
				});
			}
		], done);
	});

	it("t1.1. should have an empty root-level folder (depth=0)", function(done) {
		get("t1.1", '/id/' + rootId, {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
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

	it("t1.2. should have an empty root-level folder (depth=1)", function(done) {
		get("t1.2", '/id/' + rootId, {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.children);
			should.exist(res.json.children.length);
			res.json.children.should.be.an.instanceOf(Array);
			res.json.children.length.should.equal(0);
			done();
		});
	});

	it("t2.1.0. should create a folder", function(done) {
		post("t2.1.0", '/id/' + rootId, {_method: "MKCOL",name: "toto"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal(rootPath + "/toto");
			done();
		});
	});

	it("t2.1.1. should fail to re-create the same folder (overwrite=false)", function(done) {
		post("t2.1.1", '/id/' + rootId, {_method: "MKCOL",name: "toto", overwrite: "false"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.not.exist(res);
			should.exist(err.statusCode);
			err.statusCode.should.equal(412);
			done();
		});
	});

	it("t2.1.2. should re-create the same folder (overwrite=undefined)", function(done) {
		post("t2.1.2", '/id/' + rootId, {_method: "MKCOL",name: "toto"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal(rootPath + "/toto");
			done();
		});
	});

	it("t2.1.3. should re-create the same folder (overwrite=true)", function(done) {
		post("t2.1.3", '/id/' + rootId, {_method: "MKCOL",name: "toto", overwrite: "true"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal(rootPath + "/toto");
			done();
		});
	});

	var totoId;

	it("t2.2. should have a single sub-folder", function(done) {
		get("t2.2", '/id/' + rootId, {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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
			res.json.children[0].path.should.equal(rootPath + "/toto");
			totoId = res.json.children[0].id;
			done();
		});
	});

	it("t2.3. should have an empty folder (depth=1)", function(done) {
		get("t2.3", '/id/' + totoId, {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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

	var titiId;

	it("t2.5. should create a sub-folder", function(done) {
		post("t2.5", '/id/' + totoId, {_method: "MKCOL",name: "titi"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal(rootPath + "/toto/titi");
			titiId = res.json.id;
			done();
		});
	});

	it("t2.6. should fail to download a folder", function(done) {
		get("t2.6", '/id/' + titiId, null /*query*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(403); // Forbidden
			should.not.exist(res);
			done();
		});
	});

	var textContent = "This is a Text content!";
	var textContent2 = "This is another Text content!";
	var textContentId = "";

	it("t3.1. should create a file (using 'application/x-www-form-urlencoded')", function(done) {
		post("t3.1", '/id/' + titiId, {_method: "PUT",name: "tutu"} /*query*/, new Buffer(textContent), 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json[0]);
			should.exist(res.json[0].isDir);
			res.json[0].isDir.should.equal(false);
			should.exist(res.json[0].path);
			res.json[0].path.should.equal(rootPath + "/toto/titi/tutu");
			should.exist(res.json[0].id);
			textContentId = res.json[0].id;
			done();
		});
	});

	it("t3.1.1. should fail to overwrite an existing file (overwrite=false)", function(done) {
		post("t3.1.1", '/id/' + titiId, {_method: "PUT",name: "tutu", overwrite: "false"} /*query*/, new Buffer(textContent), 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.exist(err);
			should.not.exist(res);
			should.exist(err.statusCode);
			err.statusCode.should.equal(412);
			done();
		});
	});

	it("t3.1.2. should succeed to overwrite an existing file (overwrite=undefined)", function(done) {
		post("t3.1.1", '/id/' + titiId, {_method: "PUT",name: "tutu"} /*query*/, new Buffer(textContent), 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json[0]);
			should.exist(res.json[0].isDir);
			res.json[0].isDir.should.equal(false);
			should.exist(res.json[0].path);
			res.json[0].path.should.equal(rootPath + "/toto/titi/tutu");
			should.exist(res.json[0].id);
			textContentId = res.json[0].id;
			done();
		});
	});

	it("t3.1.3. should succeed to overwrite an existing file (overwrite=true)", function(done) {
		post("t3.1.1", '/id/' + titiId, {_method: "PUT",name: "tutu", overwrite: "true"} /*query*/, new Buffer(textContent), 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json[0]);
			should.exist(res.json[0].isDir);
			res.json[0].isDir.should.equal(false);
			should.exist(res.json[0].path);
			res.json[0].path.should.equal(rootPath + "/toto/titi/tutu");
			should.exist(res.json[0].id);
			textContentId = res.json[0].id;
			done();
		});
	});

	it("t3.2. should see created file as a file", function(done) {
		get("t3.2", '/id/' + textContentId, {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			should.strictEqual(res.json.isDir, false);
			should.not.exist(res.json.children);
			should.exist(res.json.path);
			res.json.path.should.equal(rootPath + "/toto/titi/tutu");
			should.exist(res.json.id);
			res.json.id.should.equal(textContentId);
			done();
		});
	});

	it("t3.3. should download the same file", function(done) {
		get("t3.3", '/id/' + textContentId, null /*query*/, function(err, res) {
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
	var emptyContentId;

	it("t3.3.1. should create an empty file (using 'application/x-www-form-urlencoded')", function(done) {
		post("t3.1.1", '/id/' + titiId, {_method: "PUT",name: "empty"} /*query*/, emptyContent, 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json[0]);
			should.exist(res.json[0].isDir);
			res.json[0].isDir.should.equal(false);
			should.exist(res.json[0].path);
			res.json[0].path.should.equal(rootPath + "/toto/titi/empty");
			should.exist(res.json[0].id);
			emptyContentId = res.json[0].id;
			done();
		});
	});

	it("t3.4. should download the same empty file", function(done) {
		get("t3.4", '/id/' + emptyContentId, null /*query*/, function(err, res) {
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

	var tataId;

	it("t4.1. should create a file (using 'multipart/form-data')", function(done) {
		var content = {
			name: 'file',	// field name
			filename: 'tata', // file path
			input: new Buffer(textContent)
		};
		async.waterfall([
			function(cb) {
				post("t4.1", '/id/' + titiId, {_method: "PUT"} /*query*/, content, 'multipart/form-data' /*contentType*/, cb);
			},
			function(res, cb) {
				log.verbose("t4.1", "res:", res);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201);
				should.exist(res.json);
				should.exist(res.json[0]);
				should.exist(res.json[0].isDir);
				res.json[0].isDir.should.equal(false);
				should.exist(res.json[0].path);
				res.json[0].path.should.equal(rootPath + "/toto/titi/tata");
				should.exist(res.json[0].id);
				tataId = res.json[0].id;
				cb();
			}
		],done);
	});

	it("t4.2. should download the same file", function(done) {
		get("t4.2", '/id/' + tataId, null /*query*/, function(err, res) {
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

	var dir1file0Id;

	it("t4.3. should create a file in a relative location (using 'multipart/form-data')", function(done) {
		var content = {
			name: 'file',	// field name
			filename: 'dir.1/file.0', // file path
			input: new Buffer(textContent)
		};
		async.waterfall([
			function(cb) {
				post("t4.3", '/id/' + titiId, {_method: "PUT"} /*query*/, content, 'multipart/form-data' /*contentType*/, cb);
			},
			function(res, cb) {
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201);
				should.exist(res.json);
				should.exist(res.json[0]);
				should.exist(res.json[0].isDir);
				res.json[0].isDir.should.equal(false);
				should.exist(res.json[0].path);
				res.json[0].path.should.equal(rootPath + "/toto/titi/dir.1/file.0");
				should.exist(res.json[0].id);
				dir1file0Id = res.json[0].id;
				cb();
			}
		],done);
	});

	it("t4.4. should download the same file", function(done) {
		get("t4.4", '/id/' + dir1file0Id, null /*query*/, function(err, res) {
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

	var dir2file0Id;
	var dir2file1Id;

	it("t4.5. should create 2 files in a relative location (using 'multipart/form-data')", function(done) {
		var content = [{
			name: 'file',	// field name
			filename: 'dir.2/file.0', // file path
			input: new Buffer(textContent)
		},{
			name: 'file',	// field name
			filename: 'dir.2/file.1', // file path
			input: new Buffer(textContent2)
		}];
		async.waterfall([
			function(cb) {
				post("t4.5", '/id/' + titiId, {_method: "PUT"} /*query*/, content, 'multipart/form-data' /*contentType*/, cb);
			},
			function(res, cb) {
				log.verbose("t4.5", "res:", res);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201);
				should.exist(res.json);
				// Check first file
				should.exist(res.json[0]);
				should.exist(res.json[0].isDir);
				res.json[0].isDir.should.equal(false);
				should.exist(res.json[0].path);
				res.json[0].path.should.equal(rootPath + "/toto/titi/dir.2/file.0");
				should.exist(res.json[0].id);
				dir2file0Id = res.json[0].id;
				// Check second file
				should.exist(res.json[1]);
				should.exist(res.json[1].isDir);
				res.json[1].isDir.should.equal(false);
				should.exist(res.json[1].path);
				res.json[1].path.should.equal(rootPath + "/toto/titi/dir.2/file.1");
				should.exist(res.json[1].id);
				dir2file1Id = res.json[1].id;
				cb();
			}
		],done);
	});

	it("t4.6. should download the same file (first one)", function(done) {
		get("t4.6", '/id/' + dir2file0Id, null /*query*/, function(err, res) {
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

	it("t4.7. should download the same file (second one)", function(done) {
		get("t4.7", '/id/' + dir2file1Id, null /*query*/, function(err, res) {
			var contentStr;
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.buffer);
			contentStr = res.buffer.toString();
			contentStr.should.equal(textContent2);
			done();
		});
	});

	var iconId,
	    iconBuffer = fs.readFileSync(path.join(__dirname, '..', '..', 'ares', 'assets', 'images', 'ares_48x48.ico'));
	it("t4.8. create & compare a binary file (using 'multipart/form-data')", function(done) {
		var content = {
			name: 'file',	// field name
			filename: 'ares.ico', // file path
			input: iconBuffer
		};
		async.waterfall([
			function(cb) {
				post("t4.8", '/id/' + titiId, {_method: "PUT"} /*query*/, content, 'multipart/form-data' /*contentType*/, cb);
			},
			function(res, cb) {
				log.verbose("t4.8", "POST res:", res);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201);
				should.exist(res.json);
				should.exist(res.json[0]);
				should.exist(res.json[0].isDir);
				res.json[0].isDir.should.equal(false);
				should.exist(res.json[0].path);
				res.json[0].path.should.equal(rootPath + "/toto/titi/ares.ico");
				should.exist(res.json[0].id);
				iconId = res.json[0].id;
				cb();
			},
			function(cb) {
				get("t4.9", '/id/' + iconId, null /*query*/, cb);
			},
			function(res, cb) {
				log.verbose("t4.8", "GET res:", res);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				checkBuffer(res.buffer, iconBuffer);
				cb();
			}
		], function(err) {
			should.not.exist(err);
			done();
		});
	});

	it("t5.1. should fail to describe a non-existing file", function(done) {
		get("t5.1", '/id/' + '112233', {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	it("t5.2. should fail to download a non-existing file", function(done) {
		get("t5.2", '/id/' + '112233', null /*query*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	var tata1Id;

	it("t6.1. should copy file in the same folder, as a new file", function(done) {
		post("t6.1", '/id/' + tataId, {_method: "COPY", name: "tata.1"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.path);
			res.json.name.should.equal('tata.1');
			should.exist(res.json.id);
			tata1Id = res.json.id;
			done();
		});
	});

	it("t6.2. should fail to copy file in the same folder, onto another one (overwrite=false)", function(done) {
		post("t6.2", '/id/' + tata1Id, {_method: "COPY", name: "tata", overwrite: "false"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(412); // Precondition-Failed
			should.not.exist(res);
			done();
		});
	});

	it("t6.3. should fail to copy file as or to nothing", function(done) {
		post("t6.3", '/id/' + tata1Id, {_method: "COPY"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400); // Bad-Request
			should.not.exist(res);
			done();
		});
	});

	it("t6.4. should copy file in the same folder, onto another one (overwrite=undefined)", function(done) {
		post("t6.4/1", '/id/' + tata1Id, {_method: "COPY", name: "tata"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200); // Ok

			get("t6.4/2", '/id/' + tataId, null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get("t6.4/3", '/id/' + tata1Id, null /*query*/, function(err, res) {
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

	it("t6.5. should fail to copy file in the same folder as the same name (overwrite=true)", function(done) {
		post("t6.5", '/id/' + tataId, {_method: "COPY",name: "tata", overwrite: true} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400);
			should.not.exist(res);
			done();
		});
	});

	var toto1Id;

	it("t6.6. should reccursively copy folder in the same folder, as a new folder", function(done) {
		async.waterfall([
			function(next) {
				post("t6.6/1", '/id/' + totoId, {_method: "COPY", name: "toto.1"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					should.exist(res.json);
					should.exist(res.json.name);
					res.json.name.should.equal('toto.1');
					should.exist(res.json.id);
					toto1Id = res.json.id;
					res.statusCode.should.equal(201); // Created
					next();
				});
			}, function(next) {
				get("t6.6/2", '/file' + rootPath + '/toto.1/titi/tata', null /*query*/, function(err, res) {
					var contentStr;
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(200);
					should.exist(res.buffer);
					contentStr = res.buffer.toString();
					contentStr.should.equal(textContent);
					next();
				});
			}
		], done);
	});

	it("t7.1. should rename folder in the same folder, as a new folder", function(done) {
		post("t7.1/1", '/id/' + toto1Id, {_method: "MOVE", name: "toto.2"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			get("t7.1/2", '/file' + rootPath + '/toto.2/titi/tata', null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get("t7.1/3", '/file' + rootPath + '/toto.1/titi/tata', {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
					should.exist(err);
					should.exist(err.statusCode);
					err.statusCode.should.equal(404);
					should.not.exist(res);

					done();
				});
			});
		});
	});

	it("t7.2. should rename file in the same folder, as a new file", function(done) {
		post("t7.2/1", '/id/' + tata1Id, {_method: "MOVE", name: "tata.2"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			get("t7.2/2", '/file' + rootPath + '/toto/titi/tata.2', null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get("t7.2/3", '/file' + rootPath + '/toto/titi/tata.1', {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
					should.exist(err);
					should.exist(err.statusCode);
					err.statusCode.should.equal(404);
					should.not.exist(res);

					done();
				});
			});
		});
	});

	it("t7.3. should fail to move file into a non-existing folder", function(done) {
		post("t7.3", '/id/' + tataId, {_method: "MOVE", folderId: '112233'} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	it("t7.4. should fail to move folder into a non-existing folder", function(done) {
		post("t7.4", '/id/' + titiId, {_method: "MOVE", folderId: '112233'} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	var toto3Id;

	it("t7.5. should move file into another folder", function(done) {
		post("t7.5/1", '/id/' + rootId, {_method: "MKCOL",name: "toto.3"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal(rootPath + "/toto.3");
			should.exist(res.json.id);
			toto3Id = res.json.id;

			post("t7.5/2", '/id/' + tataId, {_method: "MOVE", folderId: toto3Id} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201); // Created

				get("t7.5/3", '/file' + rootPath + '/toto.3/tata', null /*query*/, function(err, res) {
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

	it("t7.6. should move folder into another folder", function(done) {
		post("t7.6/1", '/id/' + rootId, {_method: "MKCOL",name: "toto.4"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal(rootPath + "/toto.4");
			should.exist(res.json.id);
			var toto4Id = res.json.id;

			get("t7.6/2", '/file' + rootPath + '/toto.2/titi', {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.json);
				should.exist(res.json.isDir);
				res.json.isDir.should.equal(true);
				should.exist(res.json.id);
				var toto2titiId = res.json.id;
				should.exist(res.json.children);
				var nbChildren = res.json.children.length;

				post("t7.6/3", '/id/' + toto2titiId, {_method: "MOVE", folderId: toto4Id} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(201); // Created

					get("t7.6/4", '/file' + rootPath + '/toto.4/titi', {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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

	it("t8.0. should find a designer overlay iframe.html at any place", function(done) {
		get("t8.0", '/file' + rootPath + '/iframe.html', {overlay: "designer"}, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.not.exist(res.json);
			res.headers['content-type'].should.match(/^text\/html/);
			done();
		});
	});

	it("t100.0. should delete test root folder", function(done) {
		post("t100.0", '/id/' + rootId, {_method: "DELETE"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200); // Ok
			done();
		});
	});

	it("t100.1. should stop", function(done) {
		myFs.quit(done);
	});
}
