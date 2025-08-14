<script setup>
import { ref, computed, watch } from "vue";
import { message } from "ant-design-vue";
import * as XLSX from "xlsx";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  historyList: {
    type: Array,
    default: () => []
  },
  historyStats: {
    type: Object,
    default: () => ({
      totalLotteries: 0,
      awardStats: {},
      recentActivity: []
    })
  },
  canUndo: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible", "undo", "delete", "clear"]);

const showUndoConfirm = ref(false);
const undoLoading = ref(false);

// 最后一条记录（按时间戳排序的最新记录）
const lastRecord = computed(() => {
  if (props.historyList.length === 0) return null;
  // 按时间戳降序排序，获取最新的记录
  const sortedHistory = [...props.historyList].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return sortedHistory[0];
});

// 关闭弹窗
const handleClose = () => {
  emit("update:visible", false);
};

// 撤销操作
const handleUndo = () => {
  if (!props.canUndo) {
    message.warning("没有可撤销的记录");
    return;
  }
  showUndoConfirm.value = true;
};

// 确认撤销
const confirmUndo = () => {
  undoLoading.value = true;
  try {
    emit("undo");
    showUndoConfirm.value = false;
  } catch (error) {
    console.error("撤销失败:", error);
  } finally {
    undoLoading.value = false;
  }
};

// 取消撤销
const cancelUndo = () => {
  showUndoConfirm.value = false;
};

// 删除记录
const handleDeleteRecord = recordId => {
  emit("delete", recordId);
};

// 清空所有记录
const handleClearAll = () => {
  emit("clear");
};

// 导出记录
const handleExport = () => {
  try {
    // 按奖项分组
    const groupedByAward = {};
    props.historyList.forEach(record => {
      const awardKey = record.awardKey;
      if (!groupedByAward[awardKey]) {
        groupedByAward[awardKey] = {
          awardName: record.awardName,
          records: []
        };
      }
      groupedByAward[awardKey].records.push(record);
    });

    // 构建导出数据
    const data = [["时间", "奖项", "中奖者", "礼物", "类型"]];

    // 按奖项分块添加数据
    Object.keys(groupedByAward).forEach((awardKey, index) => {
      const group = groupedByAward[awardKey];

      // 添加奖项分隔行
      if (index > 0) {
        data.push(["", "", "", "", ""]); // 空行分隔
      }
      data.push([`=== ${group.awardName} ===`, "", "", "", ""]); // 奖项标题行

      // 添加该奖项的所有记录
      group.records.forEach(record => {
        const roundText = record.multiRound.isMultiRound ? `多轮抽奖(${record.multiRound.roundIndex + 1}/${record.multiRound.totalRounds})` : "单次抽奖";

        data.push([formatTime(record.timestamp), record.awardName, record.winner.namezh, record.gift?.giftName || record.gift || "", roundText]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    ws["!cols"] = [
      { wch: 20 }, // 时间
      { wch: 12 }, // 奖项
      { wch: 15 }, // 中奖者
      { wch: 20 }, // 礼物
      { wch: 18 } // 类型
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "抽奖历史记录");
    XLSX.writeFile(wb, `抽奖历史记录_${new Date().toISOString().split("T")[0]}.xlsx`);

    message.success("历史记录导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败，请重试");
  }
};

// 获取时间线颜色
const getTimelineColor = record => {
  if (record.multiRound.isMultiRound) {
    return "blue";
  }
  return "green";
};

// 获取时间线图标
const getTimelineDot = record => {
  if (record.multiRound.isMultiRound) {
    return record.multiRound.roundIndex;
  }
  return "🎯";
};

// 格式化时间
const formatTime = timestamp => {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};
</script>

<template>
  <a-modal :open="visible" title="抽奖历史记录" :width="800" :footer="null" @cancel="handleClose" @update:open="val => $emit('update:visible', val)">
    <div class="lottery-history">
      <!-- 统计信息 -->
      <div class="history-stats">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-statistic title="总抽奖次数" :value="historyStats.totalLotteries" :value-style="{ color: '#1890ff' }" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="涉及奖项" :value="Object.keys(historyStats.awardStats).length" :value-style="{ color: '#52c41a' }" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="最近活动" :value="historyStats.recentActivity.length" suffix="条" :value-style="{ color: '#faad14' }" />
          </a-col>
        </a-row>
      </div>

      <!-- 操作按钮 -->
      <div class="history-actions">
        <a-space>
          <a-button type="primary" :disabled="!canUndo" @click="handleUndo" :loading="undoLoading">
            <template #icon>
              <span>↶</span>
            </template>
            撤销最后一次
          </a-button>
          <a-button danger @click="handleClearAll" :disabled="historyList.length === 0"> 清空历史 </a-button>
          <a-button @click="handleExport" :disabled="historyList.length === 0"> 导出记录 </a-button>
        </a-space>
      </div>

      <!-- 历史记录列表 -->
      <div class="history-list">
        <a-empty v-if="historyList.length === 0" description="暂无抽奖历史记录" />

        <div v-else class="history-timeline">
          <a-timeline>
            <a-timeline-item v-for="(record, index) in historyList" :key="record.id" :color="getTimelineColor(record)">
              <template #dot>
                <span class="timeline-dot">
                  {{ getTimelineDot(record) }}
                </span>
              </template>

              <div class="history-record">
                <div class="record-header">
                  <div class="record-info">
                    <span class="award-name">{{ record.awardName }}</span>
                    <span class="record-time">{{ formatTime(record.timestamp) }}</span>
                  </div>
                  <div class="record-actions">
                    <a-button type="text" size="small" danger @click="handleDeleteRecord(record.id)"> 删除 </a-button>
                  </div>
                </div>

                <div class="record-content">
                  <div class="winner-info">
                    <div class="winner-avatar">
                      <img v-if="record.winner.image?.dataUrl" :src="record.winner.image.dataUrl" :alt="record.winner.namezh" class="avatar-img" />
                      <span v-else class="avatar-char">
                        {{ record.winner.avatarChar || record.winner.namezh?.charAt(0) }}
                      </span>
                    </div>
                    <div class="winner-details">
                      <div class="winner-name">{{ record.winner.namezh }}</div>
                      <div class="winner-en">{{ record.winner.nameen }}</div>
                      <div v-if="record.gift" class="winner-gift">🎁 {{ record.gift.giftName || record.gift }}</div>
                    </div>
                  </div>

                  <!-- 多轮抽奖标识 -->
                  <div v-if="record.multiRound.isMultiRound" class="multi-round-badge">
                    <a-tag color="blue"> 多轮抽奖 {{ record.multiRound.roundIndex + 1 }}/{{ record.multiRound.totalRounds }} </a-tag>
                  </div>
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>
      </div>
    </div>

    <!-- 撤销确认弹窗 -->
    <a-modal :open="showUndoConfirm" title="确认撤销" :width="400" @ok="confirmUndo" @cancel="cancelUndo" :confirm-loading="undoLoading" @update:open="val => (showUndoConfirm = val)" okText="确定" cancelText="取消">
      <div class="undo-confirm">
        <p>确定要撤销最后一次抽奖吗？</p>
        <div v-if="lastRecord" class="last-record-info">
          <p><strong>奖项：</strong>{{ lastRecord.awardName }}</p>
          <p><strong>中奖者：</strong>{{ lastRecord.winner.namezh }}</p>
          <p><strong>时间：</strong>{{ formatTime(lastRecord.timestamp) }}</p>
        </div>
        <a-alert message="注意" description="撤销后将恢复抽奖前的状态，包括名单、奖项数量等" type="warning" show-icon />
      </div>
    </a-modal>
  </a-modal>
</template>

<style lang="scss" scoped>
.lottery-history {
  .history-stats {
    margin-bottom: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;
  }

  .history-actions {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .history-list {
    padding: 10px;
    max-height: 500px;
    overflow-y: auto;

    .history-timeline {
      .timeline-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #fff;
        border: 2px solid currentColor;
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
      }

      .history-record {
        .record-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .record-info {
            .award-name {
              font-weight: 500;
              color: #1890ff;
              margin-right: 12px;
            }

            .record-time {
              font-size: 12px;
              color: #999;
            }
          }
        }

        .record-content {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .winner-info {
            display: flex;
            align-items: center;
            flex: 1;

            .winner-avatar {
              width: 40px;
              height: 40px;
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
                font-size: 16px;
                font-weight: 500;
                color: #666;
              }
            }

            .winner-details {
              .winner-name {
                font-size: 16px;
                font-weight: 500;
                color: #333;
                line-height: 1.2;
              }

              .winner-en {
                font-size: 12px;
                color: #999;
                line-height: 1.2;
                margin-top: 2px;
              }

              .winner-gift {
                font-size: 13px;
                color: #52c41a;
                line-height: 1.2;
                margin-top: 4px;
              }
            }
          }

          .multi-round-badge {
            margin-left: 12px;
          }
        }
      }
    }
  }
}

.undo-confirm {
  .last-record-info {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 4px;
    margin: 12px 0;

    p {
      margin: 4px 0;
      font-size: 14px;
    }
  }
}
</style>
