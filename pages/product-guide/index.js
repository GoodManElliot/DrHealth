const WXAPI = require('apifm-wxapi')
const APP = getApp()

Page({
  data: {
    navHeight: 0,
    navTop: 0,
    windowHeight: 0,
    menuButtonObject: {},
    
    // 风零产品内容
    productList: [
      {
        id: 1,
        title: '风零产品介绍',
        icon: '📦',
        color: '#D299C2',
        items: [
          '产品成分解析',
          '作用机制说明',
          '适用人群',
          '产品优势'
        ]
      },
      {
        id: 2,
        title: '使用方法',
        icon: '💡',
        color: '#FED6E3',
        items: [
          '服用方法',
          '服用剂量',
          '服用时间',
          '注意事项'
        ]
      },
      {
        id: 3,
        title: '效果评估',
        icon: '📊',
        color: '#A8EDEA',
        items: [
          '效果指标',
          '评估周期',
          '效果对比',
          '用户反馈'
        ]
      },
      {
        id: 4,
        title: '购买指导',
        icon: '🛒',
        color: '#FFB6C1',
        items: [
          '购买渠道',
          '价格说明',
          '优惠活动',
          '售后服务'
        ]
      }
    ]
  },

  onLoad: function(options) {
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject
    })
  },

  onShow: function() {
    // 页面显示时的逻辑
  },

  // 点击产品指导项目
  onProductTap: function(e) {
    const product = e.currentTarget.dataset.product
    wx.navigateTo({
      url: `/pages/guidance-detail/index?type=product&id=${product.id}&title=${product.title}`
    })
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  },

  // 返回首页
  goHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})


