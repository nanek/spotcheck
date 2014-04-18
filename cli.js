#!/usr/bin/env node
var path = require('path');
var argv = require('minimist')(process.argv.slice(2));

if (argv._[0] === 'download') {
  var spotcheck = require('./index');
  var config = argv._[1];
  var date = argv.date;

  if (!config) {
    return console.error("Missing config.");
  }
  spotcheck.readConfig(config, date);
  spotcheck.run();
} else if (argv._[0] === 'report') {
  var report = require('./lib/report');
  var filePath = argv._[1];

  if (filePath && filePath[0] !== '/') {
    filePath = path.join(process.cwd(), filePath);
  }

  var opts = {
    format: argv.format,
    field: argv.field
  };

  if (!filePath) {
    return console.error("Missing filePath.");
  }
  if (!(opts.format || opts.field)) {
    return console.error("Missing format or field.");
  }
  report.report(filePath, opts);
} else {
  console.log('OPTIONS');
  console.log('=======');
  console.log('download');
  console.log('report');
}
