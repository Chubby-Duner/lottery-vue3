import { defineStore } from "pinia"
import storage from "@/composables/useLocalStorage"
import { useAwardStore } from "@/store/awardStore"

export const usePrizeStore = defineStore("prizeStore", {
  state: () => ({
    // 导入的礼物数据
    prizeList: storage.get("prize_list", []),
    // 礼物数据备份
    prizeListBackup: storage.get("prize_list_backup", []),
    // 礼物等级映射
    giftLevelMap: {
      award1: "一等奖",
      award2: "二等奖",
      award3: "三等奖",
      award4: "纪念奖"
    }
  }),
  getters: {
    // 根据奖项key获取该奖项的所有礼物
    getPrizesByAward: (state) => (awardKey) => {
      return state.prizeList.filter(prize => prize.giftLevel === awardKey);
    },
    // 根据奖项key随机获取一个礼物（考虑数量限制）
    getRandomPrizeByAward: (state) => (awardKey) => {
      const prizes = state.prizeList.filter(prize => prize.giftLevel === awardKey);
      if (prizes.length === 0) {
        return {
          giftName: state.giftLevelMap[awardKey] || awardKey,
          giftImage: null,
          description: state.giftLevelMap[awardKey] || awardKey
        };
      }
      // 有礼物，过滤出剩余数量大于0的
      const availablePrizes = prizes.filter(prize => prize.remainingQuantity > 0);
      if (availablePrizes.length === 0) {
        return {
          giftName: state.giftLevelMap[awardKey] || awardKey,
          giftImage: null,
          description: state.giftLevelMap[awardKey] || awardKey
        };
      }
      const randomIndex = Math.floor(Math.random() * availablePrizes.length);
      return availablePrizes[randomIndex];
    },
    // 获取所有礼物数据
    getAllPrizes: (state) => {
      return state.prizeList;
    },
    // 检查是否有礼物数据
    hasPrizes: (state) => {
      return state.prizeList.length > 0;
    },
    // 获取礼物分组数据
    getPrizeGroups: (state) => {
      const groups = {};
      state.prizeList.forEach(prize => {
        const level = prize.giftLevel || 'award1';
        if (!groups[level]) {
          groups[level] = [];
        }
        groups[level].push(prize);
      });

      return Object.keys(groups).map(level => ({
        key: level,
        title: state.giftLevelMap[level] || level,
        data: groups[level]
      })).filter(group => group.data.length > 0);
    },
    // 获取指定奖项的可用礼物列表（用于调试）
    getAvailablePrizesForAward: (state) => (awardKey) => {
      const prizes = state.prizeList.filter(prize => prize.giftLevel === awardKey);
      return prizes.map(prize => ({
        ...prize,
        isAvailable: prize.remainingQuantity > 0
      }));
    }
  },
  actions: {
    // 设置礼物数据
    setPrizeList(prizes) {
      this.prizeList = prizes;
      storage.set("prize_list", this.prizeList);
    },
    // 添加礼物
    addPrize(prize) {
      this.prizeList.push(prize);
      storage.set("prize_list", this.prizeList);
    },
    // 清空礼物数据
    clearPrizes() {
      this.prizeList = [];
      this.prizeListBackup = [];
      storage.remove("prize_list");
      storage.remove("prize_list_backup");
    },
    // 更新礼物
    updatePrize(index, prize) {
      this.prizeList[index] = prize;
      storage.set("prize_list", this.prizeList);
    },
    // 删除礼物
    removePrize(index) {
      this.prizeList.splice(index, 1);
      storage.set("prize_list", this.prizeList);
    },
    // 减少礼物剩余数量
    decreasePrizeRemainingQuantity(prizeName, giftLevel) {
      const prize = this.prizeList.find(p => p.giftName === prizeName && p.giftLevel === giftLevel);
      if (prize && prize.remainingQuantity > 0) {
        prize.remainingQuantity -= 1;
        storage.set("prize_list", this.prizeList);
      }
    },
    // 重置所有礼物的剩余数量为giftQuantity
    resetAllRemainingQuantity() {
      this.prizeList.forEach(prize => {
        prize.remainingQuantity = prize.giftQuantity;
      });
      storage.set("prize_list", this.prizeList);
    },
    // 获取礼物剩余数量
    getPrizeRemainingQuantity(prizeName, giftLevel) {
      const prize = this.prizeList.find(p => p.giftName === prizeName && p.giftLevel === giftLevel);
      return prize ? prize.remainingQuantity : 0;
    },
    // 同步奖项key与label到giftLevelMap
    syncGiftLevelMap(awards) {
      // awards: [{ key: 'award1', label: '一等奖' }, ...]
      const map = {};
      awards.forEach(item => {
        map[item.key] = item.label;
      });
      this.giftLevelMap = map;
    },
    // 同步奖项key与label到giftLevelMap，并同步礼物列表
    syncGiftLevelMapAndPrizes() {
      const awardStore = useAwardStore();
      const awards = Array.isArray(awardStore.awards) ? awardStore.awards : [];
      const map = {};
      const validAwardKeys = [];
      awards.forEach(item => {
        map[item.key] = item.label;
        validAwardKeys.push(item.key);
      });
      this.giftLevelMap = map;
      // 只保留prizeList中giftLevel在awards中的礼物
      this.prizeList = this.prizeList.filter(prize => validAwardKeys.includes(prize.giftLevel));
      // 对于awards中有但prizeList没有的giftLevel，自动补充一个默认礼物（仅无礼物时）
      awards.forEach(item => {
        const hasPrize = this.prizeList.some(prize => prize.giftLevel === item.key);
        const maxId = this.prizeList.length > 0 ? Math.max(...this.prizeList.map(g => g.__id ?? 0)) : 0;
        if (!hasPrize) {
          this.prizeList.push({
            giftCategory: item.label,
            giftName: item.label,
            giftLevel: item.key,
            giftQuantity: item.count,
            remainingQuantity: item.count,
            giftImage: null,
            description: item.label,
            __id: maxId + 1
          });
        }
      });
      storage.set("prize_list", this.prizeList);
    },
    // 备份礼物数据
    setPrizeListBackup(prizes) {
      this.prizeListBackup = prizes;
      storage.set("prize_list_backup", this.prizeListBackup);
    }
  }
}) 