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
    util  = require('util'),
    spawn = require('child_process').spawn;

// Load IDE configuration & start per-project file servers

var ide = {};
var service = {};
var subProcesses = [];
var platformVars = [
	{regex: /@NODE@/, value: process.argv[0]},
	{regex: /@HOME@/, value: process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']}
];
function platformSubst(inStr) {
	var outStr = inStr;
	platformVars.forEach(function(subst){
		outStr = outStr.replace(subst.regex,subst.value);
	});
	return outStr;
}

var configPath = process.argv[2] || path.resolve(__dirname, "ide.json");
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
		try {
			service.url = msg.url;
			if (service.url.match(/^https:/)) {
				console.info("Service['"+service.id+"']: connect to <"+service.url+"> to accept SSL certificate");
			}
		} catch (e) {
			console.error("Error updating URL for service "+service.id+": "+e);
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
	console.log("> Service['"+service.id+"']: executing '"+command+" "+params.join(" ")+"'");
	var subProcess = spawn(command, params, options);
	subProcess.stderr.on('data', serviceEcho(service));
	subProcess.stdout.on('data', serviceEcho(service));
	subProcess.on('exit', handleServiceExit(service));
	subProcess.on('message', handleMessage(service));
	subProcesses.push(subProcess);
}

ide.res.services.filter(function(service){
	return service.active;
}).forEach(function(service){
	startService(service);
});

// Start the ide server

var enyojsRoot = path.resolve(__dirname,".");
var app = express.createServer();

var port = parseInt(process.argv[2] || "9009", 10);
var addr = process.argv[3] || "127.0.0.1";

app.configure(function(){
	app.use('/ide', express.static(enyojsRoot + '/'));
	app.use('/', express.static(enyojsRoot + '/ares'));
	app.use('/enyo', express.static(enyojsRoot + '/enyo'));
	app.use('/lib', express.static(enyojsRoot + '/lib'));
	app.get('/res/timestamp', function(req, res) {
		res.status(200).json({timestamp: ide.res.timestamp});
	});
	app.get('/res/services', function(req, res) {
		res.status(200).json({services: ide.res.services});
	});
	app.get('/res/services/:service_id', function(req, res) {
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
});
app.listen(port, addr);

// Exit path

console.info("ARES IDE is now running at <http://" + addr + ":" + port + "/ide/ares/index.html> Press CTRL + C to shutdown");
process.on('exit', function () {
	console.log('Terminating sub-processes...');
	subProcesses.forEach(function(process) {
		process.kill();
	});
	console.log('Exiting...');
});
