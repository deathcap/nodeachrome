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

const SOCKET_PATH = path.join(__dirname, 'nodeachrome.sock');
const client = net.connect(SOCKET_PATH);

let cmd;

if (process.argv[2] === '-e') {
  const code = process.argv[3] || '1+2';
  cmd = {fromUnix: true, args: ['eval', code]};
} else {
  cmd = {fromUnix: true, args: process.argv.slice(2)};
}

const Readable = require('stream').Readable;
const rs = new Readable({objectMode: true});
rs.push(cmd);
rs.push(null);

const Writable = require('stream').Writable;
const ws = new Writable({objectMode: true});
ws._write = (chunk, encoding, cb) => {
  console.log('writable received',chunk,encoding);
  // TODO: get data back
};

rs
.pipe(new nativeMessage.Output())
.pipe(client)
.pipe(new nativeMessage.Input())
.pipe(ws);
