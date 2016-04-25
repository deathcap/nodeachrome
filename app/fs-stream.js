'use strict';

// Node.js fs API streams
//
// https://nodejs.org/api/fs.html

const Writable = require('stream').Writable;
const Readable = require('stream').Readable;
const util = {inherits: require('inherits')};
module.exports = (fs) => {

// based on node.js:
// https://github.com/nodejs/node/blob/master/lib/fs.js
// https://github.com/nodejs/node/blob/627524973a22c584fdd06c951fbe82364927a1ed/lib/fs.js#L1777
// TODO: can this be moved to a module or refactored elsewhere somehow?

var pool;

const kMinPoolSpace = 128;

function allocNewPool(poolSize) {
  pool = Buffer.allocUnsafe(poolSize);
  pool.used = 0;
}


fs.createReadStream = function(path, options) {
  return new ReadStream(path, options);
};

util.inherits(ReadStream, Readable);
fs.ReadStream = ReadStream;

function ReadStream(path, options) {
  if (!(this instanceof ReadStream))
    return new ReadStream(path, options);

  if (options === undefined)
    options = {};
  else if (typeof options === 'string')
    options = { encoding: options };
  else if (options === null || typeof options !== 'object')
    throw new TypeError('"options" argument must be a string or an object');

  // a little bit bigger buffer and water marks by default
  options = Object.create(options);
  if (options.highWaterMark === undefined)
    options.highWaterMark = 64 * 1024;

  Readable.call(this, options);

  this.path = path;
  this.fd = options.fd === undefined ? null : options.fd;
  this.flags = options.flags === undefined ? 'r' : options.flags;
  this.mode = options.mode === undefined ? 0o666 : options.mode;

  this.start = options.start;
  this.end = options.end;
  this.autoClose = options.autoClose === undefined ? true : options.autoClose;
  this.pos = undefined;

  if (this.start !== undefined) {
    if (typeof this.start !== 'number') {
      throw new TypeError('"start" option must be a Number');
    }
    if (this.end === undefined) {
      this.end = Infinity;
    } else if (typeof this.end !== 'number') {
      throw new TypeError('"end" option must be a Number');
    }

    if (this.start > this.end) {
      throw new Error('"start" option must be <= "end" option');
    }

    this.pos = this.start;
  }

  if (typeof this.fd !== 'number')
    this.open();

  this.on('end', function() {
    if (this.autoClose) {
      this.destroy();
    }
  });
}

fs.FileReadStream = fs.ReadStream; // support the legacy name

ReadStream.prototype.open = function() {
  var self = this;
  fs.open(this.path, this.flags, this.mode, function(er, fd) {
    if (er) {
      if (self.autoClose) {
        self.destroy();
      }
      self.emit('error', er);
      return;
    }

    self.fd = fd;
    self.emit('open', fd);
    // start the flow of data.
    self.read();
  });
};

ReadStream.prototype._read = function(n) {
  if (typeof this.fd !== 'number')
    return this.once('open', function() {
      this._read(n);
    });

  if (this.destroyed)
    return;

  if (!pool || pool.length - pool.used < kMinPoolSpace) {
    // discard the old pool.
    pool = null;
    allocNewPool(this._readableState.highWaterMark);
  }

  // Grab another reference to the pool in the case that while we're
  // in the thread pool another read() finishes up the pool, and
  // allocates a new one.
  var thisPool = pool;
  var toRead = Math.min(pool.length - pool.used, n);
  var start = pool.used;

  if (this.pos !== undefined)
    toRead = Math.min(this.end - this.pos + 1, toRead);

  // already read everything we were supposed to read!
  // treat as EOF.
  if (toRead <= 0)
    return this.push(null);

  // the actual read.
  var self = this;
  fs.read(this.fd, pool, pool.used, toRead, this.pos, onread);

  // move the pool positions, and internal position for reading.
  if (this.pos !== undefined)
    this.pos += toRead;
  pool.used += toRead;

  function onread(er, bytesRead) {
    if (er) {
      if (self.autoClose) {
        self.destroy();
      }
      self.emit('error', er);
    } else {
      var b = null;
      if (bytesRead > 0)
        b = thisPool.slice(start, start + bytesRead);

      self.push(b);
    }
  }
};


ReadStream.prototype.destroy = function() {
  if (this.destroyed)
    return;
  this.destroyed = true;
  this.close();
};


ReadStream.prototype.close = function(cb) {
  var self = this;
  if (cb)
    this.once('close', cb);
  if (this.closed || typeof this.fd !== 'number') {
    if (typeof this.fd !== 'number') {
      this.once('open', close);
      return;
    }
    return process.nextTick(() => this.emit('close'));
  }
  this.closed = true;
  close();

  function close(fd) {
    fs.close(fd || self.fd, function(er) {
      if (er)
        self.emit('error', er);
      else
        self.emit('close');
    });
    self.fd = null;
  }
};


fs.createWriteStream = function(path, options) {
  return new WriteStream(path, options);
};

util.inherits(WriteStream, Writable);
fs.WriteStream = WriteStream;
function WriteStream(path, options) {
  if (!(this instanceof WriteStream))
    return new WriteStream(path, options);

  if (options === undefined)
    options = {};
  else if (typeof options === 'string')
    options = { encoding: options };
  else if (options === null || typeof options !== 'object')
    throw new TypeError('"options" argument must be a string or an object');

  options = Object.create(options);

  Writable.call(this, options);

  this.path = path;
  this.fd = options.fd === undefined ? null : options.fd;
  this.flags = options.flags === undefined ? 'w' : options.flags;
  this.mode = options.mode === undefined ? 0o666 : options.mode;

  this.start = options.start;
  this.autoClose = options.autoClose === undefined ? true : !!options.autoClose;
  this.pos = undefined;
  this.bytesWritten = 0;

  if (this.start !== undefined) {
    if (typeof this.start !== 'number') {
      throw new TypeError('"start" option must be a Number');
    }
    if (this.start < 0) {
      throw new Error('"start" must be >= zero');
    }

    this.pos = this.start;
  }

  if (options.encoding)
    this.setDefaultEncoding(options.encoding);

  if (typeof this.fd !== 'number')
    this.open();

  // dispose on finish.
  this.once('finish', function() {
    if (this.autoClose) {
      this.close();
    }
  });
}

fs.FileWriteStream = fs.WriteStream; // support the legacy name


WriteStream.prototype.open = function() {
  fs.open(this.path, this.flags, this.mode, function(er, fd) {
    if (er) {
      if (this.autoClose) {
        this.destroy();
      }
      this.emit('error', er);
      return;
    }

    this.fd = fd;
    this.emit('open', fd);
  }.bind(this));
};


WriteStream.prototype._write = function(data, encoding, cb) {
  if (!(data instanceof Buffer))
    return this.emit('error', new Error('Invalid data'));

  if (typeof this.fd !== 'number')
    return this.once('open', function() {
      this._write(data, encoding, cb);
    });

  var self = this;
  fs.write(this.fd, data, 0, data.length, this.pos, function(er, bytes) {
    if (er) {
      if (self.autoClose) {
        self.destroy();
      }
      return cb(er);
    }
    self.bytesWritten += bytes;
    cb();
  });

  if (this.pos !== undefined)
    this.pos += data.length;
};


function writev(fd, chunks, position, callback) {
  function wrapper(err, written) {
    // Retain a reference to chunks so that they can't be GC'ed too soon.
    callback(err, written || 0, chunks);
  }

  const req = new FSReqWrap();
  req.oncomplete = wrapper;
  binding.writeBuffers(fd, chunks, position, req);
}


WriteStream.prototype._writev = function(data, cb) {
  if (typeof this.fd !== 'number')
    return this.once('open', function() {
      this._writev(data, cb);
    });

  const self = this;
  const len = data.length;
  const chunks = new Array(len);
  var size = 0;

  for (var i = 0; i < len; i++) {
    var chunk = data[i].chunk;

    chunks[i] = chunk;
    size += chunk.length;
  }

  writev(this.fd, chunks, this.pos, function(er, bytes) {
    if (er) {
      self.destroy();
      return cb(er);
    }
    self.bytesWritten += bytes;
    cb();
  });

  if (this.pos !== undefined)
    this.pos += size;
};


WriteStream.prototype.destroy = ReadStream.prototype.destroy;
WriteStream.prototype.close = ReadStream.prototype.close;

// There is no shutdown() for files.
WriteStream.prototype.destroySoon = WriteStream.prototype.end;

};
