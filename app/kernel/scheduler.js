'use strict';

// Kernel "scheduler" (analogous to OS), manages processes
// Maintains multiple independent execution contexts (processes) for JavaScript, using sandboxed iframes (unique origins)

let nextPid = 1;
let iframes = new Map();


let draggingElement = null;

// Create a new "userland" sandboxed execution context, previously 'newsb',
// like Unix spawn/exec (close enough) or posix_spawn/system
// TODO: Unix-ish standard Node API to implement instead? process, os? exec? Found it: https://nodejs.org/api/child_process.html exec!
function spawn(argv, env) {
  const containers = document.getElementById('userland-processes');

  const container = document.createElement('div');
  const iframe = document.createElement('iframe');
  const pid = nextPid;
  nextPid += 1;

  if (!env) env = global.ENV; // inherit from kernel TODO: per-process inheritance, forking

  iframes.set(pid, iframe);

  iframe.setAttribute('id', 'userland-process-' + pid);
  iframe.setAttribute('src', '/userland/userland.html');
  iframe.addEventListener('load', (event) => {
    console.log('sandbox frame load',pid);
    iframe.contentWindow.postMessage({cmd: '_start', pid: pid, argv, env}, '*');
  });

  container.setAttribute('id', 'container-' + pid);
  container.setAttribute('style', `
background: silver;
border-width: 5px;
position: absolute;
top: 10px;
left: 10px;
border-radius: 4px; padding: 8px;
`);
  container.setAttribute('draggable', 'true'); // allow picking it up TODO: allow dropping

  container.addEventListener('dragstart', (event) => {
    const style = window.getComputedStyle(event.target, null);
    event.dataTransfer.setData('text/plain', container.getAttribute('id') + ',' +
      (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
    iframe.style.visibility = 'hidden'; // temporarily hide to allow mouse events through
  });
  container.addEventListener('dragend', (event) => {
    console.log('dragend',event);
    iframe.style.visibility = '';
  });

  container.appendChild(iframe);
  containers.appendChild(container);

  return iframe;
}

document.body.addEventListener('dragover', (event) => {
  event.preventDefault();
  return false;
}, false);

document.body.addEventListener('drop', (event) => {
  const offset = event.dataTransfer.getData('text/plain').split(',');
  const dm = document.getElementById(offset[0]);
  dm.style.left = (event.clientX + parseInt(offset[1],10)) + 'px';
  dm.style.top = (event.clientY + parseInt(offset[2],10)) + 'px';
  event.preventDefault();
  return false;
}, false);

// Send a message to the sandboxed iframe, aka the userland
function postUserland(pid, msg) {
  const iframe = iframes.get(pid);
  if (!iframe) throw new Error(`no such process: ${pid}`);
  if (!iframe.contentWindow) throw new Error(`no such process, terminated: ${pid}`);

  iframe.contentWindow.postMessage(msg, '*');
}

// Evaluate code within a given sandbox
function evalin(pid, code) {
  postUserland(pid, {cmd: 'eval', code: code});
}

function kill(pid, signal) {
  //TODO: SIGTERM etc. postUserland(pid, {cmd: 'signal', signal: signal});
  //if (signal === 'SIGKILL') {
  
    const iframe = iframes.get(pid);
    iframe.parentNode.removeChild(iframe);
    iframes.delete(pid);
    console.log(`Killed ${pid}`);

  //}
}

module.exports = {
  spawn,
  evalin,
  postUserland,
  kill,
};
