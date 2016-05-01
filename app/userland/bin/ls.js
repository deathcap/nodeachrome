'use strict';

const fs = require('fs');
const path = process.argv.length >= 3 ? process.argv[2] : '.';

fs.readdir(path, (err, files) => {
  if (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  } else {
    for (let file of files) {
      process.stdout.write(file + '\n');
    }
    process.exit(0);
  }
});
