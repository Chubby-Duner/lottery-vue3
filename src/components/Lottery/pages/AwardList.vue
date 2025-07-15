<script setup>
import { ref, computed } from "vue";
import { Empty } from "ant-design-vue";
import { useAwardStore } from "@/store/awardStore";

defineOptions({
  name: "AwardList"
});

const awardStore = useAwardStore();
const showList = ref(false);
const visibleCounts = ref({});
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;

// 动态奖项分组
const awardGroups = computed(() =>
  awardStore.awards
    .map(award => ({
      key: award.key,
      title: award.label,
      data: awardStore.winnerMap[award.key] || []
    }))
    .filter(group => group.data.length > 0)
);

// 初始化每个奖项的显示数量
const initVisibleCounts = () => {
  awardStore.awards.forEach(award => {
    if (!(award.key in visibleCounts.value)) {
      visibleCounts.value[award.key] = 5;
    }
  });
};
initVisibleCounts();

const toggleList = () => {
  showList.value = !showList.value;
  if (showList.value) initVisibleCounts();
};

const showMore = awardKey => {
  visibleCounts.value[awardKey] += 5;
};

const showLess = awardKey => {
  visibleCounts.value[awardKey] = 5;
};
</script>

<template>
  <aside class="aside-left">
    <!-- 侧边栏内容区域 -->
    <transition name="drawer">
      <div class="aside-main" v-show="showList">
        <div class="btn weight-edit-section" @click="toggleList">收起名单</div>
        <div class="award-main" v-if="awardGroups.length > 0">
          <template v-for="group in awardGroups" :key="group.key">
            <div class="award-con" v-if="group.data.length > 0">
              <h3 class="award-title">{{ group.title }}</h3>
              <ul class="win">
                <li v-for="(winner, index) in group.data.slice(0, visibleCounts[group.key])" :key="index" class="clearfix win-li">
                  <div class="f-l avatar">
                    <!-- 优先使用导入图片，没有则显示名字随机一个字 -->
                    <img v-if="winner.image && typeof winner.image === 'object' && winner.image.dataUrl" :src="winner.image.dataUrl" width="34" :alt="winner.namezh" style="object-fit: contain; border-radius: 4px; display: block; margin: 0 auto" />
                    <div
                      v-else
                      class="avatar-text"
                      :style="{ width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffe082', borderRadius: '50%', color: '#b8860b' }"
                    >
                      {{ winner.avatarChar }}
                    </div>
                  </div>
                  <div class="f-l name">{{ winner.namezh }}</div>
                </li>
              </ul>
              <div class="action-btns" v-if="group.data.length > 5">
                <a-button type="link" @click="showMore(group.key)" v-if="visibleCounts[group.key] < group.data.length"> 查看更多 </a-button>
                <a-button type="link" @click="showLess(group.key)" v-if="visibleCounts[group.key] > 5"> 收起 </a-button>
              </div>
            </div>
          </template>
        </div>
        <div v-else class="empty-tip">
          <a-empty :image="simpleImage" description="暂无中奖名单" />
        </div>
      </div>
    </transition>

    <!-- 灯笼 - 同一个灯笼，跟随区域移动 -->
    <img src="@/assets/images/lantern.png" alt="" width="85" @click="toggleList" class="switch" :class="{ 'switch-expanded': showList }" />
  </aside>
</template>

<style lang="scss" scoped>
.empty-tip {
  margin-top: 50px;
}

.switch {
  position: absolute;
  left: 86px;
  transform: translateX(-50%);
  z-index: 10;
  cursor: pointer;
  top: 2rem;
  transition: top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.switch-expanded {
  top: calc(100% - 2rem);
}
</style>
