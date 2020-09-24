const S3 = require("aws-sdk/clients/s3")
const uniqid = require("uniqid")
const mime = require("mime")

const createPresignedPost = ({ key, contentType }) => {
  const s3 = new S3()
  const params = {
    Expires: 60,
    Bucket: process.env.BUCKET_NAME,
    Conditions: [["content-length-range", 100, 10000000]], // 100Byte - 10MB
    Fields: {
      "Content-Type": contentType,
      key
    }
  }

  return new Promise(async (resolve, reject) => {
    s3.createPresignedPost(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
}

module.exports.handler = async ({ body }) => {
  try {
    const { name } = JSON.parse(body)
    const presignedPostData = await createPresignedPost({
      key: `${uniqid()}_${name}`,
      contentType: mime.getType(name)
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        error: false,
        data: presignedPostData,
        message: null
      })
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        data: null,
        message: e.message
      })
    }
  }
}
