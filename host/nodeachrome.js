#!/Users/admin/.nvm/versions/node/v4.2.4/bin/node
// ^ full path to node must be specified above, edit for your system. may also try:
// #!/usr/local/bin/node

'use strict';

const process = require('process');
const fs = require('fs');
const nativeMessage = require('chrome-native-messaging');
const input = new nativeMessage.Input();
const transform = new nativeMessage.Transform(messageHandler);
const output = new nativeMessage.Output();

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
    const path = params[0];
    if (params.length < 2) {
      fs.access(path, cb);
    } else {
      const mode = params[1];
      fs.access(path, mode, cb);
    }
  } else if (method === 'fs.readFile') {
    const path = params[0];
    // TODO: restrict access to only a limited set of files
    if (params.length < 2) {
      //const callback = params[1];
      fs.readFile(path, cb);
    } else {
      const options = params[1];
      //const callback = params[2];
      fs.readFile(path, options, cb);
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
