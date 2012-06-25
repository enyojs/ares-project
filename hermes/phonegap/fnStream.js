var BufferedStream = require('bufferedstream'),
  streamer = require('streamer'),
	error = require('./errorHandler');

var s = { fn: Object.create(streamer) };

s.fn.pipe = function(source) {
	return function stream(next, stop) {
		source.on('data', next).on('error', stop).on('close', stop).on('end', stop);
	};
};

s.fn.pump = function(source) {
	var stream = new BufferedStream;
	
	process.nextTick(function() {
		source(function(data) {
			stream.write(data);
		}, function(err) {
			if (err) return stream.emit('error', err);
			
			stream.end();
		});
	});
	return stream;
};

module.exports = s;