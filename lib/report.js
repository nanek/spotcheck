var fs = require('fs');
var _ = require('lodash');
var getobject = require('getobject');
var Table = require('cli-table');
var formats = require('../formats');

var countKey = function(key, data, opts) {
  opts = opts || {};
  var keys = _.countBy(data, function(item) {
    var value = getobject.get(item, key);
    if (opts.isJson) {
      value = JSON.stringify(value);
    }
    return value;
  });
  return keys;
};

var objToArray = function(obj) {
  var list = [];
  _.map(obj, function(value, key) {
    list.push([value, key]);
  });
  return list;
};

var chars = {
  'mid': '',
  'left-mid': '',
  'mid-mid': '',
  'right-mid': ''
};

var displayTable = function(field, data, opts) {
  opts = opts || {};
  var table = new Table({head: ['count', field], chars: chars });
  table.push.apply(table, objToArray(countKey(field, data, opts)));
  console.log(table.toString());
};

var report = function(file, opts) {
  var field = opts.field;
  var format = opts.format;

  fs.readFile(file, function (err, data) {
    if (err) throw err;
    data = JSON.parse(data);
    // Remove empty element added by download.
    data.pop();

    if (field) {
      displayTable(field, data);
    } else if (format) {
      var reportFields = formats[format].reportFields;

      reportFields.forEach(function(header){
        displayTable(header, data);
      });
    }
  });
};

module.exports = {
  report: report
};
