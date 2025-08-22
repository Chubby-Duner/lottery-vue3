<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { barrageApi } from "@/api/barrage";

defineOptions({
  name: "BarrageDisplay"
});

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  roomId: {
    type: String,
    default: "lottery-room"
  },
  autoScroll: {
    type: Boolean,
    default: true
  },
  maxBarrages: {
    type: Number,
    default: 50
  },
  pollInterval: {
    type: Number,
    default: 2000 // 2秒轮询一次
  },
  scrollSpeed: {
    type: Number,
    default: 50 // 滚动速度（像素/秒）
  },
  maxLanes: {
    type: Number,
    default: 5 // 最大弹幕轨道数
  }
});

const emit = defineEmits(["barrageReceived"]);

const barrages = ref([]);
const scrollingBarrages = ref([]); // 正在滚动的弹幕
const loading = ref(false);
const lastTimestamp = ref(null);
const pollTimer = ref(null);
const barrageContainer = ref(null);
const isPaused = ref(false);
// 移除轨道系统，改为从底部统一滚动
const showHistory = ref(false); // 是否显示历史弹幕
const historyBarrageTimer = ref(null); // 历史弹幕定时器
const historyBarrageIndex = ref(0); // 历史弹幕索引

// 获取最新弹幕
const fetchLatestBarrages = async () => {
  try {
    const params = {
      roomId: props.roomId,
      limit: 10
    };

    if (lastTimestamp.value) {
      params.since = lastTimestamp.value;
    }

    const response = await barrageApi.getLatest(params);

    if (response.code === 100200 && response.data.barrages && response.data.barrages.length > 0) {
      const newBarrages = response.data.barrages.map(item => ({
        ...item,
        id: item.id || Date.now() + Math.random(),
        displayTime: new Date().toLocaleTimeString()
      }));

      // 添加新弹幕到历史列表
      barrages.value.push(...newBarrages);

      // 限制弹幕数量
      if (barrages.value.length > props.maxBarrages) {
        barrages.value = barrages.value.slice(-props.maxBarrages);
      }

      // 更新最后时间戳
      if (newBarrages.length > 0) {
        lastTimestamp.value = Math.max(...newBarrages.map(b => new Date(b.createdAt).getTime()));
      }

      // 将新弹幕添加到滚动队列
      newBarrages.forEach(barrage => {
        addScrollingBarrage(barrage);
      });

      // 触发事件
      emit("barrageReceived", newBarrages);
      
      // 停止历史弹幕滚动，因为有新弹幕了
      stopHistoryBarrageScroll();
    } else {
      // 没有新弹幕时，启动历史弹幕滚动
      startHistoryBarrageScroll();
    }
  } catch (error) {
    console.error("获取弹幕失败:", error);
    // 出错时也启动历史弹幕滚动
    startHistoryBarrageScroll();
  }
};

// 弹幕队列，用于控制弹幕依次显示
const barrageQueue = ref([]);
const isProcessingQueue = ref(false);

// 添加滚动弹幕到队列
const addScrollingBarrage = barrage => {
  barrageQueue.value.push(barrage);
  processBarrageQueue();
};

// 处理弹幕队列，依次显示弹幕
const processBarrageQueue = async () => {
  if (isProcessingQueue.value || barrageQueue.value.length === 0) {
    return;
  }
  
  isProcessingQueue.value = true;
  
  while (barrageQueue.value.length > 0) {
    const barrage = barrageQueue.value.shift();
    const duration = 6; // 6秒滚动时间
    
    const scrollingBarrage = {
      ...barrage,
      duration,
      startTime: Date.now(),
      endTime: Date.now() + duration * 1000,
      horizontalOffset: Math.random() * 80
    };
    
    scrollingBarrages.value.push(scrollingBarrage);
    
    // 设置定时器清理已完成的弹幕
    setTimeout(() => {
      removeScrollingBarrage(scrollingBarrage.id);
    }, duration * 1000);
    
    // 等待1秒再处理下一个弹幕
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  isProcessingQueue.value = false;
};

// 轨道系统已移除，所有弹幕从底部开始滚动

// 移除滚动弹幕
const removeScrollingBarrage = barrageId => {
  const index = scrollingBarrages.value.findIndex(b => b.id === barrageId);
  if (index !== -1) {
    scrollingBarrages.value.splice(index, 1);
  }
};

// 启动历史弹幕滚动
const startHistoryBarrageScroll = () => {
  // 如果没有历史弹幕或者已经在滚动，则不启动
  if (barrages.value.length === 0 || historyBarrageTimer.value || isPaused.value) {
    return;
  }

  historyBarrageTimer.value = setInterval(() => {
    if (barrages.value.length > 0 && !isPaused.value) {
      // 循环使用历史弹幕
      const barrage = barrages.value[historyBarrageIndex.value % barrages.value.length];
      
      // 创建一个新的弹幕对象，避免重复ID问题
      const historyBarrage = {
        ...barrage,
        id: `history-${Date.now()}-${Math.random()}`,
        isHistory: true
      };
      
      addScrollingBarrage(historyBarrage);
      historyBarrageIndex.value++;
    }
  }, 2000); // 每2秒添加一个历史弹幕，让效果更连续
};

// 停止历史弹幕滚动
const stopHistoryBarrageScroll = () => {
  if (historyBarrageTimer.value) {
    clearInterval(historyBarrageTimer.value);
    historyBarrageTimer.value = null;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (barrageContainer.value) {
    barrageContainer.value.scrollTop = barrageContainer.value.scrollHeight;
  }
};

// 开始轮询
const startPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
  }

  pollTimer.value = setInterval(() => {
    if (props.visible && !isPaused.value) {
      fetchLatestBarrages();
    }
  }, props.pollInterval);
};

// 停止轮询
const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
};

// 暂停/恢复
const togglePause = () => {
  isPaused.value = !isPaused.value;
  if (!isPaused.value) {
    fetchLatestBarrages();
  } else {
    // 暂停时停止历史弹幕滚动
    stopHistoryBarrageScroll();
  }
};

// 清空弹幕
const clearBarrages = () => {
  barrages.value = [];
  scrollingBarrages.value = [];
  barrageQueue.value = []; // 清空弹幕队列
  isProcessingQueue.value = false; // 重置处理状态
  lastTimestamp.value = null;
  historyBarrageIndex.value = 0;
  // 停止历史弹幕滚动
  stopHistoryBarrageScroll();
};

// 手动刷新
const refresh = () => {
  lastTimestamp.value = null;
  fetchLatestBarrages();
};

// 获取弹幕颜色样式
const getBarrageStyle = barrage => {
  return {
    color: barrage.color || "#ffffff",
    fontSize: `${barrage.fontSize || 16}px`
  };
};

// 获取滚动弹幕样式
const getScrollingBarrageStyle = barrage => {
  const containerHeight = barrageContainer.value?.offsetHeight || 200;
  const containerWidth = barrageContainer.value?.offsetWidth || 400;

  // 计算弹幕的初始位置（从容器底部开始）
  const leftPosition = 10 + (barrage.horizontalOffset || 0);
  const maxLeft = containerWidth - 200;

  return {
    position: "absolute",
    left: `${Math.min(leftPosition, maxLeft)}px`,
    bottom: "0px", // 从容器底部开始
    width: "auto",
    maxWidth: "calc(100% - 20px)",
    animationDuration: `${barrage.duration}s`,
    animationName: barrage.isHistory ? "scrollHistoryBarrageUp" : "scrollBarrageUp",
    animationTimingFunction: "linear",
    animationFillMode: "forwards",
    transform: "translateY(0)", // 初始位置
    zIndex: 1000 + Math.floor(Date.now() / 1000) % 100
  };
};

// 切换历史弹幕显示
const toggleHistory = () => {
  showHistory.value = !showHistory.value;
};

// 处理滚动事件
const handleScroll = () => {
  if (!barrageContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = barrageContainer.value;
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

  // 如果用户手动滚动到非底部位置，暂停自动滚动
  if (!isAtBottom && props.autoScroll) {
    isPaused.value = true;
  }
};

// 监听可见性变化
const handleVisibilityChange = () => {
  if (props.visible) {
    startPolling();
    fetchLatestBarrages();
  } else {
    stopPolling();
  }
};

// 暴露方法给父组件
defineExpose({
  refresh,
  clearBarrages,
  togglePause,
  scrollToBottom
});

onMounted(() => {
  if (props.visible) {
    fetchLatestBarrages();
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
  stopHistoryBarrageScroll();
});

// 监听props变化
watch(() => props.visible, handleVisibilityChange);
watch(
  () => props.roomId,
  () => {
    clearBarrages();
    if (props.visible) {
      fetchLatestBarrages();
    }
  }
);
</script>

<template>
  <div v-if="visible" class="barrage-display">
    <!-- 控制面板 -->
    <div class="barrage-header">
      <div class="header-left">
        <h4>实时弹幕</h4>
        <span class="barrage-count">({{ scrollingBarrages.length }})</span>
      </div>
      <div class="header-actions">
        <a-button size="small" @click="togglePause" :type="isPaused ? 'primary' : 'default'">
          {{ isPaused ? "恢复" : "暂停" }}
        </a-button>
        <a-button size="small" @click="refresh" :loading="loading"> 刷新 </a-button>
        <a-button size="small" @click="clearBarrages" danger> 清空 </a-button>
      </div>
    </div>

    <!-- 弹幕滚动区域 -->
    <div ref="barrageContainer" class="barrage-scroll-container">
      <div v-if="scrollingBarrages.length === 0" class="empty-state">
        <p>暂无弹幕，等待用户发送...</p>
      </div>

      <!-- 滚动弹幕 -->
      <div v-for="barrage in scrollingBarrages" :key="barrage.id" :data-barrage-id="barrage.id" class="scrolling-barrage" :class="{ 'history-barrage': barrage.isHistory }" :style="getScrollingBarrageStyle(barrage)">
        <span class="barrage-nickname">{{ barrage.nickname || "匿名" }}：</span>
        <span class="barrage-text" :style="getBarrageStyle(barrage)">{{ barrage.content }}</span>
        <span v-if="barrage.isHistory" class="history-tag">历史</span>
      </div>
    </div>

    <!-- 历史弹幕列表（可折叠） -->
    <div class="barrage-history" v-if="barrages.length > 0">
      <div class="history-header" @click="toggleHistory">
        <span>历史弹幕 ({{ barrages.length }})</span>
        <span class="toggle-icon">{{ showHistory ? "▼" : "▶" }}</span>
      </div>
      <div v-if="showHistory" class="history-list">
        <div v-for="barrage in barrages.slice(-10)" :key="'history-' + barrage.id" class="history-item">
          <span class="history-nickname">{{ barrage.nickname || "匿名" }}：</span>
          <span class="history-content">{{ barrage.content }}</span>
          <span class="history-time">{{ barrage.displayTime }}</span>
        </div>
      </div>
    </div>

    <div v-if="isPaused" class="pause-indicator">
      <span>弹幕已暂停，点击恢复按钮继续接收</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.barrage-display {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  height: 300px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  border: 1px solid #333;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  backdrop-filter: blur(10px);

  .barrage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #333;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px 8px 0 0;
    flex-shrink: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      h4 {
        margin: 0;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
      }

      .barrage-count {
        color: #ccc;
        font-size: 12px;
      }
    }

    .header-actions {
      display: flex;
      gap: 6px;

      :deep(.ant-btn) {
        height: 24px;
        padding: 0 8px;
        font-size: 12px;
        border-radius: 4px;
      }
    }
  }

  .barrage-scroll-container {
    position: relative;
    flex: 1;
    overflow: hidden;
    background: transparent;
    min-height: 200px;
    height: 200px;
    border: 2px solid #ff4d4f; // 红色边框用于调试

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      font-size: 14px;
    }

    .scrolling-barrage {
        position: absolute;
        white-space: nowrap;
        display: flex;
        align-items: center;
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(8px);
        z-index: 1;
        max-width: calc(100% - 20px);
        overflow: hidden;
        text-overflow: ellipsis;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;

        &.history-barrage {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          .barrage-nickname {
            color: #52c41a;
          }
        }

        .barrage-nickname {
          color: #1890ff;
          font-size: 12px;
          font-weight: 600;
          margin-right: 4px;
          flex-shrink: 0;
        }

        .barrage-text {
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .history-tag {
          background: rgba(82, 196, 26, 0.8);
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 6px;
          flex-shrink: 0;
        }
      }
  }

  .barrage-history {
    border-top: 1px solid #333;
    background: rgba(255, 255, 255, 0.05);

    .history-header {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ccc;
      font-size: 12px;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .toggle-icon {
        font-size: 10px;
        transition: transform 0.2s;
      }
    }

    .history-list {
      max-height: 120px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }

      .history-item {
        padding: 4px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 11px;
        display: flex;
        align-items: center;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .history-nickname {
          color: #1890ff;
          font-weight: 500;
          margin-right: 4px;
          flex-shrink: 0;
        }

        .history-content {
          color: #fff;
          flex: 1;
          margin-right: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-time {
          color: #999;
          font-size: 10px;
          flex-shrink: 0;
        }
      }
    }
  }

  .pause-indicator {
    padding: 6px 12px;
    background: rgba(255, 193, 7, 0.2);
    border-top: 1px solid #333;
    text-align: center;

    span {
      color: #ffc107;
      font-size: 11px;
    }
  }
}

// 弹幕在容器内从底部向顶部滚动
@keyframes scrollBarrageUp {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateY(-220px); // 滚动超过容器高度确保完全消失
    opacity: 0;
  }
}

// 历史弹幕动画 - 稍微透明
@keyframes scrollHistoryBarrageUp {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  8% {
    opacity: 0.7;
  }
  92% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-220px); // 滚动超过容器高度确保完全消失
    opacity: 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .barrage-display {
    width: 350px;
    height: 250px;
    top: 10px;
    right: 10px;
  }
}
</style>
