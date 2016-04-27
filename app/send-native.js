'use strict';

const application = 'io.github.deathcap.nodeachrome';

let port = null;

// Send a message to the sandboxed iframe
// TODO: track which sandbox sends us, send back instead of hardcoding sandbox-0
function postSandbox(msg, sbID) {
  const iframe = document.getElementById('sandbox-' + sbID); // TODO: maintain map of sbID -> iframes, populate in newsb(), instead of DOM lookup
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
  postSandbox({cmd: 'recvNative', msg: msg}, msg.sbID);
}

function connectPort() {
  port = chrome.runtime.connectNative(application);
  port.onMessage.addListener(recvIncoming);
  port.onDisconnect.addListener(disconnected);

  return port;
}

// Send message using Google Chrome Native Messaging API to a native code host
function sendNative(method, params, msgID, sbID) {

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

  const msg = {method, params: paramsEncoded, msgID, sbID};

  console.log('sendNative',msg);

  if (!port) {
    port = connectPort();
  }

  port.postMessage(msg);

  // the one-off sendNativeMessage call is convenient in that it accepts a response callback,
  // but it launches the host app every time, so it doesn't preserve open filehandles (for e.g. fs.open/fs.write)
  //chrome.runtime.sendNativeMessage(application, msg, (response) => decodeResponse(response, cb));
}

window.addEventListener('message', (event) => {
  //console.log('received sandbox iframe message:',event);
  //console.log('main event data:',event.data);
  //console.log('event source:',event.source);

  // Main thread receives sendNative messages from sandbox -> sends them to native host
  if (event.data.cmd === 'sendNative') {
    //console.log('received main thread sendNative event:',event);
    const sbID = event.data.sbID; // TODO: get sbID from resolving event.origin instead of trusting sandbox to say who it is? if it matters
    sendNative(event.data.method, event.data.params, event.data.msgID, sbID);
  }
});

