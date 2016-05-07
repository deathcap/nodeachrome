'use strict';

const Writable = require('stream').Writable;

// Standard output stream for the browser
// Inspired by https://github.com/kumavis/browser-stdout which uses console.log()
// instead, HtmlStdout writes to document
class HtmlStdout extends Writable {
  constructor(opts) {
    super(opts);

    this.label = opts.label;
  }

  _write(chunks, encoding, cb) {
    const output = chunks.toString ? chunks.toString() : chunks;

    if (this.label === 'stdout') {
      console.log(this.label, output);
    } else {
      console.error(this.label, output);
    }

    const node = document.createTextNode(output);
    const terminal = document.getElementById('output');

    terminal.appendChild(node);
    terminal.scrollTop = terminal.scrollHeight; // scroll to bottom TODO: only if user hasn't scrolled up?

    process.nextTick(cb);
  }
}

// Redirects userland stdout back to Unix command-line
class RedirUnixStdout extends Writable {
  constructor(toUnix) {
    super();
    this.toUnix = toUnix;
  }

  _write(chunks, encoding, cb) {
    const output = chunks.toString ? chunks.toString() : chunks;
    console.log('REDIR STDOUT', this.toUnix, output);
    const syscall = require('./syscall').syscall;

    const sendNative = require('./native-proxy');
    sendNative('unix.stdout', [this.toUnix,
        process.pid, // TODO: secure process.pid? (have kernel set it instead of userland?) not clear if needed
        output], cb);
  }
}

// set in _start, if accesses here is too early
process.stdout = null;
process.stderr = null;

// TODO: real stream stdin
// this is enough for browserify_cli to not choke
process.stdin = {
  isTTY: false,
};

module.exports = {
  HtmlStdout,
  RedirUnixStdout,
};
