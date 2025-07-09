import { Modal } from 'ant-design-vue'

// #region 其它功能
export default function useResetData({
  isStarted,
  isMoving,
  animationPaused,
  awardStore,
  lotteryData,
  wrapPosition,
  startAnimation,
  cancelAnimation,
  message,
  nextTick,
  fullScreenLoading
}) {
  // 重置数据
  const resetAllData = () => {
    // 如果正在抽奖中，给出提示
    if (isStarted.value) {
      message.warning('正在抽奖中，建议等抽奖结束后再重置数据');
    }
    Modal.confirm({
      title: '确定要重置所有数据吗？',
      content: '此操作会恢复到导入数据后的初始状态，所有抽奖结果和名单将被清空。',
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        fullScreenLoading.value = true;
        try {
          // 停止当前抽奖
          if (isStarted.value) {
            isStarted.value = false;
            isMoving.value = false;
            cancelAnimation();
          }
          awardStore.resetAllToImportBackup();
          // 恢复 lotteryData，补全自定义字段
          if (awardStore.lotteryDataBackup && awardStore.lotteryDataBackup.length > 0) {
            // 动态设置默认权重
            const defaultWeights = {};
            awardStore.awards.forEach((award, index) => {
              defaultWeights[index + 1] = 1; // 默认每个奖项权重为1
            });
            lotteryData.value = awardStore.lotteryDataBackup.map(item => ({
              ...item,
              awardWeights: item.awardWeights || defaultWeights,
              locked: typeof item.locked === 'boolean' ? item.locked : false
            }));
            await nextTick();
            wrapPosition.value = 0;
            // 只有在动画没有被暂停时才启动
            if (!animationPaused.value) {
              startAnimation();
            }
          } else {
            lotteryData.value = [];
          }
          message.success('已重置为导入初始状态');
        } finally {
          fullScreenLoading.value = false;
        }
      }
    });
  };
  // 清空所有数据
  const clearAllData = () => {
    Modal.confirm({
      title: '确定要清空所有数据吗？',
      content: '此操作会清空上一次操作所产生的所有数据。',
      okText: '确定',
      cancelText: '取消',
      async onOk() {
        fullScreenLoading.value = true;
        try {
          awardStore.clearAll();
          message.success('已清空所有数据');
        } finally {
          fullScreenLoading.value = false;
        }
      }
    });
  };
  return {
    resetAllData,
    clearAllData
  }
} 