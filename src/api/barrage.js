import request from '@/utils/request'

/**
 * 弹幕相关API
 */
export const barrageApi = {
  /**
   * 发送弹幕
   * @param {Object} data - 弹幕数据
   * @param {string} data.content - 弹幕内容，不能为空，最大500字符
   * @param {string} [data.nickname] - 用户昵称，默认为"匿名用户"
   * @param {string} [data.roomId] - 房间ID，默认为"default"
   * @param {string} [data.color] - 弹幕颜色，默认为"#ffffff"
   * @param {number} [data.fontSize] - 字体大小，范围12-24，默认16
   * @returns {Promise}
   */
  send(data) {
    return request({
      url: '/barrage/send',
      method: 'POST',
      data
    })
  },

  /**
   * 获取弹幕列表
   * @param {Object} params - 查询参数
   * @param {string} [params.roomId] - 房间ID
   * @param {number} [params.limit=50] - 返回数量限制，默认50
   * @param {number} [params.offset=0] - 偏移量，默认0
   * @returns {Promise}
   */
  getList(params = {}) {
    return request({
      url: '/barrage/list',
      method: 'GET',
      params
    })
  },

  /**
   * 获取最新弹幕（轮询接口）
   * @param {Object} params - 查询参数
   * @param {string} params.roomId - 房间ID，不能为空
   * @param {number} [params.since] - 时间戳，获取此时间之后的弹幕
   * @param {number} [params.limit=10] - 返回数量限制，默认10，最大50
   * @returns {Promise}
   */
  getLatest(params) {
    return request({
      url: '/barrage/latest',
      method: 'GET',
      params
    })
  },

  /**
   * 清空弹幕
   * @param {Object} params - 查询参数
   * @param {string} [params.roomId] - 房间ID，不传则清空所有
   * @returns {Promise}
   */
  clear(params = {}) {
    return request({
      url: '/barrage/clear',
      method: 'DELETE',
      params
    })
  },

  /**
   * 获取弹幕统计信息
   * @param {Object} params - 查询参数
   * @param {string} [params.roomId] - 房间ID，获取指定房间统计
   * @returns {Promise}
   */
  getStats(params = {}) {
    return request({
      url: '/barrage/stats',
      method: 'GET',
      params
    })
  },

  /**
   * 删除指定弹幕
   * @param {string|number} id - 弹幕ID
   * @returns {Promise}
   */
  delete(id) {
    return request({
      url: `/barrage/${id}`,
      method: 'DELETE'
    })
  }
}

/**
 * 二维码相关API
 */
export const qrcodeApi = {
  /**
   * 生成二维码
   * @param {Object} params - 查询参数
   * @param {string} [params.roomId] - 房间ID，不提供则自动生成UUID
   * @param {string} [params.baseUrl] - 前端基础URL，默认为环境变量或localhost:3001
   * @returns {Promise}
   */
  generate(params = {}) {
    return request({
      url: '/qrcode/generate',
      method: 'GET',
      params
    })
  },

  /**
   * 获取房间二维码
   * @param {string} roomId - 房间ID
   * @param {Object} params - 查询参数
   * @param {string} [params.baseUrl] - 前端基础URL
   * @param {boolean} [params.refresh=false] - 是否强制刷新二维码，默认false
   * @returns {Promise}
   */
  getByRoom(roomId, params = {}) {
    return request({
      url: `/qrcode/${roomId}`,
      method: 'GET',
      params
    })
  },

  /**
   * 获取二维码信息
   * @param {string|number} qrId - 二维码ID
   * @returns {Promise}
   */
  getInfo(qrId) {
    return request({
      url: `/qrcode/info/${qrId}`,
      method: 'GET'
    })
  },

  /**
   * 获取二维码统计信息
   * @returns {Promise}
   */
  getStats() {
    return request({
      url: '/qrcode/stats',
      method: 'GET'
    })
  },

  /**
   * 清理过期的二维码
   * @returns {Promise}
   */
  cleanup() {
    return request({
      url: '/qrcode/cleanup',
      method: 'DELETE'
    })
  },

  /**
   * 删除指定二维码
   * @param {string|number} qrId - 二维码ID
   * @returns {Promise}
   */
  delete(qrId) {
    return request({
      url: `/qrcode/${qrId}`,
      method: 'DELETE'
    })
  },

  /**
   * 批量删除过期二维码（物理删除）
   * @param {Object} params - 查询参数
   * @param {number} [params.daysOld=7] - 删除多少天前的过期记录
   * @returns {Promise}
   */
  deleteExpired(params = {}) {
    return request({
      url: '/qrcode/cleanup/expired',
      method: 'DELETE',
      params
    })
  }
}

// 默认导出所有API
export default {
  barrage: barrageApi,
  qrcode: qrcodeApi
}