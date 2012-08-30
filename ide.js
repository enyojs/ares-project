/**
 *  ARES IDE server
 */

var fs = require("fs"),
    path = require("path"),
    express = require(path.resolve(__dirname, "hermes/filesystem/node_modules/express")),
    util  = require('util'),
    spawn = require('child_process').spawn;

// Load IDE configuration & start per-project file servers

var ide = {};
var service = {};
var sub_processes = [];
var sub_process = null;
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
	ide.conf = JSON.parse(configContent);
} catch(e) {
	throw "Improper JSON: "+configContent;
}

if (!ide.conf.services || !ide.conf.services[0]) {
	throw "Corrupted '"+configPath+"': no storage services defined";
}

// configuration age/date is the UTC configuration file last modification date
ide.conf.timestamp = configStats.atime.getTime();
console.log("conf="+JSON.stringify(ide.conf));

// live resources inherit (prototypal) from configuration
ide.res = Object.create(ide.conf);

function ipc_message(service) {
	return function(msg) {
		console.log("message received: "+JSON.stringify(msg));
		try {
			service.url = msg.url;
			console.log("setting '" + service.id + "' url to "+service.url);
			if (service.url.match(/^https:/)) {
				console.info("Service['"+service.id+"']: connect to <"+service.url+"> to accept SSL certificate");
			}
		} catch (e) {
			console.log("Error updating URL for service "+service.id+": "+e);
		}
	};
}

function serviceEcho(service) {
	return function(data){
		console.error("--- Service['"+service.id+"']: "+data+"---");
	};
}

for (var i = 0; i < ide.res.services.length; i++) {
	console.log("--- Service["+ide.res.services[i].id+"]: "+JSON.stringify(ide.res.services[i]));
	service = ide.res.services[i];
	var command = platformSubst(service.command);
	var params = [];
	var options = {
		stdio: ['ignore', 'pipe', 'pipe', 'ipc']
	}
	service.params.forEach(function(inParam){
		params.push(platformSubst(inParam));
	});
	console.log("--- Service['"+service.id+"']: running '"+command+" "+params.join(" ")+"'");
	sub_process = spawn(command, params, options);
	sub_process.stderr.on('data', serviceEcho(service));
	sub_process.stdout.on('data', serviceEcho(service));
	sub_process.on('message', ipc_message(service));
	sub_processes.push(sub_process);
	break;
}

// Start the ide server

var enyojsRoot = path.resolve(__dirname, "..");
var app = express.createServer();

var port = parseInt(process.argv[2] || "9009", 10);
var addr = process.argv[3] || "127.0.0.1";

app.configure(function(){
	app.use('/ide', express.static(enyojsRoot + '/ares-project'));
	app.use('/enyo', express.static(enyojsRoot + '/enyo'));
	app.use('/lib', express.static(enyojsRoot + '/lib'));
	app.get('/conf', function(req, res) {
		res.status(200).json(ide.conf);
	});
	// app.get('/res/services', function(req, res) {
	// 	res.status(200).json(ide.res.services);
	// });
	// app.get('/res/services/:service_id', function(req, res) {
	// 	var service_id = req.params.service_id;
	// 	var service = null;
	// 	for (var i = 0; i < ide.res.services.length; i++) {
	// 		if (ide.res.services[i].id === service_id) {
	// 			service = ide.res.services[i];
	// 			break;
	// 		}
	// 	}
	// 	res.status(200).json(service);
	// });
});
app.listen(port, addr);

// Exit path

console.info("ARES IDE is now running at <http://" + addr + ":" + port + "/ide/ares/index.html> Press CTRL + C to shutdown");
process.on('exit', function () {
	console.log('Terminating sub-processes...');
	sub_processes.forEach(function(process) {
		process.kill();
	});
	console.log('Exiting...');
});
