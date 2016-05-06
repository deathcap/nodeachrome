'use strict';

// TODO: support -n, \c? see echo(1)

const text = process.argv.slice(2).join(' ') + '\n';

// TODO: write each arg individually? writev? that's what https://svnweb.freebsd.org/base/head/bin/echo/echo.c?revision=181269&view=markup#l127 does
process.stdout.write(text);

// TODO: exit with error if write error?
