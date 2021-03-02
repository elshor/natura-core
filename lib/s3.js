/**
* show a list of all buckets
* @natura action show all buckets
* @title show all buckets
**/
export function showAllBuckets(){

}

/**
* description
* @typedef {"private"|"public-read"|"public-read-write"|"authenticated-read"} Acl
* @natura entity
**/

/**
* Create an S3 bucket in a specified region. If a region is not specified, the bucket is created in the S3 default
    region (us-east-1).
* @natura action create bucket named <<name>>
* @title create bucket
* @param {String$} name the bucket name - Bucket to create
* @param {region} region the bucket region - region to create bucket in, e.g., 'us-west-2'
* @param {Acl} acl the ACL permission - Specify the permissions to apply to this bucket

**/
export function createBucket(){

}

/**
* delete a bucket
* @natura action delete bucket <<bucket>>
* @title delete a bucket
* @param {String$} bucket bucket name  - specify the name of the bucket to delete

**/
export function removeBucket(){

}

export function uploadFileToBucket(){

}

export function downloadObject(){

}

/**
* the specified default region
* @natura expression the default region
* @title the default region
* @returns {Region}
**/
export function defaultRegion(){

}