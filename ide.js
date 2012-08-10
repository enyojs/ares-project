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
var project = {};
var backend = {};
var sub_processes = [];
var sub_process = null;

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

if (!ide.backends || !ide.backends[0]) {
	throw "Corrupted '"+configPath+"': no file backend defined";
}
for (var i = 0; i < ide.backends.length; i++) {
	console.log("--- Backend["+ide.backends[i].id+"]: "+JSON.stringify(ide.backends[i]));
}

if (!ide.workspace || !ide.workspace.projects || !ide.workspace.projects[0]) {
	throw "Corrupted '"+configPath+"': no project defined";
}
for (var j = 0; j < ide.workspace.projects.length; j++) {
	project = ide.workspace.projects[j];
	console.log("--- Project["+project.id+"]: "+JSON.stringify(project));
	for (var i = 0; i < ide.backends.length; i++) {
		if (project.backend_id === ide.backends[i].id) {
			backend = ide.backends[i];
			sub_process = spawn(backend.command, backend.params.concat(project.params));
			project.pid = sub_process.pid;
			console.log("--- Project["+project.id+"'] pid="+project.pid);
			sub_process.stderr.on('data', function(data){
				console.err("--- Project["+project.id+"]: *** "+data);
			});
			sub_process.stdout.on('data', function(data){
				console.log("--- Project["+project.id+"]: "+data);
				try {
					project.url = JSON.parse(data).url;
					console.info("Project ["+project.id+"]: connect to <"+project.url+"> to accept SSL certificate");
				} catch(e) {
				}
			});
			sub_processes.push(sub_process);
			break;
		}
	}
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
 	app.get('/res/config', function(req, res) {
		res.status(200).json({
			port: port+1
		});
	});
	app.get('/res/backends', function(req, res) {
		res.status(200).json(ide.backends);
	});
	app.get('/res/backends/:backend_id', function(req, res) {
		var backend_id = req.params.backend_id;
		var backend = null;
		for (var i = 0; i < ide.backends.length; i++) {
			if (ide.backends[i].id === backend_id) {
				backend = ide.backends[i];
				break;
			}
		}
		res.status(200).json(backend);
	});
	app.get('/res/projects', function(req, res) {
		res.status(200).json(ide.workspace.projects);
	});
	app.get('/res/projects/:project_id', function(req, res) {
		var project_id = req.params.project_id;
		var project = null;
		for (var i = 0; i < ide.workspace.projects.length; i++) {
			if (ide.projects[i].id === project_id) {
				project = ide.projects[i];
				break;
			}
		}
		res.status(200).json(project);
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
