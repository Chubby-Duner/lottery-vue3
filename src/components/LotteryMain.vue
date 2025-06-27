<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import useLocalStorage from '@/composables/useLocalStorage'
import LotteryResult from './LotteryResult.vue'
import lotteryData from '@/assets/data/lotteryData.json'

// 状态管理
const selectedAward = ref(4)
const isMoving = ref(true)
const isStarted = ref(false)
const isLocked = ref(true)
const canStop = ref(false)
const showResult = ref(false)
const winnerIndex = ref(-1)
const winnerNameZh = ref('')
const winnerNameEn = ref('')
const wrapPosition = ref(0)
const animationFrame = ref(null)
const speed = ref(6)
const lotteryWrap = ref(null)

// localStorage 管理
const { storedValue: awardLog, setValue: setAwardLog } = useLocalStorage('award_log', {
  award01: 1,
  award02: 3,
  award03: 3,
  award04: 4
})

const { storedValue: selectAwardStorage, setValue: setSelectAward } = useLocalStorage('select_award', 4)

// 计算属性
const buttonText = computed(() => {
  if (!isStarted.value && !isMoving.value) return '重新开始'
  if (!isStarted.value && isMoving.value) return '开始抽奖'
  if (isStarted.value && !isLocked.value) return '停止抽奖'
  return '正在抽奖...'
})

// 初始化
onMounted(() => {
  if (selectAwardStorage.value) {
    selectedAward.value = selectAwardStorage.value
  }
  startAnimation()
})

onUnmounted(() => {
  cancelAnimation()
})

// 方法
const startAnimation = () => {
  let lastTime = 0
  const animate = (timestamp) => {
    if (!isMoving.value) return
    
    const deltaTime = timestamp - lastTime
    lastTime = timestamp
    
    wrapPosition.value -= speed.value
    if (-wrapPosition.value >= lotteryWrap.value.scrollHeight / 2) {
      wrapPosition.value = 0
    }
    
    animationFrame.value = requestAnimationFrame(animate)
  }
  animationFrame.value = requestAnimationFrame(animate)
}

const cancelAnimation = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
}

const selectAward = (award) => {
  if (isStarted.value) {
    console.error('正在抽奖中，不允许更改奖项设置')
    return
  }
  selectedAward.value = award
  setSelectAward(award)
}

const handleLottery = () => {
  const awardKey = `award0${selectedAward.value}`
  
  if (awardLog.value[awardKey] <= 0) {
    alert('该奖项已经抽完啦，请选择其它奖项哦！')
    return
  }

  if (!isStarted.value && !isMoving.value) {
    // 重新开始
    location.reload()
    return
  }

  if (!isStarted.value && isMoving.value) {
    startLottery()
  } else if (isStarted.value && !isLocked.value) {
    stopLottery()
  }
}

const startLottery = () => {
  isStarted.value = true
  isMoving.value = true
  isLocked.value = true
  
  // 加速动画
  setTimeout(() => speed.value = 15, 1000)
  setTimeout(() => speed.value = 20, 3000)
  setTimeout(() => speed.value = 30, 5000)
  setTimeout(() => speed.value = 50, 7000)
  setTimeout(() => {
    speed.value = 90
    isLocked.value = false
  }, 9000)
}

const stopLottery = () => {
  if (isLocked.value) {
    console.error('还没结束，请稍等...')
    return
  }
  
  isStarted.value = false
  isMoving.value = false
  speed.value = 8
  
  // 随机选择获奖者
  const winnerCount = lotteryData.value.length
  winnerIndex.value = Math.floor(Math.random() * (winnerCount - 4))
  
  // 更新获奖者信息
  const winner = lotteryData.value[winnerIndex.value]
  winnerNameZh.value = winner.namezh
  winnerNameEn.value = winner.nameen
  
  // 更新奖项数据
  const awardKey = `award0${selectedAward.value}`
  const newAwardLog = { ...awardLog.value }
  newAwardLog[awardKey] -= 1
  setAwardLog(newAwardLog)
  
  // 从抽奖池中移除获奖者
  lotteryData.value = lotteryData.value.filter(item => item.nameen !== winner.nameen)
  
  // 显示结果
  setTimeout(() => {
    showResult.value = true
    canStop.value = true
  }, 4200)
}

const closeResult = () => {
  if (!canStop.value) {
    console.error('还没结束，无法关闭！')
    return
  }
  showResult.value = false
}

// 键盘事件
const handleKeyPress = (e) => {
  switch(e.key) {
    case ' ':
      handleLottery()
      break
    case '1':
      selectAward(1)
      break
    case '2':
      selectAward(2)
      break
    case '3':
      selectAward(3)
      break
    case '4':
      selectAward(4)
      break
    case 'Enter':
      closeResult()
      break
      case 'Delete':
      // 触发清除数据
      document.getElementById('clear-control')?.click()
      break
    case 'm':
      // 触发音乐开关
      document.getElementById('music-control')?.click()
      break
  }
}

onMounted(() => {
  window.addEventListener('keypress', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keypress', handleKeyPress)
})
</script>

<template>
  <div class="main">
    <div class="lotterty-infogo">
      <img src="@/assets/images/logo.png">
    </div>
    <div class="lottery-main">
      <div class="wrap-border-main">
        <img src="@/assets/images/wrap-border-1.png" class="wrap-border wrap-border-1">
        <img src="@/assets/images/wrap-border-2.png" class="wrap-border wrap-border-2">
        <img src="@/assets/images/wrap-border-3.png" class="wrap-border wrap-border-3">
        <img src="@/assets/images/wrap-border-4.png" class="wrap-border wrap-border-4">
        <div class="wrap-border wrap-border-left"></div>
        <div class="wrap-border wrap-border-right"></div>
      </div>
      <div class="wrap-main">
        <div 
          class="lottery-wrap" 
          :style="{ top: `${wrapPosition}px` }"
          ref="lotteryWrap"
        >
          <div 
            v-for="(item, index) in lotteryData" 
            :key="index" 
            class="lottery-list"
            :class="{ 'sure-active': index === winnerIndex }"
          >
            <div class="f-l turqoise lottery-avatar">
              <img :src="`@/assets/images/avatar/${item.nameen}.jpg`" :alt="item.namezh">
            </div>
            <div class="f-l lottery-content">
              <em class="beauty border-01"></em>
              <em class="beauty border-02"></em>
              <em class="beauty border-03"></em>
              <em class="beauty border-04"></em>
              <div class="border bor-top"></div>
              <div class="border bor-bottom"></div>
              <h3 class="content-title">
                <span class="lottery-name">{{ item.namezh }}</span>
                <span class="company">[ XX科技 ]</span>
              </h3>
              <div class="content-detail">
                <b>新年愿景及祝福：</b>
                <span>{{ item.wish }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard">
        <div 
          v-for="n in 4" 
          :key="n"
          class="cirle-btn award"
          :class="{ 'award-active': selectedAward === n }"
          @click="selectAward(n)"
        >
          {{ n === 4 ? '纪' : ['一', '二', '三'][n-1] }}
        </div>
        <button 
          class="btn btn-red-outline lottery-btn"
          @click="handleLottery"
        >
          {{ buttonText }}
        </button>
      </div>
    </div>
  </div>

  <LotteryResult 
    v-if="showResult"
    :award="selectedAward"
    :name-zh="winnerNameZh"
    :name-en="winnerNameEn"
    @close="closeResult"
  />
</template>

<style scoped>
/* 保留原有的CSS样式 */
</style>