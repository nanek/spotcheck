#!/usr/bin/env node
var fs = require('fs');

var zlib = require('zlib');
var split = require('split');
var through = require('through');
var async = require('async');

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./aws.json');
var s3 = new AWS.S3();

var formats = require('./formats');
var reportConfig = process.argv[2] || "default";

var report;

try {
  report = require(__dirname + "/" + reportConfig);
 } catch (error) {
  console.error("Report config not found. Create reports/default.json");
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

// List files in bucket that match prefix.
//
var listFiles = function(params) {
  s3.listObjects(params, function(err, data) {
    if (err) return console.log(err);

    // Get list of file paths.
    var paths = [];
    data.Contents.forEach(function(filePath) {
      paths.push(filePath.Key);
    });

    // Process each file path.
    async.eachSeries(paths, processFile, function(err, results) {
      if (err) return console.log(err);

      // Iterate to the next batch.
      var lastPath = paths[paths.length - 1];
      if (data.IsTruncated) {
        params.Marker = lastPath;
        console.log("stopped at", lastPath);
        //TODO: Add config var to specify end marker. If no end marker, then
        // continue from start until we run out of files.
        //listFiles(params);
      } else {
        console.log("done");
      }
    });
  });
};

listFiles(report.list);
