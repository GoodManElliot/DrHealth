'use strict'

const Core = require('@alicloud/pop-core')

/**
 * 云函数：银行卡三要素核验（调用阿里云 BankMetaVerify）
 * 需在云开发控制台配置环境变量：ALIYUN_ACCESS_KEY_ID、ALIYUN_ACCESS_KEY_SECRET
 */
exports.main = async (event, context) => {
  const { bankNo, realName, idCard } = event || {}
  if (!bankNo || !realName || !idCard) {
    return { code: -1, verified: false, msg: '参数不完整：需要银行卡号、姓名、身份证号' }
  }

  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET
  if (!accessKeyId || !accessKeySecret) {
    console.error('未配置阿里云 AccessKey，请在云函数环境变量中配置')
    return { code: -2, verified: false, msg: '服务未配置，请联系管理员' }
  }

  const client = new Core({
    accessKeyId,
    accessKeySecret,
    endpoint: 'https://cloudauth.aliyuncs.com',
    apiVersion: '2019-03-07'
  })

  const params = {
    ParamType: 'normal',
    VerifyMode: 'VERIFY_BANK_CARD',
    ProductType: 'BANK_CARD_3_META',
    BankCard: String(bankNo).trim().replace(/\s/g, ''),
    UserName: String(realName).trim(),
    IdentifyNum: String(idCard).trim().replace(/\s/g, '')
  }

  try {
    const res = await client.request('BankMetaVerify', params, { method: 'POST' })
    const code = res.Code
    const resultObj = res.ResultObject || {}
    const bizCode = resultObj.BizCode
    const subCode = resultObj.SubCode

    if (code !== '200') {
      return { code: 1, verified: false, msg: res.Message || '核验请求失败' }
    }
    // BizCode: 1 一致 2 不一致 3 查无记录
    if (bizCode === '1' && subCode === '101') {
      return { code: 0, verified: true, msg: '核验通过' }
    }
    if (bizCode === '2') {
      const reason = subCodeReason(subCode)
      return { code: 2, verified: false, msg: reason || '持卡人信息与银行卡不一致' }
    }
    if (bizCode === '3') {
      return { code: 3, verified: false, msg: '查无记录，请核对信息' }
    }
    return { code: 4, verified: false, msg: resultObj.SubCode ? subCodeReason(resultObj.SubCode) : '核验未通过' }
  } catch (err) {
    console.error('BankMetaVerify error:', err)
    const msg = err.message || err.code || '核验服务异常'
    return { code: 500, verified: false, msg: String(msg) }
  }
}

function subCodeReason(subCode) {
  const map = {
    '201': '持卡人信息有误',
    '202': '银行卡未开通认证支付',
    '203': '银行卡已过期',
    '204': '银行卡为受限制的卡',
    '210': '此卡已挂失',
    '214': '未预留手机号',
    '301': '银行卡不支持该业务',
    '302': '验证失败或银行拒绝验证',
    '304': '银行卡号有误',
    '305': '其他原因无法验证'
  }
  return map[String(subCode)] || null
}
