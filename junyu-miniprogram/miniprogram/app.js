App({
  globalData: {
    cloudReady: false,
    openid: null
  },

  onLaunch() {
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: '************',
          traceUser: true
        });
        this.globalData.cloudReady = true;
        console.log('云开发初始化成功');
      } catch (e) {
        console.log('云开发初始化失败:', e.message);
        this.globalData.cloudReady = false;
      }
    } else {
      console.log('当前基础库不支持云开发');
      this.globalData.cloudReady = false;
    }
  }
});
