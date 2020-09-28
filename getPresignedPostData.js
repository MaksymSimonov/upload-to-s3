const S3 = require('aws-sdk/clients/s3')
const uniqid = require('uniqid')
const mime = require('mime')

module.exports.handler = async (event) => {
  try {
    const s3 = new S3()
    const fileName = event['pathParameters']['fileName']

    const key = `${uniqid()}_${fileName}`
    const contentType = mime.getType(fileName)

    const params = {
      Expires: 600,
      Bucket: process.env.BUCKET_NAME,
      Conditions: [
        ['content-length-range', 100, 10000000],  // 100Byte - 10MB
        {'acl': 'public-read'}
      ],
      Fields: {
        'Content-Type': contentType,
        'acl': 'public-read',
        key
      }
    }

    const presignedPostData = s3.createPresignedPost(params)

    return response(200, { data: presignedPostData })
  } catch (error) {
    return response(500, error.message)
  }
}

const response = (responseCode, message) => ({
  statusCode: responseCode,
  body: JSON.stringify(responseCode === 200
    ? {
      ...message,
    }
    : {
      message,
    },
  null,
  2),
})
