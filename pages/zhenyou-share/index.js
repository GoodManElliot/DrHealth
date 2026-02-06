const WXAPI = require('apifm-wxapi')
const APP = getApp()

Page({
  data: {
    navHeight: 0,
    navTop: 0,
    windowHeight: 0,
    menuButtonObject: {},

    cmsCategoryId: undefined,
    cmsCategoryName: undefined,

    articles: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  // 统一派生文章阅读量字段
  deriveReadCount(article) {
    const base = article && article.base ? article.base : {}
    const vv =
      article?.vv ?? article?.views ?? article?.readCount ??
      base?.vv ?? base?.views ?? 0
    return typeof vv === 'number' ? vv : parseInt(vv || 0, 10)
  },

  onLoad(options) {
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject
    })
    this.initCmsCategory(options).then(() => {
      this.loadArticles()
    })
  },

  async initCmsCategory(options) {
    if (options && options.categoryId) {
      this.setData({ cmsCategoryId: options.categoryId })
      return
    }
    const cachedId = wx.getStorageSync('zhenyou_share_cms_category_id')
    if (cachedId) {
      this.setData({ cmsCategoryId: cachedId })
      return
    }
    const res = await WXAPI.cmsCategories()
    if (res.code == 0 && res.data) {
      let cat = res.data.find(ele => ele.type == 'zhenyou')
      if (!cat) {
        cat = res.data.find(ele => ele.name && (ele.name.indexOf('臻友') > -1 || ele.name.indexOf('分享') > -1))
      }
      if (cat) {
        this.setData({ cmsCategoryId: cat.id, cmsCategoryName: cat.name })
        wx.setStorageSync('zhenyou_share_cms_category_id', cat.id)
        return
      }
    }
    wx.showModal({
      title: '提示',
      content: '尚未在后台创建“臻友分享”CMS分类，请在内容管理新建分类（建议type设为zhenyou）。创建后返回重试。',
      showCancel: false
    })
  },

  async loadArticles() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })
    const res = await WXAPI.cmsArticlesV3({
      categoryId: this.data.cmsCategoryId || '',
      page: this.data.page,
      pageSize: this.data.pageSize
    })
    if (res.code == 0 && res.data) {
      const newListRaw = res.data.result || []
      const newList = newListRaw.map(it => ({
        ...it,
        displayVv: this.deriveReadCount(it)
      }))
      const articles = this.data.page === 1 ? newList : this.data.articles.concat(newList)
      this.setData({
        articles,
        hasMore: newList.length === this.data.pageSize,
        page: this.data.page + 1,
        loading: false
      })
    } else {
      this.setData({ loading: false, hasMore: false })
    }
  },

  onArticleTap(e) {
    const a = e.currentTarget.dataset.article
    wx.navigateTo({ url: `/pages/help/detail?id=${a.id}&source=zhenyou` })
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, articles: [] })
    this.loadArticles()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    this.loadArticles()
  },
  
  goBack() {
    wx.navigateBack()
  },
  
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  
})
