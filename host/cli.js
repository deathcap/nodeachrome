#!/Users/admin/.nvm/versions/node/v6.0.0/bin/node
'use strict';

// Unix command-line interface to talk to native host

const net = require('net');
const path = require('path');
const nativeMessage = require('chrome-native-messaging');

const SOCKET_PATH = path.join(__dirname, 'nodeachrome.sock');

const client = net.connect(SOCKET_PATH);

// TODO: recognize -e flag to evaluate code
const code = process.argv[2] || '1+2';
const cmd = {fromUnix: true, args: ['eval', code]};

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
