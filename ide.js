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
    express = require(path.resolve(__dirname, "hermes/filesystem/node_modules/express")),
    optimist = require(path.resolve(__dirname, "hermes/node_modules/optimist")),
    util  = require('util'),
    spawn = require('child_process').spawn,
    querystring = require("querystring"),
    http = require('http');

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
	.options('c', {
		alias : 'config',
		description: 'IDE configuration file',
		default: path.resolve(__dirname, "ide.json")
	})
	.argv;

if (argv.help) {
	optimist.showHelp();
	process.exit(0);
}

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

console.info("Loading ARES configuration from '"+configPath+"'...");
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
console.dir(ide.res);

function handleMessage(service) {
	return function(msg) {
		if (msg.protocol && msg.host && msg.port && msg.origin && msg.pathname) {
			service.dest = msg;
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
	debugger;			// XXX
	console.dir(req.params);
	console.dir(req.query);
	var query = {},
	    id = req.params.service_id,
	    service = ide.res.services.filter(function(service) {
		    return service.id === id;
	    })[0];
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
		path:   service.dest.pathname + '/' + req.params[0] + '?' + querystring.stringify(query),
		// request method
		method: req.method,
		// headers to send
		headers: req.headers
	};

	var creq = http.request(options, function(cres) {
		for (var header in cres.headers) {
			res.header(header, cres.headers[header]);
		}
		res.writeHead(cres.statusCode);
		cres.pipe(res);
	}).on('error', function(e) {
		next(e);
	});
	creq.end();
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
	app.use('/enyo', express.static(enyojsRoot + '/enyo'));
	app.use('/lib', express.static(enyojsRoot + '/lib'));
	app.use('/test', express.static(enyojsRoot + '/test'));

	app.use(express.logger('dev'));

	app.get('/', function(req, res, next) {
		res.redirect('/ide/ares/');
	});

	app.get('/res/timestamp', function(req, res, next) {
		res.status(200).json({timestamp: ide.res.timestamp});
	});
	app.get('/res/services', function(req, res, next) {
		//var exdate=new Date();
		//exdate.setDate(exdate.getDate() + 10);
		
		//res.cookie('remember', '1', { path: '/', expires: exdate, httpOnly: true });

		res.status(200).json({services: ide.res.services});
	});
	app.get('/res/services/:service_id', function(req, res, next) {
		var serviceId = req.params.serviceId;
		var service = null;
		for (var i = 0; i < ide.res.services.length; i++) {
			if (ide.res.services[i].id === serviceId) {
				service = ide.res.services[i];
				break;
			}
		}
		res.status(200).json({service: service});
	});
	app.all('/res/services/:service_id/*', proxyServices);

});
app.listen(port, addr);

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
	var errMsg = err.toString() + err.stack;
	console.error(errMsg);
	process.exit(1);
});
process.on('exit', function () {
	console.log('Terminating sub-processes...');
	subProcesses.forEach(function(process) {
		process.kill();
	});
	console.log('Exiting...');
});
