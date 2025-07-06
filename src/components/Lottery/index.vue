<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { message, Modal } from "ant-design-vue";
import { SettingOutlined } from "@ant-design/icons-vue";
import { useAwardStore } from "@/store/awardStore";
import { useMusicStore } from "@/store/musicStore";
import { getImageUrl, weightedRandomIndex } from "@/composables/utils";
import UploadExcel from "@/components/Upload/UploadExcel.vue";
import LotteryResult from "./LotteryResult.vue";
import WeightEditor from "./WeightEditor.vue";
import AwardSetting from "./AwardSetting.vue";

defineOptions({
  name: "LotteryMain"
});

// 获取奖项剩余数量，中奖名单等数据
const awardStore = useAwardStore();
// 获取音乐控制
const musicStore = useMusicStore();

// ===================== 状态变量 =====================
//#region 倒计时相关
const showCountdown = ref(false);
const countdownText = ref("叁");
//#endregion

//#region 导入数据相关
const importModal = ref(false);
const lotteryData = ref([]);
//#endregion

// 状态管理
const selectedAward = ref(awardStore.selectAward || awardStore.awards[0]?.key || "");
const isMoving = ref(true);
const isStarted = ref(false);
const isLocked = ref(true);
const canStop = ref(false);
const showResult = ref(false);
const winnerIndex = ref(-1);
const winnerNameZh = ref("");
const winnerNameEn = ref("");
const wrapPosition = ref(0);
const animationFrame = ref(null);
const speed = ref(6);
const lotteryWrap = ref(null);
const wrapMain = ref(null);

// 权重编辑相关
const weightEditorVisible = ref(false);
// 奖项设置相关
const awardSettingVisible = ref(false);
// 全屏loading
const fullScreenLoading = ref(false);

// ===================== 计算属性 =====================
const buttonText = computed(() => {
  if (!isStarted.value && !isMoving.value) return "重新开始";
  if (!isStarted.value && isMoving.value) return "开始抽奖";
  if (isStarted.value && !isLocked.value) return "停止抽奖";
  return "正在抽奖...";
});

// ===================== 生命周期与事件监听 =====================
// 键盘事件 - 处理普通字符键
const handleKeyPress = e => {
  switch (e.key) {
    case " ":
      handleLottery();
      break;
    case "Enter":
      // 只有在抽奖结束后才允许关闭结果
      if (!isStarted.value && canStop.value) {
        closeResult();
      }
      break;
    case "m":
    case "M":
      // 触发音乐开关
      toggleMusic();
      break;
    default:
      // 动态处理数字键和字母键选择奖项
      const keyNumber = parseInt(e.key);
      let awardIndex = -1;
      
      if (!isNaN(keyNumber) && keyNumber >= 0 && keyNumber <= 9) {
        // 处理数字键：0键对应第10个奖项，1-9键对应第1-9个奖项
        if (keyNumber === 0) {
          awardIndex = 9; // 0键对应第10个奖项（索引9）
        } else {
          awardIndex = keyNumber - 1; // 1-9键对应第1-9个奖项
        }
      } else if (e.key >= 'a' && e.key <= 'z') {
        // 处理字母键：a-z对应第11-36个奖项
        awardIndex = 10 + (e.key.charCodeAt(0) - 'a'.charCodeAt(0));
      } else if (e.key >= 'A' && e.key <= 'Z') {
        // 处理大写字母键：A-Z对应第11-36个奖项
        awardIndex = 10 + (e.key.charCodeAt(0) - 'A'.charCodeAt(0));
      }
      
      if (awardIndex >= 0 && awardIndex < awardStore.awards.length) {
        const targetAward = awardStore.awards[awardIndex];
        if (targetAward) {
          selectAward(targetAward.key);
        }
      }
      break;
  }
};

// 键盘事件 - 处理特殊键（如Delete、Backspace等）
const handleKeyDown = e => {
  switch (e.key) {
    case "Delete":
      // 重置数据
      resetAllData();
      break;
  }
};

onMounted(() => {
  window.addEventListener("keypress", handleKeyPress);
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  cancelAnimation();
  window.removeEventListener("keypress", handleKeyPress);
  window.removeEventListener("keydown", handleKeyDown);
});

// ===================== 业务逻辑区 =====================

//#region 倒计时相关
async function showCountdownSequence() {
  showCountdown.value = true;
  
  // 叁
  countdownText.value = "叁";
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 贰
  countdownText.value = "贰";
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 壹
  countdownText.value = "壹";
  await new Promise(resolve => setTimeout(resolve, 600));
  
  showCountdown.value = false;
}
//#endregion

//#region 音乐控制相关
const toggleMusic = () => {
  musicStore.toggleMusic();
};
//#endregion

//#region 导入数据相关
const beforeUpload = file => {
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (isLt1M) {
    return true;
  }
  message.error("Please do not upload files larger than 1m in size.");
  return false;
};

const handleSuccess = ({ header, results }) => {
  try {
    // 动态设置默认权重
    const defaultWeights = {};
    awardStore.awards.forEach((award, index) => {
      defaultWeights[index + 1] = 1; // 默认每个奖项权重为1
    });
    
    lotteryData.value = results.map(item => ({
      ...item,
      awardWeights: defaultWeights,
      locked: false
    }));
    // 备份导入数据
    awardStore.setLotteryDataBackup(lotteryData.value);
    // 开始动画
    if (awardStore.selectAward) {
      selectedAward.value = awardStore.selectAward;
    }
    nextTick(() => {
      wrapPosition.value = 0; // 重置
      startAnimation();
    });
  } catch (error) {
    console.error("handleSuccess ~ error:", error);
  }
};

const getTemplateUrl = () => {
  return new URL("/template/importTemplate.xlsx", import.meta.url).href;
};
//#endregion

//#region 奖项设置相关
const openAwardSetting = () => {
  awardSettingVisible.value = true;
};
const handleAwardSettingSave = newAwards => {
  awardStore.setAwards(newAwards);
  // 更新权重数据结构
  updateWeightData();
};
//#endregion

//#region 权重数据更新
const updateWeightData = () => {
  if (lotteryData.value.length > 0) {
    lotteryData.value = lotteryData.value.map(item => {
      const awardWeights = { ...item.awardWeights };
      // 确保包含所有奖项的权重
      awardStore.awards.forEach((award, index) => {
        const key = index + 1;
        if (!(key in awardWeights)) {
          awardWeights[key] = 1; // 默认权重为1
        }
      });

      return {
        ...item,
        awardWeights
      };
    });
  }
};
//#endregion

//#region 权重编辑相关
const openWeightEditor = () => {
  if (lotteryData.value.length === 0) {
    message.warning("请先导入抽奖数据");
    return;
  }
  weightEditorVisible.value = true;
};
const handleWeightSave = updatedData => {
  lotteryData.value = updatedData;
  message.success("权重设置已更新");
};
//#endregion

//#region 抽奖相关
const selectAward = awardKey => {
  if (isStarted.value) {
    message.error("正在抽奖中，不允许更改奖项设置");
    return;
  }
  selectedAward.value = awardKey;
  awardStore.setSelectAward(awardKey);
};

const handleLottery = () => {
  const idx = awardStore.awards.findIndex(a => a.key === selectedAward.value);
  const awardKey = `award0${idx + 1}`;
  if (awardStore.awardLog[awardKey] <= 0) {
    message.error("该奖项已经抽完啦，请选择其它奖项哦！");
    return;
  }
  const lockedList = lotteryData.value.filter(item => item.locked);
  if (lockedList.length > 0) {
    // 有锁定，判断锁定且权重>0的人
    const lockedWithWeight = lockedList.filter(item => (item.awardWeights?.[idx + 1] ?? 1) > 0);
    if (lockedWithWeight.length === 0) {
      message.error("锁定的人员当前奖项权重都为0，无法抽奖");
      return;
    }
  } else {
    // 没有锁定，判断所有权重
    const weights = lotteryData.value.map(item => item.awardWeights?.[idx + 1] ?? 1);
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) {
      message.error("当前奖项所有权重都为0，无法抽奖");
      return;
    }
  }
  if (!isStarted.value && !isMoving.value) {
    // 重新开始：重置状态并重新滚动，不刷新页面
    wrapPosition.value = 0;
    isMoving.value = true;
    isStarted.value = false;
    isLocked.value = true;
    speed.value = 6;
    winnerIndex.value = -1;
    showResult.value = false;
    canStop.value = false;
    startAnimation();
    return;
  }
  if (!isStarted.value && isMoving.value) {
    startLottery();
  } else if (isStarted.value && !isLocked.value) {
    stopLottery();
  }
};

const startLottery = () => {
  isStarted.value = true;
  isMoving.value = true;
  isLocked.value = true;
  // 加速动画
  setTimeout(() => (speed.value = 15), 1000);
  setTimeout(() => (speed.value = 20), 1500);
  setTimeout(() => (speed.value = 30), 3000);
  setTimeout(() => (speed.value = 50), 3500);
  setTimeout(() => {
    speed.value = 90;
    isLocked.value = false;
  }, 4000);
};

const stopLottery = async () => {
  if (isLocked.value) {
    message.error("还没结束，请稍等...");
    return;
  }
  try {
    const idx = awardStore.awards.findIndex(a => a.key === selectedAward.value);
    // 先查找是否有锁定 锁定且权重>0才可抽中
    const lockedList = lotteryData.value.filter(item => item.locked && (item.awardWeights?.[idx + 1] ?? 1) > 0);
    let winnerIndexResult;
    if (lockedList.length > 0) {
      // 只从锁定的人中随机抽取
      const idx = Math.floor(Math.random() * lockedList.length);
      const winner = lockedList[idx];
      winnerIndexResult = lotteryData.value.findIndex(item => item.nameen === winner.nameen);
    } else {
      // 正常权重抽奖
      winnerIndexResult = weightedRandomIndex(lotteryData.value, selectedAward.value);
      if (winnerIndexResult === -1) {
        message.error("当前奖项所有权重都为0，无法抽奖");
        return;
      }
    }
    winnerIndex.value = winnerIndexResult;

    // 更新获奖者信息
    const winner = lotteryData.value[winnerIndex.value];
    winnerNameZh.value = winner.namezh;
    winnerNameEn.value = winner.nameen;


    // 显示倒计时
    await showCountdownSequence();
    // 显示结果
    showResult.value = true;
    canStop.value = true;
    // 停止主动画
    isMoving.value = false;
    cancelAnimation();
    isStarted.value = false;
    speed.value = 8;

    // 更新奖项数据
    // 中奖人对象
    const winnerData = {
      nameen: winnerNameEn.value,
      namezh: winnerNameZh.value
    };
    // 写入中奖名单
    awardStore.addWinner(selectedAward.value, winnerData);
    // 更新奖项剩余数量
    const remainingIdx = awardStore.awards.findIndex(a => a.key === selectedAward.value);
    const awardKey = `award0${remainingIdx + 1}`;
    const newAwardLog = { ...awardStore.awardLog };
    newAwardLog[awardKey] -= 1;
    awardStore.setAwardLog(newAwardLog);
    // 从抽奖池中移除获奖者
    lotteryData.value = lotteryData.value.filter(item => item.nameen !== winner.nameen);
    winnerIndex.value = -1;
  } catch (error) {
    console.error("Function stopLottery ~ error:", error);
  }
};
//#endregion

//#region 动画相关
const startAnimation = () => {
  let lastTime = 0;
  const animate = timestamp => {
    if (!isMoving.value) return;
    if (!lotteryWrap.value) return; // 防止空指针
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    wrapPosition.value -= speed.value;
    if (-wrapPosition.value >= lotteryWrap.value.scrollHeight / 2) {
      wrapPosition.value = 0;
    }
    animationFrame.value = window.requestAnimationFrame(animate);
  };
  animationFrame.value = window.requestAnimationFrame(animate);
};

const cancelAnimation = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
};
//#endregion

//#region 其它功能
const closeResult = () => {
  if (!canStop.value) {
    message.error("还没结束，无法关闭！");
    return;
  }
  showResult.value = false;
};

// 重置数据
const resetAllData = () => {
  // 如果正在抽奖中，给出提示
  if (isStarted.value) {
    message.warning("正在抽奖中，建议等抽奖结束后再重置数据");
  }
  
  Modal.confirm({
    title: "确定要重置所有数据吗？",
    content: "此操作会恢复到导入数据后的初始状态，所有抽奖结果和名单将被清空。",
    okText: "确定",
    cancelText: "取消",
    async onOk() {
      fullScreenLoading.value = true;
      try {
        // 停止当前抽奖
        if (isStarted.value) {
          isStarted.value = false;
          isMoving.value = false;
          cancelAnimation();
        }
        
        awardStore.resetAllToImportBackup();
        // 恢复 lotteryData，补全自定义字段
        if (awardStore.lotteryDataBackup && awardStore.lotteryDataBackup.length > 0) {
          // 动态设置默认权重
          const defaultWeights = {};
          awardStore.awards.forEach((award, index) => {
            defaultWeights[index + 1] = 1; // 默认每个奖项权重为1
          });
          
          lotteryData.value = awardStore.lotteryDataBackup.map(item => ({
            ...item,
            awardWeights: item.awardWeights || defaultWeights,
            locked: typeof item.locked === "boolean" ? item.locked : false
          }));
          await nextTick();
          wrapPosition.value = 0;
          startAnimation();
        } else {
          lotteryData.value = [];
        }
        message.success("已重置为导入初始状态");
      } finally {
        fullScreenLoading.value = false;
      }
    }
  });
};

// 清空所有数据
const clearAllData = () => {
  Modal.confirm({
    title: "确定要清空所有数据吗？",
    content: "此操作会清空上一次操作所产生的所有数据。",
    okText: "确定",
    cancelText: "取消",
    async onOk() {
      fullScreenLoading.value = true;
      try {
        awardStore.clearAll();
        message.success("已清空所有数据");
      } finally {
        fullScreenLoading.value = false;
      }
    }
  });
};
//#endregion
</script>

<template>
  <div class="main">
    <!-- <div class="lotterty-infogo">
      <img src="@/assets/images/logo.png">
    </div> -->
    <div v-if="lotteryData.length > 0" class="lottery-main">
      <div class="wrap-border-main">
        <img src="@/assets/images/wrap-border-1.png" class="wrap-border wrap-border-1" />
        <img src="@/assets/images/wrap-border-2.png" class="wrap-border wrap-border-2" />
        <img src="@/assets/images/wrap-border-3.png" class="wrap-border wrap-border-3" />
        <img src="@/assets/images/wrap-border-4.png" class="wrap-border wrap-border-4" />
        <div class="wrap-border wrap-border-left"></div>
        <div class="wrap-border wrap-border-right"></div>
      </div>
      <div ref="wrapMain" class="wrap-main">
        <div id="lottery-wrap" :style="{ transform: `translateY(${wrapPosition}px)` }" ref="lotteryWrap">
          <div v-for="(item, index) in lotteryData" :key="index" class="clearFloat lottery-list" :class="{ 'sure-active': index === winnerIndex }">
            <div class="f-l turqoise lottery-avatar">
              <img :src="getImageUrl(item.nameen, 'avatar')" :alt="item.namezh" />
            </div>
            <div class="f-l lottery-content">
              <em class="beauty border-01"></em>
              <em class="beauty border-02"></em>
              <em class="beauty border-03"></em>
              <em class="beauty border-04"></em>
              <div class="border bor-top"></div>
              <div class="border bor-bottom"></div>
              <h3 class="content-title">
                <span class="lottery-name">{{ item.namezh }}</span>
                <span class="company">[ 牛马科技 ]</span>
              </h3>
              <div class="content-detail">
                <b>新年愿景及祝福：</b>
                <span>{{ item.wish }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard">
        <!-- 奖项按钮区域 -->
        <div class="award-buttons-container">
          <template v-for="(item, idx) in awardStore.awards" :key="item.key">
            <div class="cirle-btn award" :id="'award-' + item.key" :class="{ 'award-active': selectedAward === item.key }" @click="selectAward(item.key)">
              {{ item.label }}<br />
              <small>剩余: {{ awardStore.awardLog[`award0${idx + 1}`] }}</small>
              <div class="keyboard-hint">
                <span v-if="idx + 1 <= 9">按 {{ idx + 1 }} 键</span>
                <span v-else-if="idx + 1 === 10">按 0 键</span>
                <span v-else>按 {{ String.fromCharCode(97 + idx - 10) }} 键</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 抽奖按钮 -->
        <a-button class="btn btn-red-outline lottery-btn" @click="handleLottery">
          {{ buttonText }}
        </a-button>
      </div>

      <!-- 权重编辑按钮 -->
      <div v-if="lotteryData.length > 0" class="dashboard dashboard-setting">
        <div class="btn weight-edit-section">
          <a-button @click="openAwardSetting">
            <template #icon>
              <SettingOutlined />
            </template>
            奖项设置
          </a-button>
        </div>
        <div class="btn weight-edit-section">
          <a-button @click="openWeightEditor">
            <template #icon>
              <SettingOutlined />
            </template>
            权重设置
          </a-button>
        </div>
        <div class="btn weight-edit-section">
          <a-button danger @click="resetAllData">
            <template #icon>
              <SettingOutlined />
            </template>
            重置数据
          </a-button>
        </div>
      </div>

      <!-- 键盘快捷键提示 -->
      <div v-if="lotteryData.length > 0" class="keyboard-shortcuts">
        <div class="shortcuts-title">键盘快捷键：</div>
        <div class="shortcuts-list">
          <span class="shortcut-item">空格键：开始/停止抽奖</span>
          <span class="shortcut-item" v-if="awardStore.awards.length <= 9">数字键1-{{ awardStore.awards.length }}：选择奖项</span>
          <span class="shortcut-item" v-else-if="awardStore.awards.length === 10">数字键1-9,0：选择奖项</span>
          <span class="shortcut-item" v-else-if="awardStore.awards.length <= 36">数字键1-9,0 + 字母键a-{{ String.fromCharCode(97 + awardStore.awards.length - 11) }}：选择奖项</span>
          <span class="shortcut-item" v-else>数字键1-9, 0 + 字母键a-z：选择前36个奖项</span>
          <span class="shortcut-item">Enter：关闭结果（抽奖结束后）</span>
          <span class="shortcut-item">Delete：重置数据</span>
          <span class="shortcut-item">M：音乐开关</span>
        </div>
      </div>
    </div>

    <!-- 导入 -->
    <a-empty
      v-else
      image="https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original"
      :image-style="{
        height: '60px'
      }"
    >
      <template #description>
        <span> 请先导入数据 </span>
      </template>
      <a-button type="primary">
        <a :href="getTemplateUrl()" target="_blank">下载模板</a>
      </a-button>
      <a-button class="margin-left10" type="primary" @click="importModal = true">导入抽奖名单数据</a-button>
      <a-button class="margin-left10" type="primary" @click="clearAllData">清空所有数据</a-button>
      <!-- <a-button type="primary">导入礼物名单数据</a-button> -->
    </a-empty>
  </div>

  <!-- 倒计时 -->
  <transition name="fade">
    <div v-if="showCountdown" class="stop-main">
      <div class="countdown-container">
        <div id="stop-time" class="countdown-text" :data-number="countdownText">{{ countdownText }}</div>
        <div class="countdown-circle"></div>
        <div class="countdown-particles"></div>
      </div>
      <div class="back"></div>
    </div>
  </transition>

  <!-- 中奖结果 -->
  <LotteryResult :visible="showResult" :award="selectedAward" :name-zh="winnerNameZh" :name-en="winnerNameEn" @close="showResult = false" />

  <!-- 导入数据 -->
  <UploadExcel v-model:visible="importModal" :on-success="handleSuccess" :before-upload="beforeUpload" />

  <!-- 权重编辑 -->
  <WeightEditor v-model:visible="weightEditorVisible" :lottery-data="lotteryData" @save="handleWeightSave" />

  <!-- 奖项设置 -->
  <AwardSetting v-model:visible="awardSettingVisible" :awards="awardStore.awards" @save="handleAwardSettingSave" />

  <!-- 全屏loading -->
  <a-spin v-if="fullScreenLoading" :spinning="true" size="large" class="global-spin" />
</template>

<style lang="scss" scoped>
.keyboard-hint {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
  opacity: 0.7;
  font-weight: normal;
}

.cirle-btn.award:hover .keyboard-hint {
  opacity: 1;
  color: #666;
}

.keyboard-shortcuts {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 1000;
  max-width: 300px;
}

.shortcuts-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #ffd700;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-item {
  opacity: 0.9;
  line-height: 1.4;
}
</style>
