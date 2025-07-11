import { defineStore } from "pinia"
import storage from "@/composables/useLocalStorage"

export const useAwardStore = defineStore("awardStore", {
  state: () => ({
    // 动态奖项列表
    awards: storage.get("awards", [
      { key: "award1", label: "一等奖", count: 1 },
      { key: "award2", label: "二等奖", count: 3 },
      { key: "award3", label: "三等奖", count: 3 },
      { key: "award4", label: "纪念奖", count: 5 }
    ]),
    // 奖项剩余数量
    awardLog: storage.get("award_log", {
      award01: 1,
      award02: 3,
      award03: 3,
      award04: 5
    }),
    // 中奖名单，key为奖项key
    winnerMap: storage.get("winner_map", {}),
    // 当前选择的奖项key
    selectAward: storage.get("select_award", "award4"),
    // 导入数据的原始备份
    lotteryDataBackup: storage.get("lottery_data_backup", [])
  }),
  actions: {
    // 设置奖项
    setAwards(newAwards) {
      this.awards = newAwards;
      storage.set("awards", this.awards);

      // 更新奖项剩余数量
      const newLog = { ...this.awardLog };
      newAwards.forEach((item, idx) => {
        const key = `award0${idx + 1}`;
        if (!(key in newLog)) {
          // 新增奖项，设置初始数量
          newLog[key] = item.count;
        } else {
          // 已存在的奖项，如果新数量大于当前剩余数量，则更新剩余数量
          const currentRemaining = newLog[key];
          if (item.count > currentRemaining) {
            newLog[key] = item.count;
          }
        }
      });

      // 删除被移除奖项的数量
      Object.keys(newLog).forEach(key => {
        const awardIndex = parseInt(key.replace("award0", "")) - 1;
        if (!newAwards[awardIndex]) {
          delete newLog[key];
        }
      });
      this.awardLog = newLog;
      storage.set("award_log", this.awardLog);

      // 同步中奖名单结构
      const newWinnerMap = {};
      newAwards.forEach(item => {
        newWinnerMap[item.key] = this.winnerMap?.[item.key] || [];
      });
      this.winnerMap = newWinnerMap;
      storage.set("winner_map", this.winnerMap);
    },
    // 更新中奖个数
    setAwardLog(newLog) {
      this.awardLog = newLog;
      storage.set("award_log", this.awardLog);
    },
    // 设置当前选中的奖品
    setSelectAward(val) {
      this.selectAward = val;
      storage.set("select_award", this.selectAward);
    },
    // 添加中奖者
    addWinner(awardKey, winner) {
      if (!this.winnerMap[awardKey]) this.winnerMap[awardKey] = [];
      this.winnerMap[awardKey].push(winner);
      storage.set("winner_map", this.winnerMap);
    },
    // 重置奖项个数
    resetAwardCounts() {
      const newLog = {};
      this.awards.forEach((item, idx) => {
        newLog[`award0${idx + 1}`] = item.count;
      });
      this.awardLog = newLog;
      storage.set("award_log", this.awardLog);
    },
    // 更新中奖者
    setWinners(awardKey, winners) {
      this.winnerMap[awardKey] = winners;
      storage.set("winner_map", this.winnerMap);
    },
    clearAllWinners() {
      this.winnerMap = {};
      storage.remove("winner_map");
    },
    clearAll() {
      this.awards = [
        { key: "award1", label: "一等奖", count: 1 },
        { key: "award2", label: "二等奖", count: 3 },
        { key: "award3", label: "三等奖", count: 3 },
        { key: "award4", label: "纪念奖", count: 5 }
      ];
      storage.set("awards", this.awards);
      this.awardLog = {
        award01: 1,
        award02: 3,
        award03: 3,
        award04: 5
      };
      storage.set("award_log", this.awardLog);
      this.winnerMap = {};
      storage.remove("winner_map");
      this.selectAward = "award4";
      storage.set("select_award", this.selectAward);
      this.lotteryDataBackup = [];
      storage.remove("lottery_data_backup");
    },
    // 备份导入数据
    setLotteryDataBackup(data) {
      this.lotteryDataBackup = data;
      storage.set("lottery_data_backup", data);
    },
    // 恢复到导入数据时的状态
    resetAllToImportBackup() {
      if (!this.lotteryDataBackup || this.lotteryDataBackup.length === 0) return;
      // 你可以根据实际需求恢复awards、awardLog、winnerMap等
      // 这里只恢复名单，奖项和数量可根据实际需求扩展
      this.awards = [
        { key: "award1", label: "一等奖", count: 1 },
        { key: "award2", label: "二等奖", count: 3 },
        { key: "award3", label: "三等奖", count: 3 },
        { key: "award4", label: "纪念奖", count: 5 }
      ];
      storage.set("awards", this.awards);
      this.awardLog = {
        award01: 1,
        award02: 3,
        award03: 3,
        award04: 5
      };
      storage.set("award_log", this.awardLog);
      this.winnerMap = {};
      storage.remove("winner_map");
      this.selectAward = "award4";
      storage.set("select_award", this.selectAward);
    }
  }
}) 