#!/Users/admin/.nvm/versions/node/v6.0.0/bin/node
'use strict';

// Unix command-line interface to talk to native host

const net = require('net');
const path = require('path');
const nativeMessage = require('chrome-native-messaging');

if (process.argv.length < 3) {
  process.stderr.write(`usage: ${process.argv[0]} [-e code | command]\n`);
  process.exit(1);
}

const SOCKET_PATH = path.join(__dirname, 'sock');
const client = net.connect(SOCKET_PATH);

let cmd;

const unixID = process.pid; // unique identifier for host to correlate request/responses
if (process.argv[2] === '-e') {
  const code = process.argv[3] || '1+2';
  cmd = {fromUnix: true, unixID, args: ['eval', code]};
} else {
  cmd = {fromUnix: true, unixID, args: process.argv.slice(2)};
}

const Readable = require('stream').Readable;
const rs = new Readable({objectMode: true});
let sentCmd = false;
rs._read = (size) => {
  if (!sentCmd) {
    rs.push(cmd);
    sentCmd = true;
    return;
  }

  //rs.push(null);
  // keep the connection open
  //rs.push(null);
};

const Writable = require('stream').Writable;

rs
.pipe(new nativeMessage.Output())
.pipe(client);

const ws = new Writable({objectMode: true});
ws._write = (msg, encoding, cb) => {
  //console.log('msg',msg);

  if (msg.cmd === 'stdout') {
    process.stdout.write(msg.output);
  } else if (msg.cmd === 'ack') {
    //console.log('Host received',msg);
  } else {
    console.log('Unknown message:',msg);
  }
};

// Decode all messages
// TODO: find out why I have to do this instead of the straightforward approach in
// https://github.com/deathcap/nodeachrome/pull/30#issuecomment-217346189
// which only reads the first message
const decodeState = {
  buf: Buffer.alloc(0),
  push: (msg) => {
    ws._write(msg, null, () => {});
  },
};
client.on('readable', () => {
  //console.log('client is readable');
  const chunk = client.read();

  function done() {
    //console.log('Done!', decodeState); // done decoding this message
  }

  // based on https://github.com/jdiamond/chrome-native-messaging/blob/master/index.js#L38
  // Input.prototype._transform = function(chunk, encoding, done) {
 
    // Save this chunk.
    var self = decodeState;
    self.buf = Buffer.concat([ self.buf, chunk ]);

    function parseBuf() {
        // Do we have a length yet?
        if (typeof self.len !== 'number') {
            // Nope. Do we have enough bytes for the length?
            if (self.buf.length >= 4) {
                // Yep. Parse the bytes.
                self.len = self.buf.readUInt32LE(0);
                // Remove the length bytes from the buffer.
                self.buf = self.buf.slice(4);
            }
        }

        // Do we have a length yet? (We may have just parsed it.)
        if (typeof self.len === 'number') {
            // Yep. Do we have enough bytes for the message?
            if (self.buf.length >= self.len) {
                // Yep. Slice off the bytes we need.
                var message = self.buf.slice(0, self.len);
                // Remove the bytes for the message from the buffer.
                self.buf = self.buf.slice(self.len);
                // Clear the length so we know we need to parse it again.
                self.len = null;
                // Parse the message bytes.
                var obj = JSON.parse(message.toString());
                // Enqueue it for reading.
                self.push(obj);
                // We could have more messages in the buffer so check again.
                parseBuf();
            }
        }
    }

    // Check for a parsable buffer (both length and message).
    parseBuf();

    // We're done.
    done();
});
