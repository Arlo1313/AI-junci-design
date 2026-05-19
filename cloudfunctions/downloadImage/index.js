// cloudfunctions/downloadImage/index.js
const cloud = require('wx-server-sdk')
const https = require('https')
const url = require('url')

cloud.init({
  env: ********
})

exports.main = async (event, context) => {
  const { imageUrl } = event
  if (!imageUrl) {
    return { success: false, error: '缺少imageUrl参数' }
  }

  try {
    // 下载外部图片到云函数本地
    const imageBuffer = await new Promise((resolve, reject) => {
      const parsedUrl = url.parse(imageUrl)
      https.get(parsedUrl, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP状态码错误: ${res.statusCode}`))
        }
        const chunks = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    })

    // 上传到微信云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: `ai-images/${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
      fileContent: imageBuffer
    })

    // 获取可访问的临时链接
    const tempUrlResult = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })

    return {
      success: true,
      tempUrl: tempUrlResult.fileList[0].tempFileURL
    }
  } catch (err) {
    console.error('云函数下载图片失败:', err)
    return { success: false, error: err.message }
  }
}
