import { defineStore } from "pinia"
import storage from "@/composables/useLocalStorage"
import { v4 as uuidv4 } from 'uuid'

export const useLotteryHistoryStore = defineStore("lotteryHistoryStore", {
  state: () => ({
    // 抽奖历史记录
    lotteryHistory: storage.get("lottery_history", []),
    // 多轮抽奖配置
    multiRoundConfig: {
      enabled: false,
      roundCount: 1, // 本轮要抽取的人数
      currentRound: 0, // 当前已抽取的人数
      awardKey: '', // 当前奖项
      isInProgress: false // 是否正在进行多轮抽奖
    },
    // 当前多轮抽奖的临时结果
    currentMultiRoundResults: []
  }),
  
  getters: {
    // 获取指定奖项的历史记录
    getHistoryByAward: (state) => (awardKey) => {
      return state.lotteryHistory.filter(record => record.awardKey === awardKey)
    },
    
    // 获取最近的历史记录
    getRecentHistory: (state) => (limit = 10) => {
      return state.lotteryHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    },
    
    // 检查是否可以撤销
    canUndo: (state) => {
      return state.lotteryHistory.length > 0
    },
    
    // 获取最后一次抽奖记录
    getLastLotteryRecord: (state) => {
      if (state.lotteryHistory.length === 0) return null
      return state.lotteryHistory[state.lotteryHistory.length - 1]
    },
    
    // 多轮抽奖进度
    multiRoundProgress: (state) => {
      if (!state.multiRoundConfig.enabled) return null
      return {
        current: state.multiRoundConfig.currentRound,
        total: state.multiRoundConfig.roundCount,
        percentage: state.multiRoundConfig.roundCount > 0 
          ? (state.multiRoundConfig.currentRound / state.multiRoundConfig.roundCount) * 100 
          : 0
      }
    }
  },
  
  actions: {
    // 记录抽奖历史
    addLotteryRecord({
      awardKey,
      awardName,
      winner,
      gift,
      lotteryDataSnapshot, // 抽奖前的名单快照
      awardLogSnapshot,    // 抽奖前的奖项数量快照
      winnerMapSnapshot,   // 抽奖前的中奖名单快照
      prizeListSnapshot    // 抽奖前的礼物数量快照
    }) {
      const record = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        awardKey,
        awardName,
        winner,
        gift,
        // 保存快照用于撤销
        snapshots: {
          lotteryData: JSON.parse(JSON.stringify(lotteryDataSnapshot)),
          awardLog: JSON.parse(JSON.stringify(awardLogSnapshot)),
          winnerMap: JSON.parse(JSON.stringify(winnerMapSnapshot)),
          prizeList: JSON.parse(JSON.stringify(prizeListSnapshot))
        },
        // 多轮抽奖相关信息
        multiRound: {
          isMultiRound: this.multiRoundConfig.enabled,
          roundIndex: this.multiRoundConfig.currentRound,
          totalRounds: this.multiRoundConfig.roundCount
        }
      }
      
      this.lotteryHistory.push(record)
      storage.set("lottery_history", this.lotteryHistory)
      
      // 如果是多轮抽奖，添加到当前结果中
      if (this.multiRoundConfig.enabled) {
        this.currentMultiRoundResults.push({
          winner: record.winner,
          gift: record.gift,
          roundIndex: record.multiRound.roundIndex
        })
      }
    },
    
    // 撤销最后一次抽奖
    undoLastLottery() {
      if (this.lotteryHistory.length === 0) return null
      console.log("🚀 ~ undoLastLottery ~ this.lotteryHistory:", this.lotteryHistory);
      
      // 按时间戳降序排序，获取最新的记录
      const sortedHistory = [...this.lotteryHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      const lastRecord = sortedHistory[0]
      console.log("🚀 ~ undoLastLottery ~ lastRecord:", lastRecord);
      
      // 从原数组中移除这条记录
      const recordIndex = this.lotteryHistory.findIndex(record => record.id === lastRecord.id)
      if (recordIndex !== -1) {
        this.lotteryHistory.splice(recordIndex, 1)
      }
      storage.set("lottery_history", this.lotteryHistory)
      
      // 如果是多轮抽奖中的撤销，需要更新多轮状态
      if (lastRecord.multiRound.isMultiRound && this.multiRoundConfig.enabled) {
        this.multiRoundConfig.currentRound = Math.max(0, this.multiRoundConfig.currentRound - 1)
        // 从当前多轮结果中移除
        this.currentMultiRoundResults = this.currentMultiRoundResults.filter(
          result => result.roundIndex !== lastRecord.multiRound.roundIndex
        )
      }
      
      return lastRecord
    },
    
    // 开始多轮抽奖
    startMultiRound(awardKey, roundCount) {
      this.multiRoundConfig = {
        enabled: true,
        roundCount,
        currentRound: 0,
        awardKey,
        isInProgress: true
      }
      this.currentMultiRoundResults = []
    },
    
    // 完成一轮抽奖
    completeOneRound() {
      if (this.multiRoundConfig.enabled) {
        this.multiRoundConfig.currentRound++
        
        // 检查是否完成所有轮次
        if (this.multiRoundConfig.currentRound >= this.multiRoundConfig.roundCount) {
          this.finishMultiRound()
        }
      }
    },
    
    // 结束多轮抽奖
    finishMultiRound() {
      this.multiRoundConfig = {
        enabled: false,
        roundCount: 1,
        currentRound: 0,
        awardKey: '',
        isInProgress: false
      }
      
      // 保存多轮抽奖结果
      const results = [...this.currentMultiRoundResults]
      this.currentMultiRoundResults = []
      
      return results
    },
    
    // 取消多轮抽奖
    cancelMultiRound() {
      this.multiRoundConfig = {
        enabled: false,
        roundCount: 1,
        currentRound: 0,
        awardKey: '',
        isInProgress: false
      }
      this.currentMultiRoundResults = []
    },
    
    // 清空历史记录
    clearHistory() {
      this.lotteryHistory = []
      this.currentMultiRoundResults = []
      storage.remove("lottery_history")
    },
    
    // 删除指定历史记录
    deleteHistoryRecord(recordId) {
      this.lotteryHistory = this.lotteryHistory.filter(record => record.id !== recordId)
      storage.set("lottery_history", this.lotteryHistory)
    },
    
    // 获取历史统计信息
    getHistoryStats() {
      const stats = {
        totalLotteries: this.lotteryHistory.length,
        awardStats: {},
        recentActivity: this.getRecentHistory(5)
      }
      
      // 统计各奖项抽奖次数
      this.lotteryHistory.forEach(record => {
        if (!stats.awardStats[record.awardKey]) {
          stats.awardStats[record.awardKey] = {
            awardName: record.awardName,
            count: 0,
            winners: []
          }
        }
        stats.awardStats[record.awardKey].count++
        stats.awardStats[record.awardKey].winners.push(record.winner.namezh)
      })
      
      return stats
    }
  }
})