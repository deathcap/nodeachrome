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
const ws = new Writable({objectMode: true});
ws._write = (chunk, encoding, cb) => {
  console.log('writable received',chunk,encoding);
  // TODO: get data back
};

rs
.pipe(new nativeMessage.Output())
.pipe(client)

client.on('readable', () => {
  //console.log('client is readable');
  const data = client.read();

  if (data) {
    // Decode the buffer to JSON
    //console.log('read=', data.toString());

    const rs = new Readable;
    const ws = new Writable({objectMode: true});
    ws._write = (msg, encoding, cb) => {
      //console.log('msg',msg);

      if (msg.cmd === 'stdout') {
        process.stdout.write(msg.output);
      } else if (msg.cmd === 'ack') {
        console.log('Host received',msg);
      } else {
        console.log('Unknown message:',msg);
      }
    };
    rs.push(data);
    rs.push(null);
    rs.pipe(new nativeMessage.Input()).pipe(ws);
  }
  //client.pipe(new nativeMessage.Input()).pipe(ws);
});
