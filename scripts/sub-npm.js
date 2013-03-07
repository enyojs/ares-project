var path = require('path'),
    spawn = require('child_process').spawn;

var submodules = [
	'node_modules/phonegapbuildapi',
	'node_modules/unzip'
];

var mwd = process.cwd();

// pick every known arguments from the npm caller command
var argv = JSON.parse(process.env.npm_config_argv);
var args = argv.cooked.filter(function(cooked) {
	return argv.remain.filter(function(remain) {
		return (cooked === remain);
	}).length === 0;
});

function install() {
	var submodule = submodules.shift();
	var msg = 'cd ' + submodule + ' && npm ' + args.join(' ') + '...';
	if (!submodule) {
		process.exit(0);
	}
	console.log(msg);
	var outBuf = '', errBuf = '', child = spawn('npm', args, {
		cwd: path.resolve(mwd, submodule)
	});
	child.stdout.on('data', function(data) {
		outBuf += data.toString();
		var lines = outBuf.split('\n');
		outBuf = lines.pop(); // last element
		lines.forEach(function(line) {
			child.emit('line', line);
		});
	});
	child.stderr.on('data', function(data) {
		errBuf += data.toString();
		var lines = errBuf.split('\n');
		errBuf = lines.pop(); // last element
		lines.forEach(function(line) {
			child.emit('line', line);
		});
	});
	child.on('line', function(line) {
		console.log(submodule + ': ' + line);
	});
	child.on('exit', function(code, signal) {
		if (code !== 0) {
			console.error(msg + 'failed');
			process.exit(1);
		}
		console.log(msg + 'ok');

		install();
	});
}

install();
