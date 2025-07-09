import { ref } from 'vue'

// #region 权重编辑相关
export default function useWeightEditor({
  lotteryData,
  awardStore,
  isMoving,
  animationPaused,
  startAnimation,
  cancelAnimation,
  message,
  nextTick
}) {
  const weightEditorVisible = ref(false);
  // 防抖变量
  let weightEditorClickTime = 0;
  const WEIGHT_EDITOR_DEBOUNCE = 300; // 300ms 防抖

  const openWeightEditor = () => {
    const now = Date.now();
    if (now - weightEditorClickTime < WEIGHT_EDITOR_DEBOUNCE) {
      return; // 防抖处理
    }
    weightEditorClickTime = now;
    if (lotteryData.length === 0) {
      message.warning('请先导入抽奖数据');
      return;
    }
    cancelAnimation();
    animationPaused.value = true; // 标记动画被暂停
    weightEditorVisible.value = true;
  };

  const handleWeightSave = updatedData => {
    lotteryData.value = updatedData;
    message.success('权重设置已更新');
    // 如果之前暂停了动画，现在恢复
    if (animationPaused.value && isMoving.value) {
      animationPaused.value = false; // 先重置暂停标志
      nextTick(() => {
        startAnimation();
      });
    }
  };

  // 监听权重编辑弹窗关闭
  const handleWeightEditorClose = () => {
    weightEditorVisible.value = false;
    // 如果之前暂停了动画，现在恢复
    if (animationPaused.value && isMoving.value) {
      animationPaused.value = false; // 先重置暂停标志
      nextTick(() => {
        startAnimation();
      });
    }
  };

  return {
    weightEditorVisible,
    openWeightEditor,
    handleWeightSave,
    handleWeightEditorClose
  }
} 