'use strict';

function boot() {
  console.log('creating initial process');
  const init = new Process();
  init.exec(['init']);
}

module.exports = {
  boot,
};
