'use strict';

// Process initialization

const {HtmlStdout, RedirUnixStdout} = require('./stdout');
const tee = require('tee');

// Save kernel data for syscall
let kernel = {
  source: null,
  origin: null,
};

// our sandbox identifier, who we are. global _per sandbox_ - basically like a Unix pid
// TODO: replace with getter/setter defineProperty, since not actually supposed to set it, per the API
process.pid = null;

window.addEventListener('message', (event) => {
  if (event.data.cmd === '_start') {
    // Start a new sandbox (like _start in C or Unix, runs before kernel)

    // save for sending messages back to kernel thread later
    kernel.source = event.source;
    kernel.origin = event.origin;
    process.pid = event.data.pid;
    process.argv = ['/bin/node'].concat(event.data.argv || ['a.out']); // [0]=always node, [1]=script name, [2]=args
    process.title = process.argv[1];
    process.env = event.data.env || {};

    console.log('sandbox received _start:',event.data);

    // Setup streams
    process.stdout = new HtmlStdout({label: 'stdout'});
    process.stderr = new HtmlStdout({label: 'stderr'});

    if (event.data.opts) {
      if ('unixID' in event.data.opts) {
        // Launched from Unix cli, so redirect stdout back
        // tee to stream both, show on HtmlStdout and RedirUnixStdout
        process.stdout = tee(process.stdout, new RedirUnixStdout(event.data.opts.unixID));
        //process.stderr = tee(process.stderr, new RedirUnixStdout(event.data.opts.unixID)); // TODO: should redirect stderr too? probably, but need to differentiate
      }
    }


    process.stderr.write(`\nStarted pid=${process.pid}, argv=${JSON.stringify(process.argv)}, env=${JSON.stringify(process.env)}\n`);

    event.source.postMessage({cmd: 'started'}, event.origin);

    // TODO: dynamic requires
    // This is what we can do now with browserify
    let commands = {
      init: () => require('./bin/init'),
      npm: () => require('./bin/npm'),
      browserify: () => require('./bin/browserify'),
      ls: () => require('./bin/ls'),
      eval: () => require('./bin/eval'),
      false: () => require('./bin/false'),
      true: () => require('./bin/true'),
      echo: () => require('./bin/echo'),
      kill: () => require('./bin/kill'),
      reboot: () => require('./bin/reboot'),
    };

    if (commands[process.argv[1]]) {
      commands[process.argv[1]]();
    }
  }
});

module.exports = {
  kernel,
};
