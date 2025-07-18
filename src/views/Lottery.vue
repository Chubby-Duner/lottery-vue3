<script setup>
import { ref } from "vue";
import AwardList from "@/components/Lottery/pages/AwardList.vue";
import PrizeList from "@/components/Lottery/pages/PrizeList.vue";
import LotteryMain from "@/components/Lottery/pages/index.vue";
import MusicControl from "@/components/Lottery/features/MusicControl.vue";
import SplashScreen from "@/components/SplashScreen.vue";

defineOptions({
  name: "Lottery"
});

const showSplash = ref(true);
</script>

<template>
  <div class="lottery-wrapper">
    <SplashScreen v-if="showSplash" @close="showSplash = false" />
    <div v-else class="lottery-container">
      <!-- 顶部花纹 -->
      <header class="top-head"></header>
      <!-- 中奖列表 -->
      <AwardList />
      <!-- 礼物列表 -->
      <PrizeList />
      <!-- 主抽奖程序 -->
      <LotteryMain />
      <!-- 背景音乐 -->
      <MusicControl />
      <!-- 底部花纹 -->
      <footer class="footer"></footer>
    </div>
  </div>
</template>

<style lang="scss">
.lottery-wrapper {
  width: 100%;
  height: 100%;
}
</style>
