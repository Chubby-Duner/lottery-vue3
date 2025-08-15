<script setup>
import { ref, computed, nextTick } from "vue";
import { message } from "ant-design-vue";
import { getRandomChar } from "@/composables/utils";
import { useAwardStore } from "@/store/awardStore";
import { useMusicStore } from "@/store/musicStore";
import { usePrizeStore } from "@/store/prizeStore";
import UploadExcel from "@/components/Upload/UploadExcel.vue";
import LotteryLogo from "./LotteryLogo.vue";
import LotteryResult from "./LotteryResult.vue";
import WeightEditor from "./WeightEditor.vue";
import AwardSetting from "./AwardSetting.vue";
import GiftSetting from "./GiftSetting.vue";
import Countdown from "../features/Countdown.vue";
import ImportEmptyBlock from "../features/ImportEmptyBlock.vue";
import AwardControlPanel from "../features/AwardControlPanel.vue";
import KeyboardShortcuts from "../features/KeyboardShortcuts.vue";
import MultiRoundSetting from "../features/MultiRoundSetting.vue";
import MultiRoundProgress from "../features/MultiRoundProgress.vue";
import LotteryHistory from "../features/LotteryHistory.vue";

import useCountdown from "@/composables/lottery/useCountdown";
import useAwardSetting from "@/composables/lottery/useAwardSetting";
import useWeightEditor from "@/composables/lottery/useWeightEditor";
import useAnimation from "@/composables/lottery/useAnimation";
import useLottery from "@/composables/lottery/useLottery";
import useResetData from "@/composables/lottery/useResetData";
import useKeyboardShortcuts from "@/composables/lottery/useKeyboardShortcuts";
import useLotteryHistory from "@/composables/lottery/useLotteryHistory";
import useMultiRoundLottery from "@/composables/lottery/useMultiRoundLottery";

defineOptions({
  name: "LotteryMain"
});

// 获取奖项剩余数量，中奖名单等数据
const awardStore = useAwardStore();
// 获取音乐控制
const musicStore = useMusicStore();
const prizeStore = usePrizeStore();

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
// 是否抽奖中，动画已经在滚动了
const isMoving = ref(true);
// 抽奖是否已经开始
const isStarted = ref(false);
// 是否允许停止抽奖
const isLocked = ref(true);
const canStop = ref(false);
const showResult = ref(false);
const winnerIndex = ref(-1);
const winnerNameZh = ref("");
const winnerNameEn = ref("");
const winnerImage = ref(null);
const winnerAvatarChar = ref("");
const winnerWish = ref("");
const winnerGift = ref(null);
const wrapPosition = ref(0);
const animationFrame = ref(null);
const speed = ref(6);
const lotteryWrap = ref(null);
const wrapMain = ref(null);
const animationPaused = ref(false); // 添加动画暂停标志
// 抽奖流程锁，防止未出结果时重复抽奖
const isLotteryProcessing = ref(false);
// 控制全局键盘监听开关
const keyboardEnabled = ref(true);

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

// 礼物设置相关
const giftSettingVisible = ref(false);
const openPrizeSetting = () => {
  if (!prizeStore.hasPrizes) {
    message.warning("请先导入礼物数据");
    return;
  }
  giftSettingVisible.value = true;
};

// 历史记录相关
const { showHistoryModal, canUndo, historyStats, recentHistory, showHistory, handleUndoConfirm, clearAllHistory, deleteHistoryRecord, historyStore } = useLotteryHistory({
  lotteryData,
  selectedAward,
  isMoving,
  animationPaused,
  startAnimation: () => startAnimation(),
  cancelAnimation: () => cancelAnimation()
});

// 多轮抽奖相关
const {
  showMultiRoundModal,
  multiRoundCount,
  showMultiRoundProgress,
  multiRoundResults,
  isMultiRoundMode,
  currentRoundIndex,
  totalRounds,
  showMultiRoundSetting,
  startMultiRoundLottery,
  finishMultiRoundLottery,
  completeOneRound,
  cancelMultiRoundLottery,
  closeMultiRoundModal,
  getCurrentAwardRemaining
} = useMultiRoundLottery({
  selectedAward,
  isStarted,
  isMoving,
  isLotteryProcessing
});

// 处理多轮抽奖开始
const handleMultiRoundStart = roundCount => {
  const success = startMultiRoundLottery(roundCount);
  if (success) {
    // 多轮抽奖设置成功后，自动开始第一轮抽奖
    setTimeout(() => {
      if (historyStore.multiRoundConfig.enabled && lotteryData.value.length > 0) {
        message.info(`多轮抽奖已开始，将全自动进行${roundCount}轮抽奖`);
        handleLottery(); // 自动开始第一轮抽奖
      }
    }, 500); // 0.5秒后自动开始第一轮
  }
};

// ===================== 计算属性 =====================
const buttonText = computed(() => {
  // 多轮抽奖模式下的按钮文本
  if (isMultiRoundMode.value) {
    if (!isStarted.value && !isMoving.value) return "重新开始";
    if (!isStarted.value && isMoving.value) return "多轮抽奖准备中...";
    if (isStarted.value && !isLocked.value) return "停止抽奖";
    return `多轮抽奖进行中... (${currentRoundIndex.value + 1}/${totalRounds.value})`;
  }

  // 普通抽奖模式
  if (!isStarted.value && !isMoving.value) return "重新开始";
  if (!isStarted.value && isMoving.value) return "开始抽奖";
  if (isStarted.value && !isLocked.value) return "停止抽奖";
  return "抽奖中...";
});

// ===================== 业务逻辑区 =====================

//#region 音乐控制相关
const toggleMusic = () => {
  musicStore.toggleMusic();
};
//#endregion

//#region 导入数据相关
const beforeUpload = file => {
  const isLt1M = file.size / 1024 / 1024 < 10;
  if (isLt1M) {
    return true;
  }
  message.error("Please do not upload files larger than 10m in size.");
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
      locked: false,
      avatarChar: getRandomChar(item.namezh) // 新增：固定头像字
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
  // 奖项设置保存后弹出礼物设置弹窗
  giftSettingVisible.value = true;
  // 强制重置动画相关状态并自动重启动画
  isStarted.value = false;
  isMoving.value = false;
  animationPaused.value = false;
  nextTick(() => {
    wrapPosition.value = 0;
    startAnimation();
  });
};
//#endregion

//#region 抽奖相关
const { selectAward, handleLottery, exportWinners } = useLottery({
  isStarted,
  isMoving,
  isLocked,
  isLotteryProcessing,
  canStop,
  showResult,
  winnerIndex,
  winnerNameZh,
  winnerNameEn,
  winnerImage,
  winnerAvatarChar,
  winnerWish,
  winnerGift,
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
  finishMultiRoundLottery,
  completeOneRound
});
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
    message.error("抽奖还没结束，无法关闭！");
    return;
  }
  showResult.value = false;
  isLotteryProcessing.value = false; // 关闭结果弹窗后允许下一次抽奖
};
//#endregion

// ===================== 生命周期与事件监听 =====================
// 键盘快捷键处理
useKeyboardShortcuts({
  isStarted,
  canStop,
  awardStore,
  handleLottery,
  closeResult,
  toggleMusic,
  selectAward,
  resetAllData,
  cancelAnimation,
  enabled: keyboardEnabled
});

// 页面按钮、快捷键等直接用 useLottery 的 handleLottery
</script>

<template>
  <div class="main">
    <!-- Logo -->
    <LotteryLogo />

    <div v-if="lotteryData.length > 0" class="lottery-main">
      <!-- 抽奖区域 -->
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
              <!-- 优先显示导入图片，没有则显示名字的随机一个字 -->
              <img v-if="item.image && typeof item.image === 'object' && item.image.dataUrl" :src="item.image.dataUrl" :alt="item.namezh" />
              <div
                v-else
                class="avatar-text"
                :style="{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffe082', borderRadius: '50%', fontSize: '28px', color: '#b8860b', fontWeight: 'bold', border: '3px solid #d9ad61', margin: '0 auto' }"
              >
                {{ item.avatarChar }}
              </div>
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

      <!-- 操作按钮 -->
      <AwardControlPanel
        v-if="lotteryData.length > 0"
        :awards="awardStore.awards"
        :selectedAward="selectedAward"
        :awardLog="awardStore.awardLog"
        :buttonText="buttonText"
        :isStarted="isStarted"
        :canUndo="canUndo"
        :isMultiRoundMode="isMultiRoundMode"
        @selectAward="selectAward"
        @handleLottery="handleLottery"
        @openAwardSetting="openAwardSetting"
        @openPrizeSetting="openPrizeSetting"
        @openWeightEditor="openWeightEditor"
        @resetAllData="resetAllData"
        @exportWinners="exportWinners"
        @showHistory="showHistory"
        @showMultiRoundSetting="showMultiRoundSetting"
      />

      <!-- 键盘快捷键提示 -->
      <KeyboardShortcuts v-if="lotteryData.length > 0" :award-length="awardStore.awards.length" />
    </div>

    <!-- 导入 -->
    <ImportEmptyBlock v-else @import="importModal = true" />
  </div>

  <!-- 倒计时 -->
  <Countdown :visible="showCountdown" :countdown-text="countdownText" />

  <!-- 中奖结果弹窗，传递中奖人image字段，支持动态头像 -->
  <LotteryResult :visible="showResult" :award="selectedAward" :name-zh="winnerNameZh" :name-en="winnerNameEn" :image="winnerImage" :avatarChar="winnerAvatarChar" :wish="winnerWish" :gift="winnerGift" @close="showResult = false" />

  <!-- 导入数据 -->
  <UploadExcel v-model:visible="importModal" :on-success="handleSuccess" :before-upload="beforeUpload" />

  <!-- 权重编辑 -->
  <WeightEditor v-model:visible="weightEditorVisible" :lottery-data="lotteryData" @save="handleWeightSave" @close="handleWeightEditorClose" @onOpen="keyboardEnabled = false" @onClose="keyboardEnabled = true" />

  <!-- 奖项设置 -->
  <AwardSetting v-model:visible="awardSettingVisible" :awards="awardStore.awards" @save="handleAwardSettingSaveWrap" @close="handleAwardSettingClose" @onOpen="keyboardEnabled = false" @onClose="keyboardEnabled = true" />

  <!-- 礼物设置 -->
  <GiftSetting v-model:visible="giftSettingVisible" />

  <!-- 多轮抽奖设置 -->
  <MultiRoundSetting
    v-model:visible="showMultiRoundModal"
    :currentAwardName="awardStore.awards.find(a => a.key === selectedAward)?.label || selectedAward"
    :remainingCount="getCurrentAwardRemaining()"
    :defaultRoundCount="multiRoundCount"
    @confirm="handleMultiRoundStart"
    @cancel="closeMultiRoundModal"
    @onOpen="keyboardEnabled = false"
    @onClose="keyboardEnabled = true"
  />

  <!-- 多轮抽奖进度 -->
  <MultiRoundProgress :visible="showMultiRoundProgress" :awardName="awardStore.awards.find(a => a.key === selectedAward)?.label || selectedAward" :currentRound="currentRoundIndex + 1" :totalRounds="totalRounds" :currentResults="multiRoundResults" @cancel="cancelMultiRoundLottery" />

  <!-- 抽奖历史记录 -->
  <LotteryHistory v-model:visible="showHistoryModal" :historyList="recentHistory" :historyStats="historyStats" :canUndo="canUndo" @undo="handleUndoConfirm" @delete="deleteHistoryRecord" @clear="clearAllHistory" />
</template>

<style lang="scss" scoped></style>
