<script setup>
import { computed, ref, watch } from "vue";
import { useAwardStore } from "@/store/awardStore";
import { usePrizeStore } from "@/store/prizeStore";
import { storeToRefs } from "pinia";
import FireworkEffect from '../features/FireworkEffect.vue'

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
  gift: Object, // 新增，中奖者获得的礼物信息
  department: String
});

const emit = defineEmits(["close"]);

const awardStore = useAwardStore();
const prizeStore = usePrizeStore();
const { awards } = storeToRefs(awardStore);

const awardText = computed(() => {
  const found = awards.value.find(item => item.key === props.award);
  if (found) {
    return found.label;
  }
  return props.award;
});

// 获取礼物信息
const giftInfo = computed(() => {
  // 优先使用传入的礼物信息，如果没有则随机选择一个
  if (props.gift) {
    return props.gift;
  }
  return prizeStore.getRandomPrizeByAward(props.award);
});

// 中奖结果头像渲染逻辑：优先外部传入avatar，其次image.dataUrl，最后降级为名称
const avatarUrl = computed(() => {
  if (props.avatar) return props.avatar;
  if (props.image && typeof props.image === "object" && props.image.dataUrl) return props.image.dataUrl;
  return "";
});

// 礼花效果
const showFirework = ref(false)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      showFirework.value = false
      setTimeout(() => {
        showFirework.value = true
      }, 100)
    }
  }
)
</script>

<template>
  <div v-if="visible" class="result-dialog-mask">
    <FireworkEffect :show="showFirework" />
    <div class="result-dialog">
      <div class="result-header">
        <div class="award-info">
          <span class="award">{{ awardText }}</span>
        </div>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      
      <!-- 奖品展示区域 -->
      <div class="gift-showcase" v-if="giftInfo">
        <div class="gift-card">
          <div class="gift-image-container">
            <img 
              v-if="giftInfo.giftImage && typeof giftInfo.giftImage === 'object' && giftInfo.giftImage.dataUrl" 
              :src="giftInfo.giftImage.dataUrl" 
              :alt="giftInfo.giftName" 
              class="gift-image" 
            />
            <div 
              v-else
              class="gift-image-placeholder"
            >
              {{ giftInfo.giftName ? giftInfo.giftName.charAt(0) : '礼' }}
            </div>
          </div>
          <div class="gift-details">
            <div class="gift-name">{{ giftInfo.giftName }}</div>
            <div class="gift-description">{{ giftInfo.description || giftInfo.giftCategory || awardText }}</div>
          </div>
        </div>
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
        <div class="winner-department" v-if="department">
          <b>部门：</b>
          <span>{{ department }}</span>
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
  border-radius: 20px;
  padding: 32px 40px 28px 40px;
  min-width: 420px;
  max-width: 500px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
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
  margin-bottom: 24px;
}

.award-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.award {
  font-size: 2.8rem;
  color: #d9ad61;
  font-weight: bold;
  font-family: "STKaiti", "KaiTi ", serif;
}

/* 奖品展示区域样式 */
.gift-showcase {
  margin-bottom: 24px;
}

.gift-card {
  background: linear-gradient(135deg, #fffbe6 0%, #fff8dc 100%);
  border-radius: 16px;
  padding: 20px;
  border: 3px solid #d9ad61;
  box-shadow: 0 4px 20px rgba(218, 165, 32, 0.2);
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
  animation: gift-appear 0.6s ease-out;
}

@keyframes gift-appear {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.gift-image-container {
  flex-shrink: 0;
}

.gift-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  border: 3px solid #d9ad61;
  box-shadow: 0 2px 8px rgba(218, 165, 32, 0.3);
}

.gift-image-placeholder {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ffe082 0%, #ffd54f 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #b8860b;
  font-weight: bold;
  border: 3px solid #d9ad61;
  box-shadow: 0 2px 8px rgba(218, 165, 32, 0.3);
}

.gift-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gift-name {
  font-size: 1.8rem;
  color: #b8860b;
  font-weight: bold;
  font-family: "STKaiti", "KaiTi ", serif;
  line-height: 1.2;
}

.gift-description {
  font-size: 1.4rem;
  color: #8b7355;
  font-family: "STKaiti", "KaiTi ", serif;
  line-height: 1.3;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2.4rem;
  color: #d9ad61;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(218, 165, 32, 0.1);
  color: #b8860b;
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

.winner-department {
  margin-top: 8px;
  font-size: 1.8rem;
  color: #8b7355;
  font-family: "STKaiti", "KaiTi ", serif;
  background: #f9f9f9;
  border-radius: 6px;
  padding: 6px 12px;
  display: inline-block;
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
