var path = require('path')
  , streamer = require('streamer')
  , error = require('./errorHandler')
  , fnFs = require('./fnFs')
  , _ = require('../lib/_')

var s = { fn: Object.create(streamer) }

for (var i in fnFs.fn) {
  if (typeof s.fn[i] === 'undefined') {
    s.fn[i] = fnFs.fn[i]
  }
}
fnFs.fn = s.fn

s.fn.ls = function ls(inList) {
  return function(inPath) {
    return function stream(next, stop) {
      console.log('ls\'ing: ', inPath)
      
      inList(inPath, error(stop)(function(entries) {
        var entry
        console.log('ls\'d: ', inPath, entries.contents)
        while (entry = entries.contents.shift()) {
          next({
            path: path.join(inPath, path.basename(entry.path)),
            toString: function() {return this.path},
            isDir: entry.isDir
          })
        }
        stop()
      }))
    }
    
  }
}

s.fn.get = function get(inReadFile) {
  return function(inPath) {
    return function stream(next, stop) {
      console.log('get\'ing: ', inPath)
      
      inReadFile(inPath, error(stop)(function(data) {
        console.log('got: ', inPath)
        next({path: inPath, content: data})
        stop()
      }))
    }
  }
}

s.fn.gettree = function (inLs, inGet, inLstree, inDirs, inFiles) {
  return function(inPath) {
    console.log('gettree, inPath: ', inPath)
    var entries = inLs(inPath)
    var nested = s.fn.merge(s.fn.map(inLstree, s.fn.map(function(entry) {
      return entry.path
    }, inDirs(entries))))
    return s.fn.merge(s.fn.map(inGet, s.fn.map(function(entry) {
      return entry.path
    }, s.fn.merge(s.fn.map(inFiles, s.fn.list(entries, nested))))))
  }
}

module.exports = s
