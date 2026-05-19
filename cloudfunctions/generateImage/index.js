const cloud = require('wx-server-sdk');
const https = require('axios');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// ========================================
// 【必须替换】你的阿里云百炼API Key
// ========================================
const ALIYUN_API_KEY = '***********';
const API_HOST = '***********';

// 发送HTTP请求（Promise封装，不依赖任何外部库）
function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(body.substring(0, 300))); }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

function buildPrompt(userPrompt, shape, glaze) {
  const shapeMap = {
    '梅瓶': 'a classic Chinese meiping plum vase',
    '茶盏': 'a traditional Chinese tea bowl',
    '笔筒': 'a cylindrical Chinese brush pot',
    '花器': 'an artistic Chinese flower vase'
  };
  const glazeMap = {
    '天青': 'sky-blue Jun glaze',
    '铜红': 'rich copper-red Jun glaze',
    '月白': 'moon-white Jun glaze',
    '窑变': 'dramatic kiln-transformation glaze'
  };
  const s = shapeMap[shape] || shape;
  const g = glazeMap[glaze] || glaze;
  return `A stunning Chinese Jun porcelain ceramic: ${s}, featuring ${g}, inspired by "${userPrompt}", museum-quality studio product photography, warm beige background, photorealistic, masterpiece`;
}

exports.main = async (event, context) => {
  try {
    // 获取参数
    const prompt = event.prompt || (event.data && event.data.prompt);
    const shape = event.shape || (event.data && event.data.shape) || '';
    const glaze = event.glaze || (event.data && event.data.glaze) || '';
    
    if (!prompt || !prompt.trim()) {
      return { success: false, error: '请输入描述词' };
    }
    
    const optimizedPrompt = buildPrompt(prompt.trim(), shape, glaze);
    console.log('优化后的提示词:', optimizedPrompt);
    
    // 步骤1：创建异步任务（使用阿里云模型）
    const postData = JSON.stringify({
      model: 'wan2.2-t2i-flash',  // 
      input: { prompt: optimizedPrompt },
      parameters: { size: '1024*1024', n: 1 }
    });
    
    console.log('开始创建AI任务...');
    const createRes = await httpRequest({
      hostname: API_HOST,
      path: '/api/v1/services/aigc/text2image/image-synthesis',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + ALIYUN_API_KEY,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    const taskId = createRes.output && createRes.output.task_id;
    if (!taskId) {
      console.error('创建任务失败:', createRes);
      return { success: false, error: '创建任务失败' };
    }
    console.log('任务创建成功，taskId:', taskId);
    
    // 步骤2：轮询查询结果（最多30次，每次2秒）
    const maxAttempts = 30;
    const interval = 2000;
    let resultRes = null;
    
    console.log('开始轮询任务结果...');
    for (let i = 0; i < maxAttempts; i++) {
      resultRes = await httpRequest({
        hostname: API_HOST,
        path: '/api/v1/tasks/' + taskId,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + ALIYUN_API_KEY }
      });
      
      const status = resultRes.output && resultRes.output.task_status;
      console.log(`轮询第${i+1}次，状态:`, status);
      
      if (status === 'SUCCEEDED') {
        console.log('任务执行成功');
        break;
      }
      
      if (status === 'FAILED') {
        const errorMsg = resultRes.output && resultRes.output.message;
        console.error('AI生成失败:', errorMsg);
        return { success: false, error: errorMsg || 'AI生成失败' };
      }
      
      // 等待后继续轮询
      await new Promise(r => setTimeout(r, interval));
    }
    
    // 检查是否成功获取到图片
    const imageUrl = resultRes.output && 
                     resultRes.output.results && 
                     resultRes.output.results[0] && 
                     resultRes.output.results[0].url;
    
    if (!imageUrl) {
      console.error('未获取到图片URL:', resultRes);
      return { success: false, error: '未获取到图片' };
    }
    console.log('图片生成成功，URL:', imageUrl);
    
    // 步骤3：保存到数据库
    try {
      const db = cloud.database();
      await db.collection('ai_history').add({
        data: {
          prompt: prompt.trim(),
          shape,
          glaze,
          imageUrl,
          createdAt: db.serverDate()
        }
      });
      console.log('数据保存成功');
    } catch (dbError) {
      console.error('数据库保存失败:', dbError.message);
      // 数据库保存失败不影响返回结果
    }
    
    return { success: true, imageUrl: imageUrl };
    
  } catch (err) {
    console.error('云函数执行错误:', err.message);
    return { 
      success: false, 
      error: err.message || '网络异常，请稍后重试' 
    };
  }
};
