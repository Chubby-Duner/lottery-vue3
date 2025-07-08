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
    <!-- 侧边栏内容区域 -->
    <transition name="drawer">
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
    </transition>

    <!-- 灯笼 - 同一个灯笼，跟随区域移动 -->
    <img src="@/assets/images/lantern.png" alt="" width="85" @click="toggleList" class="switch" :class="{ 'switch-expanded': showList }" />
  </aside>
</template>

<style lang="scss" scoped>
.aside-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.aside-main {
  flex: 1;
  overflow-y: auto;
}

.switch {
  position: absolute;
  right: 2px;
  transform: translateX(-50%);
  z-index: 10;
  cursor: pointer;
  top: 2rem;
  transition: top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.switch-expanded {
  top: calc(100% - 2rem);
}

/* 在容器内的灯笼位置 */
.aside-container .switch {
  bottom: 0;
}
</style>
