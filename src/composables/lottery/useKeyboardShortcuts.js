import { onMounted, onUnmounted } from 'vue'

// #region 键盘快捷键处理
export default function useKeyboardShortcuts({
  // 状态参数
  isStarted,
  canStop,
  awardStore,
  // 方法参数
  handleLottery,
  closeResult,
  toggleMusic,
  selectAward,
  resetAllData,
  cancelAnimation
}) {
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

  // 注册事件监听器
  onMounted(() => {
    window.addEventListener("keypress", handleKeyPress);
    window.addEventListener("keydown", handleKeyDown);
    // 监听页面刷新事件
    window.addEventListener("beforeunload", handleBeforeUnload);
  });

  // 清理事件监听器
  onUnmounted(() => {
    cancelAnimation();
    window.removeEventListener("keypress", handleKeyPress);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });

  return {
    handleKeyPress,
    handleKeyDown,
    handleBeforeUnload
  };
} 