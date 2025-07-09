<script setup>
import { defineProps, defineEmits } from "vue";
const props = defineProps({
  awards: { type: Array, required: true },
  selectedAward: { type: String, required: true },
  awardLog: { type: Object, required: true },
  buttonText: { type: String, required: true }
});
const emit = defineEmits(["selectAward", "handleLottery", "openAwardSetting", "openWeightEditor", "resetAllData"]);
</script>

<template>
  <!-- 奖项按钮和抽奖按钮区域 -->
  <div class="dashboard">
    <div class="award-buttons-scroll-container">
      <div class="award-buttons-container">
        <template v-for="(item, idx) in awards" :key="item.key">
          <div class="cirle-btn award" :id="'award-' + item.key" :class="{ 'award-active': selectedAward === item.key }" @click="$emit('selectAward', item.key)" :style="awards.length > 12 ? { 'will-change': 'transform' } : {}">
            {{ item.label }}<br />
            <small>剩余: {{ awardLog[`award0${idx + 1}`] }}</small>
            <div class="keyboard-hint" v-if="awards.length <= 20">
              <span v-if="idx + 1 <= 9">按 {{ idx + 1 }} 键</span>
              <span v-else-if="idx + 1 === 10">按 0 键</span>
              <span v-else>按 {{ String.fromCharCode(97 + idx - 10) }} 键</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 抽奖按钮 -->
    <a-button class="btn btn-red-outline lottery-btn" @click="$emit('handleLottery')">
      {{ buttonText }}
    </a-button>
  </div>

  <!-- 设置按钮区域 -->
  <div class="dashboard dashboard-setting">
    <div class="btn weight-edit-section">
      <a-button @click="$emit('openAwardSetting')">
        <template #icon>
          <slot name="icon-award-setting" />
        </template>
        奖项设置
      </a-button>
    </div>
    <div class="btn weight-edit-section">
      <a-button @click="$emit('openWeightEditor')">
        <template #icon>
          <slot name="icon-weight-editor" />
        </template>
        权重设置
      </a-button>
    </div>
    <div class="btn weight-edit-section">
      <a-button danger @click="$emit('resetAllData')">
        <template #icon>
          <slot name="icon-reset-data" />
        </template>
        重置数据
      </a-button>
    </div>
  </div>
</template>

<style scoped></style>
