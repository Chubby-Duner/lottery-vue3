<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
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

const emit = defineEmits(["barrageReceived", "close"]);

const scrollingBarrages = ref([]); // 正在滚动的弹幕
const historyBarrages = ref([]); // 历史弹幕
const loading = ref(false);
const lastTimestamp = ref(null);
const pollTimer = ref(null);
const barrageContainer = ref(null);
const isPaused = ref(false);
const showHistory = ref(false); // 是否显示历史弹幕

// 垂直滚动相关变量
const translateY = ref(0);
const listRef = ref(null);
let scrollInterval = null;
const scrollSpeed = 1.5; // 滚动速度（px/帧）
const stepTime = 30; // 滚动间隔（毫秒）

// 获取初始弹幕列表
const fetchInitialBarrages = async () => {
  try {
    const params = {
      roomId: props.roomId,
      limit: 20
    };

    const response = await barrageApi.getList(params);

    if (response.code === 100200 && response.data.barrages && response.data.barrages.length > 0) {
      const initialBarrages = response.data.barrages.map(item => ({
        ...item,
        id: item.id || Date.now() + Math.random(),
        displayTime: new Date().toLocaleTimeString()
      }));

      // 按创建时间升序排序
      initialBarrages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // 设置历史弹幕列表
      historyBarrages.value = initialBarrages;

      // 更新最后时间戳
      if (initialBarrages.length > 0) {
        lastTimestamp.value = Math.max(...initialBarrages.map(b => new Date(b.createdAt).getTime()));
      }
    }
  } catch (error) {
    console.error("获取初始弹幕失败:", error);
  }
};

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

      // 添加新弹幕到历史弹幕列表
      historyBarrages.value.push(...newBarrages);

      // 限制历史弹幕数量
      if (historyBarrages.value.length > 50) {
        historyBarrages.value = historyBarrages.value.slice(-50);
      }

      // 只有新弹幕才添加到滚动列表进行滚动显示
      scrollingBarrages.value.push(...newBarrages);

      // 限制滚动弹幕数量，保持性能
      if (scrollingBarrages.value.length > 20) {
        scrollingBarrages.value = scrollingBarrages.value.slice(-20);
      }

      // 更新最后时间戳
      if (newBarrages.length > 0) {
        lastTimestamp.value = Math.max(...newBarrages.map(b => new Date(b.createdAt).getTime()));
      }

      // 触发事件
      emit("barrageReceived", newBarrages);
    }
  } catch (error) {
    console.error("获取弹幕失败:", error);
    stopPolling();
  }
};

// 弹幕队列，用于控制弹幕依次显示
const barrageQueue = ref([]);
const isProcessingQueue = ref(false);

// 添加滚动弹幕（直接添加到末尾）
const addScrollingBarrage = barrage => {
  scrollingBarrages.value.push(barrage);

  // 限制显示的弹幕数量，保持性能
  if (scrollingBarrages.value.length > 20) {
    scrollingBarrages.value.shift();
  }
};

// 处理弹幕队列（已废弃，保留兼容性）
const processBarrageQueue = async () => {
  // 不再需要队列处理，弹幕直接添加
};

// 启动垂直滚动
const startVerticalScroll = () => {
  if (scrollInterval) return;

  scrollInterval = setInterval(() => {
    if (isPaused.value || scrollingBarrages.value.length === 0) return;

    translateY.value -= scrollSpeed;

    // 获取第一条弹幕的高度
    const firstItem = listRef.value?.children[0];
    if (firstItem && Math.abs(translateY.value) >= firstItem.offsetHeight) {
      // 滚动满一条弹幕高度 -> 把第一条移到末尾（循环显示）
      const first = scrollingBarrages.value.shift();
      if (first) {
        scrollingBarrages.value.push(first);
      }
      // 重置位移
      translateY.value = 0;
    }
  }, stepTime);
};

// 停止垂直滚动
const stopVerticalScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

// 移除滚动弹幕（保留兼容性）
const removeScrollingBarrage = barrageId => {
  const index = scrollingBarrages.value.findIndex(b => b.id === barrageId);
  if (index !== -1) {
    scrollingBarrages.value.splice(index, 1);
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
    startVerticalScroll();
  } else {
    // 暂停时停止垂直滚动
    stopVerticalScroll();
  }
};

// 清空弹幕
const clearBarrages = () => {
  scrollingBarrages.value = [];
  historyBarrages.value = [];
  barrageQueue.value = []; // 清空弹幕队列
  isProcessingQueue.value = false; // 重置处理状态
  lastTimestamp.value = null;
  translateY.value = 0; // 重置滚动位置
  // 停止垂直滚动
  stopVerticalScroll();
};

// 切换历史弹幕显示
const toggleHistory = () => {
  showHistory.value = !showHistory.value;
};

// 关闭弹幕区域
const handleClose = () => {
  emit("close");
};

// 手动刷新
const refresh = () => {
  lastTimestamp.value = null;
  fetchInitialBarrages();
};

// 获取弹幕颜色样式
const getBarrageItemStyle = barrage => {
  return {
    color: barrage.color || "#ffffff",
    fontSize: `${barrage.fontSize || 14}px`
  };
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
    fetchInitialBarrages();
    startVerticalScroll();
  } else {
    stopPolling();
    stopVerticalScroll();
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
    fetchInitialBarrages();
    startPolling();
    startVerticalScroll();
  }
});

onUnmounted(() => {
  stopPolling();
  stopVerticalScroll();
});

// 监听props变化
watch(() => props.visible, handleVisibilityChange);
watch(
  () => props.roomId,
  () => {
    clearBarrages();
    if (props.visible) {
      fetchInitialBarrages();
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
        <a-button size="small" @click="handleClose" class="close-btn">
          <CloseOutlined />
        </a-button>
      </div>
    </div>

    <!-- 弹幕滚动区域 -->
    <div ref="barrageContainer" class="barrage-scroll-container">
      <div v-if="scrollingBarrages.length === 0" class="empty-state">
        <p>暂无弹幕，等待用户发送...</p>
      </div>

      <!-- 垂直滚动弹幕列表 -->
      <div class="barrage-list" :style="{ transform: `translateY(${translateY}px)` }" ref="listRef">
        <div v-for="barrage in scrollingBarrages" :key="barrage.id" class="barrage-item">
          <span class="barrage-nickname">{{ barrage.nickname || "匿名" }}：</span>
          <span class="barrage-text" :style="getBarrageItemStyle(barrage)">{{ barrage.content }}</span>
        </div>
      </div>
    </div>

    <!-- 历史弹幕列表（可折叠） -->
    <div class="barrage-history" v-if="historyBarrages.length > 0">
      <div class="history-header" @click="toggleHistory">
        <span>历史弹幕 ({{ historyBarrages.length }})</span>
        <span class="toggle-icon">{{ showHistory ? "▼" : "▶" }}</span>
      </div>
      <div v-if="showHistory" class="history-list">
        <div v-for="barrage in historyBarrages.slice(-10)" :key="'history-' + barrage.id" class="history-item">
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
  width: 420px;
  max-height: 80vh;
  height: auto;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  backdrop-filter: blur(20px);
  overflow: hidden;

  .barrage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
    border-radius: 16px 16px 0 0;
    flex-shrink: 0;
    backdrop-filter: blur(10px);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      h4 {
        margin: 0;
        color: #f8fafc;
        font-size: 16px;
        font-weight: 700;
        background: linear-gradient(135deg, #60a5fa, #a78bfa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .barrage-count {
        color: #94a3b8;
        font-size: 12px;
        background: rgba(59, 130, 246, 0.1);
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;

      :deep(.ant-btn) {
        height: 32px;
        padding: 0 12px;
        font-size: 12px;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.3s ease;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.6);
        color: #e2e8f0;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border-color: rgba(59, 130, 246, 0.4);
        }

        &.ant-btn-primary {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-color: transparent;

          &:hover {
            background: linear-gradient(135deg, #2563eb, #7c3aed);
          }
        }

        &.ant-btn-danger {
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-color: transparent;

          &:hover {
            background: linear-gradient(135deg, #dc2626, #ea580c);
          }
        }

        &.close-btn {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;

          &:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.5);
            color: #dc2626;
          }
        }
      }
    }
  }

  .barrage-scroll-container {
    position: relative;
    flex: 1;
    overflow: hidden;
    background: transparent;
    min-height: 200px;
    max-height: 300px;

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
      font-size: 14px;
      font-weight: 500;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.03));
      border-radius: 12px;
      margin: 16px;
      padding: 32px;
      border: 1px dashed rgba(148, 163, 184, 0.2);

      p {
        margin: 0;
        text-align: center;
        line-height: 1.5;
      }
    }

    .barrage-list {
      display: flex;
      flex-direction: column;
    }

    .barrage-item {
      padding: 12px 16px;
      margin: 6px 12px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.08));
      border: 1px solid rgba(148, 163, 184, 0.15);
      display: flex;
      align-items: center;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(15px);
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.6s ease;
      }

      &:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.12));
        border-color: rgba(59, 130, 246, 0.4);
        transform: translateY(-2px) scale(1.02);
        box-shadow:
          0 8px 25px rgba(59, 130, 246, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.1);

        &::before {
          left: 100%;
        }
      }

      .barrage-nickname {
        color: #60a5fa;
        font-size: 14px;
        font-weight: 700;
        margin-right: 10px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        position: relative;

        &::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
        }
      }

      &:hover .barrage-nickname::after {
        width: 100%;
      }

      .barrage-text {
        font-size: 14px;
        font-weight: 500;
        color: #f8fafc;
        flex: 1;
        word-break: break-all;
        line-height: 1.5;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .barrage-history {
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
    flex-shrink: 0;
    backdrop-filter: blur(10px);

    .history-header {
      padding: 12px 20px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.08));
        color: #e2e8f0;
      }

      .toggle-icon {
        font-size: 12px;
        transition: transform 0.3s ease;
        color: #60a5fa;
      }
    }

    .history-list {
      max-height: 120px;
      overflow-y: auto;
      background: rgba(15, 23, 42, 0.4);
      padding: 4px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.3);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 3px;

        &:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
        }
      }

      .history-item {
        padding: 8px 12px;
        margin: 2px 4px;
        border-radius: 8px;
        font-size: 12px;
        display: flex;
        align-items: center;
        min-height: 28px;
        background: rgba(30, 41, 59, 0.4);
        border: 1px solid rgba(148, 163, 184, 0.1);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateX(2px);
        }

        &:last-child {
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .history-nickname {
          color: #60a5fa;
          font-weight: 600;
          margin-right: 8px;
          flex-shrink: 0;
          min-width: 45px;
          font-size: 11px;
        }

        .history-content {
          color: #e2e8f0;
          flex: 1;
          margin-right: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
          font-weight: 400;
        }

        .history-time {
          color: #94a3b8;
          font-size: 10px;
          flex-shrink: 0;
          min-width: 50px;
          text-align: right;
          font-weight: 500;
        }
      }
    }
  }

  .pause-indicator {
    padding: 12px 20px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.08));
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    text-align: center;
    backdrop-filter: blur(10px);
    border-radius: 0 0 16px 16px;

    span {
      color: #fbbf24;
      font-size: 12px;
      font-weight: 500;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
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
