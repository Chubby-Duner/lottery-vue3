<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import confetti from 'canvas-confetti'

defineOptions({
  name: "FireworkEffect"
});

const props = defineProps({
  show: { type: Boolean, default: false }
})

const canvas = ref(null)
let myConfetti = null

onMounted(() => {
  if (canvas.value) {
    myConfetti = confetti.create(canvas.value, { resize: true, useWorker: true })
  }
})

onBeforeUnmount(() => {
  myConfetti = null
})

watch(
  () => props.show,
  (val) => {
    if (val && myConfetti) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          myConfetti({
            particleCount: 80,
            spread: 70 + Math.random() * 30,
            origin: { y: Math.random() * 0.6 + 0.2 }
          })
        }, i * 300)
      }
    }
  }
)
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