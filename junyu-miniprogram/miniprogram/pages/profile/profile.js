Page({
  showTip(e) {
    wx.showToast({ title: e.currentTarget.dataset.msg, icon: 'none' });
  }
});