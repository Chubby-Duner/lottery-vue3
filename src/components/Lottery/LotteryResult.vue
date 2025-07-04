<script setup>
import { computed } from 'vue'

defineOptions({
  name: "LotteryResult"
});

const props = defineProps({
  visible: Boolean,
  award: [String, Number],
  nameZh: String,
  nameEn: String,
  avatar: String // 可选，若未传则自动拼接
})

const emit = defineEmits(['close'])

const awardText = computed(() => {
  switch (props.award) {
    case 1: return '一等奖'
    case 2: return '二等奖'
    case 3: return '三等奖'
    case 4: return '纪念奖'
    default: return props.award
  }
})

const avatarUrl = computed(() => {
  return props.avatar || `/src/assets/images/avatar/${props.nameEn}.jpg`
})
</script>

<template>
  <div v-if="visible" class="result-dialog-mask">
    <div class="result-dialog">
      <div class="result-header">
        <span class="award">{{ awardText }}</span>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      <div class="result-body">
        <img :src="avatarUrl" class="avatar" :alt="nameZh" />
        <div class="winner-name">{{ nameZh }}</div>
      </div>
      <div class="result-footer">
        恭喜获得 <b>{{ awardText }}</b>！
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-dialog-mask {
  position: fixed; left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.result-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 32px 40px 24px 40px;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  text-align: center;
  position: relative;
  animation: pop-in 0.4s;
}
@keyframes pop-in {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.result-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.award {
  font-size: 1.3rem; color: #d9ad61; font-weight: bold;
}
.close-btn {
  background: none; border: none; font-size: 2rem; color: #888; cursor: pointer;
}
.result-body {
  display: flex; flex-direction: column; align-items: center;
}
.avatar {
  width: 120px; height: 120px; border-radius: 50%; object-fit: cover;
  border: 4px solid #d9ad61; margin-bottom: 16px;
}
.winner-name {
  font-size: 2rem; color: #333; font-weight: bold;
}
.result-footer {
  margin-top: 18px; font-size: 1.1rem; color: #d9ad61;
}
</style>