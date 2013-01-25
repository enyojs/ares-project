/**
 *  ARES IDE server
 */

//extract major version
var version = process.version.match(/[0-9]+.[0-9]+/)[0];
if (version <= 0.7) {
	console.error("Ares ide.js is only supported on Node.js version 0.8 and above");
	process.exit(1);
}

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    optimist = require("optimist"),
    util  = require('util'),
    spawn = require('child_process').spawn,
    querystring = require("querystring"),
    http = require('http'),
    HttpError = require(path.resolve(__dirname, "hermes/lib/httpError"));

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
		default: path.resolve(__dirname, "ide.json")
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
	win32: "Start",
	darwin: "open",
	linux: "xdg-open"
};

var configPath;
if (argv.runtest) {
	configPath = path.resolve(__dirname, "ide-test.json");
} else{
	configPath = argv.config;
}
if (!fs.existsSync(configPath)) {
	throw "Did not find: '"+configPath+"': ";
}

log("Loading ARES configuration from '"+configPath+"'...");
var configStats = fs.lstatSync(configPath);
if (!configStats.isFile()) {
	throw "Not a file: '"+configPath+"': ";
}

var configContent = fs.readFileSync(configPath, 'utf8');
try {
	ide.res = JSON.parse(configContent);
} catch(e) {
	throw "Improper JSON: "+configContent;
}

if (!ide.res.services || !ide.res.services[0]) {
	throw "Corrupted '"+configPath+"': no storage services defined";
}

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

ide.res.services.filter(function(service){
	return service.active;
}).forEach(function(service){
	if (service.command) {
		startService(service);
	}
});

// Start the ide server

var enyojsRoot = path.resolve(__dirname,".");
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
	spawn(platformOpen[process.platform], [url]);
} else {
	console.log("Ares now running at <" + url + ">");
}

// Exit path

console.info("Press CTRL + C to shutdown");

process.on('uncaughtException', function (err) {
	console.error(err.stack);
	process.exit(1);
});
process.on('exit', function () {
	console.log('Terminating sub-processes...');
	subProcesses.forEach(function(process) {
		process.kill();
	});
	console.log('Exiting...');
});
