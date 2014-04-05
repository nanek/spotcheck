// Cloudtrail
//

/*
Example log entry.
http://docs.aws.amazon.com/awscloudtrail/latest/userguide/eventreference.html

{"Records": [
  {
    "eventVersion": "1.0",
    "userIdentity": {
      "type": "IAMUser",
      "principalId": "AIDAI2JXM4FBZZEXAMPLE",
      "arn": "arn:aws:iam::123456789012:user/Alice",
      "accountId": "123456789012",
      "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
      "userName": "Alice"
    },
    "eventTime": "2013-10-26T03:08:58Z",
    "eventSource": "iam.amazonaws.com",
    "eventName": "CreateUser",
    "awsRegion": "us-east-1",
    "sourceIPAddress": "192.0.2.01",
    "userAgent": "aws-cli/1.1.1 Python/2.7.4 Windows/7",
    "requestParameters": {"userName": "Bob"},
    "responseElements": {"user": {
      "createDate": "Oct 26, 2013 3:08:58 AM",
      "userName": "Bob",
      "arn": "arn:aws:iam::123456789012:user/Bob",
      "path": "/",
      "userId": "AIDAIHQ2LPVSRIEXAMPLE"
    }}
  }
  ]
}
*/
var SEPARATOR = ',\n';

var convert = function(row) {
  var obj = JSON.parse(row);

  // Remove the array that wraps the objects.
  var records = [];
  obj.Records.forEach(function(record){
    records.push(JSON.stringify(record, undefined, 2));
  });

  return records.join(SEPARATOR) + SEPARATOR;
};

module.exports = {
  toJson: convert,
  gzip: true,
  fileDateFormat: 'YYYY/MM/DD'
};
