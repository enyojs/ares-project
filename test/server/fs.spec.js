#!/usr/bin/env node_modules/mocha/bin/mocha --bail
/**
 * fsXXX.js test suite
 */
// @see http://visionmedia.github.com/mocha/

var fs = require("fs"),
    path = require("path"),
    http = require("http"),
    querystring = require("querystring"),
    should = require("should"),
    util = require("util"),
    async = require("async"),
    optimist = require("optimist");

/*
 * parameters parsing
 */

var argv = optimist
	    .usage('\nAres FileSystem (fs) tester.\nUsage: "$0 [OPTIONS] -F <FS_PATH>"')
	    .options('F', {
		    alias : 'filesystem',
		    description: 'path to the Hermes file-system to test. For example ../../hermes/fsLocal.js',
		    required: true
	    })
	    .options('A', {
		    alias : 'auth',
		    description: 'auth parameter, passed as a single-quoted URL-encoded JSON-formatted Javascript Object'
	    })
	    .options('h', {
		    alias : 'help',
		    description: 'help message',
		    boolean: true
	    })
	    .options('v', {
		    alias : 'verbose',
		    description: 'verbose execution mode',
		    boolean: true
	    })
	    .options('q', {
		    alias : 'quiet',
		    description: 'really quiet',
		    boolean: true
	    })
	    .argv;

if (argv.help) {
	optimist.showHelp();
	process.exit(0);
}

if (argv.quiet) {
	argv.verbose = false;
}

var config = {};

config.name = path.basename(argv.filesystem);
config.prefix = '[fs.spec:' + config.name + ']';

if (argv.auth) {
	config.auth = JSON.parse(decodeURIComponent(argv.auth));
}

log("running in verbose mode");
log("argv:", argv);
log("config:", config);

/*
 * utilities
 */

function log() {
	if (argv.verbose) {
		console.log.bind(this, config.prefix).apply(this, arguments);
	}
}

function get(path, query, next) {
	var reqOptions = {
		hostname: "127.0.0.1",
		port: argv.port,
		method: 'GET',
		headers: {},
		path: path
	};

	if (config.auth) {
		query.auth = JSON.stringify(config.auth);
	}

	if (query && Object.keys(query).length > 0) {
		reqOptions.path += '?' + querystring.stringify(query);
	}

	call(reqOptions, undefined /*reqBody*/, undefined /*reqParts*/, next);
}

function post(path, query, content, contentType, next) {
	var reqContent, reqBody, reqParts;
	var reqOptions = {
		hostname: "127.0.0.1",
		port: argv.port,
		method: 'POST',
		headers: {},
		path: path
	};

	if (contentType) {
		if (!contentType instanceof String) throw new Error("bad parameter: missing contentType");
		reqOptions.headers['content-type'] = contentType;

		if (contentType.match(/^text\/plain/)) {
			if (!content instanceof String) throw new Error("bad parameter: not a String");
			reqBody = content;
		} else if (contentType.match(/^application\/xml/)) {
			if (!content instanceof String) throw new Error("bad parameter: not a String");
			reqBody = content;	// XXX or convert an Object to XML
		} else if (contentType.match(/^application\/json/)) {
			if (!content instanceof Object) throw new Error("bad parameter: not an Object");
			reqBody = JSON.stringify(content);
		} else if (contentType === 'application/x-www-form-urlencoded') {
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
		} else if (contentType.match(/multipart\/form-data/)) {
			reqParts = content;
		} else if (content && contentType instanceof String) {
			if (contentType) reqOptions.headers['x-content-type'] = contentType; // original value
			reqOptions.headers['content-type'] = 'text/plain; charset=x-binary';
			reqBody = content.toString('x-binary'); // do not decode/encode
		}
	}

	if (config.auth) {
		query.auth = JSON.stringify(config.auth);
	}

	if (query && Object.keys(query).length > 0) {
		reqOptions.path += '?' + querystring.stringify(query);
	}

	call(reqOptions, reqBody, reqParts, next);
}

function call(reqOptions, reqBody, reqParts, next) {
	log("reqOptions="+util.inspect(reqOptions));
	log("reqBody="+util.inspect(reqBody));
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
			log("data="+util.inspect(data));
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
		sendOnePart(req, reqParts.name, reqParts.filename, reqParts.input);
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

function sendOnePart(req, name, filename, input) {
	var boundaryKey = generateBoundary();
	req.setHeader('Content-Type', 'multipart/form-data; boundary="'+boundaryKey+'"');
	req.write('--' + boundaryKey + '\r\n' +
		  // use your file's mime type here, if known
		  'Content-Type: application/octet-stream\r\n' +
		  // "name" is the name of the form field
		  // "filename" is the name of the original file
		  'Content-Disposition: form-data; name="' + name + '"; filename="' + filename + '"\r\n' +
		  'Content-Transfer-Encoding: binary\r\n\r\n');
	req.write(input);
	req.end('\r\n--' + boundaryKey + '--'); 
}

var Fs = require(argv.filesystem);
if (!Fs) {
	throw new Error("Unable to load file-system: " + argv.filesystem);
}
var myFs;

describe("Testing " + config.name, function() {
	
	it("t0. should start", function(done) {
		myFs = new Fs(argv, function(err, service){
			log("service="+util.inspect(service));
			should.not.exist(err);
			should.exist(service);
			should.exist(service.origin);
			service.origin.should.match(/^http/);
			done();
		});
	});

	var rootId;

	it("t1.0. should have an empty default root-level folder (depth=0)", function(done) {
		get('/id/', {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.not.exist(res.json.children);
			should.exist(res.json.id);
			rootId = res.json.id;
			done();
		});
	});
	
	it("t1.1. should have an empty root-level folder (depth=0)", function(done) {
		get('/id/' + rootId, {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
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
		get('/id/' + rootId, {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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
	
	it("t1.3. should have an empty root-level folder (implicit id, depth=1)", function(done) {
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
	
	it("t2.1. should create a folder", function(done) {
		post('/id/' + rootId, {_method: "MKCOL",name: "toto"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
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

	 var totoId;

	it("t2.2. should have a single sub-folder", function(done) {
		get('/id/' + rootId, {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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
			totoId = res.json.children[0].id;
			done();
		});
	});

	it("t2.3. should have an empty folder (depth=1)", function(done) {
		get('/id/' + totoId, {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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
	
	it("t2.4 should fail to create a folder", function(done) {
		post('/id/' + rootId, {_method: "MKCOL",name: "toto"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			err.statusCode.should.equal(409); // Conflict
			//should.exist(err.json);
			//should.exist(err.json.code);
			//err.json.code.should.equal('EEXIST');
			should.not.exist(res);
			done();
		});
	});

	 var titiId;

	it("t2.5. should create a sub-folder", function(done) {
		post('/id/' + totoId, {_method: "MKCOL",name: "titi"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto/titi");
			titiId = res.json.id;
			done();
		});
	});

	it("t2.6. should fail to download a folder", function(done) {
		get('/id/' + titiId, null /*query*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(403); // Forbidden
			should.not.exist(res);
			done();
		});
	});

	var textContent = "This is a Text content!";
	var textContentType = "text/plain; charset=utf-8";
	var textContentId = "";

	it("t3.1. should create a file (using 'application/x-www-form-urlencoded')", function(done) {
		post('/id/' + titiId, {_method: "PUT",name: "tutu"} /*query*/, new Buffer(textContent), 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201);
			should.exist(res.json);
			should.exist(res.json[0]);
			should.exist(res.json[0].isDir);
			res.json[0].isDir.should.equal(false);
			should.exist(res.json[0].path);
			res.json[0].path.should.equal("/toto/titi/tutu");
			should.exist(res.json[0].id);
			textContentId = res.json[0].id;
			done();
		});
	});

	it("t3.2. should see created file as a file", function(done) {
		get('/id/' + textContentId, {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200);
			should.exist(res.json);
			should.exist(res.json.isDir);
			should.strictEqual(res.json.isDir, false);
			should.not.exist(res.json.children);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto/titi/tutu");
			should.exist(res.json.id);
			res.json.id.should.equal(textContentId);
			done();
		});
	});

	it("t3.3. should download the same file", function(done) {
		get('/id/' + textContentId, null /*query*/, function(err, res) {
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

	it("t3.3. should create an empty file (using 'application/x-www-form-urlencoded')", function(done) {
		post('/id/' + titiId, {_method: "PUT",name: "empty"} /*query*/, emptyContent, 'application/x-www-form-urlencoded' /*contentType*/, function(err, res) {
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
			should.exist(res.json[0].id);
			emptyContentId = res.json[0].id;
			done();
		});
	});

	it("t3.4. should download the same empty file", function(done) {
		get('/id/' + emptyContentId, null /*query*/, function(err, res) {
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
				post('/id/' + titiId, {_method: "PUT"} /*query*/, content, 'multipart/form-data' /*contentType*/, cb);
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
				res.json[0].path.should.equal("/toto/titi/tata");
				should.exist(res.json[0].id);
				tataId = res.json[0].id;
				cb();
			}
		],done);
	});

	it("t4.2. should download the same file", function(done) {
		get('/id/' + tataId, null /*query*/, function(err, res) {
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
				post('/id/' + titiId, {_method: "PUT"} /*query*/, content, 'multipart/form-data' /*contentType*/, cb);
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
				res.json[0].path.should.equal("/toto/titi/dir.1/file.0");
				should.exist(res.json[0].id);
				dir1file0Id = res.json[0].id;
				cb();
			}
		],done);
	});

	it("t4.4. should download the same file", function(done) {
		get('/id/' + dir1file0Id, null /*query*/, function(err, res) {
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

	it("t5.1. should fail to describe a non-existing file", function(done) {
		get('/id/' + '112233', {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
			var emptyBuf, emptyStr;
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	it("t5.2. should fail to download a non-existing file", function(done) {
		get('/id/' + '112233', null /*query*/, function(err, res) {
			var contentBuf, contentStr;
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404);
			should.not.exist(res);
			done();
		});
	});

	 var tata1Id;

	it("t6.1. should copy file in the same folder, as a new file", function(done) {
		post('/id/' + tataId, {_method: "COPY", name: "tata.1"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
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

	it("t6.2. should fail to copy file in the same folder, onto another one (no overwrite)", function(done) {
		post('/id/' + tata1Id, {_method: "COPY", name: "tata"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(412); // Precondition-Failed
			should.not.exist(res);
			done();
		});
	});

	it("t6.3. should fail to copy file as or to nothing", function(done) {
		post('/id/' + tata1Id, {_method: "COPY"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400); // Bad-Request
			should.not.exist(res);
			done();
		});
	});

	it("t6.4. should copy file in the same folder, onto another one (overwrite)", function(done) {
		post('/id/' + tata1Id, {_method: "COPY", name: "tata", overwrite: true} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(200); // Ok

			get('/id/' + tataId, null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get('/id/' + tata1Id, null /*query*/, function(err, res) {
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

	it("t6.5. should fail to copy file in the same folder as the same name (overwrite)", function(done) {
		post('/id/' + tataId, {_method: "COPY",name: "tata", overwrite: true} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(400);
			should.not.exist(res);
			done();
		});
	});

	 var toto1Id;

	it("t6.6. should reccursively copy folder in the same folder, as a new folder", function(done) {
		post('/id/' + totoId, {_method: "COPY", name: "toto.1"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			should.exist(res.json);
			should.exist(res.json.name);
			res.json.name.should.equal('toto.1');
			should.exist(res.json.id);
			toto1Id = res.json.id;
			res.statusCode.should.equal(201); // Created

			get('/file/toto.1/titi/tata', null /*query*/, function(err, res) {
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

	it("t7.1. should rename folder in the same folder, as a new folder", function(done) {
		post('/id/' + toto1Id, {_method: "MOVE", name: "toto.2"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			get('/file/toto.2/titi/tata', null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get('/file//toto.1/titi/tata', {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
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

	it("t7.2. should rename file in the same folder, as a new file", function(done) {
		post('/id/' + tata1Id, {_method: "MOVE", name: "tata.2"} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created

			get('/file/toto/titi/tata.2', null /*query*/, function(err, res) {
				var contentStr;
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(200);
				should.exist(res.buffer);
				contentStr = res.buffer.toString();
				contentStr.should.equal(contentStr);

				get('/i/toto/titi/tata.1', {_method: "PROPFIND", depth: 0} /*query*/, function(err, res) {
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

	it("t7.3. should fail to move file into a non-existing folder", function(done) {
		post('/id/' + tataId, {_method: "MOVE", folderId: '112233'} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	it("t7.4. should fail to move folder into a non-existing folder", function(done) {
		post('/id/' + titiId, {_method: "MOVE", folderId: '112233'} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
			should.exist(err);
			should.exist(err.statusCode);
			err.statusCode.should.equal(404); // Not-Found
			should.not.exist(res);
			done();
		});
	});

	 var toto3Id;

	it("t7.5. should move file into another folder", function(done) {
		post('/id/' + rootId, {_method: "MKCOL",name: "toto.3"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto.3");
			should.exist(res.json.id);
			toto3Id = res.json.id;

			post('/id/' + tataId, {_method: "MOVE", folderId: toto3Id} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
				should.not.exist(err);
				should.exist(res);
				should.exist(res.statusCode);
				res.statusCode.should.equal(201); // Created

				get('/file/toto.3/tata', null /*query*/, function(err, res) {
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
		post('/id/' + rootId, {_method: "MKCOL",name: "toto.4"} /*query*/, undefined /*content*/, undefined /*contentType*/, function(err, res) {
			should.not.exist(err);
			should.exist(res);
			should.exist(res.statusCode);
			res.statusCode.should.equal(201); // Created
			should.exist(res.json);
			should.exist(res.json.isDir);
			res.json.isDir.should.equal(true);
			should.exist(res.json.path);
			res.json.path.should.equal("/toto.4");
			should.exist(res.json.id);
			var toto4Id = res.json.id;

			get('/file/toto.2/titi', {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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

				post('/id/' + toto2titiId, {_method: "MOVE", folderId: toto4Id} /*query*/, null /*content*/, null /*contentType*/, function(err, res) {
					should.not.exist(err);
					should.exist(res);
					should.exist(res.statusCode);
					res.statusCode.should.equal(201); // Created
					
					get('/file/toto.4/titi', {_method: "PROPFIND", depth: 1} /*query*/, function(err, res) {
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

	it("t100. should stop", function(done) {
		myFs.quit(done);
	});
});
