const WXAPI = require('apifm-wxapi')
const APP = getApp()

Page({
  data: {
    navHeight: 0,
    navTop: 0,
    categoryId: undefined,
    
    title: '',
    content: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      categoryId: options.categoryId
    })
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  // 内容输入
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  // 提交文章
  async submitArticle() {
    if (this.data.submitting) {
      return
    }

    const { title, content, categoryId } = this.data

    if (!title || !title.trim()) {
      wx.showToast({
        title: '请输入文章标题',
        icon: 'none'
      })
      return
    }

    if (!content || !content.trim()) {
      wx.showToast({
        title: '请输入文章内容',
        icon: 'none'
      })
      return
    }

    if (!categoryId) {
      wx.showToast({
        title: '分类信息错误',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        this.setData({ submitting: false })
        return
      }

      // 调用API工厂的文章发布接口
      const res = await WXAPI.cmsArticleCreate({
        token: token,
        categoryId: categoryId,
        title: title.trim(),
        content: content.trim()
      })

      console.log('发布文章返回:', res)

      if (res.code === 0) {
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 2000
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      } else {
        wx.showToast({
          title: res.msg || '发布失败',
          icon: 'none'
        })
        this.setData({ submitting: false })
      }
    } catch (error) {
      console.error('发布文章失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      this.setData({ submitting: false })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
