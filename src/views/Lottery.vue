<script setup>
import AwardList from "@/components/Lottery/pages/AwardList.vue";
import PrizeList from "@/components/Lottery/pages/PrizeList.vue";
import LotteryMain from "@/components/Lottery/pages/index.vue";
// import SnowEffect from '@/components/Lottery/features/SnowEffect.vue'
import MusicControl from "@/components/Lottery/features/MusicControl.vue";

defineOptions({
  name: "Lottery"
});
</script>

<template>
  <div class="lottery-container">
    <header class="top-head"></header>

    <AwardList />
    <PrizeList />

    <LotteryMain />

    <!-- 添加音乐和清除控制 -->
    <MusicControl />

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

<style lang="scss">
</style>
