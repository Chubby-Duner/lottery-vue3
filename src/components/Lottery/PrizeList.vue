<script setup>
import { ref } from "vue";

defineOptions({
  name: "PrizeList"
});

const showList = ref(false);

const toggleList = () => {
  showList.value = !showList.value;
};
</script>

<template>
  <aside class="aside-right">
    <div class="aside-main" v-show="showList">
      <div class="btn btn-red-outline award-list-btn" @click="toggleList">新年礼物</div>
      <div class="award-main">
        <div class="award-con">
          <h3 class="award-title">一等奖</h3>
          <ul class="win">
            <li class="clearfix win-li">
              <div class="f-l avatar">
                <img width="34" src="@/assets/images/gift/canon.jpg" />
              </div>
              <div class="f-l name">佳能微单</div>
            </li>
          </ul>
        </div>
        <!-- 类似结构添加其他奖项 -->
      </div>
    </div>
    <img src="@/assets/images/lantern.png" alt="" width="85" v-show="!showList" @click="showList = true" class="switch" />
  </aside>
</template>

<style lang="scss">
@use "@/styles/index.scss";
</style>
