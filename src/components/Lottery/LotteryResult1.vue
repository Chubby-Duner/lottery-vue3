<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { getImageUrl } from "@/utils/index.js"

const props = defineProps({
  award: Number,
  nameZh: String,
  nameEn: String,
  show: Boolean
})

const emit = defineEmits(['close'])
const canvas = ref(null)

const drawResult = () => {
  const ctx = canvas.value.getContext('2d')
  const backImg = new Image()
  const avatar = new Image()
  
  backImg.src = `../../assets/images/award_${props.award}.png`
  avatar.src = `../../assets/images/avatar/${props.nameEn}.jpg`
  
  backImg.onload = () => {
    ctx.drawImage(backImg, 0, 0)
    drawCircleAvatar(ctx, avatar, 158, 178, 200)
    
    ctx.fillStyle = '#D9AD61'
    ctx.font = "bold 6rem STKaiti"
    
    const x = props.nameZh.length <= 2 ? 300 : 280
    const y = props.nameZh.length <= 2 ? 1010 : 1000
    ctx.fillText(props.nameZh, x, y)
  }
}

const drawCircleAvatar = (ctx, img, x, y, r) => {
  ctx.save()
  const d = 2 * r
  const cx = x + r
  const cy = y + r
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.clip()
  ctx.drawImage(img, x, y, d, d)
  ctx.restore()
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    console.log(1);
    
    nextTick(() => {
      drawResult()
    })
  }
})
</script>

<template>
  <div class="modal" v-if="props.show">
    <div class="modal-content">
      <canvas ref="canvas" width="700" height="1300"></canvas>
    </div>
    <!-- <button class="close" @click="$emit('close')">
      <span aria-hidden="true">&times;</span>
    </button> -->
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
}

.close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
}
</style>