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
	ide = JSON.parse(configContent);
} catch(e) {
	throw "Improper JSON: "+configContent;
}

if (!ide.services || !ide.services[0]) {
	throw "Corrupted '"+configPath+"': no file service defined";
}

function servicePortSetter(service) {
	return function(data){
		console.log("--- Service['"+service.id+"']: "+data);
		try {
			service.url = JSON.parse(data).url;
			if (service.url.match(/^https:/)) {
				console.info("Service['"+service.id+"']: connect to <"+service.url+"> to accept SSL certificate");
			}
		} catch(e) {
			//console.log("Error updating URL for service "+service.id+": "+e);
		}
	};
}

function serviceEcho(service) {
	return function(data){
		console.error("-E- Service['"+service.id+"']: *** "+data);
	};
}

for (var i = 0; i < ide.services.length; i++) {
	console.log("--- Service["+ide.services[i].id+"]: "+JSON.stringify(ide.services[i]));
	service = ide.services[i];
	var command = platformSubst(service.command);
	var params = [];
	service.params.forEach(function(inParam){
		params.push(platformSubst(inParam));
	});
	console.log("--- Service['"+service.id+"']: running '"+command+" "+params.join(" ")+"'");
	sub_process = spawn(command, params);
	sub_process.stderr.on('data', serviceEcho(service));
	sub_process.stdout.on('data', servicePortSetter(service));
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
	app.get('/res/services', function(req, res) {
		res.status(200).json(ide.services);
	});
	app.get('/res/services/:service_id', function(req, res) {
		var service_id = req.params.service_id;
		var service = null;
		for (var i = 0; i < ide.services.length; i++) {
			if (ide.services[i].id === service_id) {
				service = ide.services[i];
				break;
			}
		}
		res.status(200).json(service);
	});
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
