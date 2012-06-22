var pump = require('./fnStream').fn.pump
	, s = require('./fnHermes')
	, zip = require('./fnZip').fn.zip

function ZipStreamRequest(inReadFile, inList) {
	return function(inPath) {
		var isDir = function(entry) {
				return entry.isDir === true
			}
			, dirs = s.fn.dirs(isDir)
			, ls = s.fn.ls(inList)
			, get = s.fn.get(inReadFile)
			, paths = s.fn.paths(ls)
			, files = s.fn.files(isDir)
			, gettree = s.fn.gettree(ls, get, s.fn.lstree(ls, dirs, files), dirs, files)
			, tree = s.fn.map(function(entry) {
						entry.path = entry.path.replace(inPath, '')
						return entry
					}
				, gettree(inPath))

		return pump(zip(tree))
	}
}

module.exports = ZipStreamRequest;
