import { defineStore } from 'pinia'
import storage from '@/composables/useLocalStorage'

export const useAwardStore = defineStore('awardStore', {
  state: () => ({
    /* 奖项名单 */
    award1: storage.get('award_1', []),
    award2: storage.get('award_2', []),
    award3: storage.get('award_3', []),
    award4: storage.get('award_4', []),
    /*
      奖项的个数
      
      // 01: 一等奖
      // 02: 二等奖
      // 03: 三等奖
      // 04: 纪念奖
    */
    awardLog: storage.get('award_log', {
      award01: 1,
      award02: 3,
      award03: 3,
      award04: 4
    }),
    /* 当前选择的奖项 */
    selectAward: storage.get('select_award', 4)
  }),
  actions: {
    setAwardWinners(awardKey, winners) {
      if (awardKey === 'award1') this.award1 = winners
      if (awardKey === 'award2') this.award2 = winners
      if (awardKey === 'award3') this.award3 = winners
      if (awardKey === 'award4') this.award4 = winners
      this._syncLocal()
    },
    addWinner(awardKey, winner) {
      if (awardKey === 'award1') this.award1.push(winner)
      if (awardKey === 'award2') this.award2.push(winner)
      if (awardKey === 'award3') this.award3.push(winner)
      if (awardKey === 'award4') this.award4.push(winner)
      this._syncLocal()
    },
    clearAll() {
      this.award1 = []
      this.award2 = []
      this.award3 = []
      this.award4 = []
      this.awardLog = {
        award01: 1,
        award02: 3,
        award03: 3,
        award04: 4
      }
      this.selectAward = 4
      storage.remove('award_1')
      storage.remove('award_2')
      storage.remove('award_3')
      storage.remove('award_4')
      storage.remove('award_log')
      storage.remove('select_award')
    },
    setAwardLog(newLog) {
      this.awardLog = newLog
      storage.set('award_log', this.awardLog)
    },
    setSelectAward(val) {
      this.selectAward = val
      storage.set('select_award', this.selectAward)
    },
    _syncLocal() {
      storage.set('award_1', this.award1)
      storage.set('award_2', this.award2)
      storage.set('award_3', this.award3)
      storage.set('award_4', this.award4)
      storage.set('award_log', this.awardLog)
      storage.set('select_award', this.selectAward)
    }
  }
}) 