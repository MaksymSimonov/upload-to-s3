const S3 = require('aws-sdk/clients/s3')
const uniqid = require('uniqid')
const mime = require('mime')

const createPresignedPost = ({ key, contentType }) => {
  const s3 = new S3()
  const params = {
    Expires: 600,
    Bucket: process.env.BUCKET_NAME,
    Conditions: [['content-length-range', 100, 10000000], {'acl': 'public-read'}], // 100Byte - 10MB
    Fields: {
      'Content-Type': contentType,
      'acl': 'public-read',
      key
    }
  }

  return new Promise((resolve, reject) => {
    s3.createPresignedPost(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body)
    const { name } = body

    const presignedPostData = await createPresignedPost({
      key: `${uniqid()}_${name}`,
      contentType: mime.getType(name)
    })

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
