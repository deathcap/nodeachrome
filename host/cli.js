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
const cmd = {method: 'eval', code};

const Readable = require('stream').Readable;
const rs = new Readable({objectMode: true});
rs.push(cmd);
rs.push(null);

rs
.pipe(new nativeMessage.Output())
.pipe(client);
