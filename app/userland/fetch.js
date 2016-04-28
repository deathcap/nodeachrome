'use strict';

// Fetch API proxy

const syscall = require('./syscall').syscall;

let nextID = 1;
let id2resolve = new Map();
let id2reject = new Map();

// Override the global fetch object, since in userland, it can't request
// arbitrary sites, so we have to forward to the kernel.
global.fetch = function(input, init) {
  return new Promise((resolve, reject) => {
    const id = nextID;
    syscall({cmd: 'fetch', method: 'fetch', id, pid: process.pid, input, init});
    nextID += 1;

    id2resolve.set(id, resolve);
    id2reject.set(id, reject);
  });
};

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'fetch') {
    const id = event.data.id;

    if (event.data.method === 'resolve') {
      const resolve = id2resolve.get(id);
      resolve(event.data.data);
    } else if (event.data.method === 'reject') {
      const reject = id2reject.get(id);
      reject(event.data.err);
    }
  }
});
