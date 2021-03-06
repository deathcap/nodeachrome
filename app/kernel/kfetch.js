'use strict';

// Kernel side of userland/fetch.js
// Actually performs the fetch API requests

const postUserland = require('./scheduler').postUserland;

window.addEventListener('message', (event) => {
  if (event.data.cmd === 'fetch') {
    console.log('got fetch',event.data);

    const id = event.data.id;

    function reply(msg) {
      event.source.postMessage(msg, '*');
    }

    if (event.data.method === 'fetch') {
      function resolve(dataObject) {
        // 'Response' object
        // Copy the serializable properties
        let data = {
          //body: dataObject.body, // can't, is a ReadableByteStream
          bodyUsed: dataObject.bodyUsed,
          ok: dataObject.ok,
          status: dataObject.status,
          statusText: dataObject.statusText,
          type: dataObject.type,
          url: dataObject.url,
          headers: JSON.parse(JSON.stringify(dataObject.headers)), // https://fetch.spec.whatwg.org/#headers-class
        };
        reply( {cmd: 'fetch', method: 'resolve', id, data});

        const reader = dataObject.body.getReader();
        function read() {
          reader.read().then((result) => {
            reply({cmd: 'fetch', method: 'resolveRead', id, result});
            if (!result.done) {
              read();
            }
          }).catch((err) => {
            reply({cmd: 'fetch', method: 'rejectRead', id, err});
          });
        }
        read();
      }
      function reject(err) {
        err = err.toString(); // TODO: fix cloning
        reply({cmd: 'fetch', method: 'reject', id, err});
      }

      const request = fetch(event.data.input, event.data.init).then(resolve).catch(reject);
    }
  }
});
