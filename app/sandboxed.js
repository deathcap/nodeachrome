'use strict';

window.addEventListener('message', (event) => {
  event.source.postMessage({
    hello: eval('1 + 2'), // eval is allowed here
  }, event.origin);
});

