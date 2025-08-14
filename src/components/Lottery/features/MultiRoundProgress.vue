<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  awardName: {
    type: String,
    default: ""
  },
  currentRound: {
    type: Number,
    default: 1
  },
  totalRounds: {
    type: Number,
    default: 1
  },
  currentResults: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["cancel"]);

// 计算进度百分比
const progressPercent = computed(() => {
  if (props.totalRounds === 0) return 0;
  return Math.round(((props.currentRound - 1) / props.totalRounds) * 100);
});

// 是否显示下一轮提示
const showNextRoundTip = computed(() => {
  return props.currentRound <= props.totalRounds && props.currentResults.length > 0;
});

// 下一轮提示消息
const nextRoundMessage = computed(() => {
  const remaining = props.totalRounds - props.currentRound + 1;
  if (remaining > 1) {
    return `第 ${props.currentRound - 1} 轮抽奖完成，1秒后自动开始第 ${props.currentRound} 轮抽奖`;
  } else if (remaining === 1) {
    return `第 ${props.currentRound - 1} 轮抽奖完成，1秒后自动开始最后一轮抽奖`;
  } else {
    return "所有轮次抽奖已完成！";
  }
});

// 取消多轮抽奖
const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <div v-if="visible" class="multi-round-progress">
    <div class="progress-header">
      <h3 class="progress-title">
        <span class="icon">🎯</span>
        多轮抽奖进行中
      </h3>
      <a-button type="text" danger size="small" @click="handleCancel" :disabled="loading"> 取消 </a-button>
    </div>

    <div class="progress-content">
      <div class="progress-info">
        <span class="award-name">{{ awardName }}</span>
        <span class="progress-text"> 第 {{ currentRound }} / {{ totalRounds }} 轮 </span>
      </div>

      <a-progress
        :percent="progressPercent"
        :stroke-color="{
          '0%': '#108ee9',
          '100%': '#87d068'
        }"
        :show-info="false"
        :stroke-width="8"
      />

      <div class="progress-stats">
        <span class="completed">已完成：{{ currentRound - 1 }} 轮</span>
        <span class="remaining">剩余：{{ totalRounds - currentRound + 1 }} 轮</span>
      </div>
    </div>

    <!-- 当前轮次结果展示 -->
    <div v-if="currentResults.length > 0" class="current-results">
      <h4 class="results-title">本轮抽奖结果</h4>
      <div class="results-list">
        <div v-for="(result, index) in currentResults" :key="index" class="result-item">
          <div class="winner-info">
            <div class="winner-avatar">
              <img v-if="result.winner.image?.dataUrl" :src="result.winner.image.dataUrl" :alt="result.winner.namezh" class="avatar-img" />
              <span v-else class="avatar-char">
                {{ result.winner.avatarChar || result.winner.namezh?.charAt(0) }}
              </span>
            </div>
            <div class="winner-details">
              <div class="winner-name">{{ result.winner.namezh }}</div>
              <div class="winner-gift">{{ result.gift?.giftName || "奖品" }}</div>
            </div>
          </div>
          <div class="round-badge">第{{ result.roundIndex + 1 }}轮</div>
        </div>
      </div>
    </div>

    <!-- 下一轮提示 -->
    <div v-if="showNextRoundTip" class="next-round-tip">
      <a-alert :message="nextRoundMessage" type="info" show-icon :closable="false" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multi-round-progress {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e8e8e8;
  z-index: 1000;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px 12px;
    border-bottom: 1px solid #f0f0f0;

    .progress-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;

      .icon {
        margin-right: 8px;
      }
    }
  }

  .progress-content {
    padding: 16px 20px;

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .award-name {
        font-weight: 500;
        color: #1890ff;
      }

      .progress-text {
        font-size: 14px;
        color: #666;
      }
    }

    .progress-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;

      .completed {
        color: #52c41a;
      }

      .remaining {
        color: #faad14;
      }
    }
  }

  .current-results {
    padding: 0 20px 16px;
    border-top: 1px solid #f0f0f0;

    .results-title {
      margin: 16px 0 12px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .results-list {
      max-height: 200px;
      overflow-y: auto;

      .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        .winner-info {
          display: flex;
          align-items: center;
          flex: 1;

          .winner-avatar {
            width: 32px;
            height: 32px;
            margin-right: 12px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;

            .avatar-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .avatar-char {
              font-size: 14px;
              font-weight: 500;
              color: #666;
            }
          }

          .winner-details {
            .winner-name {
              font-size: 14px;
              font-weight: 500;
              color: #333;
              line-height: 1.2;
            }

            .winner-gift {
              font-size: 12px;
              color: #999;
              line-height: 1.2;
              margin-top: 2px;
            }
          }
        }

        .round-badge {
          background: #1890ff;
          color: #fff;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
      }
    }
  }

  .next-round-tip {
    padding: 0 20px 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .multi-round-progress {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    width: auto;
  }
}
</style>
