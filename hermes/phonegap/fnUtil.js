var streamer = require('streamer'),
	error = require('./errorHandler');

var s = { fn: Object.create(streamer) };

s.fn.serialize = function(source) {
  var queue = [];
  
  return function stream(next, stop) {
    var processing = false,
      completed = false;
    
    source(function sourceNext(x) {
      if (processing) {
        queue.push(x)
        return
      }
      
      processing = true
      next(x, function() {
        processing = false
        if (queue.length){
          sourceNext(queue.shift())
        } else if (completed) {
          stop();
        }
      })
    }, error(stop)(function() {
      completed = true
    }))
  }
}

module.exports = s