#!/usr/bin/env node

/**
 *  ARES IDE server
 */
require('./hermes/lib/checkNodeVersion');	// Check nodejs version

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    optimist = require("optimist"),
    util  = require('util'),
    spawn = require('child_process').spawn,
    querystring = require("querystring"),
    http = require('http') ;
var myDir = typeof(__dirname) !== 'undefined' ?  __dirname : path.resolve('') ;
var HttpError = require(path.resolve(myDir, "hermes/lib/httpError"));

var argv = optimist.usage('\nAres IDE, a front-end designer/editor web applications.\nUsage: "$0" [OPTIONS]\n')
	.options('h', {
		alias : 'help',
		description: 'help message',
		boolean: true
	})
	.options('T', {
		alias : 'runtest',
		description: 'Run the non-regression test suite',
		boolean: true
	})
	.options('b', {
		alias : 'browser',
		description: 'Open the default browser on the Ares URL',
		boolean: true
	})
	.options('p', {
		alias : 'port',
		description: 'port (o) local IP port of the express server (default: 9009, 0: dynamic)',
		default: '9009'
	})
	.options('H', {
		alias : 'host',
		description: 'host to bind the express server onto',
		default: '127.0.0.1'
	})
	.options('a', {
		alias : 'listen_all',
		description: 'When set, listen to all adresses. By default, listen to the address specified with -H',
		'boolean': true
	})
	.options('c', {
		alias : 'config',
		description: 'IDE configuration file',
		default: path.resolve(myDir, "ide.json")
	})
	.options('v', {
		alias : 'verbose',
		description: 'Increase IDE verbosity in the console',
		boolean: true
	})
	.argv;

if (argv.help) {
	optimist.showHelp();
	process.exit(0);
}

function log() {
	if (argv.verbose) {
		var arg, msg = arguments.callee.caller.name + '(): ';
		for (var argi = 0; argi < arguments.length; argi++) {
			arg = arguments[argi];
			if (typeof arg === 'object') {
				msg += util.inspect(arg);
			} else {
				msg += arg;
			}
			msg += ' ';
		}
		console.log(msg);
	};
}

log("Arguments:", argv);

// Load IDE configuration & start per-project file servers

var ide = {};
var service = {};
var subProcesses = [];
var platformVars = [
	{regex: /@NODE@/, value: process.argv[0]},
	{regex: /@CWD@/, value: process.cwd()},
	{regex: /@INSTALLDIR@/, value: __dirname},
	{regex: /@HOME@/, value: process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']}
];

function platformSubst(inStr) {
	var outStr = inStr;
	if (outStr) {
		platformVars.forEach(function(subst){
			outStr = outStr.replace(subst.regex,subst.value);
		});
	}
	return outStr;
}
var platformOpen = {
	win32: [ "cmd" , '/c', 'start' ],
	darwin:[ "open" ],
	linux: [ "xdg-open" ]
};

var configPath, tester;
var configStats;

if (argv.runtest) {
	tester = require('./test/tester/main.js');
	configPath = path.resolve(myDir, "ide-test.json");
} else{
	configPath = argv.config;
}

function loadMainConfig(configFile) {
	if (!fs.existsSync(configFile)) {
		throw "Did not find: '"+configFile+"': ";
	}

	log("Loading ARES configuration from '"+configFile+"'...");
	configStats = fs.lstatSync(configFile);
	if (!configStats.isFile()) {
		throw "Not a file: '"+configFile+"': ";
	}

	var configContent = fs.readFileSync(configFile, 'utf8');
	try {
		ide.res = JSON.parse(configContent);
	} catch(e) {
		throw "Improper JSON: "+configContent;
	}

	if (!ide.res.services || !ide.res.services[0]) {
		throw "Corrupted '"+configFile+"': no storage services defined";
	}
}

function appendPluginConfig(configFile) {
	log("Loading ARES plugin configuration from '"+configFile+"'...");
	var pluginData;
	var configContent = fs.readFileSync(configFile, 'utf8');
	try {
		pluginData = JSON.parse(configContent);
	} catch(e) {
		throw "Improper JSON in " + configFile + " : "+configContent;
	}

	pluginData.services.forEach(function(service) {
		log("Adding service '" + service.name + "' to ARES configuration");
		ide.res.services.push(service);
	});
}

function loadPluginConfigFiles() {
	var base = path.join(myDir, 'node_modules');
	var directories = fs.readdirSync(base);
	directories.forEach(function(directory) {
		var filename = path.join(base, directory, 'ide.json');
		if (fs.existsSync(filename)) {
			appendPluginConfig(filename);
		}
	});
}

loadMainConfig(configPath);
loadPluginConfigFiles();

// configuration age/date is the UTC configuration file last modification date
ide.res.timestamp = configStats.atime.getTime();
log(ide.res);

function handleMessage(service) {
	return function(msg) {
		if (msg.protocol && msg.host && msg.port && msg.origin && msg.pathname) {
			service.dest = msg;
			log("will proxy to service.dest:", service.dest);
			service.origin = 'http://' + argv.host + ':' + argv.port;
			service.pathname = '/res/services/' + service.id;

			if (service.origin.match(/^https:/)) {
				console.info("Service['"+service.id+"']: connect to <"+service.origin+"> to accept SSL certificate");
			}

			var options = {
				host:   service.dest.host,
				port:   service.dest.port,
				path:   '/config',
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				}
			};
			var creq = http.request(options, function(cres) {
				console.info("Service['"+service.id+"']: POST /config response.status=" + cres.statusCode);
			}).on('error', function(e) {
				throw e;
			});
			creq.write(JSON.stringify({config: service}, null, 2));
			creq.end();
			
		} else {
			console.error("Error updating URL for service "+service.id);
		}
	};
}

function serviceEcho(service) {
	return function(data){
		console.log("> Service['"+service.id+"']: "+data);
	};
}

function handleServiceExit(service) {
	return function(code, signal) {
		if (signal) {
			console.log("> Service['"+service.id+"']: killed (signal="+signal+")");
		} else {
			console.error("*** Service['"+service.id+"']: abnormal exit (code="+code+")");
			if (service.respawn) {
				console.error("*** Service['"+service.id+"']: respawning...");
				startService(service);
			} else {
				console.error("*** Exiting...");
				process.exit(code);
			}
		}
	};
}

function startService(service) {
	var command = platformSubst(service.command);
	var params = [];
	var options = {
		stdio: ['ignore', 'pipe', 'pipe', 'ipc']
	};
	service.params.forEach(function(inParam){
		params.push(platformSubst(inParam));
	});
	if (service.verbose) {
		params.push('-v');
	}
	console.log("> Service['"+service.id+"']: executing '"+command+" "+params.join(" ")+"'");
	var subProcess = spawn(command, params, options);
	subProcess.stderr.on('data', serviceEcho(service));
	subProcess.stdout.on('data', serviceEcho(service));
	subProcess.on('exit', handleServiceExit(service));
	subProcess.on('message', handleMessage(service));
	subProcesses.push(subProcess);
}

function proxyServices(req, res, next) {
	log("req.params:", req.params, ", req.query:", req.query);
	var query = {},
	    id = req.params.serviceId,
	    service = ide.res.services.filter(function(service) {
		    return service.id === id;
	    })[0];
	if (!service) {
		next(new HttpError('No such service: ' + id, 403));
		return;
	}
	for (var key in req.query) {
		if (key && req.query[key]) {
			query[key] = req.query[key];
		}
	}
	var options = {
		// host to forward to
		host:   service.dest.host,
		// port to forward to
		port:   service.dest.port,
		// path to forward to
		path:   service.dest.pathname +
			(req.params[0] ? '/' + req.params[0] : '') +
			'?' + querystring.stringify(query),
		// request method
		method: req.method,
		// headers to send
		headers: req.headers
	};
	log("options:", options);

	var creq = http.request(options, function(cres) {
		// transmit every header verbatim, but cookies
		log("cres.headers:", cres.headers);
		for (var key in cres.headers) {
			var val = cres.headers[key];
			if (key.toLowerCase() === 'set-cookie') {
				var cookies = parseSetCookie(val);
				cookies.forEach(translateCookie.bind(this, service, res));
			} else {
				res.header(key, val);
			}
		}
		// re-write cookies
		res.writeHead(cres.statusCode);
		cres.pipe(res);
	}).on('error', function(e) {
		next(e);
	});
	req.pipe(creq);
}

function translateCookie(service, res, cookie) {
	cookie.options.domain = ide.res.domain || '127.0.0.1';
	var oldPath = cookie.options.path;
	cookie.options.path = service.pathname + (oldPath ? oldPath : '');
	log("cookie.path:", oldPath, "->", cookie.options.path);
	log("set-cookie:", cookie);
	res.cookie(cookie.name, cookie.value, cookie.options);
}

function parseSetCookie(cookies) {
	var outCookies = [];
	if (!Array.isArray(cookies)) {
		cookies = [ cookies ];
	}
	cookies.forEach(function(cookie) {
		var outCookie = {};
		var tokens = cookie.split(/; */);
		log("parseSetCookie(): tokens:", tokens);
		var namevalStr = tokens.splice(0, 1)[0];
		if (typeof namevalStr === 'string') {
			var nameval = namevalStr.split('=');
			outCookie.name = nameval[0];
			outCookie.value = nameval[1];
			outCookie.options = {};
			tokens.forEach(function(token) {
				var opt = token.split('=');
				outCookie.options[opt[0]] = opt[1] || true;
			});
			if (typeof outCookie.options.expires === 'string') {
				outCookie.options.expires = new Date(outCookie.options.expires);
			}
			log("parseSetCookie(): outCookie:", outCookie);
			outCookies.push(outCookie);
		} else {
			log("parseSetCookie(): Invalid Set-Cookie header:", namevalStr);
		}
	});
	log("outCookies:", outCookies);
	return outCookies;
}

function onExit() {
	if (subProcesses.length > 0) {
		console.log('Terminating sub-processes...');
		subProcesses.forEach(function(subproc) {
			process.kill(subproc.pid, 'SIGINT');
		});
		subProcesses = [];
		console.log('Exiting...');
	}
}

ide.res.services.filter(function(service){
	return service.active;
}).forEach(function(service){
	if (service.command) {
		startService(service);
	}
});

// Start the ide server

var enyojsRoot = path.resolve(myDir,".");
var app = express.createServer();

var port = parseInt(argv.port, 10);
var addr = argv.host;

app.configure(function(){

	app.use('/ide', express.static(enyojsRoot + '/'));
	app.use('/test', express.static(enyojsRoot + '/test'));

	app.use(express.logger('dev'));

	app.get('/', function(req, res, next) {
		log("GET /");
		res.redirect('/ide/ares/');
	});
	app.get('/res/timestamp', function(req, res, next) {
		res.status(200).json({timestamp: ide.res.timestamp});
	});
	app.get('/res/services', function(req, res, next) {
		log("GET /res/services:", ide.res.services);
		res.status(200).json({services: ide.res.services});
	});
	app.all('/res/services/:serviceId/*', proxyServices);
	app.all('/res/services/:serviceId', proxyServices);

	if (tester) {
		app.post('/res/tester', tester.setup);
		app['delete']('/res/tester', tester.cleanup);
	}

});

app.listen(port, argv.listen_all ? null : addr);

// Run non-regression test suite

var page = "index.html";
if (argv.runtest) {
	page = "test.html";
}

// Open default browser

var url = "http://" + addr + ":" + port + "/ide/ares/" + page;
if (argv.browser) {
	var info = platformOpen[process.platform] ;
	spawn(info[0], info.slice(1).concat([url]));
} else {
	console.log("Ares now running at <" + url + ">");
}

// Exit path

console.info("Press CTRL + C to shutdown");

process.on('uncaughtException', function (err) {
	console.error(err.stack);
	process.exit(1);
});
process.on('exit', onExit);
process.on('SIGINT', onExit);
