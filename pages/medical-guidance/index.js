const WXAPI = require('apifm-wxapi')
const APP = getApp()

Page({
  data: {
    navHeight: 0,
    navTop: 0,
    windowHeight: 0,
    menuButtonObject: {},
    
    // 医学指导内容
    medicalList: [
      {
        id: 1,
        title: '疾病认知',
        icon: '🔬',
        color: '#4ECDC4',
        items: [
          '高尿酸血症定义',
          '痛风发病机制',
          '并发症风险',
          '疾病分级标准'
        ]
      },
      {
        id: 2,
        title: '检查指导',
        icon: '🩺',
        color: '#45B7D1',
        items: [
          '血尿酸检测',
          '肾功能检查',
          '影像学检查',
          '定期复查时间'
        ]
      },
      {
        id: 3,
        title: '用药指导',
        icon: '💊',
        color: '#96CEB4',
        items: [
          '降尿酸药物',
          '止痛药物',
          '用药注意事项',
          '药物相互作用'
        ]
      },
      {
        id: 4,
        title: '治疗原则',
        icon: '⚕️',
        color: '#FFB6C1',
        items: [
          '急性期治疗',
          '缓解期治疗',
          '长期管理',
          '预防复发'
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
  onMedicalTap: function(e) {
    const medical = e.currentTarget.dataset.medical
    wx.navigateTo({
      url: `/pages/guidance-detail/index?type=medical&id=${medical.id}&title=${medical.title}`
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


