<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { message, Modal } from "ant-design-vue";
import { SettingOutlined } from "@ant-design/icons-vue";
import KeyboardShortcuts from "../features/KeyboardShortcuts.vue";
import { useAwardStore } from "@/store/awardStore";
import { useMusicStore } from "@/store/musicStore";
import { getImageUrl } from "@/composables/utils";
import UploadExcel from "@/components/Upload/UploadExcel.vue";
import LotteryResult from "./LotteryResult.vue";
import WeightEditor from "./WeightEditor.vue";
import AwardSetting from "./AwardSetting.vue";

import useCountdown from "@/composables/lottery/useCountdown";
import useAwardSetting from "@/composables/lottery/useAwardSetting";
import useWeightEditor from "@/composables/lottery/useWeightEditor";
import useAnimation from "@/composables/lottery/useAnimation";
import useLottery from "@/composables/lottery/useLottery";
import useResetData from "@/composables/lottery/useResetData";
import Countdown from "../features/Countdown.vue";
import ImportEmptyBlock from "../features/ImportEmptyBlock.vue";

defineOptions({
  name: "LotteryMain"
});

// 获取奖项剩余数量，中奖名单等数据
const awardStore = useAwardStore();
// 获取音乐控制
const musicStore = useMusicStore();

// ===================== 状态变量 =====================
//#region 倒计时相关
const { showCountdown, countdownText, showCountdownSequence } = useCountdown();
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
const animationPaused = ref(false); // 添加动画暂停标志
// 抽奖流程锁，防止未出结果时重复抽奖
const isLotteryProcessing = ref(false);
// 停止抽奖防抖标志
const isStopping = ref(false);

// 先声明动画相关方法，避免循环依赖
let startAnimation, cancelAnimation;
const animation = useAnimation({
  isMoving,
  wrapPosition,
  lotteryWrap,
  animationFrame,
  speed,
  animationPaused
});
startAnimation = animation.startAnimation;
cancelAnimation = animation.cancelAnimation;

// 权重编辑相关
const { weightEditorVisible, openWeightEditor, handleWeightSave, handleWeightEditorClose } = useWeightEditor({
  lotteryData,
  awardStore,
  isMoving,
  animationPaused,
  startAnimation: () => startAnimation(),
  cancelAnimation: () => cancelAnimation(),
  message,
  nextTick
});
// 奖项设置相关
const { awardSettingVisible, openAwardSetting, handleAwardSettingSave, handleAwardSettingClose } = useAwardSetting({
  awardStore,
  isMoving,
  animationPaused,
  startAnimation: () => startAnimation(),
  cancelAnimation: () => cancelAnimation(),
  nextTick
});

// ===================== 计算属性 =====================
const buttonText = computed(() => {
  if (!isStarted.value && !isMoving.value) return "重新开始";
  if (!isStarted.value && isMoving.value) return "开始抽奖";
  if (isStarted.value && !isLocked.value) return "停止抽奖";
  return "正在抽奖...";
});

// ===================== 生命周期与事件监听 =====================
// 防抖变量
let lastKeyPressTime = 0;
const KEY_PRESS_DEBOUNCE = 500; // 500ms 防抖

// 键盘事件 - 处理普通字符键
const handleKeyPress = e => {
  const now = Date.now();

  switch (e.key) {
    case " ":
      // 防抖处理
      if (now - lastKeyPressTime > KEY_PRESS_DEBOUNCE) {
        handleLottery();
        lastKeyPressTime = now;
      }
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
      } else if (e.key >= "a" && e.key <= "z") {
        // 处理字母键：a-z对应第11-36个奖项
        awardIndex = 10 + (e.key.charCodeAt(0) - "a".charCodeAt(0));
      } else if (e.key >= "A" && e.key <= "Z") {
        // 处理大写字母键：A-Z对应第11-36个奖项
        awardIndex = 10 + (e.key.charCodeAt(0) - "A".charCodeAt(0));
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

// 页面刷新前清空所有数据
const handleBeforeUnload = () => {
  awardStore.clearAll();
};

onMounted(() => {
  window.addEventListener("keypress", handleKeyPress);
  window.addEventListener("keydown", handleKeyDown);
  // 监听页面刷新事件
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  cancelAnimation();
  window.removeEventListener("keypress", handleKeyPress);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

// ===================== 业务逻辑区 =====================

//#region 倒计时相关
// 已抽离到 useCountdown.js
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
      // 只有在动画没有被暂停时才启动
      if (!animationPaused.value) {
        startAnimation();
      }
    });
  } catch (error) {
    console.error("handleSuccess ~ error:", error);
  }
};
//#endregion

//#region 奖项设置相关
// 已抽离到 useAwardSetting.js
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

// 包装 handleAwardSettingSave，先保存奖项再更新权重
const handleAwardSettingSaveWrap = newAwards => {
  handleAwardSettingSave(newAwards);
  updateWeightData();
};
//#endregion

//#region 权重编辑相关
// 已抽离到 useWeightEditor.js
//#endregion

//#region 抽奖相关
// 包装 useLottery，增加流程锁逻辑
const {
  selectAward,
  startLottery,
  stopLottery: _stopLottery
} = useLottery({
  isStarted,
  isMoving,
  isLocked,
  canStop,
  showResult,
  winnerIndex,
  winnerNameZh,
  winnerNameEn,
  wrapPosition,
  speed,
  selectedAward,
  lotteryData,
  awardStore,
  animationPaused,
  startAnimation: () => startAnimation(),
  cancelAnimation: () => cancelAnimation(),
  showCountdownSequence,
  message,
  nextTick
});

// 包装 handleLottery，修正锁逻辑和剩余数量校验
const handleLottery = () => {
  // 重新开始时重置流程锁
  if (!isStarted.value && !isMoving.value) {
    isLotteryProcessing.value = false;
  }
  // “开始抽奖”时加锁
  if (!isStarted.value && isMoving.value) {
    // 先校验剩余数量
    const idx = awardStore.awards.findIndex(a => a.key === selectedAward.value);
    const awardKey = `award0${idx + 1}`;
    if (awardStore.awardLog[awardKey] <= 0) {
      message.error("该奖项已经抽完啦，请选择其它奖项哦！");
      return;
    }
    if (isLotteryProcessing.value) {
      message.warning("抽奖进行中，请等待结果...");
      return;
    }
    isLotteryProcessing.value = true;
    startLottery();
    return;
  }
  // “停止抽奖”时不判断锁，始终允许，但防抖
  if (isStarted.value && !isLocked.value && isMoving.value) {
    stopLottery();
    return;
  }
  // 重新开始
  if (!isStarted.value && !isMoving.value) {
    wrapPosition.value = 0;
    isMoving.value = true;
    isStarted.value = false;
    isLocked.value = true;
    speed.value = 6;
    winnerIndex.value = -1;
    showResult.value = false;
    canStop.value = false;
    if (!animationPaused.value) {
      startAnimation();
    }
  }
};

// 包装 stopLottery，结束后解锁，防止多次触发
const stopLottery = async () => {
  if (isStopping.value) return;
  isStopping.value = true;
  await _stopLottery();
  isLotteryProcessing.value = false;
  isStopping.value = false;
};
//#endregion

//#region 动画相关
// 已在顶部初始化
//#endregion

//#region 其它功能
const { resetAllData } = useResetData({
  isStarted,
  isMoving,
  animationPaused,
  awardStore,
  lotteryData,
  wrapPosition,
  startAnimation: () => startAnimation(),
  cancelAnimation: () => cancelAnimation(),
  message,
  nextTick
});

const closeResult = () => {
  if (!canStop.value) {
    message.error("还没结束，无法关闭！");
    return;
  }
  showResult.value = false;
  isLotteryProcessing.value = false; // 关闭结果弹窗后允许下一次抽奖
};
//#endregion
</script>

<template>
  <div class="main">
    <div class="lottery-logo">
      <img src="@/assets/images/yun.png" class="cloud-left" alt="云朵" />
      <div class="logo-text">
        <h1>抽奖系统</h1>
        <p>LOTTERY SYSTEM</p>
      </div>
      <img src="@/assets/images/yun.png" class="cloud-right" alt="云朵" />
    </div>
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
        <div class="award-buttons-scroll-container">
          <div class="award-buttons-container">
            <template v-for="(item, idx) in awardStore.awards" :key="item.key">
              <div class="cirle-btn award" :id="'award-' + item.key" :class="{ 'award-active': selectedAward === item.key }" @click="selectAward(item.key)" :style="awardStore.awards.length > 12 ? { 'will-change': 'transform' } : {}">
                {{ item.label }}<br />
                <small>剩余: {{ awardStore.awardLog[`award0${idx + 1}`] }}</small>
                <div class="keyboard-hint" v-if="awardStore.awards.length <= 20">
                  <span v-if="idx + 1 <= 9">按 {{ idx + 1 }} 键</span>
                  <span v-else-if="idx + 1 === 10">按 0 键</span>
                  <span v-else>按 {{ String.fromCharCode(97 + idx - 10) }} 键</span>
                </div>
              </div>
            </template>
          </div>
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
      <KeyboardShortcuts v-if="lotteryData.length > 0" :award-length="awardStore.awards.length" />
    </div>

    <!-- 导入 -->
    <ImportEmptyBlock v-else @import="importModal = true" />
  </div>

  <!-- 倒计时 -->
  <Countdown :visible="showCountdown" :countdown-text="countdownText" />

  <!-- 中奖结果 -->
  <LotteryResult :visible="showResult" :award="selectedAward" :name-zh="winnerNameZh" :name-en="winnerNameEn" @close="showResult = false" />

  <!-- 导入数据 -->
  <UploadExcel v-model:visible="importModal" :on-success="handleSuccess" :before-upload="beforeUpload" />

  <!-- 权重编辑 -->
  <WeightEditor v-model:visible="weightEditorVisible" :lottery-data="lotteryData" @save="handleWeightSave" @close="handleWeightEditorClose" />

  <!-- 奖项设置 -->
  <AwardSetting v-model:visible="awardSettingVisible" :awards="awardStore.awards" @save="handleAwardSettingSaveWrap" @close="handleAwardSettingClose" />

</template>

<style lang="scss" scoped></style>
