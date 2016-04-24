#!/Users/admin/.nvm/versions/node/v4.2.4/bin/node
// ^ full path to node must be specified above, edit for your system. may also try:
// #!/usr/local/bin/node

'use strict';

// Native messaging host, provides native access to OS functions over stdin/stdout
// for the Google Chrome extension
// TODO: port off nodejs?

const process = require('process');
const fs = require('fs');
const path = require('path');
const nativeMessage = require('chrome-native-messaging');
const input = new nativeMessage.Input();
const transform = new nativeMessage.Transform(messageHandler);
const output = new nativeMessage.Output();

// Prepend all paths with this filesystem root
const ROOT = path.join(__dirname, '../data');
if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT);

function fixpath(relativePath) {
  const newPath = path.join(ROOT, relativePath);
  if (!newPath.startsWith(ROOT)) {
    return ROOT; // tried to go above root, return root
  }
  return newPath;
}


process.stdin
  .pipe(input)
  .pipe(transform)
  .pipe(output)
  .pipe(process.stdout);

function encodeError(err) {
  return {error:
            {
              code: err.errno, // must be an integer, but err.code is a string like 'ENOENT'
              message: err.toString(),
            }
          };
}

function encodeResult(err, data) {
  if (err) {
    return encodeError(err);
  } else {
    return {result:data};
  }
}

function messageHandler(msg, push, done) {
  const method = msg.method;
  const params = msg.params;

  function cb(err, data) {
    push(encodeResult(err, data));
    done();
  }

  if (method === 'echo') {
    push(msg);
    done();
  } else if (method === 'fs.access') {
    const path = fixpath(params[0]);
    if (params.length < 2) {
      fs.access(path, cb);
    } else {
      const mode = params[1];
      fs.access(path, mode, cb);
    }
  } else if (method === 'fs.chmod') {
    const path = fixpath(params[0]);
    const mode = params[1];
    fs.chmod(path, mode, cb);
  } else if (method === 'fs.chown') {
    const path = fixpath(params[0]);
    const uid = params[1];
    const gid = params[2];
    fs.chown(path, uid, gid, cb);
  } else if (method === 'fs.close') {
    const fd = params[0];
    fs.close(fd, cb);
    /* TODO
  } else if (method === 'fs.createReadStream') {
    const path = params[0];
    */
  } else if (method === 'fs.exists') { // deprecated, by npm uses
    const path = fixpath(params[0]);
    fs.exists(path, cb);
  } else if (method === 'fs.fstat') {
    const fd = params[0];
    fs.fstat(fd, cb);
  } else if (method === 'fs.lstat') {
    const path = fixpath(params[0]);
    fs.lstat(path, cb);
  } else if (method === 'fs.mkdir') {
    const path = fixpath(params[0]);
    if (params.length < 2) {
      fs.mkdir(path, cb);
    } else {
      const mode = params[1];
      fs.mkdir(path, mode, cb);
    }
  } else if (method === 'fs.open') {
    const path = fixpath(params[0]);
    const flags = params[1];
    if (params.length < 3) {
      const mode = params[2];
      fs.open(path, flags, mode, cb);
    } else {
      fs.open(path, flags, cb);
    }
  } else if (method === 'fs.readFile') {
    const file = fixpath(params[0]);
    // TODO: restrict access to only a limited set of files
    if (params.length < 2) {
      //const callback = params[1];
      fs.readFile(file, cb);
    } else {
      const options = params[1];
      //const callback = params[2];
      fs.readFile(file, options, cb);
    }
  } else if (method === 'fs.readdir') {
    const path = fixpath(params[0]);
    fs.readdir(path, cb);
  } else if (method === 'fs.readlink') {
    const path = fixpath(params[0]);
    fs.readlink(path, cb);
  } else if (method === 'fs.realpath') {
    const path = fixpath(params[0]);
    if (params.length < 2) {
      fs.realpath(path, cb);
    } else {
      const cache = params[1];
      fs.realpath(path, cache, cb);
    }
  } else if (method === 'fs.rename') {
    const oldPath = fixpath(params[0]);
    const newPath = fixpath(params[1]);
    fs.rename(oldPath, newPath, cb);
  } else if (method === 'fs.rmdir') {
    const path = fixpath(params[0]);
    fs.rmdir(path, cb);
  } else if (method === 'fs.stat') {
    const path = fixpath(params[0]);
    fs.stat(path, cb);
  } else if (method === 'fs.symlink') {
    const target = fixpath(params[0]);
    const path = fixpath(params[1]);
    if (params.length < 3) {
      fs.symlink(target, path, cb);
    } else {
      const type = params[2];
      fs.symlink(target, path, type, cb);
    }
  } else if (method === 'fs.unlink') {
    const path = fixpath(params[0]);
    fs.unlink(path, cb);
  } else if (method === 'fs.writeFile') {
    const file = fixpath(params[0]);
    const data = params[1];
    if (params.length < 3) {
      fs.writeFile(file, data, cb);
    } else {
      const options = params[2];
      fs.writeFile(file, data, options, cb);
    }
  } else {
    push({error: {
      code: -32601, // defined in http://www.jsonrpc.org/specification#response_object
      message: 'Method not found',
      data: `invalid method: ${method}`}
    });
    done();
  }
}
