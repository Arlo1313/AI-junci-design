// miniprogram/utils/tracker.js

function getUserId() {
  let userId = wx.getStorageSync('tracker_user_id');
  if (!userId) {
    userId = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    wx.setStorageSync('tracker_user_id', userId);
  }
  return userId;
}

function getCommonProps() {
  const sysInfo = wx.getSystemInfoSync();
  return {
    user_id: getUserId(),
    app_version: '1.0.0',
    platform: sysInfo.platform,
    system: sysInfo.system,
    timestamp: new Date().toISOString()
  };
}

function track(eventName, properties = {}) {
  // 关键修改：在这里再调用 wx.cloud.database()
  // 确保 wx.cloud.init() 已经执行过了
  if (!wx.cloud) {
    console.error('[埋点] 云开发未初始化');
    return;
  }
  
  const db = wx.cloud.database();
  
  console.log('[埋点]', eventName, properties);
  
  db.collection('event_logs').add({
    data: {
      event: eventName,
      ...getCommonProps(),
      ...properties,
      local_time: db.serverDate()
    },
    success: (res) => {
      console.log('[埋点成功]', eventName, res._id);
    },
    fail: (err) => {
      console.error('[埋点失败]', eventName, err);
    }
  });
}

module.exports = { track };