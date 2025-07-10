<script setup>
import { computed } from "vue";
import { useAwardStore } from "@/store/awardStore";
import { storeToRefs } from "pinia";

defineOptions({
  name: "LotteryResult"
});

const props = defineProps({
  visible: Boolean,
  award: [String, Number],
  nameZh: String,
  nameEn: String,
  avatar: String, // 可选，外部传入头像dataUrl
  image: Object, // 可选，中奖对象带图片字段
  avatarChar: String, // 可选，外部传入头像dataUrl
  wish: String, // 新增，中奖者愿景及祝福
});

const emit = defineEmits(["close"]);

const awardStore = useAwardStore();
const { awards } = storeToRefs(awardStore);

const awardText = computed(() => {
  const found = awards.value.find(item => item.key === props.award);
  if (found) {
    return found.label;
  }
  return props.award;
});

// 中奖结果头像渲染逻辑：优先外部传入avatar，其次image.dataUrl，最后降级为名称
const avatarUrl = computed(() => {
  if (props.avatar) return props.avatar;
  if (props.image && typeof props.image === "object" && props.image.dataUrl) return props.image.dataUrl;
  return "";
});
</script>

<template>
  <div v-if="visible" class="result-dialog-mask">
    <div class="result-dialog">
      <div class="result-header">
        <span class="award">{{ awardText }}</span>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      <div class="result-body">
        <template v-if="nameZh === 'Invalid Winner' || !nameZh">
          <div class="avatar-text">无效中奖者</div>
        </template>
        <template v-else>
          <img v-if="avatarUrl" :src="avatarUrl" class="avatar" :alt="nameZh" />
          <div
            v-else
            class="avatar-text"
            :style="{ width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffe082', borderRadius: '50%', fontSize: '48px', color: '#b8860b', fontWeight: 'bold', border: '5px solid #d9ad61', marginBottom: '20px' }"
          >
            {{ avatarChar ? avatarChar : (nameZh ? nameZh[0] : '') }}
          </div>
        </template>
        <div class="winner-name">
          <template v-if="nameZh === 'Invalid Winner' || !nameZh"> 暂无有效中奖者 </template>
          <template v-else>
            {{ nameZh }}
          </template>
        </div>
        <div class="winner-wish" v-if="wish">
          <b>新年愿景及祝福：</b>
          <span>{{ wish }}</span>
        </div>
      </div>
      <div class="result-footer">
        <template v-if="nameZh === 'Invalid Winner' || !nameZh"> 请检查抽奖数据或重新抽奖 </template>
        <template v-else>
          恭喜获得 <b>{{ awardText }}</b
          >！
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-dialog-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.result-dialog {
  background: #fff;
  border-radius: 16px;
  padding: 40px 48px 32px 48px;
  min-width: 380px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  text-align: center;
  position: relative;
  animation: pop-in 0.4s;
}

@keyframes pop-in {
  0% {
    transform: scale(0.7);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.award {
  font-size: 2.8rem;
  color: #d9ad61;
  font-weight: bold;
  font-family: "STKaiti", "KaiTi ", serif;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
}

.result-body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 5px solid #d9ad61;
  margin-bottom: 20px;
}

.winner-name {
  font-size: 2.4rem;
  color: #333;
  font-weight: bold;
  font-family: "STKaiti", "KaiTi ", serif;
  margin-top: 8px;
}

.winner-wish {
  margin-top: 12px;
  font-size: 2rem;
  color: #b8860b;
  font-family: "STKaiti", "KaiTi ", serif;
  background: #fffbe6;
  border-radius: 8px;
  padding: 8px 16px;
  display: inline-block;
}

.result-footer {
  margin-top: 18px;
  font-size: 1.8rem;
  color: #d9ad61;
  font-family: "STKaiti", "KaiTi ", serif;
}

.avatar-text {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffe082 0%, #ffd54f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  color: #b8860b;
  font-weight: bold;
  margin-bottom: 20px;
  border: 6px solid #d9ad61;
  box-shadow: 0 4px 24px rgba(218, 165, 32, 0.18);
  letter-spacing: 0.2em;
  text-shadow:
    1px 2px 8px #fffbe6,
    0 1px 0 #fffbe6;
  transition: all 0.2s;
}
</style>
