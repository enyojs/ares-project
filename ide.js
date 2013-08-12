#!/usr/bin/env node
/* global require, __dirname, console, process */
/**
 *  ARES IDE server
 */

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    npmlog = require('npmlog'),
    nopt = require('nopt'),
    util  = require('util'),
    spawn = require('child_process').spawn,
    querystring = require("querystring"),
    versionTools = require('./hermes/lib/version-tools'),
    http = require('http'),
    HttpError = require("./hermes/lib/httpError");

// __dirname is not defined by node-webkit
var myDir = typeof(__dirname) !== 'undefined' ?  __dirname : path.resolve('') ;

/**********************************************************************/

var knownOpts = {
        "help":            Boolean,
        "runtest":         Boolean,
        "browser":         Boolean,
        "bundled-browser": Boolean,
        "port":            Number,
        "host":            String,
        "listen_all":      Boolean,
        "config":          path,
        "level":           ['silly', 'verbose', 'info', 'http', 'warn', 'error'],
        "log":             Boolean,
        "version":         Boolean
};
var shortHands = {
	"h": ["--help"],
	"T": ["--runtest"],
	"b": ["--browser"],
	"B": ["--bundled-browser"],
	"p": ["--port"],
	"H": ["--host"],
	"a": ["--listen_all"],
	"c": ["--config"],
	"l": ["--level"],
	"L": ["--log"],
	"V": ["--version"]
};
var argv = nopt(knownOpts, shortHands, process.argv, 2 /*drop 'node' & 'ide.js'*/);

argv.config = argv.config || path.join(myDir, "ide.json");
argv.host = argv.host || "127.0.0.1";
argv.port = argv.port || 9009;

if (argv.help) {
	console.log("\n" +
		"Ares IDE, a front-end designer/editor web applications.\n" +
		"\n" +
		"Usage: 'node ./ide.js' [OPTIONS]\n" +
		"\n" +
		"OPTIONS:\n" +
		"  -h, --help            help message                                                                          [boolean]\n" +
		"  -T, --runtest         Run the non-regression test suite                                                     [boolean]\n" +
		"  -b, --browser         Open the default browser on the Ares URL                                              [boolean]\n" +
		"  -B, --bundled-browser Open the included browser on the Ares URL                                             [boolean]\n" +
		"  -p, --port        b   port (o) local IP port of the express server (default: 9009, 0: dynamic)              [default: '9009']\n" +
		"  -H, --host        b   host to bind the express server onto                                                  [default: '127.0.0.1']\n" +
		"  -a, --listen_all  b   When set, listen to all adresses. By default, listen to the address specified with -H [boolean]\n" +
		"  -c, --config      b   IDE configuration file                                                                [default: './ide.json']\n" +
		"  -l, --level       b   IDE debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error')                 [default: 'http']\n" +
		"  -L, --log         b   Log IDE debug to ./ide.log                                                            [boolean]\n");
	process.exit(0);
}

/**********************************************************************/

var log = npmlog;
log.heading = 'ares';
log.level = 'http';

log.level = argv.level || 'http';
if (argv.log) {
	log.stream = fs.createWriteStream('ide.log');
}

versionTools.setLogger(log);
if (argv.version) {
	versionTools.showVersionAndExit();
}

versionTools.checkNodeVersion();		// Exit in case of error

function m() {
	var arg, msg = '';
	for (var argi = 0; argi < arguments.length; argi++) {
		arg = arguments[argi];
		if (typeof arg === 'object') {
			msg += util.inspect(arg);
		} else {
			msg += arg;
		}
			msg += ' ';
	}
	return msg;
}

log.info('main', m("Arguments:", argv));

/**********************************************************************/

// Exit path

process.on('uncaughtException', function (err) {
	log.error('main', err.stack);
	process.exit(1);
});
process.on('exit', onExit);
process.on('SIGINT', onExit);

// Load IDE configuration & start per-project file servers

var ide = {};
var subProcesses = [];
var platformVars = [
	{regex: /@NODE@/, value: process.argv[0]},
	{regex: /@CWD@/, value: process.cwd()},
	{regex: /@INSTALLDIR@/, value: myDir},
	{regex: /@HOME@/, value: process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']}
];

var platformOpen = {
	win32: [ "cmd" , '/c', 'start' ],
	darwin:[ "open" ],
	linux: [ "xdg-open" ]
};

var bundledBrowser = {
	win32: [ path.resolve ( myDir + "../../../chromium/" + "chrome.exe" ) ],
	darwin:[ path.resolve ( myDir + "../../../../bin/chromium/" + "Chromium.app" ), "--args" ],
	linux: [ path.resolve ( myDir + "../../../../bin/chromium/" + "chrome" ) ]
};

var configPath, tester;
var configStats;
var serviceMap = {};

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

	log.verbose('loadMainConfig()', "Loading ARES configuration from '"+configFile+"'...");
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

function getObjectType(object) {
	return util.isArray(object) ? "array" : typeof object;
}

function mergePluginConfig(service, newdata, configFile) {
	log.verbose('mergePluginConfig()', "Merging service '" + (service.name || service.id) + "' to ARES configuration");
	try {
		for(var key in newdata) {
			var srcType = getObjectType(service[key]);
			var dstType = getObjectType(newdata[key]);

			if (srcType === 'undefined') {
				service[key] = newdata[key];
			} else if (srcType !== dstType) {
				throw "Incompatible elements '" + key + "'. Unable to merge " + configFile;
			} else if (srcType === 'array') {
				for(var idx = 0; idx < newdata[key].length; idx++) {
					service[key].push(newdata[key][idx]);
				}
			} else if (srcType === 'object') {
				for(var subkey in newdata[key]) {
					log.verbose('mergePluginConfig()', "Adding or replacing " + subkey + " in " + key);
					service[key][subkey] = newdata[key][subkey];
				}
			} else {
				service[key] = newdata[key];
			}
		}

		log.verbose('mergePluginConfig()', "Merged service: " + JSON.stringify(service, null, 2));
	} catch(err) {
		log.warn('mergePluginConfig()', err);
		throw new Error("Unable to merge '" + configFile + "'");
	}
}

function appendPluginConfig(configFile) {
	log.verbose('appendPluginConfig()', "Loading ARES plugin configuration from '"+configFile+"'...");
	var pluginDir = path.dirname(configFile);
	log.verbose('appendPluginConfig()', 'pluginDir:', pluginDir);

	var pluginData,
	    configContent = fs.readFileSync(configFile, 'utf8');
	try {
		pluginData = JSON.parse(configContent);
	} catch(e) {
		throw "Improper JSON in " + configFile + " : "+configContent;
	}
	
	// The service in the plugin configuration file that is both
	// active and has a defined 'type` property is the main
	// plugin.
	var pluginService = pluginData.services.filter(function(service) {
		return service.active && service.type;
	})[0];
	var pluginUrl = '/res/plugins/' + pluginService.id;
	log.verbose('appendPluginConfig()', 'pluginUrl:', pluginUrl);

	pluginService.pluginDir = pluginDir;
	pluginService.pluginUrl = pluginUrl;

	pluginData.services.forEach(function(service) {
		// Apply regexp to all properties
		substVars(service, [
			{regex: /@PLUGINDIR@/, value: pluginDir},
			{regex: /@PLUGINURL@/, value: pluginUrl}
		]);
		if (serviceMap[service.id]) {
			mergePluginConfig(serviceMap[service.id], service, configFile);
		} else {
			log.verbose('appendPluginConfig()', "Adding new service '" + service.name + "' to ARES configuration");
			ide.res.services.push(service);
			serviceMap[service.id] = service;
		}
	});
}

function loadPluginConfigFiles() {
	var modDir, nPlugins = 0;

	// Build a service map to merge the plugin services later on
	ide.res.services.forEach(function(entry) {
		serviceMap[entry.id] = entry;
	});

	// After 'npm install', 'ares-ide' & its potential plugins are
	// located into the same folder named 'node_modules', so we
	// first try this runtime configuration.  If not found, we
	// revert to the development one (look for plugins into under
	// the 'ares-project/node_modules').
	modDir = path.resolve(myDir, "..");
	if (path.basename(modDir) !== 'node_modules') {
		modDir = path.join(myDir, 'node_modules');
	}
	log.info('loadPluginConfigFiles()', "loading plugins from '" + modDir + "'");

	// Find and load the plugins configuration, sorted in folder
	// names lexicographical order.
	var directories = fs.readdirSync(modDir).sort();
	directories.forEach(function(directory) {
		var filename = path.join(modDir, directory, 'ide-plugin.json');
		if (fs.existsSync(filename)) {
			nPlugins++;
			log.info('loadPluginConfigFiles()', "loading '" + directory + "/ide-plugin.json'");
			appendPluginConfig(filename);
		}
	});
	log.info('loadPluginConfigFiles()', "loaded " + nPlugins + " plugins");
}

loadMainConfig(configPath);
loadPluginConfigFiles();

// configuration age/date is the UTC configuration file last modification date
ide.res.timestamp = configStats.atime.getTime();
log.verbose('main', ide.res);

function handleMessage(service) {
	return function(msg) {
		if (msg.protocol && msg.host && msg.port && msg.origin && msg.pathname) {
			service.dest = msg;
			log.info(service.id , m("will proxy to service.dest:", service.dest));
			service.origin = 'http://' + argv.host + ':' + argv.port;
			service.pathname = '/res/services/' + service.id;

			if (service.origin.match(/^https:/)) {
				log.http(service.id, "connect to <"+service.origin+"> to accept SSL certificate");
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
				log.http(service.id, "POST /config response.status=" + cres.statusCode);
			}).on('error', function(e) {
				throw e;
			});
			creq.write(JSON.stringify({config: service}, null, 2));
			creq.end();
		} else {
			log.error(service.id, "Error updating service URL");
		}
	};
}

function serviceOut(service) {
	var line = "";
	return function(data){
		line += data.toString();
		if (line[line.length-1] === '\n') {
			log.http(service.id, line);
			line = "";
		}
	};
}

function serviceErr(service) {
	var line = "";
	return function(data){
		line += data.toString();
		if (line[line.length-1] === '\n') {
			log.warn(service.id, line);
			line = "";
		}
	};
}

function handleServiceExit(service) {
	return function(code, signal) {
		if (signal) {
			log.warn(service.id, "killed (signal="+signal+")");
		} else {
			log.warn(service.id, "abnormal exit (code="+code+")");
			if (service.respawn) {
				log.warn(service.id, "respawning...");
				startService(service);
			} else {
				log.error('handleServiceExit()', "*** Exiting...");
				process.exit(code);
			}
		}
	};
}

function substVars(data, vars) {
	var s;
	for(var key in data) {
		var pType = getObjectType(data[key]);
		if (pType === 'string') {
			s = data[key];
			s = substitute(s, vars);
			data[key] = s;
		} else if (pType === 'array') {
			substVars(data[key], vars);
		} else if (pType === 'object') {
			substVars(data[key], vars);
		}
		// else - Nothing to do (no substitution on non-string
		// properties)
	}
}

function substitute(s, vars) {
	vars.forEach(function(subst){
		s = s.replace(subst.regex,subst.value);
	});
	return s;
}

function startService(service) {
	// substitute platform variables
	substVars(service, platformVars);

	// prepare command
	var command = service.command;
	var params = [];
	var options = {
		stdio: ['ignore', 'pipe', 'pipe', 'ipc']
	};
	service.params.forEach(function(inParam){
		params.push(inParam);
	});
	if (service.verbose) {
		params.push('-v');
	}

	// run the command
	log.info(service.id, "executing '"+command+" "+params.join(" ")+"'");
	var subProcess = spawn(command, params, options);
	
	subProcess.stderr.on('data', serviceErr(service));
	subProcess.stdout.on('data', serviceOut(service));
	/*
	subProcess.stderr.pipe(process.stderr);
	subProcess.stdout.pipe(process.stdout);
	 */
	subProcess.on('exit', handleServiceExit(service));
	subProcess.on('message', handleMessage(service));
	subProcesses.push(subProcess);
}

function proxyServices(req, res, next) {
	log.verbose('proxyServices()', m("req.params:", req.params, ", req.query:", req.query));
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
			(req.params[0] ? '/' + encodeURI(req.params[0]) : '') +
			'?' + querystring.stringify(query),
		// request method
		method: req.method,
		// headers to send
		headers: req.headers
	};
	log.verbose('proxyServices()', m("options:", options));

	var creq = http.request(options, function(cres) {
		// transmit every header verbatim, but cookies
		log.verbose('proxyServices()', m("cres.headers:", cres.headers));
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
	log.silly('translateCookie()', m("cookie.path:", oldPath, "->", cookie.options.path));
	log.silly('translateCookie()', m("set-cookie:", cookie));
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
		log.silly("parseSetCookie()", m("tokens:", tokens));
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
			log.silly("parseSetCookie()", m("outCookie:", outCookie));
			outCookies.push(outCookie);
		} else {
			log.silly("parseSetCookie()", m("Invalid Set-Cookie header:", namevalStr));
		}
	});
	log.silly("parseSetCookie()", m("outCookies:", outCookies));
	return outCookies;
}

function onExit() {
	if (subProcesses.length > 0) {
		log.info('onExit()', 'Terminating sub-processes...');
		subProcesses.forEach(function(subproc) {
			process.kill(subproc.pid, 'SIGINT');
		});
		subProcesses = [];
		log.info('onExit()', 'Exiting...');
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

var app, server;
if (express.version.match(/^2\./)) {
	// express-2.x
	app = express.createServer();
	server = app;
} else {
	// express-3.x
	app = express();
	server = http.createServer(app);
}

function cors(req, res, next) {
	/*
	 * - Lowercase HTTP headers, work-around an iPhone bug
	 * - Overrriden by each individual service behind '/res/services/:service'
	 */
	res.header('access-control-allow-origin', '*' /*FIXME: config.allowedDomains*/);
	res.header('access-control-allow-methods', 'GET,POST');
	res.header('access-control-allow-headers', 'Content-Type');
	next();
}

app.configure(function(){

	app.use(cors);
	app.use(express.favicon(myDir + '/ares/assets/images/ares_48x48.ico'));

	app.use('/ide', express.static(enyojsRoot));
	app.use('/test', express.static(path.join(enyojsRoot, '/test')));

	app.use(express.logger('dev'));

	app.get('/', function(req, res, next) {
		log.http('main', "GET /");
		res.redirect('/ide/ares/');
	});
	app.get('/res/timestamp', function(req, res, next) {
		res.status(200).json({timestamp: ide.res.timestamp});
	});
	app.get('/res/services', function(req, res, next) {
		log.http('main', m("GET /res/services:", ide.res.services));
		res.status(200).json({services: ide.res.services});
	});
	app.all('/res/services/:serviceId/*', proxyServices);
	app.all('/res/services/:serviceId', proxyServices);

	// access to static files provided by the plugins
	ide.res.services.forEach(function(service) {
		if (service.pluginUrl && service.pluginDir) {
			log.verbose('app.configure()', service.pluginUrl + ' -> ' + service.pluginDir);
			app.use(service.pluginUrl, express.static(service.pluginDir));
		}
	});

	if (tester) {
		app.post('/res/tester', tester.setup);
		app['delete']('/res/tester', tester.cleanup);
	}
	
	/**
	 * Global error handler (last plumbed middleware)
	 * @private
	 */
	function errorHandler(err, req, res, next){
		log.error('errorHandler()', err.stack);
		res.status(500).send(err.toString());
	}

	// express-3.x: middleware with arity === 4 is
	// detected as the error handler
	app.use(errorHandler.bind(this));

	log.verbose('app.configure()', "done");
});

// Run non-regression test suite

var page = "index.html";
if (argv.runtest) {
	page = "test.html";
}

server.listen(argv.port, argv.listen_all ? null : argv.host, null /*backlog*/, function () {
	var tcpAddr = server.address();
	var url = "http://" + (argv.host || "127.0.0.1") + ":" + tcpAddr.port + "/ide/ares/" + page;
	var info;
	if (argv.browser) {
		// Open default browser
		info = platformOpen[process.platform] ;
		spawn(info[0], info.slice(1).concat([url]));
	} else if (argv['bundled-browser']) {
		// Open bundled browser
		info = platformOpen[process.platform].concat(bundledBrowser[process.platform]);
		spawn(info[0], info.slice(1).concat([url]));
	} else {
		log.http('main', "Ares now running at <" + url + ">");
	}
});

log.info('main', "Press CTRL + C to shutdown");
