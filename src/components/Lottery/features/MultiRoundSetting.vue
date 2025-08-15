<script setup>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentAwardName: {
    type: String,
    default: ""
  },
  remainingCount: {
    type: Number,
    default: 0
  },
  defaultRoundCount: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(["update:visible", "confirm", "cancel", "onOpen", "onClose"]);

const loading = ref(false);
const roundCount = ref(1);

// 监听默认轮数变化
watch(
  () => props.defaultRoundCount,
  newVal => {
    roundCount.value = newVal;
  },
  { immediate: true }
);

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      roundCount.value = props.defaultRoundCount;
      emit("onOpen");
    } else {
      emit("onClose");
    }
  }
);

// 验证设置
const validateSetting = () => {
  if (roundCount.value < 1) {
    message.error("抽奖轮数必须大于0");
    return false;
  }

  if (roundCount.value > props.remainingCount) {
    message.error(`抽奖轮数不能超过剩余奖项数量（${props.remainingCount}）`);
    return false;
  }

  if (roundCount.value > 10) {
    message.error("抽奖轮数不能超过10轮");
    return false;
  }

  return true;
};

// 确认设置
const handleConfirm = () => {
  if (!validateSetting()) return;

  loading.value = true;

  try {
    emit("confirm", roundCount.value);
    emit("update:visible", false);
  } catch (error) {
    console.error("确认多轮抽奖设置失败:", error);
    message.error("设置失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 取消设置
const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};

// 监听visible变化已通过v-model:visible处理
</script>

<template>
  <a-modal :open="visible" title="多轮抽奖设置" :width="500" @ok="handleConfirm" @cancel="handleCancel" :confirm-loading="loading" @update:open="val => $emit('update:visible', val)" okText="确定" cancelText="取消">
    <div class="desc-wrapper" style="margin-bottom: 16px">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center">
        <span style="margin-right: 8px">📋</span>
        使用说明
      </div>
      <div style="font-size: 12px; line-height: 1.6; opacity: 0.95">
        <div style="margin-bottom: 4px">• 每轮抽奖全自动进行，间隔 1 秒，可随时取消</div>
        <div style="margin-bottom: 4px">• 无需任何手动操作，系统自动完成所有轮次</div>
        <div style="margin-bottom: 4px">• 结果弹窗自动关闭，支持撤销操作</div>
      </div>
    </div>

    <div class="multi-round-setting">
      <div class="setting-item">
        <label class="setting-label">当前奖项：</label>
        <span class="award-name">{{ currentAwardName }}</span>
      </div>

      <div class="setting-item">
        <label class="setting-label">剩余数量：</label>
        <span class="remaining-count">{{ remainingCount }} 个</span>
      </div>

      <div class="setting-item">
        <label class="setting-label">抽奖轮数：</label>
        <a-input-number v-model:value="roundCount" :min="1" :max="Math.min(remainingCount, 10)" :step="1" style="width: 120px" placeholder="请输入轮数" />
        <span class="hint">（最多 {{ Math.min(remainingCount, 10) }} 轮）</span>
      </div>

      <div class="setting-item">
        <div class="description">
          <p>• 多轮抽奖将自动连续抽取 {{ roundCount }} 位中奖者</p>
        </div>
      </div>

      <div v-if="roundCount > remainingCount" class="warning">
        <a-alert message="警告" :description="`抽奖轮数不能超过剩余奖项数量（${remainingCount}）`" type="warning" show-icon />
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.multi-round-setting {
  .setting-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .setting-label {
      width: 80px;
      font-weight: 500;
      color: #333;
    }

    .award-name {
      color: #1890ff;
      font-weight: 500;
    }

    .remaining-count {
      color: #52c41a;
      font-weight: 500;
    }

    .hint {
      margin-left: 8px;
      color: #999;
      font-size: 12px;
    }
  }

  .description {
    flex: 1;

    p {
      margin: 4px 0;
      color: #666;
      font-size: 13px;
      line-height: 1.4;
    }
  }

  .warning {
    margin-top: 16px;
  }
}
</style>
