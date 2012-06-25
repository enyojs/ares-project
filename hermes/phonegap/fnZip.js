var streamer = require('streamer')
	, zipstream = require('zipstream')
	, BufferedStream = require('bufferedstream')
	, fnStream = require('./fnStream')
	, fnUtil = require('./fnUtil')
	, error = require('./errorHandler')

var s = { fn: Object.create(streamer) }

for (var i in fnStream.fn) {
	if (typeof s.fn[i] === 'undefined') {
		s.fn[i] = fnStream.fn[i]
	}
}
fnStream.fn = s.fn

for (var i in fnUtil.fn) {
	if (typeof s.fn[i] === 'undefined') {
		s.fn[i] = fnUtil.fn[i]
	}
}
fnUtil.fn = s.fn

s.fn.zip = function(entries) {
	return function stream(next, stop) {
		var zip = zipstream.createZip({level: 1})
		s.fn.pipe(zip)(next, stop)
		
		s.fn.serialize(entries)(function(entry, next) {
			console.log('Zipping: ', entry.path)
			var bufferedStream = new BufferedStream()
			zip.addFile(bufferedStream, {name: entry.path},	next)
			bufferedStream.write(entry.content || '')
			bufferedStream.end()
		}, error(stop)(function(err) {
			console.log('Finalizing.')
			zip.finalize()
		}))
	}
}

module.exports = s