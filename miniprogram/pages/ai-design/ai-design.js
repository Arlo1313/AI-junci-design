// miniprogram/pages/ai-design/ai-design.js
const tracker = require('../../utils/tracker.js');

Page({
  data: {
    prompt: '青山远黛，云海翻涌',
    shape: '梅瓶',
    glaze: '天青',
    shapes: ['梅瓶', '茶盏', '笔筒', '花器'],
    glazes: ['天青', '铜红', '月白', '窑变'],
    isGenerating: false,
    showResult: false,
    result: null,
    progress: 0
  },

  onLoad() {
    tracker.track('ai_page_view', {});
  },

  onInput(e) {
    this.setData({ prompt: e.detail.value });
  },

  selectShape(e) {
    const shape = e.currentTarget.dataset.v;
    this.setData({ shape: shape });
    tracker.track('ai_shape_select', { shape: shape });
  },

  selectGlaze(e) {
    const glaze = e.currentTarget.dataset.v;
    this.setData({ glaze: glaze });
    tracker.track('ai_glaze_select', { glaze: glaze });
  },

  // ===== 修复后的：云函数中转下载，无语法错误 =====
  uploadToCloud(tempUrl, fileName) {
    return new Promise((resolve) => {
      // 调用你已部署的 downloadImage 云函数
      wx.cloud.callFunction({
        name: 'downloadImage',
        data: {
          imageUrl: tempUrl
        }
      }).then((res) => {
        if (res.result && res.result.success) {
          // 直接返回云存储的临时链接
          resolve(res.result.tempUrl);
        } else {
          console.error('云函数下载失败:', res.result?.error || '未知错误');
          resolve(tempUrl);
        }
      }).catch((err) => {
        console.error('调用云函数异常:', err);
        resolve(tempUrl);
      });
    });
  },

  saveToMyCreation(result) {
    if (!result || !result.image) return;
    
    let creations = wx.getStorageSync('ai_creations') || [];
    let times = wx.getStorageSync('ai_creation_times') || [];
    let details = wx.getStorageSync('ai_creation_details') || [];
    
    creations.unshift(result.image);
    times.unshift(new Date().toLocaleString());
    details.unshift({
      title: result.title,
      shape: result.shapeName,
      glaze: result.glazeName,
      price: result.price,
      prompt: this.data.prompt
    });
    
    if (creations.length > 20) {
      creations = creations.slice(0, 20);
      times = times.slice(0, 20);
      details = details.slice(0, 20);
    }
    
    wx.setStorageSync('ai_creations', creations);
    wx.setStorageSync('ai_creation_times', times);
    wx.setStorageSync('ai_creation_details', details);
  },

  // ===== 核心：生成成功后转存云存储 =====
  onGenerate() {
    const { prompt, shape, glaze } = this.data;

    if (!prompt.trim()) {
      wx.showToast({ title: '请输入描述词', icon: 'none' });
      return;
    }

    this.setData({ isGenerating: true, progress: 0, showResult: false });

    tracker.track('ai_generate_click', {
      prompt_length: prompt.trim().length,
      shape: shape,
      glaze: glaze
    });

    const timer = setInterval(() => {
      this.setData({ progress: Math.min(this.data.progress + Math.random() * 15 + 5, 90) });
    }, 500);

    wx.cloud.callFunction({
      name: 'generateImage',
      data: { prompt: prompt.trim(), shape, glaze },
      timeout: 60000
    }).then((res) => {
      clearInterval(timer);
      this.setData({ isGenerating: false, progress: 0 });

      if (res.result && res.result.success) {
        tracker.track('ai_generate_success', {
          shape: shape,
          glaze: glaze,
          source: 'cloud_function',
          prompt_length: prompt.trim().length
        });

        // 调用修复后的 uploadToCloud
        return this.uploadToCloud(res.result.imageUrl, `design_${Date.now()}`)
          .then((cloudFileID) => {
            const resultData = {
              id: Date.now().toString(),
              title: shape + ' · ' + prompt.substring(0, 10) + '...',
              image: cloudFileID,
              shapeName: shape,
              glazeName: glaze,
              price: 299
            };

            this.saveToMyCreation(resultData);

            this.setData({
              showResult: true,
              result: resultData
            });
            wx.showToast({ title: 'AI生成成功', icon: 'none' });
          });

      } else {
        console.error('云函数返回失败:', res.result);
        wx.showToast({ title: res.result.error || 'AI服务异常', icon: 'none' });
        this.fallbackGenerate(prompt, shape, glaze);
      }
    }).catch(err => {
      clearInterval(timer);
      this.setData({ isGenerating: false, progress: 0 });
      console.error('云函数调用异常:', err);
      wx.showToast({ title: '演示模式（云端未连接）', icon: 'none' });
      
      tracker.track('ai_generate_fail', {
        shape: shape,
        glaze: glaze,
        error: err.message || 'cloud_function_error'
      });
      
      this.fallbackGenerate(prompt, shape, glaze);
    });
  },

  fallbackGenerate(prompt, shape, glaze) {
    const imageMap = {
      '梅瓶': '/images/jun_porcelain_1.jpg',
      '茶盏': '/images/jun_porcelain_2.jpg',
      '笔筒': '/images/jun_porcelain_4.jpg',
      '花器': '/images/jun_porcelain_3.jpg'
    };
    
    tracker.track('ai_generate_success', {
      shape: shape,
      glaze: glaze,
      source: 'fallback_local',
      prompt_length: prompt.trim().length
    });
    
    const resultData = {
      id: Date.now().toString(),
      title: shape + ' · ' + prompt.substring(0, 10) + '...',
      image: imageMap[shape] || '/images/jun_porcelain_1.jpg',
      shapeName: shape,
      glazeName: glaze,
      price: 299
    };

    this.saveToMyCreation(resultData);

    this.setData({
      showResult: true,
      result: resultData
    });
  },

  previewImage() {
    if (this.data.result && this.data.result.image) {
      wx.previewImage({
        urls: [this.data.result.image],
        current: this.data.result.image
      });
    }
  },

  onAddToCart() {
    const result = this.data.result;
    if (!result) return;
    
    tracker.track('ai_add_to_cart_click', {
      shape: result.shapeName,
      glaze: result.glazeName,
      price: result.price,
      title_preview: result.title
    });
    
    const cart = wx.getStorageSync('cart') || [];
    cart.push({
      id: result.id,
      name: result.title,
      price: result.price,
      image: result.image,
      shape: result.shapeName,
      glaze: result.glazeName
    });
    wx.setStorageSync('cart', cart);
    wx.showToast({ title: '已加入定制车', icon: 'none' });
  }
});