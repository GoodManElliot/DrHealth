const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

Page({

  data: {
    balance: 0.00,
    withdrawType: 'wechat', // wechat | bank
    bankInfo: null
  },

  onLoad: function(options) {
    this.setData({
      balance_pay_pwd: wx.getStorageSync('balance_pay_pwd')
    })
  },

  onShow: function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        AUTH.login(this)
      } else {
        this.userAmount()
        if (this.data.withdrawType === 'bank') {
          this.fetchBankInfo()
        }
      }
    })
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ withdrawType: type })
    if (type === 'bank') {
      this.fetchBankInfo()
    }
  },

  async fetchBankInfo() {
    const res = await WXAPI.userBankInfo(wx.getStorageSync('token'))
    const info = res.code === 0 && res.data ? (res.data.info || res.data) : null
    if (info && (info.id || info.bankCardNumber || info.bankNo || info.cardNo)) {
      const cardNo = String(info.bankCardNumber || info.bankNo || info.cardNo || '')
      info.bankCardTail = cardNo.slice(-4) || '****'
      this.setData({ bankInfo: info })
    } else {
      this.setData({ bankInfo: null })
    }
  },

  goBindBank() {
    wx.navigateTo({
      url: '/pages/bank-card/bind'
    })
  },

  onUnbindBank() {
    wx.showModal({
      title: '解绑银行卡',
      content: '确定解绑当前银行卡？解绑后可重新绑定新卡。',
      success: async (res) => {
        if (!res.confirm) return
        const r = await WXAPI.userBankUnBind(wx.getStorageSync('token'))
        if (r.code === 0) {
          this.setData({ bankInfo: null })
          wx.showToast({ title: '解绑成功', icon: 'success' })
        } else {
          wx.showToast({ title: r.msg || '解绑失败', icon: 'none' })
        }
      }
    })
  },

  async userAmount() {
    const res = await WXAPI.userAmount(wx.getStorageSync('token'))
    if (res.code === 0) {
      this.setData({
        balance: res.data.balance
      })
    }
  },

  async bindSave() {
    const { withdrawType, bankInfo } = this.data
    if (withdrawType === 'bank') {
      const hasBank = bankInfo && (bankInfo.id || bankInfo.bankCardNumber || bankInfo.bankNo || bankInfo.cardNo)
      if (!hasBank) {
        wx.showToast({
          title: '请先绑定银行卡',
          icon: 'none'
        })
        return
      }
    }

    let minWidthAmount = wx.getStorageSync('WITHDRAW_MIN')
    if (!minWidthAmount) {
      minWidthAmount = 0
    }
    const amount = this.data.amount
    if (!amount) {
      wx.showToast({
        title: '请填写正确的提现金额',
        icon: 'none'
      })
      return
    }
    if (this.data.balance_pay_pwd == '1' && !this.data.pwd) {
      wx.showToast({
        title: '请输入交易密码',
        icon: 'none'
      })
      return
    }
    if (amount * 1 < minWidthAmount) {
      wx.showToast({
        title: '提现金额不能低于' + minWidthAmount,
        icon: 'none'
      })
      return
    }
    if (withdrawType === 'wechat' && amount * 1 > 200) {
      wx.showToast({
        title: '单次提现不能超过200元',
        icon: 'none'
      })
      return
    }

    if (withdrawType === 'wechat') {
      if (amount * 1 > 2000) {
        if (!this.data.name) {
          wx.showToast({
            title: '请输入真实姓名',
            icon: 'none'
          })
          return
        }
      } else {
        this.data.name = ''
      }
    }

    this.doWithdrawSubmit(amount)
  },

  async doWithdrawSubmit(amount) {
    const { withdrawType, bankInfo } = this.data
    // 按申请提现 V3 接口：token, money, pwd, name, bankName, bankBranch, bankCardNumber, extJsonStr
    const payload = {
      token: wx.getStorageSync('token'),
      money: amount,
      pwd: this.data.pwd ? this.data.pwd : '',
      name: withdrawType === 'wechat' ? (this.data.name || '') : ''
    }
    if (withdrawType === 'bank' && bankInfo) {
      payload.name = bankInfo.name || bankInfo.realName || bankInfo.linkMan || ''
      payload.bankCardNumber = bankInfo.bankCardNumber || bankInfo.bankNo || bankInfo.cardNo || ''
      payload.bankName = bankInfo.bankName || bankInfo.bank_name || bankInfo.openBank || ''
      payload.bankBranch = bankInfo.bankBranch || ''
    }
    const res = await WXAPI.withDrawApplyV2(payload)
    if (res.code == 0) {
      let content = withdrawType === 'wechat' ? '您的提现申请已提交\n\n请待审核完成后24小时内至提现记录中接收转账' : '您的提现申请已提交，将打款至绑定银行卡'
      wx.showModal({
        title: '成功',
        content: content,
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack({ delta: 0 })
          }
        }
      })
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  }
})
