import { Modal } from 'ant-design-vue'
import { usePrizeStore } from "@/store/prizeStore";

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
  nextTick
}) {
  const prizeStore = usePrizeStore();
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
        try {
          // 停止当前抽奖
          if (isStarted.value) {
            isStarted.value = false;
            isMoving.value = false;
            cancelAnimation();
          }
          awardStore.resetAllToImportBackup();
          // 后期剩余数量直接使用prize_list的数据，改成直接使用备份数据赋值给 prize_list
          // prizeStore.setPrizeListBackup();
          // 重置礼物数量状态  
          prizeStore.resetPrizeQuantities();
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
        } catch (error) {
          console.error("error in resetAllData", error);
        }
      }
    });
  };
  return {
    resetAllData
  }
} 