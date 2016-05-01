'use strict';

// Standard output stream for the browser
// Inspired by https://github.com/kumavis/browser-stdout TODO: pr?

const Writable = require('stream').Writable;

class BrowserStdout extends Writable {
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
    document.getElementById('output').appendChild(node);

    process.nextTick(cb);
  }
}

process.stdout = new BrowserStdout({label: 'stdout'});
process.stderr = new BrowserStdout({label: 'stderr'});

// TODO: real stream stdin
// this is enough for some apps to not choke
process.stdin = {
  isTTY: false, // for browserify cli
  on: () => null, // for cash/vorpal
};

