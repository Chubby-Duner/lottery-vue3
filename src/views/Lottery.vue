<script setup>
import AwardList from "@/components/Lottery/pages/AwardList.vue";
import PrizeList from "@/components/Lottery/pages/PrizeList.vue";
import LotteryMain from "@/components/Lottery/pages/index.vue";
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

    <footer class="footer"></footer>
  </div>
</template>

<style lang="scss"></style>
