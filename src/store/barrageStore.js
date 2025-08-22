import { defineStore } from 'pinia'

export const useBarrageStore = defineStore('barrageStore', {
  state: () => ({
    // 弹幕显示状态
    isBarrageVisible: false,
    isQRCodeVisible: false,
    
    // 弹幕配置
    config: {
      roomId: 'lottery-room',
      maxBarrages: 50,
      pollInterval: 2000,
      autoScroll: true,
      displayPosition: 'right' // 'right', 'left', 'top', 'bottom'
    },
    
    // 弹幕数据
    barrages: [],
    lastTimestamp: null,
    
    // 统计信息
    stats: {
      totalBarrages: 0,
      activeUsers: 0,
      lastUpdateTime: null
    },
    
    // 二维码信息
    qrCodeData: null,
    
    // 弹幕过滤设置
    filters: {
      enableFilter: false,
      keywords: [], // 过滤关键词
      maxLength: 500, // 最大长度
      minInterval: 1000 // 最小发送间隔（毫秒）
    }
  }),
  
  getters: {
    // 获取最新的弹幕
    latestBarrages: (state) => {
      return state.barrages.slice(-10)
    },
    
    // 获取弹幕总数
    totalBarrageCount: (state) => {
      return state.barrages.length
    },
    
    // 检查弹幕是否激活
    isBarrageActive: (state) => {
      return state.isBarrageVisible || state.isQRCodeVisible
    },
    
    // 获取房间统计信息
    roomStats: (state) => {
      const uniqueUsers = new Set(state.barrages.map(b => b.nickname || '匿名用户'))
      return {
        totalBarrages: state.barrages.length,
        activeUsers: uniqueUsers.size,
        lastUpdateTime: state.stats.lastUpdateTime
      }
    }
  },
  
  actions: {
    // 设置弹幕显示状态
    setBarrageVisible(visible) {
      this.isBarrageVisible = visible
    },
    
    // 设置二维码显示状态
    setQRCodeVisible(visible) {
      this.isQRCodeVisible = visible
    },
    
    // 更新弹幕配置
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig }
    },
    
    // 设置房间ID
    setRoomId(roomId) {
      this.config.roomId = roomId
      // 切换房间时清空弹幕
      this.clearBarrages()
    },
    
    // 添加弹幕
    addBarrages(newBarrages) {
      if (!Array.isArray(newBarrages)) {
        newBarrages = [newBarrages]
      }
      
      // 添加时间戳和ID
      const processedBarrages = newBarrages.map(barrage => ({
        ...barrage,
        id: barrage.id || `${Date.now()}_${Math.random()}`,
        receivedAt: new Date().toISOString(),
        displayTime: new Date().toLocaleTimeString()
      }))
      
      this.barrages.push(...processedBarrages)
      
      // 限制弹幕数量
      if (this.barrages.length > this.config.maxBarrages) {
        this.barrages = this.barrages.slice(-this.config.maxBarrages)
      }
      
      // 更新最后时间戳
      if (processedBarrages.length > 0) {
        const latestTimestamp = Math.max(
          ...processedBarrages.map(b => new Date(b.createdAt || b.receivedAt).getTime())
        )
        this.lastTimestamp = latestTimestamp
      }
      
      // 更新统计信息
      this.updateStats()
    },
    
    // 清空弹幕
    clearBarrages() {
      this.barrages = []
      this.lastTimestamp = null
      this.updateStats()
    },
    
    // 删除指定弹幕
    removeBarrage(barrageId) {
      const index = this.barrages.findIndex(b => b.id === barrageId)
      if (index !== -1) {
        this.barrages.splice(index, 1)
        this.updateStats()
      }
    },
    
    // 设置二维码数据
    setQRCodeData(qrData) {
      this.qrCodeData = qrData
    },
    
    // 更新统计信息
    updateStats() {
      const uniqueUsers = new Set(this.barrages.map(b => b.nickname || '匿名用户'))
      this.stats = {
        totalBarrages: this.barrages.length,
        activeUsers: uniqueUsers.size,
        lastUpdateTime: new Date().toISOString()
      }
    },
    
    // 更新过滤设置
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    },
    
    // 检查弹幕是否通过过滤
    isBarrageAllowed(content) {
      if (!this.filters.enableFilter) {
        return true
      }
      
      // 检查长度
      if (content.length > this.filters.maxLength) {
        return false
      }
      
      // 检查关键词过滤
      if (this.filters.keywords.length > 0) {
        const hasBlockedKeyword = this.filters.keywords.some(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        )
        if (hasBlockedKeyword) {
          return false
        }
      }
      
      return true
    },
    
    // 重置所有状态
    resetAll() {
      this.isBarrageVisible = false
      this.isQRCodeVisible = false
      this.barrages = []
      this.lastTimestamp = null
      this.qrCodeData = null
      this.stats = {
        totalBarrages: 0,
        activeUsers: 0,
        lastUpdateTime: null
      }
    },
    
    // 导出弹幕数据
    exportBarrages() {
      return {
        roomId: this.config.roomId,
        exportTime: new Date().toISOString(),
        totalCount: this.barrages.length,
        barrages: this.barrages.map(barrage => ({
          id: barrage.id,
          content: barrage.content,
          nickname: barrage.nickname,
          color: barrage.color,
          fontSize: barrage.fontSize,
          createdAt: barrage.createdAt,
          receivedAt: barrage.receivedAt
        }))
      }
    }
  },
  
  // 持久化配置
  persist: {
    key: 'lottery-barrage-store',
    storage: localStorage,
    paths: ['config', 'filters'] // 只持久化配置和过滤设置
  }
})