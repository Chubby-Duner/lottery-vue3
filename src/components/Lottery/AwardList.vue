<script setup>
import { ref, computed } from "vue";
import { Empty } from "ant-design-vue";
import { useAwardStore } from "@/store/awardStore";
import { getImageUrl } from "@/composables/utils";

defineOptions({
  name: "AwardList",
});

const awardStore = useAwardStore();
const showList = ref(false);
const visibleCounts = ref({});
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE;

// 动态奖项分组
const awardGroups = computed(() =>
  awardStore.awards
    .map((award) => ({
      key: award.key,
      title: award.label,
      data: awardStore.winnerMap[award.key] || [],
    }))
    .filter((group) => group.data.length > 0)
);

// 初始化每个奖项的显示数量
const initVisibleCounts = () => {
  awardStore.awards.forEach((award) => {
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

const showMore = (awardKey) => {
  visibleCounts.value[awardKey] += 5;
};

const showLess = (awardKey) => {
  visibleCounts.value[awardKey] = 5;
};
</script>

<template>
  <aside class="aside-left">
    <div class="aside-main" v-show="showList">
      <div class="btn btn-red-outline award-list-btn" @click="toggleList">
        {{ showList ? "收起名单" : "中奖名单" }}
      </div>
      <div class="award-main" v-if="awardGroups.length > 0">
        <template v-for="group in awardGroups" :key="group.key">
          <div class="award-con" v-if="group.data.length > 0">
            <h3 class="award-title">{{ group.title }}</h3>
            <ul class="win">
              <li
                v-for="(winner, index) in group.data.slice(0, visibleCounts[group.key])"
                :key="index"
                class="clearfix win-li"
              >
                <div class="f-l avatar">
                  <img width="34" :src="getImageUrl(winner.nameen, 'avatar')" />
                </div>
                <div class="f-l name">{{ winner.namezh }}</div>
              </li>
            </ul>
            <div class="action-btns" v-if="group.data.length > 5">
              <a-button
                type="link"
                @click="showMore(group.key)"
                v-if="visibleCounts[group.key] < group.data.length"
              >
                查看更多
              </a-button>
              <a-button
                type="link"
                @click="showLess(group.key)"
                v-if="visibleCounts[group.key] > 5"
              >
                收起
              </a-button>
            </div>
          </div>
        </template>
      </div>
      <div v-else class="empty-tip">
        <a-empty :image="simpleImage" description="暂无中奖名单" />
      </div>
    </div>

    <img
      src="@/assets/images/lantern.png"
      alt=""
      width="85"
      v-show="!showList"
      @click="toggleList"
      class="switch"
    />
  </aside>
</template>

<style scoped>
@import "@/assets/styles/style.css";

.empty-tip {
  margin-top: 50px;
}
</style>
