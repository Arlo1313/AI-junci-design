// miniprogram/app.js
const tracker = require('./utils/tracker.js');

App({
  globalData: {
    cloudReady: false,
    openid: null
  },

  onLaunch(options) {  // ← 注意加了 options 参数
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: 'cloud1-d7g8ezg3gbf2bad70',
          traceUser: true
        });
        this.globalData.cloudReady = true;
        console.log('云开发初始化成功');
        
        // ===== 新增：上报小程序启动 =====
        tracker.track('app_launch', {
          scene: options.scene || 'unknown',
          path: options.path || ''
        });
        
      } catch (e) {
        console.log('云开发初始化失败:', e.message);
        this.globalData.cloudReady = false;
      }
    } else {
      console.log('当前基础库不支持云开发');
      this.globalData.cloudReady = false;
    }
  },

  // ===== 新增：小程序切换到前台 =====
  onShow() {
    tracker.track('app_show', {});
  }
});