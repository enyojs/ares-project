var stream = require('stream')
  , util = require('util')
  ;

var BufferedStreamToBase64 = function (limit) {
  if (typeof limit === 'undefined') {
    limit = Infinity;
  }
  this.limit = limit;
  // Since oddBytes saved can be up to 2 bytes, assume worst case and assume when there are no chunks there are still two bytes saved in oddBytes
  this.size = 2;
  this.oddBytes;
  this.chunks = [];
  this.writable = true;
  this.readable = true;
  this.paused = false;
}
util.inherits(BufferedStreamToBase64, stream.Stream);
BufferedStreamToBase64.prototype.pipe = function (dest, options) {
  var self = this
  if (self.resume) self.resume();
  stream.Stream.prototype.pipe.call(self, dest, options)
  //just incase you are piping to two streams, do not emit data twice.
  //note: you can pipe twice, but you need to pipe both streams in the same tick.
  //(this is normal for streams)
  if(this.piped)
    return dest

  process.nextTick(function () {
    self.emitAllBufferedChunks();
  })
  this.piped = true

  return dest
}
BufferedStreamToBase64.prototype.write = function (chunk) {
  if (!this.chunks.length && !this.paused) {
    this.emit('data', this.getBase64SizedChunk(chunk).toString('base64'));
    return;
  }
  this.chunks.push(chunk);
  this.size += chunk.length;
  if (this.limit < this.size) {
    this.pause();
  }
}
BufferedStreamToBase64.prototype.end = function () {
  if(!this.chunks.length && !this.paused) {
    // If there are any remaining data not encoded, we need to encode it and send it now
    if(Buffer.isBuffer(this.oddBytes)) {
      this.emit('data', this.oddBytes.toString('base64'));
    }

    // In case a pause is triggered after oddBytes been emitted, we can't end just yet
    if(this.paused) {
      this.ended = true;
    } else {
      this.emit('end');
    }
  } else {
    this.ended = true;
  }
}

if (!stream.Stream.prototype.pause) {
  BufferedStreamToBase64.prototype.pause = function() {
    this.paused = true;
    this.emit('pause');
  };
}
if (!stream.Stream.prototype.resume) {
  BufferedStreamToBase64.prototype.resume = function() {
    this.paused = false;
    this.emitAllBufferedChunks();
    this.emit('resume');
  };
}

BufferedStreamToBase64.prototype.getBase64SizedChunk = function (chunk) {
  // Ensure we are dealing with a buffer
  if(!Buffer.isBuffer(chunk)) {
    chunk = new Buffer(chunk);
  }

  // Add any oddBytes left from last write
  if(Buffer.isBuffer(this.oddBytes)) {
    // Calculate total length to optimize for performance (avoid unnecessary loop or array)
    chunk = Buffer.concat([this.oddBytes, chunk], this.oddBytes.length + chunk.length);
    this.oddBytes = undefined;
  }

  // Base64 encode three bytes at a time, thus, we want to calculate how many bytes to push to next write
  var remaining = chunk.length % 3;

  // Split data into one part which is possible to Base64 encode (without any empty encoding) and one part we wait to encode until next write
  if(remaining) {
    chunk = chunk.slice(0, chunk.length - remaining);
    this.oddBytes = chunk.slice(chunk.length - remaining);
  }

  return chunk;
};
BufferedStreamToBase64.prototype.emitAllBufferedChunks = function () {
  var self = this
    // Loop through all chunks and try to emit the data - return true if all chunks have been processed, otherwise false (if paused somewhere along the processing)
    , emitChunk = function () {
        if(self.paused) return false;

        var chunk = self.chunks.shift();

        if(!chunk) return true;

        self.size -= chunk.length;
        self.emit('data', self.getBase64SizedChunk(chunk).toString('base64'));
        return emitChunk();
      };

  if(emitChunk() && self.ended) {
    // If there are any remaining data not encoded, we need to encode it and send it now
    if(Buffer.isBuffer(this.oddBytes)) {
      this.emit('data', this.oddBytes.toString('base64'));
      // In case a pause is triggered after oddBytes been emitted, end here
      if(!self.paused) return;
    }
    self.emit('end');
  }
};

exports.BufferedStreamToBase64 = BufferedStreamToBase64;
