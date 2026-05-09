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

  onInput(e) {
    this.setData({ prompt: e.detail.value });
  },

  selectShape(e) {
    this.setData({ shape: e.currentTarget.dataset.v });
  },

  selectGlaze(e) {
    this.setData({ glaze: e.currentTarget.dataset.v });
  },

  onGenerate() {
    const { prompt, shape, glaze } = this.data;

    if (!prompt.trim()) {
      wx.showToast({ title: '请输入描述词', icon: 'none' });
      return;
    }

    this.setData({ isGenerating: true, progress: 0, showResult: false });

    // 进度条动画
    const timer = setInterval(() => {
      this.setData({ progress: Math.min(this.data.progress + Math.random() * 15 + 5, 90) });
    }, 500);

    // 直接调用云函数，不检查 cloudReady
    wx.cloud.callFunction({
      name: 'generateImage',
      data: { prompt: prompt.trim(), shape, glaze },
      timeout: 60000
    }).then(res => {
      clearInterval(timer);
      this.setData({ isGenerating: false, progress: 0 });

      if (res.result && res.result.success) {
        // ✅ 真实AI返回
        this.setData({
          showResult: true,
          result: {
            id: Date.now().toString(),
            title: shape + ' · ' + prompt.substring(0, 10) + '...',
            image: res.result.imageUrl,
            shapeName: shape,
            glazeName: glaze,
            price: 299
          }
        });
        wx.showToast({ title: 'AI生成成功', icon: 'none' });
      } else {
        // 云函数返回了，但执行失败（如API Key无效）
        console.error('云函数返回失败:', res.result);
        wx.showToast({ title: res.result.error || 'AI服务异常', icon: 'none' });
        this.fallbackGenerate(prompt, shape, glaze);
      }
    }).catch(err => {
      // 调用失败（未部署、网络问题、环境不存在）
      clearInterval(timer);
      this.setData({ isGenerating: false, progress: 0 });
      console.error('云函数调用异常:', err);
      wx.showToast({ title: '演示模式（云端未连接）', icon: 'none' });
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
    this.setData({
      showResult: true,
      result: {
        id: Date.now().toString(),
        title: shape + ' · ' + prompt.substring(0, 10) + '...',
        image: imageMap[shape] || '/images/jun_porcelain_1.jpg',
        shapeName: shape,
        glazeName: glaze,
        price: 299
      }
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