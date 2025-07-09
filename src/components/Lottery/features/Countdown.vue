<template>
  <transition name="fade">
    <div v-if="visible" class="stop-main">
      <div class="countdown-container">
        <div id="stop-time" class="countdown-text" :data-number="countdownText">{{ countdownText }}</div>
        <div class="countdown-circle"></div>
        <div class="countdown-particles"></div>
      </div>
      <div class="back"></div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  countdownText: [String, Number]
});
const emit = defineEmits(["end"]);
// 这里可以扩展倒计时结束自动emit('end')的逻辑
</script>

<style lang="scss" scoped></style>
