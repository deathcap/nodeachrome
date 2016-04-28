'use strict';

// Kernel side of userland/fetch.js
// Actually performs the fetch API requests

const postUserland = require('./scheduler').postUserland;

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'fetch') {
    console.log('got fetch',event.data);

    const id = event.data.id;
    const pid = event.data.pid;

    if (event.data.method === 'fetch') {
      function resolve(data) {
        data = data.toString(); // TODO: fix cloning. in particular, response body [object Response]
        postUserland(pid, {cmd: 'fetch', method: 'resolve', id, data});
      }
      function reject(err) {
        err = err.toString(); // TODO: fix cloning
        postUserland(pid, {cmd: 'fetch', method: 'reject', id, err});
      }

      const request = fetch(event.data.input, event.data.init).then(resolve).catch(reject);
    }
  }
});
