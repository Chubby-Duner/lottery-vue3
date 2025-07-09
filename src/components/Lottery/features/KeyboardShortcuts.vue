<script setup>
import { ref } from "vue";
const props = defineProps({
  awardLength: {
    type: Number,
    required: true
  }
});
const showShortcuts = ref(false);
</script>

<template>
  <div class="keyboard-shortcuts-trigger" @mouseenter="showShortcuts = true" @mouseleave="showShortcuts = false">
    <span class="shortcuts-icon">?</span>
    <div v-if="showShortcuts" class="keyboard-shortcuts-popup">
      <div class="shortcuts-title">键盘快捷键：</div>
      <div class="shortcuts-list">
        <span class="shortcut-item">空格键：开始/停止抽奖</span>
        <span class="shortcut-item" v-if="awardLength <= 9">数字键1-{{ awardLength }}：选择奖项</span>
        <span class="shortcut-item" v-else-if="awardLength === 10">数字键1-9,0：选择奖项</span>
        <span class="shortcut-item" v-else-if="awardLength <= 36">数字键1-9,0 + 字母键a-{{ String.fromCharCode(97 + awardLength - 11) }}：选择奖项</span>
        <span class="shortcut-item" v-else>数字键1-9, 0 + 字母键a-z：选择前36个奖项</span>
        <span class="shortcut-item">Enter：关闭结果（抽奖结束后）</span>
        <span class="shortcut-item">Delete：重置数据</span>
        <span class="shortcut-item">M：音乐开关</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 键盘快捷键提示触发器 */
.keyboard-shortcuts-trigger {
  position: fixed;
  bottom: 50px;
  right: 20px;
  z-index: 1000;
  cursor: pointer;

  .shortcuts-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.8);
    color: #ffd700;
    border-radius: 50%;
    font-size: 18px;
    font-weight: bold;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.9);
      transform: scale(1.1);
    }
  }
}

/* 键盘快捷键提示弹窗 */
.keyboard-shortcuts-popup {
  position: absolute;
  bottom: 50px;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 12px;
  max-width: 300px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  /* 添加小箭头 */
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    right: 15px;
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
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
}
</style>
