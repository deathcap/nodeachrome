'use strict';

const application = 'io.github.deathcap.nodeachrome';
let port = null;

document.getElementById('connect').addEventListener('click', () => {
  log('chrome.runtime.connectNative');

  port = chrome.runtime.connectNative(application);
  port.onMessage.addListener(log);
  port.onDisconnect.addListener((e) => {
    log('unexpected disconnect');
    port = null;
  });
});

document.getElementById('disconnect').addEventListener('click', () => {
  log('port.disconnect');
  port.disconnct();
  port = null;
});

document.getElementById('send').addEventListener('click', () => {
  const json = document.getElementById('msg').value;
  let msg;

  try {
    msg = JSON.parse(json);
  } catch (err) {
    return log('invalid JSON: ' + json);
  }

  if (port) {
    log('port.postMessage');
    port.postMessage(msg);
  } else {
    log('chrome.runtime.sendNativeMessage');
    chrome.runtime.sendNativeMessage(application, msg, log);
  }
});

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('log').innerHTML = '';
});

function log(msg) {
  console.log(msg);

  const e = document.createElement('pre');
  e.appendChild(document.createTextNode(typeof msg === 'object' ? JSON.stringify(msg) : msg));
  document.getElementById('log').appendChild(e);
}
