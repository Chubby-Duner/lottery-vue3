import { ref } from 'vue'

// ===================== 状态变量 =====================
// #region 倒计时相关
const showCountdown = ref(false);
const countdownText = ref('叁');

// #region 倒计时相关
async function showCountdownSequence() {
  showCountdown.value = true;
  // 叁
  countdownText.value = '叁';
  await new Promise(resolve => setTimeout(resolve, 800));
  // 贰
  countdownText.value = '贰';
  await new Promise(resolve => setTimeout(resolve, 800));
  // 壹
  countdownText.value = '壹';
  await new Promise(resolve => setTimeout(resolve, 600));
  showCountdown.value = false;
}
// #endregion

export default function useCountdown() {
  return {
    showCountdown,
    countdownText,
    showCountdownSequence
  }
} 