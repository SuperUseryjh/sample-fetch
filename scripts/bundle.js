const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.resolve(__dirname, '../dist/main.js')],
  bundle: true,
  outfile: path.resolve(__dirname, '../dist/bundle.js'),
  format: 'esm', // Use ES module format
  platform: 'browser', // Target browser environment
}).catch(() => process.exit(1));