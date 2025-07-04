<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { translateKeys } from '@/composables/utils'

import AwardList from '@/components/Lottery/AwardList.vue'
import PrizeList from '@/components/Lottery/PrizeList.vue'
import LotteryMain from '@/components/Lottery/index.vue'
import SnowEffect from '@/components/Lottery/SnowEffect.vue'
import MusicControl from '@/components/Lottery/MusicControl.vue'
import ClearDataControl from '@/components/Lottery/ClearDataControl.vue'

defineOptions({
  name: "Lottery"
});

</script>

<template>
  <div class="lottery-container">
  
    <!-- ***************************** -->

    <header class="top-head"></header>
    
    <AwardList />
    <PrizeList />
    
    <LotteryMain />

    <!-- 添加音乐和清除控制 -->
    <MusicControl />
    <!-- <ClearDataControl /> -->
    
    
    <!-- 两种雪花效果 -->
    <!-- <SnowEffect 
      :speed="2"
      :interaction="true"
      :size="10"
      :count="30"
      start-color="rgba(253,252,251,1)"
      end-color="rgba(251,252,253,0.3)"
      :opacity="0.8"
      :wind-power="2"
      :image="false"
    />
    <SnowEffect 
      :speed="3"
      :interaction="true"
      :size="12"
      :count="80"
      :wind-power="-5"
      image="@/assets/images/snow.png"
    /> -->


    <footer class="footer"></footer>
  </div>
</template>

<style>
/* 全局样式 */
@import '@/assets/styles/style.css';
@import '@/assets/styles/animate.css';

.lottery-container {
  /* position: relative; */
  width: 100%;
  height: 100%;
  /* overflow: hidden; */
}
</style>