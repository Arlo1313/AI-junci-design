Page({
  // 页面初始数据
  data: {},

  // 点击AI设计按钮跳转到对应页面
  goAI() {
    wx.switchTab({
      url: '/pages/ai-design/ai-design'
    });
  },

  // 点击盲盒/大师联名等按钮显示提示语
  showTip(e) {
    wx.showToast({
      title: e.currentTarget.dataset.msg,
      icon: 'none'
    });
  }
});