<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import confetti from "canvas-confetti";

defineOptions({
  name: "FireworkEffect"
});

const props = defineProps({
  show: { type: Boolean, default: false }
});

const canvas = ref(null);
let myConfetti = null;

onMounted(() => {
  if (canvas.value) {
    myConfetti = confetti.create(canvas.value, { resize: true, useWorker: true });
  }
});

onBeforeUnmount(() => {
  myConfetti = null;
});

watch(
  () => props.show,
  val => {
    if (val) {
      // 确保 myConfetti 已初始化且为函数
      const tryFirework = (retryCount = 0) => {
        if (myConfetti && typeof myConfetti === "function") {
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              // 在每次调用前再次检查，防止在延时期间被销毁
              if (myConfetti && typeof myConfetti === "function") {
                myConfetti({
                  particleCount: 80,
                  spread: 70 + Math.random() * 30,
                  origin: { y: Math.random() * 0.6 + 0.2 }
                });
              }
            }, i * 300);
          }
        } else if (retryCount < 10) {
          // 解决多轮抽奖快速状态变化导致动画报错问题
          // 最多重试10次
          // 如果还未初始化，50ms后重试
          setTimeout(() => {
            if (props.show) {
              // 确保仍然需要显示烟花
              tryFirework(retryCount + 1);
            }
          }, 50);
        }
      };

      tryFirework();
    }
  }
);
</script>

<template>
  <canvas ref="canvas" class="firework-canvas"></canvas>
</template>

<style scoped>
.firework-canvas {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}
</style>
