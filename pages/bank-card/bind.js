const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const STATIC_BANK_LIST = require('../../utils/bankList')
const { validateBankCard, validateRealName } = require('../../utils/bankCardValidate')

const OTHER_BANK_ID = 'other'

Page({
  data: {
    banks: [],
    bankIndex: 0,
    bankNameManual: '',
    branchName: '',
    bankNo: '',
    realName: '',
    provinces: [],
    provinceIndex: 0,
    cities: [],
    cityIndex: 0
  },

  onLoad() {
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        AUTH.login(this)
      } else {
        this.loadBanks()
        this.loadProvinces()
      }
    })
  },

  async loadProvinces() {
    const res = await WXAPI.provinceV2()
    if (res.code === 0 && res.data && res.data.length) {
      this.setData({
        provinces: res.data
      })
      const first = res.data[0]
      if (first && first.id) {
        this.loadCities(first.id)
      }
    }
  },

  onProvinceChange(e) {
    const idx = parseInt(e.detail.value, 10)
    const province = this.data.provinces[idx]
    this.setData({
      provinceIndex: idx,
      cities: [],
      cityIndex: 0
    })
    if (province && province.id) {
      this.loadCities(province.id)
    }
  },

  async loadCities(provinceId) {
    const res = await WXAPI.nextRegionV2(provinceId)
    if (res.code === 0 && res.data && res.data.length) {
      this.setData({
        cities: res.data
      })
    }
  },

  onCityChange(e) {
    this.setData({
      cityIndex: parseInt(e.detail.value, 10)
    })
  },

  async loadBanks() {
    const res = await WXAPI.userBankSelectBanks()
    let list = (res.code === 0 && res.data && res.data.length) ? res.data : []
    if (!list.length) {
      list = STATIC_BANK_LIST
    }
    // 统一为 { id, name }，兼容接口返回 bankName/title 等字段
    list = list.map(item => ({
      id: item.id != null ? item.id : item.bankId || '',
      name: item.name || item.bankName || item.title || ''
    }))
    list = list.concat([{ id: OTHER_BANK_ID, name: '其他（手动填写）' }])
    this.setData({
      banks: list
    })
  },

  onBankPickerChange(e) {
    this.setData({
      bankIndex: parseInt(e.detail.value, 10)
    })
  },

  async bindSave() {
    const { banks, bankIndex, bankNameManual, branchName, bankNo, realName, provinces, provinceIndex, cities, cityIndex } = this.data
    const bank = banks[bankIndex]
    if (!bank) {
      wx.showToast({ title: '请选择银行', icon: 'none' })
      return
    }

    let bankName = bank.name || bank.bankName || bank.title || ''
    if (bank.id === OTHER_BANK_ID) {
      if (!bankNameManual || !bankNameManual.trim()) {
        wx.showToast({ title: '请输入银行名称', icon: 'none' })
        return
      }
      bankName = bankNameManual.trim()
    }

    const bankNoTrim = (bankNo || '').trim().replace(/\s/g, '')
    if (!bankNoTrim) {
      wx.showToast({ title: '请输入银行卡号', icon: 'none' })
      return
    }
    const cardCheck = validateBankCard(bankNoTrim)
    if (!cardCheck.valid) {
      wx.showToast({ title: cardCheck.msg, icon: 'none' })
      return
    }
    const realNameTrim = (realName || '').trim()
    if (!realNameTrim) {
      wx.showToast({ title: '请输入真实姓名', icon: 'none' })
      return
    }
    const nameCheck = validateRealName(realNameTrim)
    if (!nameCheck.valid) {
      wx.showToast({ title: nameCheck.msg, icon: 'none' })
      return
    }
    if (!branchName || !branchName.trim()) {
      wx.showToast({ title: '请输入支行名称', icon: 'none' })
      return
    }
    const province = provinces[provinceIndex]
    if (!province || !province.id) {
      wx.showToast({ title: '请选择所属省份', icon: 'none' })
      return
    }
    const city = cities[cityIndex]
    if (!city || !city.id) {
      wx.showToast({ title: '请选择所属城市', icon: 'none' })
      return
    }

    const branchTrim = branchName.trim()
    const openBank = branchTrim ? `${bankName} ${branchTrim}` : bankName

    const payload = {
      token: wx.getStorageSync('token'),
      provinceId: province.id,
      cityId: city.id,
      name: realNameTrim,
      bankCardNumber: bankNoTrim,
      bankName,
      bankBranch: branchTrim,
      openBank
    }
    if (bank.id && bank.id !== OTHER_BANK_ID) {
      payload.bankId = bank.id
    }

    const res = await WXAPI.userBankBind(payload)
    if (res.code === 0) {
      wx.showToast({ title: '绑定成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({ title: res.msg || '绑定失败', icon: 'none' })
    }
  }
})
