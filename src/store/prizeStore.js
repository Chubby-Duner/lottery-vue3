import { defineStore } from "pinia"
import storage from "@/composables/useLocalStorage"
import { useAwardStore } from "@/store/awardStore"

export const usePrizeStore = defineStore("prizeStore", {
  state: () => ({
    // 导入的礼物数据
    prizeList: storage.get("prize_list", []),
    // 礼物剩余数量状态（新结构）
    prizeQuantities: storage.get("prize_quantities", {}),
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
        // 没有礼物，直接用数量
        const count = state.prizeQuantities[awardKey];
        if (count === 0) {
          return {
            giftName: state.giftLevelMap[awardKey] || awardKey,
            giftImage: null,
            description: state.giftLevelMap[awardKey] || awardKey
          };
        }
        return {
          giftName: state.giftLevelMap[awardKey] || awardKey,
          giftImage: null,
          description: state.giftLevelMap[awardKey] || awardKey
        };
      }
      // 有礼物，过滤出数量大于0的
      const availablePrizes = prizes.filter(prize => {
        const prizeId = `${prize.giftName}_${prize.giftLevel}`;
        const awardMap = state.prizeQuantities[awardKey];
        let remainingQuantity = awardMap && typeof awardMap === 'object' ? awardMap[prizeId] : undefined;
        if (remainingQuantity === undefined || remainingQuantity === null) {
          remainingQuantity = prize.giftQuantity || 1;
        }
        return remainingQuantity > 0;
      });
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
      return prizes.map(prize => {
        const prizeId = `${prize.giftName}_${prize.giftLevel}`;
        const awardMap = state.prizeQuantities[awardKey];
        let remainingQuantity = awardMap && typeof awardMap === 'object' ? awardMap[prizeId] : undefined;
        if (remainingQuantity === undefined || remainingQuantity === null) {
          remainingQuantity = prize.giftQuantity || 1;
        }
        return {
          ...prize,
          remainingQuantity: remainingQuantity,
          isAvailable: remainingQuantity > 0
        };
      });
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
      this.prizeQuantities = {};
      storage.remove("prize_list");
      storage.remove("prize_quantities");
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
    // 减少礼物数量
    decreasePrizeQuantity(prizeName, giftLevel) {
      const prizeId = `${prizeName}_${giftLevel}`;
      // 没有礼物时直接减少awardKey的数量
      if (!this.prizeList.some(p => p.giftLevel === giftLevel)) {
        let current = this.prizeQuantities[giftLevel];
        if (current === undefined || current === null) current = 1;
        if (current > 0) {
          this.prizeQuantities[giftLevel] = current - 1;
          storage.set("prize_quantities", this.prizeQuantities);
        }
        return;
      }
      // 有礼物时减少对应prizeId
      if (!this.prizeQuantities[giftLevel] || typeof this.prizeQuantities[giftLevel] !== 'object') {
        this.prizeQuantities[giftLevel] = {};
      }
      let current = this.prizeQuantities[giftLevel][prizeId];
      if (current === undefined || current === null) {
        const prize = this.prizeList.find(p => p.giftName === prizeName && p.giftLevel === giftLevel);
        current = prize ? (prize.giftQuantity || 1) : 1;
      }
      if (current > 0) {
        this.prizeQuantities[giftLevel][prizeId] = current - 1;
        storage.set("prize_quantities", this.prizeQuantities);
      }
    },
    // 重置礼物数量
    resetPrizeQuantities() {
      this.prizeQuantities = {};
      const awardStore = useAwardStore();
      const awards = Array.isArray(awardStore.awards) ? awardStore.awards : [];
      awards.forEach(award => {
        const prizes = this.prizeList.filter(prize => prize.giftLevel === award.key);
        if (prizes.length === 0) {
          // 没有礼物，直接用奖项数量
          this.prizeQuantities[award.key] = award.count;
        } else {
          // 有礼物，按prizeId分配
          this.prizeQuantities[award.key] = {};
          prizes.forEach(prize => {
            const prizeId = `${prize.giftName}_${prize.giftLevel}`;
            this.prizeQuantities[award.key][prizeId] = prize.giftQuantity || 1;
          });
        }
      });
      storage.set("prize_quantities", this.prizeQuantities);
    },
    // 获取礼物剩余数量
    getPrizeRemainingQuantity(prizeName, giftLevel) {
      const prizeId = `${prizeName}_${giftLevel}`;
      const awardMap = this.prizeQuantities[giftLevel];
      if (!this.prizeList.some(p => p.giftLevel === giftLevel)) {
        // 没有礼物，直接返回awardKey的数量
        let remaining = this.prizeQuantities[giftLevel];
        if (remaining === undefined || remaining === null) remaining = 1;
        return remaining;
      }
      // 有礼物
      let remaining = awardMap && typeof awardMap === 'object' ? awardMap[prizeId] : undefined;
      if (remaining !== undefined && remaining !== null) return remaining;
      const prize = this.prizeList.find(p => p.giftName === prizeName && p.giftLevel === giftLevel);
      if (prize) return prize.giftQuantity || 1;
      return 1;
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
    // 同步奖项key与label到giftLevelMap，并同步礼物列表和数量
    syncGiftLevelMapAndPrizes() {
      const awardStore = useAwardStore();
      const awards = Array.isArray(awardStore.awards) ? awardStore.awards : [];
      const awardLog = awardStore.awardLog || {};
      console.log("🚀 ~ syncGiftLevelMapAndPrizes ~ awardLog:", awardLog);

      // 1. 同步giftLevelMap
      const map = {};
      const validAwardKeys = [];
      awards.forEach(item => {
        map[item.key] = item.label;
        validAwardKeys.push(item.key);
      });
      this.giftLevelMap = map;
      // 2. 只保留prizeList中giftLevel在awards中的礼物
      this.prizeList = this.prizeList.filter(prize => validAwardKeys.includes(prize.giftLevel));
      // 3. 对于awards中有但prizeList没有的giftLevel，自动补充一个默认礼物（仅无礼物时）
      awards.forEach((item, idx) => {
        const hasPrize = this.prizeList.some(prize => prize.giftLevel === item.key);
        if (!hasPrize) {
          const awardLogKey = `award0${idx + 1}`;
          const remaining = awardLog[awardLogKey] ?? item.count;
          this.prizeList.push({
            giftName: item.label,
            giftLevel: item.key,
            giftQuantity: remaining,
            giftImage: null,
            description: item.label
          });
        }
      });
      // 4. prizeQuantities同步
      const newQuantities = {};
      awards.forEach((award, idx) => {
        const awardKey = award.key;
        const prizes = this.prizeList.filter(prize => prize.giftLevel === awardKey);
        const awardLogKey = `award0${idx + 1}`;
        const remaining = awardLog[awardLogKey];
        console.log("🚀 ~ awards.forEach ~ remaining:", awardLogKey, remaining);
        if (prizes.length === 0) {
          // 没有礼物，直接用奖项剩余数量
          newQuantities[awardKey] = remaining ?? award.count;
        } else {
          // 有礼物，所有礼物数量都优先用awardLog
          newQuantities[awardKey] = {};
          prizes.forEach(prize => {
            const prizeId = `${prize.giftName}_${prize.giftLevel}`;
            console.log("🚀 ~ awards.forEach ~ prizeId:", prizeId);
            newQuantities[awardKey][prizeId] = remaining ?? (prize.giftQuantity || 1);
            console.log("🚀 ~ awards.forEach ~ newQuantities[awardKey][prizeId]:", newQuantities[awardKey][prizeId]);
          });
        }
      });
      this.prizeQuantities = newQuantities;
      storage.set("prize_list", this.prizeList);
      storage.set("prize_quantities", this.prizeQuantities);
    }
  }
}) 