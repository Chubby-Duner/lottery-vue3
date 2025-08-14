import { weightedRandomIndex, convertAwardKey } from '@/composables/utils'
import * as XLSX from "xlsx";
import { usePrizeStore } from "@/store/prizeStore";
import { useLotteryHistoryStore } from "@/store/lotteryHistoryStore";
import { v4 as uuidv4 } from 'uuid';

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
  winnerGift,
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
  const prizeStore = usePrizeStore();
  const historyStore = useLotteryHistoryStore();
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
    
    // 多轮抽奖模式下的快速动画
    if (historyStore.multiRoundConfig.enabled) {
      // 快速动画，2秒内完成
      setTimeout(() => (speed.value = 30), 200);
      setTimeout(() => (speed.value = 50), 400);
      setTimeout(() => (speed.value = 90), 600);
      setTimeout(() => {
        speed.value = 120;
        isLocked.value = false;
        // 自动停止抽奖
        setTimeout(() => {
          if (isStarted.value && !isLocked.value) {
            stopLottery();
          }
        }, 500); // 0.5秒后自动停止
      }, 800);
    } else {
      // 普通模式的原有动画
      setTimeout(() => (speed.value = 15), 1000);
      setTimeout(() => (speed.value = 20), 1500);
      setTimeout(() => (speed.value = 30), 3000);
      setTimeout(() => (speed.value = 50), 3500);
      setTimeout(() => {
        speed.value = 90;
        isLocked.value = false;
      }, 4000);
    }
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
        winnerGift.value = null;
      } else {
        winnerNameZh.value = winner.namezh;
        winnerNameEn.value = winner.nameen;
        winnerAvatarChar.value = winner.avatarChar;
        winnerWish.value = winner.wish;
        winnerImage.value = (winner.image && winner.image.dataUrl) ? { dataUrl: winner.image.dataUrl } : null;
        // 调试信息：显示当前奖项的所有礼物状态
        // const availablePrizes = prizeStore.getAvailablePrizesForAward(selectedAward.value);
        // console.log(`奖项 ${selectedAward.value} 的礼物状态:`, availablePrizes);

        // 随机选择一个礼物（getRandomPrizeByAward已经会过滤掉数量为0的礼物）
        winnerGift.value = prizeStore.getRandomPrizeByAward(selectedAward.value);

        // 调试信息：显示选中的礼物和剩余数量
        if (winnerGift.value && winnerGift.value.giftName) {
          // 减少选中礼物的剩余数量
          prizeStore.decreasePrizeRemainingQuantity(winnerGift.value.giftName, selectedAward.value);
        }
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
      // 为winner生成唯一id
      const winnerId = uuidv4();
      
      // 中奖人对象，只存nameen、namezh和image.dataUrl和avatarChar
      let winnerData = {
        id: winnerId, // 添加生成的唯一id
        nameen: winner.nameen,
        namezh: winner.namezh,
        avatarChar: winner.avatarChar // 新增，保证名单有头像字
      };
      if (winner.image && typeof winner.image === 'object' && winner.image.dataUrl) {
        winnerData.image = { dataUrl: winner.image.dataUrl };
      }
      // 增加奖项和礼物信息
      const awardObj = awardStore.awards.find(a => a.key === selectedAward.value);
      winnerData.award = awardObj ? (awardObj.label || awardObj.name) : selectedAward.value;
      winnerData.gift = winnerGift.value ? winnerGift.value.giftName : '';
      // 记录抽奖历史（在状态更新前记录快照）
      const awardName = awardStore.awards.find(a => a.key === selectedAward.value)?.label || selectedAward.value;
      historyStore.addLotteryRecord({
        awardKey: convertAwardKey(selectedAward.value),
        awardName,
        winner: {
          id: winnerId, // 使用生成的同一个id
          namezh: winner.namezh,
          nameen: winner.nameen,
          avatarChar: winner.avatarChar,
          image: winner.image,
          wish: winner.wish
        },
        gift: winnerGift.value,
        lotteryDataSnapshot: [...lotteryData.value],
        awardLogSnapshot: { ...awardStore.awardLog },
        winnerMapSnapshot: JSON.parse(JSON.stringify(awardStore.winnerMap)),
        prizeListSnapshot: [...prizeStore.prizeList]
      });
      
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
      
      // 处理多轮抽奖逻辑
      if (historyStore.multiRoundConfig.enabled) {
        historyStore.completeOneRound();
        
        // 自动关闭结果弹窗
        setTimeout(() => {
          showResult.value = false;
        }, 1000); // 1秒后自动关闭结果弹窗
        
        // 检查是否还有剩余轮次
        if (historyStore.multiRoundConfig.currentRound < historyStore.multiRoundConfig.roundCount) {
          // 还有剩余轮次，自动重置状态准备下一轮
          setTimeout(() => {
            if (lotteryData.value.length > 0) {
              // 重置抽奖状态，准备下一轮
              isMoving.value = true;
              isStarted.value = false;
              isLocked.value = true;
              speed.value = 6;
              showResult.value = false;
              canStop.value = false;
              isLotteryProcessing.value = false;
              
              // 重新启动动画
              if (!animationPaused.value) {
                startAnimation();
              }
              
              message.success(`第 ${historyStore.multiRoundConfig.currentRound} 轮完成，1秒后自动开始第 ${historyStore.multiRoundConfig.currentRound + 1} 轮抽奖`);
              
              // 自动开始下一轮抽奖
              setTimeout(() => {
                if (historyStore.multiRoundConfig.enabled && lotteryData.value.length > 0) {
                  // 自动触发下一轮抽奖
                  startLottery();
                }
              }, 1000); // 1秒后自动开始抽奖
            } else {
              // 没有足够的人员或奖项，结束多轮抽奖
              historyStore.finishMultiRound();
              message.warning('人员不足或奖项已抽完，多轮抽奖提前结束');
            }
          }, 2000); // 2秒后准备下一轮（给结果展示时间）
        } else {
          // 所有轮次完成
          const results = historyStore.finishMultiRound();
          setTimeout(() => {
            showResult.value = false; // 自动关闭最后一轮的结果弹窗
            message.success(`多轮抽奖完成！共抽取了 ${results.length} 位中奖者`);
          }, 2000); // 2秒后关闭并显示完成消息
        }
      }
      
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
    // 统一表头
    const columns = ["奖项", "中奖人", "礼物"];
    const data = [columns];
    awards.forEach(award => {
      const winners = winnerMap[award.key] || [];
      if (winners.length > 0) {
        // 区块奖项名
        data.push([award.label || award.name]);
        winners.forEach(winner => {
          data.push([
            winner.award || (award.label || award.name),
            winner.namezh || winner.nameZh || winner.nameZH || winner.name || '',
            winner.gift || ''
          ]);
        });
        // 区块之间空一行
        data.push([]);
      }
    });
    // 移除最后一个空行
    if (data.length > 0 && data[data.length - 1].length === 0) {
      data.pop();
    }
    // 生成sheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = columns.map(() => ({ wch: 16 }));
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