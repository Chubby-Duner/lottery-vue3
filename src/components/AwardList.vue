<script setup>
import { ref, computed } from 'vue'
import useLocalStorage from '@/composables/useLocalStorage'

const showList = ref(false)
const showAward4 = ref(false)

const { storedValue: award1 } = useLocalStorage('award_1', [])
const { storedValue: award2 } = useLocalStorage('award_2', [])
const { storedValue: award3 } = useLocalStorage('award_3', [])
const { storedValue: award4 } = useLocalStorage('award_4', [])

const toggleList = () => {
  showList.value = !showList.value
}

const toggleAward4 = () => {
  showAward4.value = !showAward4.value
}
</script>

<template>
  <aside class="aside-left">
    <div class="aside-main" v-show="showList">
      <div class="btn btn-red-outline" @click="toggleList">中奖名单</div>
      <div class="award-main">
        <div id="award-123">
          <div class="award-con" v-show="award1.length > 0">
            <h3 class="award-title">一等奖</h3>
            <ul class="win">
              <li v-for="(winner, index) in award1" :key="index" class="clearfix win-li">
                <div class="f-l avatar">
                  <img width="34" :src="`@/assets/images/avatar/${winner.nameen}.jpg`"/>
                </div>
                <div class="f-l name">{{ winner.namezh }}</div>
              </li>
            </ul>
          </div>
          <!-- 类似结构添加二等奖、三等奖 -->
        </div>
        <div class="award-con" v-show="award4.length > 0">
          <h3 class="award-title">纪念奖</h3>
          <ul class="win">
            <li v-for="(winner, index) in award4" :key="index" class="clearfix win-li">
              <div class="f-l avatar">
                <img width="34" :src="`@/assets/images/avatar/${winner.nameen}.jpg`"/>
              </div>
              <div class="f-l name">{{ winner.namezh }}</div>
            </li>
          </ul>
        </div>
        <a href="javascript:;" v-show="award4.length > 0" class="more" @click="toggleAward4">
          查看更多
        </a>
      </div>
    </div>
    <img 
      src="@/assets/images/lantern.png" 
      alt="" 
      width="85" 
      v-show="!showList"
      @click="showList = true"
      class="switch"
    >
  </aside>
</template>

<style scoped>
/* 保留原有样式 */
</style>