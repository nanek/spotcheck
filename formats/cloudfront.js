// Cloudfront
//
var header = [
  'date',
  'time',
  'x-edge-location',
  'sc-bytes',
  'c-ip',
  'cs-method',
  'cs(Host)',
  'cs-uri-stem',
  'sc-status',
  'cs(Referer)',
  'cs(User-Agent)',
  'cs-uri-query',
  'cs(Cookie)',
  'x-edge-result-type',
  'x-edge-request-id',
  'x-host-header',
  'cs-protocol',
  'cs-bytes'
];

// Convert log format into a JSON object.
//
var convert = function(row) {
  // Skip commented lines.
  if (row[0] === '#') return "";
  // Skip blank lines.
  if (row === '') return "";

  var obj = {};
  var vals = row.split('\t');
  var fields = header.length;

  if (vals.length === fields) {
    header.forEach(function(key, index){
      obj[key] = vals[index];
    });
    return JSON.stringify(obj, undefined, 2) + ',\n';
  } else {
    console.log("Skipping row. Values don't match expected length.")
  }

  return "";
};

module.exports = {
  toJson: convert,
  gzip: true,
  fileDateFormat: 'YYYY-MM-DD',
  reportFields: header
};
