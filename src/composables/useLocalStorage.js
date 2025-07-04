const storage = {
  /**
   * 获取存储值
   * @param {string} key 存储键名
   * @param {any} defaultValue 默认值
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`读取 localStorage 键值 ${key} 失败:`, error)
      return defaultValue
    }
  },

  /**
   * 设置存储值
   * @param {string} key 存储键名
   * @param {any} value 存储值
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`存储到 localStorage 键值 ${key} 失败:`, error)
      
      // 处理存储空间不足的情况
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage 存储空间已满，尝试清理...')
        this.clearExpired()
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
          console.error('再次存储失败，请清理数据', e)
        }
      }
    }
  },

  /**
   * 移除指定键值
   * @param {string} key 要移除的键名
   */
  remove(key) {
    localStorage.removeItem(key)
  },

  /**
   * 清空所有 localStorage
   */
  clear() {
    localStorage.clear()
  },

  /**
   * 清理过期的存储项（需要项目实现过期机制）
   */
  clearExpired() {
    Object.keys(localStorage).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key))
        if (item?.expires && Date.now() > item.expires) {
          localStorage.removeItem(key)
        }
      } catch (e) {
        // 非JSON格式数据直接删除
        localStorage.removeItem(key)
      }
    })
  },

  /**
   * 带过期时间的存储
   * @param {string} key 存储键名
   * @param {any} value 存储值
   * @param {number} ttl 有效期(毫秒)
   */
  setWithTTL(key, value, ttl = 24 * 60 * 60 * 1000) {
    this.set(key, {
      value,
      expires: Date.now() + ttl
    })
  },

  /**
   * 获取带过期时间的存储
   * @param {string} key 存储键名
   * @param {any} defaultValue 默认值
   * @returns {any}
   */
  getWithTTL(key, defaultValue = null) {
    try {
      const item = this.get(key)
      if (item?.expires) {
        return Date.now() > item.expires ? defaultValue : item.value
      }
      return defaultValue
    } catch (error) {
      console.error(`读取 TTL 存储键值 ${key} 失败:`, error)
      return defaultValue
    }
  }
}

export default storage