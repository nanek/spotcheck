# Spotcheck

Quick, light weight querying of log files from AWS S3.

- Downloads files from a S3 bucket.
- Concatenates all files into a single file.
- Unzips if necessary.
- Converts from a standard log format into JSON.

# Log file formats supported

- `s3`         - S3 website log
- `cloudfront` - Cloudfront log (File from each edge server)
- `cloudtrail` - Cloudtrail audit log

# Installation

    npm install spotcheck -g

    # Create aws.json with your AWS API credentials.
    {
      "accessKeyId": "",
      "secretAccessKey": ""
    }

    # Create report.json (see example below).

    # Run report.
    spotcheck report.json

# Report format

Example `report.json`
````
{
  "list": {
    "Bucket": "",
    "Prefix": "",
    "MaxKeys": 100
  },
  "format": "s3",
  "Filename": "report.log"
}
````

# Possible TODOs

- Caching of files from S3 (listings and files. plain file or leveldb)
- Filtering. (example: obj['sc-status'] !== '200')
- Aggregation. Counts.
- Transforms (example: ua parse, UTC to local time)
- Output (example: send to loggly for additional processing)

# More Robust Alternatives

Spotcheck is not intended to be a robust log parsing solution. It is designed
more to make one off requests and queries easy, while leaving the heavy lifting
up to more robust and full feature tools like: Loggly / Splunk / Hadoop / etc.
