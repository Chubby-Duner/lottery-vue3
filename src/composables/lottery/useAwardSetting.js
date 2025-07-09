import { ref } from 'vue'

// #region 奖项设置相关
export default function useAwardSetting({
  awardStore,
  isMoving,
  animationPaused,
  startAnimation,
  cancelAnimation,
  nextTick
}) {
  const awardSettingVisible = ref(false);
  // 防抖变量
  let awardSettingClickTime = 0;
  const AWARD_SETTING_DEBOUNCE = 300; // 300ms 防抖

  const openAwardSetting = () => {
    const now = Date.now();
    if (now - awardSettingClickTime < AWARD_SETTING_DEBOUNCE) {
      return; // 防抖处理
    }
    awardSettingClickTime = now;
    // 暂停动画以提高性能
    cancelAnimation();
    animationPaused.value = true; // 标记动画被暂停
    awardSettingVisible.value = true;
  };

  const handleAwardSettingSave = newAwards => {
    awardStore.setAwards(newAwards);
    // 这里 updateWeightData 由外部调用
    // 如果之前暂停了动画，现在恢复
    if (animationPaused.value && isMoving.value) {
      animationPaused.value = false; // 先重置暂停标志
      nextTick(() => {
        startAnimation();
      });
    }
  };

  // 监听奖项设置弹窗关闭
  const handleAwardSettingClose = () => {
    awardSettingVisible.value = false;
    // 如果之前暂停了动画，现在恢复
    if (animationPaused.value && isMoving.value) {
      animationPaused.value = false; // 先重置暂停标志
      nextTick(() => {
        startAnimation();
      });
    }
  };

  return {
    awardSettingVisible,
    openAwardSetting,
    handleAwardSettingSave,
    handleAwardSettingClose
  }
} 