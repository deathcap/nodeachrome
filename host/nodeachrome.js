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

function messageHandler(msg, push, done) {
  const method = msg.method;
  const params = msg.params;

  if (method === 'echo') {
    push(msg);
    done();
  } else if (method === 'fs.readFile') {
    const file = params[0];
    // TODO: restrict access to only a limited set of files
    if (params.length < 2) {
      //const callback = params[1];
      fs.readFile(file, (err, data) => {
        if (err) throw err; // TODO
        push(data);
        done();
      });
    } else {
      const options = params[1];
      //const callback = params[2];
      fs.readFile(file, options, (err, data) => {
        if (err) throw err; // TODO
        push(data);
        done();
      });
    }
  } else {
    push({error: `invalid method: ${method}`});
    done();
  }
}
