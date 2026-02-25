/**
 * 银行卡号校验
 * - 仅数字
 * - 长度 16～19 位（国内银行卡常见长度）
 * 注：已去掉 Luhn 校验，避免部分卡号或输错一位被误判
 */

/**
 * 校验银行卡号格式是否有效
 * @param {string} bankNo 银行卡号（可含空格，会先去除）
 * @returns {{ valid: boolean, msg?: string }}
 */
function validateBankCard(bankNo) {
  const raw = (bankNo || '').trim().replace(/\s/g, '')
  if (!raw) {
    return { valid: false, msg: '请输入银行卡号' }
  }
  if (!/^\d+$/.test(raw)) {
    return { valid: false, msg: '银行卡号只能为数字' }
  }
  if (raw.length < 16 || raw.length > 19) {
    return { valid: false, msg: '银行卡号一般为 16～19 位数字' }
  }
  return { valid: true }
}

/**
 * 真实姓名简单校验：2～20 个字符，仅中文或少数民族姓名中的 ·
 * @param {string} name
 * @returns {{ valid: boolean, msg?: string }}
 */
function validateRealName(name) {
  const raw = (name || '').trim()
  if (!raw) return { valid: false, msg: '请输入真实姓名' }
  if (raw.length < 2 || raw.length > 20) {
    return { valid: false, msg: '姓名长度为 2～20 个字符' }
  }
  if (!/^[\u4e00-\u9fa5·]+$/.test(raw)) {
    return { valid: false, msg: '姓名仅支持中文或间隔符·' }
  }
  return { valid: true }
}

/**
 * 身份证号格式校验（18 位）
 */
function validateIdCard(idCard) {
  const raw = (idCard || '').trim().replace(/\s/g, '')
  if (!raw) return { valid: false, msg: '请输入身份证号' }
  if (!/^\d{17}[\dXx]$/.test(raw)) {
    return { valid: false, msg: '请输入正确的18位身份证号' }
  }
  const weight = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const code = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) sum += parseInt(raw[i], 10) * weight[i]
  if (code[sum % 11] !== raw[17].toUpperCase()) {
    return { valid: false, msg: '身份证号格式不正确' }
  }
  return { valid: true }
}

module.exports = {
  validateBankCard,
  validateRealName,
  validateIdCard
}
