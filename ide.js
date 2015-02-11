#!/usr/bin/env node
/* jshint node:true */
/*global setImmediate,require,process*/
/**
 *  ARES IDE server
 */

var fs = require("fs"),
    path = require("path"),
    createDomain = require('domain').create,
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
	"timeout":         Number,
	"listen_all":      Boolean,
	"dev-mode":        Boolean,
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
	"D": ["--dev-mode"],
	"t": ["--timeout"],
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
argv.timeout = argv.timeout || (4*60*1000);	//default: 4 minutes.
	
if (process.env['ARES_BUNDLE_BROWSER'] && !argv['bundled-browser']) {
	delete process.env['ARES_BUNDLE_BROWSER'];
}

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
		"  -D, --dev-mode        Load non-minified version of Ares and Enyo for Ares debug and development             [boolean]\n" +
		"  -p, --port        b   port (o) local IP port of the express server (default: 9009, 0: dynamic)              [default: '9009']\n" +
		"  -H, --host        b   host to bind the express server onto                                                  [default: '127.0.0.1']\n" +
		"  -t, --timeout     b   milliseconds of inactivity before a server socket is presumed to have timed out       [default: '240000']\n" +
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

var configPath, tester;
var configStats;
var aresAboutData;
var serviceMap = {};

if (argv.runtest) {
	tester = require('./test/tester/main.js');
	configPath = path.resolve(myDir, "ide-test.json");
} else{
	configPath = argv.config;
}
function checkFile(inFile) {
	var fileStats;
	if (!fs.existsSync(inFile)) {
		throw new Error("Did not find: '"+inFile+"': ");
	}

	fileStats = fs.lstatSync(inFile);
	if (!fileStats.isFile()) {
		throw new Error("Not a file: '"+inFile+"': ");
	}
	return fileStats;
}

function loadMainConfig(configFile) {
	configStats = checkFile(configFile);
	log.verbose('loadMainConfig()', "Loading ARES configuration from '" + configFile + "'...");
	var configContent = fs.readFileSync(configFile, 'utf8');
	try {
		ide.res = JSON.parse(configContent);
	} catch(e) {
		throw "Improper JSON: "+configContent;
	}

	if (!ide.res.services || !ide.res.services[0]) {
		throw new Error("Corrupted '"+configFile+"': no storage services defined");
	}
}
function loadPackageConfig() {
	var packagePath = path.resolve(myDir, "package.json");
	checkFile(packagePath);
	var packageContentJSON = fs.readFileSync(packagePath, 'utf8');
	try {	
		var packageContent = JSON.parse(packageContentJSON);
		aresAboutData = {
			"version": packageContent.version,
			"bugReportURL": packageContent.bugs.url, 
			"license": packageContent.license,
			"projectHomePage": packageContent.homepage
		};
		
	} catch(e) {
		throw new Error("Improper JSON: " + packagePath);
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

	var pluginData, configContent;
	try {
		configContent = fs.readFileSync(configFile, 'utf8');
		pluginData = JSON.parse(configContent);
	} catch(e) {
		throw new Error("Unable to load or JSON-parse '" + configFile + "' (" + e.toString() + ")");
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


/**
 * load proxy from environment in each service (only if proxy is
 * missing from original config)
 */
function loadProxyFromEnv() {
	ide.res.services.forEach(function(s){
		if (! s.proxyUrl) {
			s.proxyUrl = ide.res.globalProxyUrl || process.env.https_proxy || process.env.http_proxy;
		}
	});
}

loadMainConfig(configPath);
loadPluginConfigFiles();

loadPackageConfig();

loadProxyFromEnv();

// File age/date is the UTC configuration file last modification date
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
			log.http(service.id, "POST /config");
			var creq = http.request(options, function(cres) {
				log.http(service.id, "POST /config", cres.statusCode);
			}).on('error', function(e) {
				throw e;
			});
			log.verbose(service.id, "config:", service);
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

var unproxyfiableHeaders = [
	"Access-Control-Allow-Methods", 
	"Access-Control-Allow-Headers", 
	"Access-Control-Allow-Origin", 
	"Access-Control-Expose-Headers"
];

function proxyServices(req, res, next) {
	log.verbose('proxyServices()', m("req.params:", req.params, ", req.query:", req.query));
	var query = {},
	    id = req.params.serviceId,
	    service = ide.res.services.filter(function(service) {
		    return service.id === id;
	    })[0];
	if (!service) {
		setImmediate(next, new HttpError('No such service: ' + id, 403));
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

	// ENYO-3634: if we proxyfy a CORS request, it's not CORS anymore between ARES and proxyfied service
	// so we remove CORS request headers (note that OPTIONS requests should never make it to here!)
	if (options.headers && options.headers.origin) {
		delete options.headers.origin;
	}

	var creq = http.request(options, function(cres) {
		// transmit every header verbatim, but cookies
		log.verbose('proxyServices()', m("cres.headers:", cres.headers));
		for (var key in cres.headers) {
			var val = cres.headers[key];
			if (key.toLowerCase() === 'set-cookie') {
				// re-write cookies
				var cookies = parseSetCookie(val);
				cookies.forEach(translateCookie.bind(this, service, res));
			} else {
				// ENYO-3634 / CORS is the sole responsibility of the ARES server when services are proxified
				// therefore should the service have fixed CORS headers, they are ignored.
				if (unproxyfiableHeaders.indexOf(key) === -1) {
					res.header(key, val);
				}
			}
		}
		res.writeHead(cres.statusCode);
		cres.pipe(res);
	}).on('error', function(e) {
		log.error('proxyServices()', "options:", options);
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
	process.exit(0);
}

ide.res.services.filter(function(service){
	return service.active;
}).forEach(function(service){
	if (service.command) {
		startService(service);
	}
});

// Start the ide server

var app = express(),
    server = http.createServer(app);

/**
 * Ares server timeout is defined as the maximum value of services timeout attributes.
 * @param  {integer} inTimeout default value of the server timeout.
 */
function defineServerTimeout(inTimeout) {

	var timeout = inTimeout;

	for (var key in ide.res.services) {

		if (ide.res.services[key].timeout !== undefined && 
			ide.res.services[key].timeout > inTimeout) {
			timeout = ide.res.services[key].timeout;
		}
	}
	
	log.verbose("Timeout between main server and its children is set to : ", timeout ," (ms)");
	server.setTimeout(timeout);
}


defineServerTimeout(argv.timeout);

// over-write CORS headers using the configuration if
// any, otherwise be paranoid.

var corsHeaders,
    allowedMethods = ['GET', 'PUT', 'POST', 'DELETE'],
    exposedHeaders = ['x-content-type'],
    allowedHeaders = ['Content-Type','Authorization','Cache-Control','X-HTTP-Method-Override'];

function setCorsHeaders(req, res, next) {
	var cors = ide.res.cors || {};
	var origins = (Array.isArray(cors.origins) && cors.origins.length > 0 && cors.origins);

	// one time setup - allowed methods and headers don't change per request
	if (!corsHeaders) {
		var methods = Array.isArray(cors.methods) && cors.methods,
		    headers = Object.keys(ide.res.headers || {});
		corsHeaders = {};
		corsHeaders['Access-Control-Allow-Methods'] = allowedMethods.concat(methods).join(',');
		corsHeaders['Access-Control-Allow-Headers'] = allowedHeaders.concat(headers).join(',');
		corsHeaders['Access-Control-Expose-Headers'] = exposedHeaders.concat(headers).join(',');
		corsHeaders['Access-Control-Max-Age'] = '86400';
		corsHeaders['Access-Control-Allow-Credentials'] = 'true';
		log.info("setCorsHeaders()", "CORS will use:", corsHeaders);
	}

	// request time: is this a CORS request? [CLUE: if yes, there's an origin]
	if (req.headers && req.headers.origin) {
		if (origins.indexOf("*") !== -1) {
			corsHeaders['Access-Control-Allow-Origin'] = "*";
		} else {
			if (origins.indexOf(req.headers.origin) !== -1) {
				corsHeaders['Access-Control-Allow-Origin'] = req.headers.origin;
			} else {
				corsHeaders['Access-Control-Allow-Origin'] = "";
			}
		}
		for (var h in corsHeaders) {
			log.silly("setCorsHeaders()", h, ":", corsHeaders[h]);
			// Lowercase HTTP headers, work-around an iPhone bug
			res.header(h.toLowerCase(), corsHeaders[h]);
		}
	} 
	if ('OPTIONS' === req.method) {
		res.status(200).end();
	} else {
		setImmediate(next);
	}
}

function setUserHeaders(req, res, next) {
	var headers = ide.res.headers || {};
	for (var k in headers) {
		var v = headers[k];
		log.silly('setUserHeaders()', "adding:", k, ":", v);
		res.header(k, v);
	}
	setImmediate(next);
}

app.configure(function(){

	/*
	 * Error Handling - Wrap exceptions in delayed handlers
	 */
	app.use(function _useDomain(req, res, next) {
		var domain = createDomain();
		
		domain.on('error', function(err) {
			next(err);
			domain.dispose();
		});
		
		domain.enter();
		setImmediate(next);
	});

	app.use(setCorsHeaders);
	app.use(setUserHeaders);

	app.use(express.favicon(myDir + '/assets/images/ares_48x48.ico'));

	["preview", "ide"].forEach(function(client) {
		var dir = path.resolve(myDir, "_ares");
		if (argv['dev-mode'] || !fs.existsSync(dir)) {
			dir = myDir;
		}
		log.info("main", "Loading url: /" + client + " from folder:", dir);
		app.use('/' + client, express.static(dir));
		app.use('/' + client + '/lib', express.static(path.join(myDir, 'lib')));
		app.use('/' + client + '/assets', express.static(path.join(myDir, 'assets')));
	});

	app.use('/test', express.static(path.join(myDir, '/test')));

	app.use(express.logger('dev'));

	// Real home is '/ide/'
	app.get('/', function(req, res, next) {
		log.http('main', "GET /");
		res.redirect(req.url.replace(/$|\?/,"ide/$&"));
	});
	// Compatibility redirection to not invalidate bookmarks to
	// former home.
	app.get('/ide/ares*', function(req, res, next) {
		log.http('main', "GET /ide/ares*");
		res.redirect(req.url.replace(/ares($|\/|\?)/,""));
	});

	app.get('/res/timestamp', function(req, res, next) {
		res.status(200).json({timestamp: ide.res.timestamp});
	});
	app.get('/res/services', function(req, res, next) {
		log.verbose('main', m("GET /res/services:", ide.res.services));
		res.status(200).json({services: ide.res.services});
	});
	app.get('/res/aboutares', function(req, res, next) {		
		res.status(200).json({aboutAres: aresAboutData});
	});
	app.get('/res/language', function(req, res, next) {
		log.verbose('main', m("GET /res/language:", ide.res.language));		
		res.status(200).json({language: ide.res.language});
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
var origin, url;

server.listen(argv.port, argv.listen_all ? null : argv.host, null /*backlog*/, function () {
	var tcpAddr = server.address(),
	    info;
	origin = "http://" + (argv.host || "127.0.0.1") + ":" + tcpAddr.port;
	url = origin + "/ide/" + page;
	if (argv.browser) {
		// Open default browser
		info = platformOpen[process.platform] ;
		spawn(info[0], info.slice(1).concat([url]));
	} else if (argv['bundled-browser']) {
		// Open bundled browser
		var bundledBrowser = process.env['ARES_BUNDLE_BROWSER'];
		info = platformOpen[process.platform];
		if (bundledBrowser) {
			if (process.platform === 'win32') {
				info.splice(2, 1); // delete 'start' command
			}
			info = info.concat([bundledBrowser, '--args']);
		} 
		spawn(info[0], info.slice(1).concat([url]));
	} else {
		log.http('main', "Ares now running at <" + url + ">");
	}
});

log.info('main', "Press CTRL + C to shutdown");
