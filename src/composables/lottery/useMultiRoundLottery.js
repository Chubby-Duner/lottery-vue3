import { ref, computed } from 'vue'
import { useLotteryHistoryStore } from '@/store/lotteryHistoryStore'
import { useAwardStore } from '@/store/awardStore'
import { message } from 'ant-design-vue'

export default function useMultiRoundLottery({
  selectedAward,
  isStarted,
  isMoving,
  isLotteryProcessing
}) {
  const historyStore = useLotteryHistoryStore()
  const awardStore = useAwardStore()
  
  // 多轮抽奖配置状态
  const showMultiRoundModal = ref(false)
  const multiRoundCount = ref(1)
  const showMultiRoundProgress = ref(false)
  const multiRoundResults = ref([])
  
  // 计算属性
  const isMultiRoundMode = computed(() => historyStore.multiRoundConfig.enabled)
  const multiRoundProgress = computed(() => historyStore.multiRoundProgress)
  const currentRoundIndex = computed(() => historyStore.multiRoundConfig.currentRound)
  const totalRounds = computed(() => historyStore.multiRoundConfig.roundCount)
  const isMultiRoundInProgress = computed(() => historyStore.multiRoundConfig.isInProgress)
  
  // 获取当前奖项剩余数量
  const getCurrentAwardRemaining = () => {
    const idx = awardStore.awards.findIndex(a => a.key === selectedAward.value)
    const awardKey = `award${idx + 1}`
    return awardStore.awardLog[awardKey] || 0
  }
  
  // 显示多轮抽奖设置弹窗
  const showMultiRoundSetting = () => {
    if (isStarted.value || isLotteryProcessing.value) {
      message.warning('抽奖进行中，无法设置多轮抽奖')
      return
    }
    
    const remaining = getCurrentAwardRemaining()
    if (remaining <= 0) {
      message.error('当前奖项已抽完，无法进行多轮抽奖')
      return
    }
    
    multiRoundCount.value = Math.min(remaining, 5) // 默认最多5轮
    showMultiRoundModal.value = true
  }
  
  // 开始多轮抽奖
  const startMultiRoundLottery = (roundCount = multiRoundCount.value) => {
    try {
      if (roundCount < 1) {
        message.error('抽奖轮数必须大于0')
        return false
      }
      
      const remaining = getCurrentAwardRemaining()
      if (roundCount > remaining) {
        message.error(`当前奖项仅剩余 ${remaining} 个，无法抽取 ${roundCount} 轮`)
        return false
      }
      
      // 更新内部状态
      multiRoundCount.value = roundCount
      
      // 开始多轮抽奖
      historyStore.startMultiRound(selectedAward.value, roundCount)
      multiRoundResults.value = []
      showMultiRoundProgress.value = true
      showMultiRoundModal.value = false
      
      message.success(`开始 ${roundCount} 轮抽奖`)
      return true
    } catch (error) {
      console.error('开始多轮抽奖失败:', error)
      message.error('开始多轮抽奖失败')
      return false
    }
  }
  
  // 完成一轮抽奖
  const completeOneRound = (winner, gift) => {
    if (!isMultiRoundMode.value) return
    
    try {
      // 添加到当前轮次结果
      multiRoundResults.value.push({
        roundIndex: currentRoundIndex.value + 1,
        winner,
        gift,
        timestamp: new Date().toISOString()
      })
      
      // 更新历史store中的轮次
      historyStore.completeOneRound()
      
      // 检查是否完成所有轮次
      if (currentRoundIndex.value >= totalRounds.value) {
        finishMultiRoundLottery()
      }
    } catch (error) {
      console.error('完成轮次失败:', error)
      message.error('完成轮次失败')
    }
  }
  
  // 完成多轮抽奖
  const finishMultiRoundLottery = () => {
    try {
      // 在清空结果前获取轮次数
      const completedRounds = historyStore.multiRoundConfig.enabled ? 
        historyStore.multiRoundConfig.currentRound : 
        multiRoundResults.value.length
      
      const results = historyStore.finishMultiRound()
      showMultiRoundProgress.value = false
      
      // 使用轮次数而不是results.length，因为results可能已被清空
      message.success(`多轮抽奖完成！共抽取了 ${completedRounds} 位中奖者`)
      
      // 清空本地结果
      setTimeout(() => {
        multiRoundResults.value = []
      }, 3000)
      
      return results
    } catch (error) {
      console.error('完成多轮抽奖失败:', error)
      message.error('完成多轮抽奖失败')
      return []
    }
  }
  
  // 取消多轮抽奖
  const cancelMultiRoundLottery = () => {
    try {
      historyStore.cancelMultiRound()
      showMultiRoundProgress.value = false
      multiRoundResults.value = []
      showMultiRoundModal.value = false
      
      message.info('多轮抽奖已取消')
    } catch (error) {
      console.error('取消多轮抽奖失败:', error)
      message.error('取消多轮抽奖失败')
    }
  }
  
  // 关闭多轮抽奖设置弹窗
  const closeMultiRoundModal = () => {
    showMultiRoundModal.value = false
  }
  
  // 验证多轮抽奖设置
  const validateMultiRoundSetting = () => {
    if (multiRoundCount.value < 1) {
      message.error('抽奖轮数必须大于0')
      return false
    }
    
    if (multiRoundCount.value > 10) {
      message.error('抽奖轮数不能超过10轮')
      return false
    }
    
    const remaining = getCurrentAwardRemaining()
    if (multiRoundCount.value > remaining) {
      message.error(`当前奖项仅剩余 ${remaining} 个，无法抽取 ${multiRoundCount.value} 轮`)
      return false
    }
    
    return true
  }
  
  // 获取多轮抽奖状态文本
  const getMultiRoundStatusText = () => {
    if (!isMultiRoundMode.value) return ''
    
    if (isMultiRoundInProgress.value) {
      return `多轮抽奖进行中 (${currentRoundIndex.value}/${totalRounds.value})`
    }
    
    return '多轮抽奖已完成'
  }
  
  // 获取下一轮提示文本
  const getNextRoundText = () => {
    if (!isMultiRoundMode.value || !isMultiRoundInProgress.value) return ''
    
    const remaining = totalRounds.value - currentRoundIndex.value
    if (remaining > 0) {
      return `还需抽取 ${remaining} 轮`
    }
    
    return '所有轮次已完成'
  }
  
  return {
    // 状态
    showMultiRoundModal,
    multiRoundCount,
    showMultiRoundProgress,
    multiRoundResults,
    
    // 计算属性
    isMultiRoundMode,
    multiRoundProgress,
    currentRoundIndex,
    totalRounds,
    isMultiRoundInProgress,
    
    // 方法
    showMultiRoundSetting,
    startMultiRoundLottery,
    completeOneRound,
    finishMultiRoundLottery,
    cancelMultiRoundLottery,
    closeMultiRoundModal,
    validateMultiRoundSetting,
    getCurrentAwardRemaining,
    getMultiRoundStatusText,
    getNextRoundText,
    
    // store引用
    historyStore
  }
}