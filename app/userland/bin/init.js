'use strict';

const fs = require('fs');

process.stdout.write('init starting\n');

fs._ping(() => {
  process.stdout.write('native host up\n');
});

// TODO: better way to not allow implicit exit? terminate and stay resident?
process.exit = () => {};
//setInterval(() => {}, 1e9);
