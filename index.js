#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var zlib = require('zlib');
var split = require('split');
var through = require('through');
var async = require('async');

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./aws.json');
var s3 = new AWS.S3();

var formats = require('./formats');
var reportConfig = process.argv[2] || "default";
var rootDir = process.cwd();

var moment = require('moment');
var start = moment();
var end = moment(start.toString()).add('days', 1);

var report;

try {
  report = require(path.join(rootDir, reportConfig));
 } catch (error) {
  console.error("Report not found. Create reports.json");
  return;
}

var format = formats[report.format];
if (!format) {
  console.error("Invalid file format (" + report.format + ") specified.");
  return;
}

var toJson = function() {
  return through(function (buf) {
    this.queue(format.toJson(buf.toString()));
  }, function end() {
    this.queue(null);
  });
};

// Download from S3, gunzip, and convert to JSON.
//
var processFile = function(path, cb) {
  if (path && path.length > 1) {
    var params = {
      Bucket: report.list.Bucket,
      Key: path
    };

    var read = s3.getObject(params).createReadStream();
    var gunzip = zlib.createGunzip();

    var reader = read;
    if (format.gzip) {
      read.pipe(gunzip);
      reader = gunzip;
    }

    var json = reader.pipe(split())
      .pipe(toJson());

    json.on('error', function(err) {
      cb(err);
    });

    json.on('end', function() {
      cb();
    });

    var out = fs.createWriteStream(report.Filename, { flags: 'a' });
    json.pipe(out);
  }
};

// Finds a unique file output name.
var outputName = function(filePath, num) {
  if (num === undefined) {
    num = 0;
  }
  var possiblePath = path.join(rootDir, filePath + '.' + num);
  if (fs.existsSync(possiblePath)) {
    num++;
    possiblePath = outputName(filePath, num);
  }
  return possiblePath;
};

// List files in bucket that match prefix.
//
var listFiles = function(params, cb) {
  s3.listObjects(params, function(err, data) {
    if (err) return console.log(err);

    // Get list of file paths.
    var paths = [];
    data.Contents.forEach(function(filePath) {
      paths.push(filePath.Key);
    });

    // Iterate to the next batch.
    var lastPath = paths[paths.length - 1];
    if (data.IsTruncated) {
      params.Marker = lastPath;
      var endMarker = report.Prefix + end.format(format.fileDateFormat);
      if (lastPath < endMarker) {
        listFiles(params, function(morePaths){
          paths = paths.concat(morePaths);
          cb(paths);
        });
      } else {
        cb(paths);
      }
    } else {
      cb(paths);
    }
  });
};

// TODO: notify if folder does not exist.
report.Filename = outputName(report.Filename);
report.list.Prefix = report.Prefix + start.format(format.fileDateFormat);

// Start JSON array.
fs.writeFileSync(report.Filename, '[');
listFiles(report.list, function(paths){

  // Process each file path.
  async.eachSeries(paths, processFile, function(err, results) {
    if (err) return console.log(err);

    // End JSON array.
    fs.appendFileSync(report.Filename, '{}]');
    console.log("done");
  });
});
