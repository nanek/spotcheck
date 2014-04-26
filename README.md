# Spotcheck

Quick, light weight querying of log files stored on AWS S3.

- Downloads files from a S3 bucket for a single day.
- Concatenates all files into a single file.
- Unzips if necessary.
- Converts from a standard log format into JSON.

# Log file formats supported

- `s3`         - S3 website log
- `cloudfront` - Cloudfront log (File from each edge server)
- `cloudtrail` - Cloudtrail audit log

# Installation

    npm install spotcheck -g

# Usage

    # Create aws.json with your AWS API credentials.
    {
      "accessKeyId": "",
      "secretAccessKey": ""
    }

    # Create report.json (see example below).

    # Download data.
    spotcheck download report.json

    Optional Parameters:
      --date   [date]      example: 04-18-2014

    # Print counts from downloaded data.
    spotcheck report [path to json file]

    Parameters (must use one):
      --format [format]    example: s3
      --field  [field]     example: user-agent

# Report format

Example `report.json`
````
{
  "Bucket": "",
  "Format": "s3",
  "Prefix": "",
  "Output": "report.log"
}
````

# More Robust Alternatives

Spotcheck is not intended to be a robust log parsing solution. It is designed
more to make one off requests and queries easy, while leaving the heavy lifting
up to more robust and full feature tools like: Loggly / Splunk / Hadoop / etc.
