var fs = require('fs');
var path = require('path');

var zlib = require('zlib');
var split = require('split');
var through = require('through');
var async = require('async');
var moment = require('moment');

var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var formats = require('./formats');
var rootDir = process.cwd();

var spotcheck = {};
module.exports = spotcheck;

var start = moment();
var end = null;
var report;
var format;

spotcheck.readConfig = function(reportConfig, inputDate) {
  reportConfig = reportConfig || "default";
  inputDate = inputDate || null;
  if (inputDate) {
    start = moment(inputDate);
  }
  end = moment(start.toString()).add('day', 1);
  console.log(start.format('MMMM Do YYYY'), "to", end.format('MMMM Do YYYY'));

  try {
    report = require(path.join(rootDir, reportConfig));
   } catch (error) {
    console.error("Report not found. Create report.json");
    return;
  }

  // Validate config.
  format = formats[report.Format];
  if (!format) {
    console.error("Invalid file format (" + report.format + ") specified.");
    return;
  }

  // TODO: handle if path does not exist.
  spotcheck.outputFile = spotcheck.outputName(report.Output);
};

spotcheck.toJson = function() {
  return through(function (buf) {
    this.queue(format.toJson(buf.toString()));
  }, function end() {
    this.queue(null);
  });
};

// Download from S3, gunzip, and convert to JSON.
//
spotcheck.processFile = function(filePath, cb) {
  if (filePath && filePath.length > 1) {
    console.log("processing", filePath);

    var params = {
      Bucket: report.Bucket,
      Key: filePath
    };

    var read = s3.getObject(params).createReadStream();
    var gunzip = zlib.createGunzip();

    var reader = read;
    if (format.gzip) {
      read.pipe(gunzip);
      reader = gunzip;
    }

    var json = reader.pipe(split())
      .pipe(spotcheck.toJson());

    var out = fs.createWriteStream(spotcheck.outputFile, { flags: 'a' });

    out.on('error', function(err) {
      cb(err);
    });

    out.on('finish', function() {
      cb();
    });

    json.pipe(out);
  }
};

// Finds a unique file output name.
spotcheck.outputName = function(filePath, num) {
  if (num === undefined) {
    num = 0;
  }
  var fileName = filePath + '.' + start.format("YYYY-MM-DD") + '.' + num;
  var possiblePath = path.join(rootDir, fileName);
  if (fs.existsSync(possiblePath)) {
    num++;
    possiblePath = spotcheck.outputName(filePath, num);
  }
  return possiblePath;
};

// List files in bucket that match prefix.
//
spotcheck.listFiles = function(params, cb) {
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
        spotcheck.listFiles(params, function(morePaths){
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

spotcheck.run = function() {
  // Start JSON array.
  fs.writeFileSync(spotcheck.outputFile, '[');

  var listParams = {
    Bucket: report.Bucket,
    MaxKeys: 1000,
    Prefix: report.Prefix + start.format(format.fileDateFormat)
  };

  spotcheck.listFiles(listParams, function(paths){
    // Process each file path.
    async.eachSeries(paths, spotcheck.processFile, function(err, results) {
      if (err) return console.log(err);

      // End JSON array.
      fs.appendFileSync(spotcheck.outputFile, '{}]');
      console.log("done");
    });
  });
};

module.exports = spotcheck;
