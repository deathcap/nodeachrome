'use strict';

// Evaluate the JavaScript code passed on command-line

if (process.argv.length <= 2) {
  process.stderr.write(`usage: ${process.argv[1]} code\n`);
  process.exit(1);
}

const code = process.argv[2];

process.stdout.write(`evaluating: ${code}\n`);

const result = eval(code);

process.stdout.write(`result: ${JSON.stringify(result, null, '  ')}\n`);
//console.log(result);
