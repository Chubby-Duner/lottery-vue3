<script setup>
import { onMounted, ref } from "vue";
const emit = defineEmits(["close"]);
const progress = ref(0);
const showContent = ref(false);

defineOptions({
  name: "SplashScreen"
});

onMounted(() => {
  // 显示内容动画
  setTimeout(() => {
    showContent.value = true;
  }, 100);
  
  // 进度条动画
  const progressInterval = setInterval(() => {
    progress.value += Math.random() * 15 + 5;
    if (progress.value >= 100) {
      progress.value = 100;
      clearInterval(progressInterval);
      setTimeout(() => {
        emit("close");
      }, 300);
    }
  }, 80);
});
</script>

<template>
  <div class="splash-screen">
    <div class="background-animation"></div>
    <div class="content" :class="{ 'show': showContent }">
      <div class="logo-container">
        <img src="@/assets/images/lucky_icon.png" alt="Logo" class="logo" />
        <div class="logo-glow"></div>
      </div>
      <div class="loading-section">
        <div class="loading-text">加载中</div>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
  animation: backgroundMove 8s ease-in-out infinite;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.content.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.logo-container {
  position: relative;
  margin-bottom: 40px;
}

.logo {
  width: 160px;
  height: auto;
  filter: drop-shadow(0 8px 32px rgba(110, 226, 245, 0.4));
  animation: logoFloat 3s ease-in-out infinite;
  position: relative;
  z-index: 2;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(110, 226, 245, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glowPulse 2s ease-in-out infinite;
  z-index: 1;
}

.loading-section {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.loading-text {
  font-size: 24px;
  color: #fff;
  font-weight: 600;
  letter-spacing: 2px;
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.5);
  margin-right: 8px;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  animation: dotBounce 1.4s ease-in-out infinite;
  box-shadow: 0 2px 10px rgba(255, 255, 255, 0.3);
}

.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

.progress-container {
  width: 280px;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
  backdrop-filter: blur(10px);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fff 0%, #6ee2f5 50%, #fff 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
  box-shadow: 0 0 20px rgba(110, 226, 245, 0.6);
  animation: progressShine 2s ease-in-out infinite;
}

.progress-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  letter-spacing: 1px;
}

@keyframes backgroundMove {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

@keyframes progressShine {
  0% { background-position: -100% 0; }
  100% { background-position: 100% 0; }
}
</style>
