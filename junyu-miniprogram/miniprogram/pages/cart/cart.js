Page({
  data: {
    items: [],
    total: 0
  },

  onShow() {
    const cart = wx.getStorageSync('cart') || [];
    const total = cart.reduce((s, i) => s + (i.price || 0), 0);
    this.setData({ items: cart, total });
  },

  goAI() {
    wx.switchTab({ url: '/pages/ai-design/ai-design' });
  },

  submit() {
    wx.showToast({ title: '订单已提交', icon: 'success' });
    wx.setStorageSync('cart', []);
    this.setData({ items: [], total: 0 });
  }
});