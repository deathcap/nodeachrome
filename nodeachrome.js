#!/Users/admin/.nvm/versions/node/v4.2.4/bin/node
// ^ full path to node must be specified above, edit for your system. may also try:
// #!/usr/local/bin/node

'use strict';

const process = require('process');
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
  push(msg); // echo
  done();
}
