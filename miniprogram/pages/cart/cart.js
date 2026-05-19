Page({
  data: {
    items: [],
    total: 0
  },

  onShow() {
    let cart = wx.getStorageSync('cart') || [];
    
    let hasExpired = false;
    cart = cart.map(item => {
      if (item.image && (item.image.includes('dashscope') || item.image.includes('aliyuncs.com'))) {
        hasExpired = true;
        return { ...item, image: '/images/placeholder.png' };
      }
      return item;
    });
    
    if (hasExpired) {
      wx.setStorageSync('cart', cart);
    }
    
    const total = cart.reduce((s, i) => s + (i.price || 0), 0);
    this.setData({ items: cart, total });
  },

  onImgError(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items;
    
    if (items[index]) {
      items[index].image = '/images/placeholder.png';
      this.setData({ items });
    }
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