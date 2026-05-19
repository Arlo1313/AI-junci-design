// miniprogram/pages/index/index.js
const tracker = require('../../utils/tracker.js');

Page({
  data: {
    activeSeries: 'zodiac',
    showZodiac: false,
    zodiacList: [
      { name: '鼠', image: '/images/鼠.jpg' },
      { name: '牛', image: '/images/牛.jpg' },
      { name: '虎', image: '/images/虎.jpg' },
      { name: '兔', image: '/images/兔.jpg' },
      { name: '龙', image: '/images/龙.jpg' },
      { name: '蛇', image: '/images/蛇.jpg' },
      { name: '马', image: '/images/马.jpg' },
      { name: '羊', image: '/images/羊.jpg' },
      { name: '猴', image: '/images/猴.jpg' },
      { name: '鸡', image: '/images/鸡.jpg' },
      { name: '狗', image: '/images/狗.jpg' },
      { name: '猪', image: '/images/猪.jpg' }
    ],
    jewelryList: [
      { name: '瑞彩·祥瑞', image: '/images/吊坠1.jpg', price: '¥79' },
      { name: '星空吊坠', image: '/images/吊坠2.jpg', price: '¥299' },
      { name: '铜红挂饰', image: '/images/吊坠3.jpg', price: '¥158' },
      { name: '观音玉佩', image: '/images/吊坠4.jpg', price: '¥368' }
    ],
    cupList: [
      { name: '天青茶盏', image: '/images/杯子1.jpg', price: '¥89' },
      { name: '窑变品茗杯', image: '/images/杯子2.jpg', price: '¥128' },
      { name: '月白主人杯', image: '/images/杯子3.jpg', price: '¥156' },
      { name: '玫瑰红茶杯', image: '/images/杯子4.jpg', price: '¥98' },
      { name: '星空盏', image: '/images/杯子5.jpg', price: '¥188' },
      { name: '山水杯', image: '/images/杯子6.jpg', price: '¥136' }
    ]
  },

  onLoad: function(options) {
    tracker.track('home_page_view', {
      source: options.source || 'direct'
    });
  },

  goAI: function() {
    tracker.track('home_ai_design_click', {});
    wx.switchTab({
      url: '/pages/ai-design/ai-design'
    });
  },

  goMaster: function() {
    wx.navigateTo({
      url: '/pages/master/master'
    });
  },

  goBlindBox: function() {
    wx.navigateTo({
      url: '/pages/blind-box/blind-box'
    });
  },

  showTip: function(e) {
    wx.showToast({
      title: e.currentTarget.dataset.msg,
      icon: 'none'
    });
  },

  switchSeries: function(e) {
    const series = e.currentTarget.dataset.series;
    this.setData({
      activeSeries: series,
      showZodiac: false
    });
  },

  toggleZodiac: function() {
    this.setData({
      showZodiac: !this.data.showZodiac
    });
  },

  showZodiacDetail: function(e) {
    const item = e.currentTarget.dataset.item;
    wx.showToast({
      title: item.name + '年生肖钧瓷',
      icon: 'none'
    });
  },

  previewImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const listname = e.currentTarget.dataset.listname;
    const urls = this.data[listname].map(function(item) {
      return item.image;
    });
    
    wx.previewImage({
      current: urls[index],
      urls: urls,
      showmenu: true
    });
  }
});