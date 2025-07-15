<script setup>
const props = defineProps({
  visible: Boolean,
  countdownText: [String, Number]
});
const emit = defineEmits(["end"]);
// 这里可以扩展倒计时结束自动emit('end')的逻辑
</script>

<template>
  <transition name="fade">
    <div v-if="visible" class="stop-main">
      <div class="countdown-container">
        <div
          id="stop-time"
          class="countdown-text"
          :data-number="countdownText"
          :key="countdownText"
        >
          {{ countdownText }}
        </div>
        <div class="countdown-circle"></div>
        <div class="countdown-particles"></div>
      </div>
      <div class="back"></div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@keyframes countdown-bounce {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.5);
    opacity: 1;
  }
  60% {
    transform: scale(0.85);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.countdown-text {
  font-size: 80px;
  font-weight: bold;
  color: #d9ad61;
  animation: countdown-bounce 0.5s;
}
</style>
