const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const CONFIG = require('../../config.js')
const APP = getApp()

Page({
  data: {
    navHeight: 0,
    navTop: 0,
    windowHeight: 0,
    menuButtonObject: {},
    
    // CMS 分类信息（后台可管理）
    cmsCategoryId: undefined,
    cmsCategoryName: undefined,

    // 精选文章数据
    articles: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    
    // 搜索相关
    searchKeyword: '',
    isSearching: false
  },

  // 统一派生文章阅读量字段
  deriveReadCount(article) {
    // 常见返回：vv / views / readCount / base.vv / base.views
    const base = article && article.base ? article.base : {}
    const vv =
      article?.vv ?? article?.views ?? article?.readCount ??
      base?.vv ?? base?.views ?? 0
    return typeof vv === 'number' ? vv : parseInt(vv || 0, 10)
  },

  onLoad: function(options) {
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject
    })
    // 初始化 CMS 分类（支持外部传入 categoryId、缓存、按类型/名称自动匹配）
    this.initCmsCategory(options).then(() => {
      this.loadArticles()
    })
  },

  onShow: function() {
    // 页面显示时的逻辑
  },

  // 初始化 CMS 分类
  async initCmsCategory(options) {
    try {
      // 优先取页面参数
      if (options && options.categoryId) {
        console.log('使用页面参数的分类ID:', options.categoryId)
        this.setData({ cmsCategoryId: options.categoryId })
        return
      }
      
      // 再取本地缓存
      const cachedId = wx.getStorageSync('science_garden_cms_category_id')
      if (cachedId) {
        console.log('使用缓存的分类ID:', cachedId)
        this.setData({ cmsCategoryId: cachedId })
        return
      }
      
      // 后台读取分类：推荐做法是在 API 工厂后台新建一个分类，type=science（或自定义），名称含"科普园地/科普"均可
      console.log('开始获取CMS分类列表...')
      const res = await WXAPI.cmsCategories()
      console.log('CMS分类列表返回:', res)
      
      if (res.code == 0 && res.data && res.data.length > 0) {
        // 匹配优先顺序：type === 'science' > 名称包含"科普园地/科普" > 第一个类型为 index 的分类
        let cat = res.data.find(ele => ele.type == 'science')
        console.log('查找type=science的分类:', cat)
        
        if (!cat) {
          cat = res.data.find(ele => ele.name && (ele.name.indexOf('科普园地') > -1 || ele.name.indexOf('科普') > -1))
          console.log('查找名称包含科普的分类:', cat)
        }
        
        if (!cat) {
          cat = res.data.find(ele => ele.type == 'index')
          console.log('查找type=index的分类:', cat)
        }
        
        if (cat) {
          console.log('找到匹配的分类:', cat)
          this.setData({ cmsCategoryId: cat.id, cmsCategoryName: cat.name })
          wx.setStorageSync('science_garden_cms_category_id', cat.id)
          return
        }
      }
      
      // 找不到分类时给出友好提示
      console.error('未找到匹配的CMS分类')
      wx.showModal({
        title: '提示',
        content: '尚未在后台创建"科普园地"CMS分类，请在API工厂后台-内容管理 新建分类（建议type设为science）。创建后返回重试。',
        showCancel: false
      })
    } catch (error) {
      console.error('初始化CMS分类失败:', error)
      wx.showToast({
        title: '初始化失败',
        icon: 'none'
      })
    }
  },

  // 加载精选文章（来自 API 工厂 CMS）
  async loadArticles() {
    if (this.data.loading || !this.data.hasMore) {
      return
    }
    
    this.setData({ loading: true })
    
    try {
      console.log('开始加载文章，分类ID:', this.data.cmsCategoryId)
      
      // 使用 CMS v3 列表接口（支持翻页）
      const res = await WXAPI.cmsArticlesV3({
        categoryId: this.data.cmsCategoryId || '',
        page: this.data.page,
        pageSize: this.data.pageSize
      })
      
      console.log('CMS文章接口返回:', res)
      
      if (res.code === 0 && res.data) {
        const newArticlesRaw = res.data.result || []
        const newArticles = newArticlesRaw.map(it => ({
          ...it,
          displayVv: this.deriveReadCount(it)
        }))
        const articles = this.data.page === 1 ? newArticles : [...this.data.articles, ...newArticles]
        
        console.log('获取到文章数量:', newArticles.length)
        console.log('当前页码:', this.data.page)
        
        // 如果第一页没有数据，显示提示
        if (this.data.page === 1 && newArticles.length === 0) {
          wx.showToast({
            title: '该分类暂无文章',
            icon: 'none'
          })
        }
        
        this.setData({
          articles: articles,
          hasMore: newArticles.length === this.data.pageSize,
          page: this.data.page + 1,
          loading: false
        })
      } else {
        console.error('文章接口返回错误:', res)
        this.setData({ loading: false, hasMore: false })
        wx.showToast({
          title: res.msg || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载文章失败:', error)
      this.setData({ loading: false, hasMore: false })
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    }
  },

  // 加载模拟文章数据
  loadMockArticles() {
    const mockArticles = [
      {
        id: 1,
        title: '食养控酸|风零研发实力有多强?',
        summary: '深入了解风零产品的研发背景和技术实力',
        pic: '/images/science/article1.jpg',
        createTime: '2024-01-15',
        readCount: 1250,
        category: '科普'
      },
      {
        id: 2,
        title: '一文带您读懂高尿酸和痛风!',
        summary: '全面解析高尿酸和痛风的成因、症状及预防方法',
        pic: '/images/science/article2.jpg',
        createTime: '2024-01-10',
        readCount: 2100,
        category: '科普'
      },
      {
        id: 3,
        title: '高尿酸饮食指南：哪些食物要少吃？',
        summary: '详细介绍高尿酸患者应该避免的食物清单',
        pic: '/images/science/article3.jpg',
        createTime: '2024-01-08',
        readCount: 1800,
        category: '生活指导'
      }
    ]
    
    this.setData({
      articles: mockArticles,
      loading: false,
      hasMore: false
    })
  },


  // 搜索输入变化
  onSearchChange: function(e) {
    const keyword = e.detail
    this.setData({ searchKeyword: keyword })
    
    // 如果搜索框为空，重新加载文章列表
    if (!keyword || keyword.trim() === '') {
      this.setData({
        isSearching: false,
        page: 1,
        hasMore: true,
        articles: []
      })
      this.loadArticles()
    }
  },

  // 执行搜索
  onSearch: function(e) {
    const keyword = e.detail || this.data.searchKeyword
    if (!keyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      isSearching: true,
      page: 1,
      hasMore: true,
      articles: []
    })
    this.searchArticles(keyword)
  },

  // 搜索文章
  async searchArticles(keyword) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      // 使用CMS文章搜索接口
      const res = await WXAPI.cmsArticlesV3({
        categoryId: this.data.cmsCategoryId || '',
        keyword: keyword,
        page: this.data.page,
        pageSize: this.data.pageSize
      })
      
      if (res.code === 0 && res.data) {
        const newArticles = res.data.result || []
        const articles = this.data.page === 1 ? newArticles : [...this.data.articles, ...newArticles]
        
        this.setData({
          articles: articles,
          hasMore: newArticles.length === this.data.pageSize,
          page: this.data.page + 1,
          loading: false
        })
      } else {
        this.setData({ loading: false, hasMore: false })
        if (this.data.page === 1) {
          wx.showToast({
            title: '未找到相关文章',
            icon: 'none'
          })
        }
      }
    } catch (error) {
      console.error('搜索文章失败:', error)
      this.setData({ loading: false, hasMore: false })
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    }
  },

  // 点击文章
  onArticleTap: function(e) {
    const article = e.currentTarget.dataset.article
    wx.navigateTo({
      // 复用现有帮助中心文章详情页（已接入 cmsArticleDetailV3）
      url: `/pages/help/detail?id=${article.id}&source=science`
    })
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      page: 1,
      hasMore: true,
      articles: []
    })
    this.loadArticles()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom: function() {
    if (this.data.isSearching) {
      this.searchArticles(this.data.searchKeyword)
    } else {
      this.loadArticles()
    }
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '科普园地 - 高尿酸自我管理',
      path: '/pages/science-garden/index',
      imageUrl: '/images/science/share.jpg'
    }
  },

  // 返回首页
  goHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack()
  },
  
  // 清除缓存并重新加载（调试用）
  clearCacheAndReload: function() {
    wx.showModal({
      title: '提示',
      content: '是否清除缓存并重新加载？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('science_garden_cms_category_id')
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
          setTimeout(() => {
            this.setData({
              cmsCategoryId: undefined,
              cmsCategoryName: undefined,
              articles: [],
              page: 1,
              hasMore: true
            })
            this.initCmsCategory({}).then(() => {
              this.loadArticles()
            })
          }, 1000)
        }
      }
    })
  }
})
