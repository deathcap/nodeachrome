'use strict';

window.addEventListener('message', (event) => {
  event.source.postMessage({
    hello: eval('1 + 2'), // eval is allowed here
  }, event.origin);


  // try using http module within sandbox iframe
  // http://stackoverflow.com/questions/6968448/where-is-body-in-a-nodejs-http-get-response
  // not allowed for http://*/ :( in sandbox, need to go back to main thread
  const http = require('http');

  var options = {
    host: 'www.google.com',
    port: 80,
    path: '/index.html'
  };

  http.get(options, function(res) {
    event.source.postMessage({
      statusCode: res.statusCode,
    }, event.origin);
    console.log("Got response: " + res.statusCode);
    res.on("data", function(chunk) {
      event.source.postMessage({
        body: chunk,
      }, event.origin);
      console.log("BODY: " + chunk);
    });
  }).on('error', function(e) {
    event.source.postMessage({
      error: e.message,
    }, event.origin);
    console.log("Got error: " + e.message);
  });

});

