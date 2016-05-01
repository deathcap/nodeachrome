'use strict';

// "Windowing desktop"
//
// Manages draggable iframes (drag from their edges, like real windows, but on the same page)

let maxZindex = 0;
let iframes = new Set();

function createDraggableIframe(pid) {
  const container = document.createElement('div');
  const iframe = document.createElement('iframe');

  iframes.add(iframe);

  const id = 'userland-process-' + pid;
  iframe.setAttribute('id', id);

  container.setAttribute('id', 'container-' + id);
  container.setAttribute('style', `
background: #c1c1c1;
border-width: 5px;
border-radius: 10px;
padding: 8px;
border-style: groove;
cursor: move;
/* Tile windows TODO: automatic organization, non-overlapping mode */
position: absolute;
top: ${20 * pid}px;
left: ${20 * pid}px;
`);

  container.setAttribute('draggable', 'true');

  function bringToTop() {
    maxZindex += 1;
    container.style.zIndex = maxZindex;
  }

  container.addEventListener('click', (event) => {
    bringToTop();
  });

  container.addEventListener('dragstart', (event) => {
    bringToTop();
    const style = window.getComputedStyle(event.target, null);
    event.dataTransfer.dragEffect = 'move';
    event.dataTransfer.setData('text/plain', container.getAttribute('id') + ',' +
      (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
    // Temporarily hide all iframes (including this one) to allow mouse events through
    for (let otherIframe of iframes) {
      otherIframe.style.visibility = 'hidden';
    }
  });
  container.addEventListener('dragend', (event) => {
    console.log('dragend',event);
    for (let otherIframe of iframes) {
      otherIframe.style.visibility = '';
    }
  });

  const titlebar = document.createElement('div');
  titlebar.setAttribute('id', 'titlebar-' + id);
  titlebar.setAttribute('style', `
width: 100%;
height: 20px;
background: #001caf;
color: white;
font-weight: bold;
`);
  titlebar.textContent = `New process ${pid}`;

  container.appendChild(titlebar);
  container.appendChild(iframe);

  return {iframe, container, titlebar};
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

module.exports = {
  createDraggableIframe,
};
