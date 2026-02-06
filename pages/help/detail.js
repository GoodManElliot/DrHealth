const WXAPI = require('apifm-wxapi')
Page({
  data: {
    comments: [],
    commentText: '',
    loading: false
  },
  onLoad: function (options) {
    // options.id = 34094
    this.data.id = options.id
    this.data.source = options.source || 'science' // 默认为科普园地
    this.fetchDetail()
    this.loadComments()
  },
  onShow: function () {

  },
  async fetchDetail() {
    console.log('获取文章详情，ID:', this.data.id)
    const res = await WXAPI.cmsArticleDetailV3({ id: this.data.id })
    console.log('文章详情接口返回:', res)
    
    if (res.code == 0) {
      console.log('文章信息:', res.data.info)
      console.log('文章ID确认:', res.data.info.id)
      const info = res.data.info || {}
      const base = info.base || {}
      const displayVvRaw = info.vv ?? info.views ?? info.readCount ?? base.vv ?? base.views ?? 0
      const displayVv = typeof displayVvRaw === 'number' ? displayVvRaw : parseInt(displayVvRaw || 0, 10)
      this.setData({
        cmsArticleDetail: {
          ...info,
          displayVv
        }
      })
      wx.setNavigationBarTitle({
        title: res.data.info.title,
      })
    }
  },
  onShareAppMessage: function() {
    const uid = wx.getStorageSync('uid')
    return {
      title: wx.getStorageSync('mallName') + ' - ' + this.data.cmsArticleDetail.title,
      path: `/pages/help/detail?id=${this.data.id}&inviter_id=${ uid ? uid : ''}`,
      imageUrl: wx.getStorageSync('share_pic')
    }
  },
  onShareTimeline() {
    const uid = wx.getStorageSync('uid')   
    return {
      title: wx.getStorageSync('mallName') + ' - ' + this.data.cmsArticleDetail.title,
      query: `id=${this.data.id}&inviter_id=${ uid ? uid : ''}`,
      imageUrl: wx.getStorageSync('share_pic')
    }
  },

  // 加载评论列表
  async loadComments() {
    try {
      console.log('加载评论，文章ID:', this.data.id)
      console.log('评论接口参数:', {
        refId: this.data.id,
        page: 1,
        pageSize: 50,
        type: 3
      })
      
      // 根据API工厂文档，使用正确的评论列表接口
      // refId 是业务ID，对于文章评论就是文章ID
      const res = await WXAPI.commentList({
        refId: this.data.id,
        page: 1,
        pageSize: 50,
        type: 3  // CMS文章评论类型
      })
      
      console.log('评论接口返回:', res)
      
      if (res.code === 0) {
        const comments = res.data || []
        console.log('原始评论数据:', comments)
        
        // 处理评论数据，确保用户信息完整
        const processedComments = comments.map(comment => {
          console.log('处理评论:', comment)
          
          // 根据实际返回的数据结构，用户信息在commentUserInfo字段中
          const userInfo = {
            nick: comment.commentUserInfo?.nick || 
                  comment.base?.nick || 
                  comment.user?.nick || 
                  comment.nick || 
                  '匿名用户',
            avatarUrl: comment.commentUserInfo?.avatarUrl || 
                      comment.base?.avatarUrl || 
                      comment.user?.avatarUrl || 
                      comment.avatarUrl || 
                      '/images/nologin.png'
          }
          
          console.log('处理后的用户信息:', userInfo)
          
          return {
            ...comment,
            user: userInfo
          }
        })
        
        console.log('最终评论数据:', processedComments)
        
        this.setData({
          comments: processedComments
        })
      } else {
        console.error('评论接口返回错误:', res)
      }
    } catch (error) {
      console.error('加载评论失败:', error)
    }
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    })
  },

  // 提交评论
  async submitComment() {
    if (this.data.loading) {
      return
    }

    const commentText = this.data.commentText.trim()
    if (!commentText) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      })
      return
    }

    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      console.log('提交评论，文章ID:', this.data.id, '内容:', commentText)
      console.log('评论提交参数:', {
        token: token,
        refId: this.data.id,
        content: commentText,
        type: 3
      })
      
      // 根据API工厂文档，使用正确的评论添加接口
      // refId 是业务ID，对于文章评论就是文章ID
      const res = await WXAPI.addComment({
        token: token,
        refId: this.data.id,
        content: commentText,
        type: 3  // CMS文章评论类型
      })
      
      console.log('评论提交返回:', res)

      if (res.code === 0) {
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        })
        
        // 清空输入框
        this.setData({
          commentText: ''
        })
        
        // 重新加载评论列表
        setTimeout(() => {
          this.loadComments()
        }, 1000)
      } else {
        wx.showToast({
          title: res.msg || '评论失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('提交评论失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },


  // 滚动到评论区域
  scrollToComments() {
    wx.pageScrollTo({
      selector: '.comments-section',
      duration: 300
    })
  }

})