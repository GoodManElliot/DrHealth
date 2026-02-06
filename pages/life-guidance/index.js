const WXAPI = require('apifm-wxapi')
const APP = getApp()

Page({
  data: {
    navHeight: 0,
    navTop: 0,
    windowHeight: 0,
    menuButtonObject: {},
    
    // 生活指导内容
    guidanceList: [
      {
        id: 1,
        title: '饮食指导',
        icon: '🍽️',
        color: '#FF6B6B',
        items: [
          '低嘌呤饮食原则',
          '推荐食物清单',
          '避免食物清单',
          '饮食搭配建议'
        ]
      },
      {
        id: 2,
        title: '运动指导',
        icon: '🏃‍♂️',
        color: '#4ECDC4',
        items: [
          '适宜运动类型',
          '运动强度控制',
          '运动时间安排',
          '注意事项'
        ]
      },
      {
        id: 3,
        title: '作息指导',
        icon: '😴',
        color: '#45B7D1',
        items: [
          '规律作息时间',
          '充足睡眠',
          '避免熬夜',
          '放松技巧'
        ]
      },
      {
        id: 4,
        title: '心理指导',
        icon: '🧘‍♀️',
        color: '#96CEB4',
        items: [
          '情绪管理',
          '压力缓解',
          '积极心态',
          '社交支持'
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

  // 点击指导项目
  onGuidanceTap: function(e) {
    const guidance = e.currentTarget.dataset.guidance
    wx.navigateTo({
      url: `/pages/guidance-detail/index?type=life&id=${guidance.id}&title=${guidance.title}`
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

