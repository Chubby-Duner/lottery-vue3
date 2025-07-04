<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { useAwardStore } from '@/store/awardStore'
import { getImageUrl } from "@/utils/index.js"
import UploadExcel from '@/components/Upload/UploadExcel.vue'
import LotteryResult from './LotteryResult.vue'
import WeightEditor from './WeightEditor.vue'
import { SettingOutlined } from '@ant-design/icons-vue'

defineOptions({
  name: "LotteryMain"
});

// 获取奖项剩余数量，中奖名单等数据
const awardStore = useAwardStore()

//#region 倒计时相关
const showCountdown = ref(false)
const countdownText = ref('叁')

async function showCountdownSequence() {
  showCountdown.value = true
  countdownText.value = '叁'
  await new Promise(resolve => setTimeout(resolve, 1000))
  countdownText.value = '贰'
  await new Promise(resolve => setTimeout(resolve, 1000))
  countdownText.value = '壹'
  await new Promise(resolve => setTimeout(resolve, 500))
  showCountdown.value = false
}
//#endregion

//#region 导入数据
const importModal = ref(false)
const lotteryData = ref([]);

const beforeUpload = file => {
  const isLt1M = file.size / 1024 / 1024 < 1

  if (isLt1M) {
    return true
  }

  message.error('Please do not upload files larger than 1m in size.')
  return false
};

const handleSuccess = ({ header, results }) => {
  try {
    console.log(header, results)
    // 设置默认权重
    lotteryData.value = results.map(item => ({
      ...item,
      awardWeights: { 1: 1, 2: 1, 3: 1, 4: 1 } // 默认每个奖项权重为1
    }))

    // 开始动画
    if (awardStore.selectAward) {
      selectedAward.value = awardStore.selectAward
    }
    nextTick(() => {
      wrapPosition.value = 0 // 重置
      startAnimation()
    })
  } catch (error) {
    console.log("🚀 ~ handleSuccess ~ error:", error);
  }
}

const getTemplateUrl = () => {
  return new URL("/template/importTemplate.xlsx", import.meta.url).href;
};
//#endregion

// 状态管理
const selectedAward = ref(awardStore.selectAward)
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
const wrapMain = ref(null)
const awards = [
  { n: 1, label: '一' },
  { n: 2, label: '二' },
  { n: 3, label: '三' },
  { n: 4, label: '纪' }
]

// 计算属性
const buttonText = computed(() => {
  if (!isStarted.value && !isMoving.value) return '重新开始'
  if (!isStarted.value && isMoving.value) return '开始抽奖'
  if (isStarted.value && !isLocked.value) return '停止抽奖'
  return '正在抽奖...'
})

// 开始动画
const startAnimation = () => {
  let lastTime = 0
  const animate = (timestamp) => {
    if (!isMoving.value) return
    if (!lotteryWrap.value) return // 防止空指针
    
    const deltaTime = timestamp - lastTime
    lastTime = timestamp
    
    wrapPosition.value -= speed.value
    if (-wrapPosition.value >= lotteryWrap.value.scrollHeight / 2) {
      wrapPosition.value = 0
    }
    
    animationFrame.value = window.requestAnimationFrame(animate)
  }
  animationFrame.value = window.requestAnimationFrame(animate)
}

// 取消动画
const cancelAnimation = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
}

const selectAward = (award) => {
  if (isStarted.value) {
    message.error('正在抽奖中，不允许更改奖项设置')
    return
  }
  selectedAward.value = award
  awardStore.setSelectAward(award)
}

// 权重编辑相关
const weightEditorVisible = ref(false)

const openWeightEditor = () => {
  if (lotteryData.value.length === 0) {
    message.warning('请先导入抽奖数据')
    return
  }
  weightEditorVisible.value = true
}

const handleWeightSave = (updatedData) => {
  lotteryData.value = updatedData
  message.success('权重设置已更新')
}

// 权重抽奖函数
const weightedRandomIndex = (list, awardType) => {
  const weights = list.map(item => (item.awardWeights?.[awardType] ?? 1))
  const total = weights.reduce((a, b) => a + b, 0)
  
  if (total === 0) {
    message.error('当前奖项所有权重都为0，无法抽奖')
    return -1
  }
  
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i
    r -= weights[i]
  }
  return 0
}

const handleLottery = () => {
  const awardKey = `award0${selectedAward.value}`
  
  if (awardStore.awardLog[awardKey] <= 0) {
    message.error('该奖项已经抽完啦，请选择其它奖项哦！')
    return
  }

  if (!isStarted.value && !isMoving.value) {
    // 重新开始：重置状态并重新滚动，不刷新页面
    wrapPosition.value = 0
    isMoving.value = true
    isStarted.value = false
    isLocked.value = true
    speed.value = 6
    winnerIndex.value = -1
    showResult.value = false
    canStop.value = false
    startAnimation()
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

const stopLottery = async() => {
  if (isLocked.value) {
    message.error('还没结束，请稍等...')
    return
  }

  try {
    // 使用权重抽奖
    const winnerIndexResult = weightedRandomIndex(lotteryData.value, selectedAward.value)
    if (winnerIndexResult === -1) return
    
    winnerIndex.value = winnerIndexResult
    
    // 更新获奖者信息
    const winner = lotteryData.value[winnerIndex.value]
    winnerNameZh.value = winner.namezh
    winnerNameEn.value = winner.nameen
    console.log("🚀 ~ stopLottery ~ winner:", winner);

    // 显示倒计时
    await showCountdownSequence()

    // 显示结果
    showResult.value = true
    canStop.value = true

    // 停止主动画
    isMoving.value = false
    cancelAnimation()

    isStarted.value = false
    speed.value = 8

    // 更新奖项数据
    // 中奖人对象
    const winnerData = {
      nameen: winnerNameEn.value,
      namezh: winnerNameZh.value
    }
    if (selectedAward.value === 1) {
      awardStore.addWinner('award1', winnerData)
    } else if (selectedAward.value === 2) {
      awardStore.addWinner('award2', winnerData)
    } else if (selectedAward.value === 3) {
      awardStore.addWinner('award3', winnerData)
    } else if (selectedAward.value === 4) {
      awardStore.addWinner('award4', winnerData)
    }

    // 更新奖项剩余数量
    const awardKey = `award0${selectedAward.value}`
    const newAwardLog = { ...awardStore.awardLog }
    newAwardLog[awardKey] -= 1
    awardStore.setAwardLog(newAwardLog)
    
    // 从抽奖池中移除获奖者
    lotteryData.value = lotteryData.value.filter(item => item.nameen !== winner.nameen)
    winnerIndex.value = -1
    console.log("🚀 ~ stopLottery ~ lotteryData.value:", lotteryData.value);
    
  } catch (error) {
    console.log("🚀 ~ stopLottery ~ error:", error);
  }
}

const smoothScrollTo = (targetTop) => {
  return new Promise(resolve => {
    function step() {
      const diff = targetTop - wrapPosition.value
      if (Math.abs(diff) < 2) {
        wrapPosition.value = targetTop
        resolve()
        return
      }
      // 逐步靠近目标，速度可调
      wrapPosition.value += diff * 0.2
      requestAnimationFrame(step)
    }
    step()
  })
}

const closeResult = () => {
  if (!canStop.value) {
    message.error('还没结束，无法关闭！')
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
  cancelAnimation()
  window.removeEventListener('keypress', handleKeyPress)
})
</script>

<template>
  <div class="main">
    <!-- <div class="lotterty-infogo">
      <img src="@/assets/images/logo.png">
    </div> -->
    <div v-if="lotteryData.length > 0" class="lottery-main">
      <div class="wrap-border-main">
        <img src="@/assets/images/wrap-border-1.png" class="wrap-border wrap-border-1">
        <img src="@/assets/images/wrap-border-2.png" class="wrap-border wrap-border-2">
        <img src="@/assets/images/wrap-border-3.png" class="wrap-border wrap-border-3">
        <img src="@/assets/images/wrap-border-4.png" class="wrap-border wrap-border-4">
        <div class="wrap-border wrap-border-left"></div>
        <div class="wrap-border wrap-border-right"></div>
      </div>
      <div ref="wrapMain" class="wrap-main">
        <div 
          id="lottery-wrap" 
          :style="{ transform: `translateY(${wrapPosition}px)` }"
          ref="lotteryWrap"
        >
          <div 
            v-for="(item, index) in lotteryData" 
            :key="index" 
            class="clearFloat lottery-list"
            :class="{ 'sure-active': index === winnerIndex }"
          >
            <div class="f-l turqoise lottery-avatar">
              <img :src="getImageUrl(item.nameen, 'avatar')" :alt="item.namezh">
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
                <span class="company">[ 牛马科技 ]</span>
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
        <template v-for="(item, idx) in awards" :key="item.n">
          <a-button
            v-if="idx === 2"
            class="btn btn-red-outline lottery-btn"
            @click="handleLottery"
          >
            {{ buttonText }}
          </a-button>
          <div
            class="cirle-btn award"
            :id="'award-' + item.n"
            :class="{ 'award-active': selectedAward === item.n }"
            @click="selectAward(item.n)"
          >
            {{ item.label }}
          </div>
        </template>
      </div>
    </div>
    <a-empty
      v-else
      image="https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original"
      :image-style="{
        height: '60px',
      }"
    >
      <template #description>
        <span>
          请先导入数据
        </span>
      </template>
      <a-button type="primary">
        <a :href="getTemplateUrl()" target="_blank">点击下载</a>
      </a-button>
      <a-button class="margin-left10" type="primary" @click="importModal = true">导入抽奖名单数据</a-button>
      <!-- <a-button type="primary">导入礼物名单数据</a-button> -->
    </a-empty>
  </div>

  <!-- 权重编辑按钮 -->
  <div v-if="lotteryData.length > 0" class="weight-edit-section" style="text-align: center; margin: 16px 0;">
    <a-button type="dashed" @click="openWeightEditor">
      <template #icon>
        <SettingOutlined />
      </template>
      权重设置
    </a-button>
  </div>

  <!-- 倒计时 -->
  <transition name="fade">
    <div v-if="showCountdown" class="stop-main">
      <div id="stop-time">{{ countdownText }}</div>
      <div class="back"></div>
    </div>
  </transition>

  <!-- 中奖结果 -->
  <LotteryResult
    :visible="showResult"
    :award="selectedAward"
    :name-zh="winnerNameZh"
    :name-en="winnerNameEn"
    @close="showResult = false"
  />

  <!-- 导入数据 -->
  <UploadExcel v-model:visible="importModal" :on-success="handleSuccess" :before-upload="beforeUpload" />

  <!-- 权重编辑 -->
  <WeightEditor
    v-model:visible="weightEditorVisible"
    :lottery-data="lotteryData"
    @save="handleWeightSave"
  />
</template>

<style scoped>
@import '@/assets/styles/style.css';
</style>