import { ref, computed } from 'vue'
import { useLotteryHistoryStore } from '@/store/lotteryHistoryStore'
import { useAwardStore } from '@/store/awardStore'
import { usePrizeStore } from '@/store/prizeStore'
import { message } from 'ant-design-vue'

export default function useLotteryHistory({
  lotteryData,
  selectedAward,
  isMoving,
  animationPaused,
  startAnimation,
  cancelAnimation
}) {
  const historyStore = useLotteryHistoryStore()
  const awardStore = useAwardStore()
  const prizeStore = usePrizeStore()

  // 历史记录相关状态
  const showHistoryModal = ref(false)
  const showUndoConfirm = ref(false)

  // 计算属性
  const canUndo = computed(() => historyStore.canUndo)
  const historyStats = computed(() => historyStore.getHistoryStats())
  const recentHistory = computed(() => historyStore.getRecentHistory(10))

  // 记录抽奖操作
  const recordLotteryOperation = (winner, gift) => {
    try {
      // 获取当前状态快照
      const awardName = awardStore.awards.find(a => a.key === selectedAward.value)?.label || selectedAward.value
      // 转换为正确的awardKey格式
      historyStore.addLotteryRecord({
        awardKey: selectedAward.value,
        awardName,
        winner,
        gift,
        lotteryDataSnapshot: lotteryData.value,
        awardLogSnapshot: awardStore.awardLog,
        winnerMapSnapshot: awardStore.winnerMap,
        prizeListSnapshot: prizeStore.prizeList
      })

    } catch (error) {
      console.error('记录抽奖历史失败:', error)
    }
  }

  // 撤销最后一次抽奖
  const undoLastLottery = async () => {
    try {
      if (!canUndo.value) {
        message.warning('没有可撤销的抽奖记录')
        return false
      }

      // 如果动画正在运行，先停止
      if (isMoving.value) {
        cancelAnimation()
        isMoving.value = false
      }

      const lastRecord = historyStore.undoLastLottery()
      if (!lastRecord) {
        message.error('撤销失败，没有找到历史记录')
        return false
      }

      // 使用增量撤销，只恢复被撤销奖项相关的数据
      await undoSpecificAward(lastRecord)

      message.success(`已撤销 ${lastRecord.awardName} 的抽奖结果：${lastRecord.winner.namezh}`)

      // 重新启动动画（如果之前没有暂停）
      if (!animationPaused.value) {
        setTimeout(() => {
          startAnimation()
        }, 100)
      }

      return true
    } catch (error) {
      console.error('撤销抽奖失败:', error)
      message.error('撤销操作失败，请重试')
      return false
    }
  }

  // 增量撤销：只恢复被撤销奖项相关的数据
  const undoSpecificAward = async (lastRecord) => {
    try {
      const { awardKey, winner, gift } = lastRecord

      // 1. 将中奖者重新加入抽奖名单
      if (winner && !lotteryData.value.find(person => person.id === winner.id)) {
        lotteryData.value.push(winner)
      }

      // 2. 恢复该奖项的剩余数量（增加1）
      const currentAwardLog = awardStore.awardLog[awardKey] || 0
      awardStore.setAwardLog({
        ...awardStore.awardLog,
        [awardKey]: currentAwardLog + 1
      })

      // 3. 从该奖项的中奖名单中移除这个中奖者
      const winnerMapKey = awardKey
      const currentWinners = awardStore.winnerMap[winnerMapKey] || []
      const updatedWinners = currentWinners.filter(w => w.id !== winner.id)
      awardStore.setWinners(winnerMapKey, updatedWinners)

      // 4. 如果有礼物，恢复礼物数量
      if (gift && gift.id) {
        const currentPrizes = prizeStore.prizeList
        const updatedPrizes = currentPrizes.map(prize => {
          if (prize.id === gift.id) {
            return {
              ...prize,
              remainingQuantity: prize.remainingQuantity + 1
            }
          }
          return prize
        })
        prizeStore.setPrizeList(updatedPrizes)
      }

    } catch (error) {
      console.error('增量撤销失败:', error)
      throw error
    }
  }

  // 从快照恢复状态（保留用于重置数据功能）
  const restoreFromSnapshot = async (snapshots) => {
    try {
      // 恢复抽奖名单
      lotteryData.value = JSON.parse(JSON.stringify(snapshots.lotteryData))

      // 恢复奖项数量
      awardStore.setAwardLog(JSON.parse(JSON.stringify(snapshots.awardLog)))

      // 恢复中奖名单
      Object.keys(snapshots.winnerMap).forEach(awardKey => {
        awardStore.setWinners(awardKey, JSON.parse(JSON.stringify(snapshots.winnerMap[awardKey])))
      })

      // 恢复礼物数量
      prizeStore.setPrizeList(JSON.parse(JSON.stringify(snapshots.prizeList)))

    } catch (error) {
      console.error('恢复状态失败:', error)
      throw error
    }
  }

  // 显示历史记录弹窗
  const showHistory = () => {
    showHistoryModal.value = true
  }

  // 关闭历史记录弹窗
  const closeHistory = () => {
    showHistoryModal.value = false
  }

  // 显示撤销确认弹窗
  const confirmUndo = () => {
    if (!canUndo.value) {
      message.warning('没有可撤销的抽奖记录')
      return
    }
    showUndoConfirm.value = true
  }

  // 确认撤销
  const handleUndoConfirm = async () => {
    showUndoConfirm.value = false
    await undoLastLottery()
  }

  // 取消撤销
  const handleUndoCancel = () => {
    showUndoConfirm.value = false
  }

  // 清空历史记录
  const clearAllHistory = () => {
    historyStore.clearHistory()
    message.success('历史记录已清空')
  }

  // 删除指定历史记录
  const deleteHistoryRecord = (recordId) => {
    historyStore.deleteHistoryRecord(recordId)
    message.success('历史记录已删除')
  }

  // 格式化时间显示
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return {
    // 状态
    showHistoryModal,
    showUndoConfirm,

    // 计算属性
    canUndo,
    historyStats,
    recentHistory,

    // 方法
    recordLotteryOperation,
    undoLastLottery,
    showHistory,
    closeHistory,
    confirmUndo,
    handleUndoConfirm,
    handleUndoCancel,
    clearAllHistory,
    deleteHistoryRecord,
    formatTime,

    // store引用
    historyStore
  }
}