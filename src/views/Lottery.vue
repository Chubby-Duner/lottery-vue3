<script setup>
import { ref } from 'vue'
import AwardList from '@/components/AwardList.vue'
import PrizeList from '@/components/PrizeList.vue'
import LotteryMain from '@/components/LotteryMain.vue'
import SnowEffect from '@/components/SnowEffect.vue'
import MusicControl from '@/components/MusicControl.vue'
import ClearDataControl from '@/components/ClearDataControl.vue'

const showCountdown = ref(false)
const countdownText = ref('')

// 处理倒计时显示
const handleCountdown = (text) => {
  showCountdown.value = true
  countdownText.value = text
  
  // 2秒后自动隐藏
  setTimeout(() => {
    showCountdown.value = false
  }, 2000)
}

// 手动隐藏倒计时
const hideCountdown = () => {
  showCountdown.value = false
}
</script>

<template>
  <div class="app-container">
    <header class="top-head"></header>
    
    <AwardList />
    <PrizeList />
    
    <div class="stop-main" v-show="showCountdown">
      <div id="stop-time">{{ countdownText }}</div>
      <div class="back"></div>
    </div>
    
    <LotteryMain />

    <!-- 添加音乐和清除控制 -->
    <MusicControl />
    <ClearDataControl />
    
    
    <!-- 两种雪花效果 -->
    <SnowEffect 
      :speed="2"
      interaction="true"
      :size="10"
      :count="30"
      start-color="rgba(253,252,251,1)"
      end-color="rgba(251,252,253,0.3)"
      :opacity="0.8"
      :wind-power="2"
      :image="false"
    />
    <!-- <SnowEffect 
      speed="3"
      interaction="true"
      size="12"
      count="80"
      wind-power="-5"
      image="@/assets/images/snow.png"
    /> -->


    <footer class="footer"></footer>
  </div>
</template>

<style>
/* 全局样式 */
@import '@/assets/styles/style.css';
@import '@/assets/styles/animate.css';

.app-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f5f5; /* 根据实际背景色调整 */
}

/* 确保雪花效果在最底层但不影响交互 */
.snow-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 其他元素确保在雪花之上 */
.top-head,
.aside-left,
.aside-right,
.main,
.footer {
  position: relative;
  z-index: 1;
}

/* 倒计时样式 - 保持原效果 */
.stop-main {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

#stop-time {
  font-size: 10rem;
  color: #fff;
  text-shadow: 0 0 10px #f00;
  font-family: "Microsoft YaHei", sans-serif;
}

.back {
  position: absolute;
  width: 200px;
  height: 200px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  z-index: -1;
}
</style>