var pathLib = require('path')
	, streamer = require('streamer')
	, s = { fn: Object.create(streamer) }

s.fn.paths = function paths(inLs) {
	return function(path) {
		return s.fn.map(function(entry) {
			entry.path = pathLib.join(path, pathLib.basename(entry.path))
			return entry
		}, inLs(path))
	}
}

s.fn.dirs = function dirs(inIsDir) {
	return function (entries) { 
		return s.fn.filter(function(entry) {
			return inIsDir(entry)
		}, entries)
	}
}

s.fn.files = function files(inIsDir) {
	return function (entries) {
		return s.fn.filter(function(entry) {
			return !inIsDir(entry)
		}, entries)
	}
}

s.fn.lstree = function lstree(inPaths, inDirs, inFiles) {
	return function _lstree(path) {
		console.log('lstree: ', path)
		var entries = inPaths(path)
			, nested = s.fn.merge(s.fn.map(_lstree, s.fn.map(function(entry) {
					return entry.path
				}, inDirs(entries))))
		return s.fn.merge(s.fn.map(inFiles, s.fn.list(entries, nested)))
	}
}

module.exports = s