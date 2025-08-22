/**
 * API统一入口文件
 * 统一管理所有API接口
 */

// 导入所有API模块
import { barrageApi, qrcodeApi } from './barrage'

// 统一导出所有API
export {
  barrageApi,
  qrcodeApi
}

// 默认导出API对象
export default {
  barrage: barrageApi,
  qrcode: qrcodeApi
}

/**
 * 使用示例：
 * 
 * // 方式1：按需导入
 * import { barrageApi, qrcodeApi } from '@/api'
 * 
 * // 发送弹幕
 * barrageApi.send({
 *   content: '这是一条测试弹幕',
 *   nickname: '测试用户',
 *   roomId: 'room123'
 * })
 * 
 * // 获取弹幕列表
 * barrageApi.getList({ roomId: 'room123', limit: 20 })
 * 
 * // 生成二维码
 * qrcodeApi.generate({ roomId: 'room123' })
 * 
 * // 方式2：默认导入
 * import api from '@/api'
 * 
 * // 发送弹幕
 * api.barrage.send({ content: '测试弹幕' })
 * 
 * // 获取二维码统计
 * api.qrcode.getStats()
 */