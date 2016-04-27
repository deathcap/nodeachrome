'use strict';

const constants = require('constants');
//const sendNative = require('./native'); // on main thread
const sendNative = require('./native-proxy'); // in sandbox

// Node.js fs API implementations, async methods
// Backed by the native messaging host for local sandboxed OS filesystem access
//
// https://nodejs.org/api/fs.html


const fs = {};

fs.access = (path, mode, cb) => {
  if (!cb) {
    cb = mode;
    if (path === '/bin/node') return cb(null); // simulate executable /bin/node
    sendNative('fs.access', [path], cb);
  } else {
    if (path === '/bin/node') return cb(null);
    sendNative('fs.access', [path, mode], cb);
  }
};

fs.chmod = (path, mode, cb) => sendNative('fs.chmod', [path, mode], cb);
fs.chown = (path, uid, gid, cb) => sendNative('fs.chown', [path, uid, gid], cb);
fs.close = (fd, cb) => sendNative('fs.close', [fd], cb);

//TODO fs.createReadStream

fs.exists = (path, cb) => sendNative('fs.exists', [path], cb);
fs.fstat = (fd, cb) => sendNative('fs.fstat', [fd], cb);
fs.mkdir = (path, mode, cb) => {
  if (!cb) {
    cb = mode;
    sendNative('fs.mkdir', [path], cb);
  } else {
    sendNative('fs.mkdir', [path, mode], cb);
  }
}

fs.open = (path, flags, mode, cb) => {
  if (!cb) {
    cb = mode;
    sendNative('fs.open', [path, flags], cb);
  } else {
    sendNative('fs.open', [path, flags, mode], cb);
  }
}

fs.readFile = (path, options, cb) => {
  if (!cb) {
    cb = options;
    sendNative('fs.readFile', [path], decodeBuffer);
  } else {
    sendNative('fs.readFile', [path, options], decodeBuffer);
  }

  function decodeBuffer(err, data) {
    // Node.js Buffer objects come over as {type:'Buffer',data:[...]} TODO: more generic serialization protocol
    if (typeof data === 'object' && data.type === 'Buffer') {
      const buffer = new Buffer(data.data);
      cb(err, buffer);
    } else {
      cb(err, data);
    }
  }
};

fs.readdir = (path, cb) => sendNative('fs.readdir', [path], cb);
fs.readlink = (path, cb) => sendNative('fs.readlink', [path], cb);
fs.realpath = (path, cache, cb) => {
  if (!cb) {
    cb = cache;
    sendNative('fs.realpath', [path], cb);
  } else {
    sendNative('fs.realpath', [path, cache], cb);
  }
};

fs.rename = (oldPath, newPath, cb) => sendNative('fs.rename', [oldPath, newPath], cb);
fs.rmdir = (path, cb) => sendNative('fs.rmdir', [path], cb);

function addStatMethods(stats) {
  // see https://github.com/nodejs/node-v0.x-archive/blob/ef4344311e19a4f73c031508252b21712b22fe8a/lib/fs.js#L124-L189
  function checkModeProperty(property) {
    return (stats.mode & constants.S_IFMT) === property;
  }

  stats.isDirectory = () => checkModeProperty(constants.S_IFDIR);
  stats.isFile = () => checkModeProperty(constants.S_IFREG);
  stats.isBlockDevice = () => checkModeProperty(constants.S_IFBLK);
  stats.isCharacterDevice = () => checkModeProperty(constants.S_IFCHR);
  stats.isSymbolicLink = () => checkModeProperty(constants.S_IFLNK);
  stats.isFIFO = () => checkModeProperty(constants.S_IFIFO);
  stats.isSocket = () => checkModeProperty(constants.S_IFSOCK);
}

fs.lstat = (path, cb) => {
  sendNative('fs.lstat', [path], (err, stats) => {
    if (err) return cb(err);

    addStatMethods(stats);

    cb(null, stats);
  });
}

fs.stat = (path, cb) => {
  sendNative('fs.stat', [path], (err, stats) => {
    if (err) return cb(err);

    addStatMethods(stats);

    cb(null, stats);
  });
}

fs.symlink = (target, path, type, cb) => {
  if (!cb) {
    cb = type;
    sendNative('fs.symlink', [target, path], cb);
  } else {
    sendNative('fs.symlink', [target, path, type], cb);
  }
};
fs.unlink = (path, cb) => sendNative('fs.unlink', [path], cb);
fs.writeFile = (file, data, options, cb) => {
  if (!cb) {
    cb = options;
    sendNative('fs.writeFile', [file, data], cb);
  } else {
    sendNative('fs.writeFile', [file, data, options], cb);
  }
};

fs.write = (fd, buffer, offset, length, position, cb) => {
  if (!cb) {
    cb = position;
    sendNative('fs.write', [fd, buffer, offset, length], cb);
  } else {
    sendNative('fs.write', [fd, buffer, offset, length, position], cb);
  }
};

fs.read = (fd, inoutBuffer, offset, length, position, cb) => {
  sendNative('fs.read', [fd, inoutBuffer, offset, length], (err, bytesRead, outBuffer) => {
    // we don't have the luxury of in-process fs reading, so have to writeback the buffer
    (new Buffer(outBuffer.data)).copy(inoutBuffer);

    cb(err, bytesRead, outBuffer);
  });
};

require('./fs-static.js')(fs);
require('./fs-stream.js')(fs);

module.exports = fs;
