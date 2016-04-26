'use strict';

const application = 'io.github.deathcap.nodeachrome';

let port = null;

// Send a message to the sandboxed iframe
function postSandbox(msg) {
  const iframe = document.getElementById('sandbox');
  const targetOrigin = '*';
  iframe.contentWindow.postMessage(msg, targetOrigin);
}

function disconnected(e) {
  port = null; // to allow to reconnect if it crashes
  console.log('unexpected native host disconnect:',e);
  throw new Error('unexpected native host disconnect:'+e);
}

function recvIncoming(msg) {
  //console.log('received incoming native msg:',msg);
  postSandbox({cmd: 'recvNative', msg: msg});
}

function connectPort() {
  port = chrome.runtime.connectNative(application);
  port.onMessage.addListener(recvIncoming);
  port.onDisconnect.addListener(disconnected);

  return port;
}

// Send message using Google Chrome Native Messaging API to a native code host
function sendNative(method, params, id) {

  const paramsEncoded = [];
  for (let i = 0; i < params.length; ++i) {
    let param = params[i];

    // Convert typed arrays to Node.js Buffers.. reconstruct loss of type fidelity from
    // JavaScript cloning algorithm over postMessage between main and sandbox frame
    if (param instanceof Uint8Array) {
      param = new Buffer(param);
    }

    paramsEncoded.push(param);
  }

  const msg = {method, params: paramsEncoded, id};

  console.log('sendNative',msg);

  if (!port) {
    port = connectPort();
  }

  port.postMessage(msg);

  // the one-off sendNativeMessage call is convenient in that it accepts a response callback,
  // but it launches the host app every time, so it doesn't preserve open filehandles (for e.g. fs.open/fs.write)
  //chrome.runtime.sendNativeMessage(application, msg, (response) => decodeResponse(response, cb));
}

// When the page loads, first contact the sandbox frame so it gets our event source
window.addEventListener('load', (event) => {
  console.log('onload');
  postSandbox({cmd: 'ping'});
});

window.addEventListener('message', (event) => {
  //console.log('received sandbox iframe message:',event);
  //console.log('main event data:',event.data);
  //console.log('event source:',event.source);

  // Main thread receives sendNative messages from sandbox -> sends them to native host
  if (event.data.cmd === 'sendNative') {
    //console.log('received main thread sendNative event:',event);
    sendNative(event.data.method, event.data.params, event.data.id);
  }
});

