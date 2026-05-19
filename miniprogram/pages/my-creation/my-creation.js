Page({
  data: {
    creations: [],
    times: []
  },

  onLoad() {
    this.loadCreations()
  },

  onShow() {
    this.loadCreations()
  },

  loadCreations() {
    // 从本地存储读取AI生成的图片（假设在ai-design页面生成后保存）
    const creations = wx.getStorageSync('ai_creations') || []
    const times = wx.getStorageSync('ai_creation_times') || []
    this.setData({ creations, times })
  },

  previewImage(e) {
    const src = e.currentTarget.dataset.src
    wx.previewImage({
      urls: this.data.creations,
      current: src
    })
  },

  goToDesign() {
    wx.switchTab({
      url: '/pages/ai-design/ai-design'
    })
  }
})