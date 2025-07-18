<script setup>
defineOptions({
  name: "SplashScreen"
});
</script>

<template>
  <div class="splash-screen">
    <img src="@/assets/images/lucky_icon.png" alt="Logo" class="logo" />
    <div class="loading">加载中...</div>
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
  background: linear-gradient(135deg, #6ee2f5 0%, #6454f0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* 保证内容始终居中 */
  min-height: 100vh;
  box-sizing: border-box;
}

.logo {
  width: 140px;
  margin-bottom: 10px;
  filter: drop-shadow(0 4px 24px #6ee2f588);
}

.loading {
  width: 140px;
  font-size: 22px;
  text-align: center;
  color: #fff;
  letter-spacing: 3px;
  font-weight: bold;
  text-shadow:
    0 2px 8px #6ee2f5aa,
    0 0 2px #fff;
  animation: blink 1.2s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
