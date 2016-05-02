'use strict';

const fs = require('fs');

process.stdout.write('init starting\n');

fs._ping(() => {
  process.stdout.write('native host up\n');
});
