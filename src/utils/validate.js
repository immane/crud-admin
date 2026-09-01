/**
 * Created by PanJiaChen on 16/11/18.
 */

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  return str.trim().length > 3
}

/**
 * Check if password meets default policy: at least 6 chars, contains letter and number
 * @param {string} pwd
 * @returns {boolean}
 */
export function isPasswordCompliant(pwd) {
  if (!pwd || pwd.length < 6) return false
  return /[A-Za-z]/.test(pwd) && /[0-9]/.test(pwd)
}

/**
 * Create validator for password field
 * @param {() => string} getPassword - getter for current password
 * @param {() => string} getConfirm - getter for confirm value
 * @param {() => boolean} isVisible - getter for visibility state
 * @param {() => boolean} isCreate - getter for create mode
 * @param {(key:string)=>string} t - i18n translate function
 * @returns {Function} element-plus validator (rule, value, callback)
 */
export function createPasswordValidator(getPassword, getConfirm, isVisible, isCreate, t) {
  return (rule, value, callback) => {
    const pwd = value || getPassword() || ''
    if (!pwd) {
      if (isCreate && isCreate()) {
        return callback(new Error(t ? t('Password is required') : 'Password is required'))
      }
      return callback()
    }
    if (!isPasswordCompliant(pwd)) {
      return callback(new Error(t ? t('Password does not meet requirements') : 'Password does not meet requirements'))
    }
    if (!isVisible || !isVisible()) {
      const confirm = getConfirm ? getConfirm() : ''
      if (!confirm) {
        return callback(new Error(t ? t('Please confirm password') : 'Please confirm password'))
      }
      if (pwd !== confirm) {
        return callback(new Error(t ? t('Passwords do not match') : 'Passwords do not match'))
      }
    }
    callback()
  }
}
