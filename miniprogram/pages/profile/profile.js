Page({
  data: {
    creationCount: 0
  },

  onShow() {
    const creations = wx.getStorageSync('ai_creations') || [];
    this.setData({
      creationCount: creations.length
    });
  },

  showTip(e) {
    wx.showToast({ title: e.currentTarget.dataset.msg, icon: 'none' });
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  }
});