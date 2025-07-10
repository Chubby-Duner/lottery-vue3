import { weightedRandomIndex } from '@/composables/utils'
import * as XLSX from "xlsx";

// #region 抽奖相关
export default function useLottery({
  isStarted,
  isMoving,
  isLocked,
  isLotteryProcessing,
  canStop,
  showResult,
  winnerIndex,
  winnerNameZh,
  winnerNameEn,
  winnerImage,
  winnerAvatarChar,
  winnerWish,
  wrapPosition,
  speed,
  selectedAward,
  lotteryData,
  awardStore,
  animationPaused,
  startAnimation,
  cancelAnimation,
  showCountdownSequence,
  message
}) {
  const selectAward = awardKey => {
    if (isStarted.value) {
      message.error('正在抽奖中，不允许更改奖项设置');
      return;
    }
    selectedAward.value = awardKey;
    awardStore.setSelectAward(awardKey);
  };

  // 封装完整流程的 handleLottery
  const handleLottery = () => {
    // 抽奖前校验数据
    if (!lotteryData.value || lotteryData.value.length === 0) {
      message.error("请先导入抽奖数据！");
      return;
    }
    // 重新开始时重置流程锁
    if (!isStarted.value && !isMoving.value) {
      isLotteryProcessing.value = false;
    }
    // “开始抽奖”时加锁
    if (!isStarted.value && isMoving.value) {
      // 先校验剩余数量
      const idx = awardStore.awards.findIndex(a => a.key === selectedAward.value);
      const awardKey = `award0${idx + 1}`;
      if (awardStore.awardLog[awardKey] <= 0) {
        message.error("该奖项已经抽完啦，请选择其它奖项哦！");
        return;
      }
      if (isLotteryProcessing.value) {
        message.warning("抽奖进行中，请等待结果...");
        return;
      }
      isLotteryProcessing.value = true;
      startLottery();
      return;
    }
    // “停止抽奖”时不判断锁，始终允许，但防抖
    if (isStarted.value && !isLocked.value && isMoving.value) {
      stopLottery();
      return;
    }
    // 重新开始
    if (!isStarted.value && !isMoving.value) {
      wrapPosition.value = 0;
      isMoving.value = true;
      isStarted.value = false;
      isLocked.value = true;
      speed.value = 6;
      winnerIndex.value = -1;
      showResult.value = false;
      canStop.value = false;
      if (!animationPaused.value) {
        startAnimation();
      }
    }
  };

  const startLottery = () => {
    isStarted.value = true;
    isMoving.value = true;
    isLocked.value = true;
    // 加速动画
    setTimeout(() => (speed.value = 15), 1000);
    setTimeout(() => (speed.value = 20), 1500);
    setTimeout(() => (speed.value = 30), 3000);
    setTimeout(() => (speed.value = 50), 3500);
    setTimeout(() => {
      speed.value = 90;
      isLocked.value = false;
    }, 4000);
  };

  const stopLottery = async () => {
    if (isLocked.value) {
      message.error('还没结束，请稍等...');
      return;
    }
    // 防止重复调用
    if (!isStarted.value || isMoving.value === false) {
      return;
    }
    // 立即设置状态，防止重复调用
    isStarted.value = false;
    // 注意：这里不停止动画，让动画在倒计时期间继续运行
    // 调整动画速度，让倒计时期间动画更慢一些
    speed.value = 15;
    try {
      const idx = awardStore.awards.findIndex(a => a.key === selectedAward.value);
      // 先查找是否有锁定 锁定且权重>0才可抽中
      const lockedList = lotteryData.value.filter(item => item.locked && (item.awardWeights?.[idx + 1] ?? 1) > 0);
      let winnerIndexResult;
      if (lockedList.length > 0) {
        // 只从锁定的人中随机抽取
        const idx = Math.floor(Math.random() * lockedList.length);
        const winner = lockedList[idx];
        winnerIndexResult = lotteryData.value.findIndex(item => item.nameen === winner.nameen);
      } else {
        // 正常权重抽奖
        winnerIndexResult = weightedRandomIndex(lotteryData.value, selectedAward.value);
        if (winnerIndexResult === -1) {
          message.error('当前奖项所有权重都为0，无法抽奖');
          return;
        }
      }
      winnerIndex.value = winnerIndexResult;
      // 更新获奖者信息
      const winner = lotteryData.value[winnerIndex.value];

      if (winnerIndex.value < 0 || winnerIndex.value >= lotteryData.value.length || !winner) {
        winnerNameZh.value = "Invalid Winner";
        winnerNameEn.value = "Invalid Winner";
        winnerAvatarChar.value = "Invalid Winner";
        winnerWish.value = "Invalid Winner";
        winnerImage.value = null;
      } else {
        winnerNameZh.value = winner.namezh;
        winnerNameEn.value = winner.nameen;
        winnerAvatarChar.value = winner.avatarChar;
        winnerWish.value = winner.wish;
        winnerImage.value = (winner.image && winner.image.dataUrl) ? { dataUrl: winner.image.dataUrl } : null;
      }

      // 显示倒计时（动画继续运行）
      await showCountdownSequence();
      // 倒计时结束后，停止动画并显示结果
      isMoving.value = false;
      cancelAnimation();
      showResult.value = true;
      canStop.value = true;
      speed.value = 8;
      // 更新奖项数据
      // 中奖人对象，只存nameen、namezh和image.dataUrl和avatarChar
      let winnerData = {
        nameen: winner.nameen,
        namezh: winner.namezh,
        avatarChar: winner.avatarChar // 新增，保证名单有头像字
      };
      if (winner.image && typeof winner.image === 'object' && winner.image.dataUrl) {
        winnerData.image = { dataUrl: winner.image.dataUrl };
      }
      // 写入中奖名单
      awardStore.addWinner(selectedAward.value, winnerData);
      // 更新奖项剩余数量
      const remainingIdx = awardStore.awards.findIndex(a => a.key === selectedAward.value);
      const awardKey = `award0${remainingIdx + 1}`;
      const newAwardLog = { ...awardStore.awardLog };
      newAwardLog[awardKey] -= 1;
      awardStore.setAwardLog(newAwardLog);
      // 从抽奖池中移除获奖者
      lotteryData.value = lotteryData.value.filter(item => item.nameen !== winner.nameen);
      winnerIndex.value = -1;
    } catch (error) {
      console.error('Function stopLottery ~ error:', error);
    }
  };

  // 导出中奖名单
  const exportWinners = () => {
    const awards = awardStore.awards;
    const winnerMap = awardStore.winnerMap;
    // 检查是否有任何奖项有中奖人
    const hasWinner = awards.some(award => (winnerMap[award.key] || []).length > 0);
    if (!hasWinner) {
      message.error("暂无任何中奖名单，无法导出！");
      return;
    }
    // 只导出奖项为表头，下面为中奖名单，不设置任何样式
    const awardNames = awards.map(award => award.label || award.name);
    // 中奖名单按列组织
    const maxWinners = Math.max(...awards.map(award => (winnerMap[award.key] || []).length));
    const winnerRows = [];
    for (let i = 0; i < maxWinners; i++) {
      winnerRows.push(awards.map(award => {
        const winner = (winnerMap[award.key] || [])[i];
        return winner ? (winner.namezh || winner.nameZh || winner.nameZH || winner.name) : "";
      }));
    }
    const data = [awardNames, ...winnerRows];

    // 生成sheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    // 设置每列宽度
    ws['!cols'] = awards.map(() => ({ wch: 16 }));
    // 创建workbook并导出
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "中奖名单");
    XLSX.writeFile(wb, "中奖名单.xlsx");
  };

  return {
    selectAward,
    handleLottery,
    startLottery,
    stopLottery,
    exportWinners
  }
} 