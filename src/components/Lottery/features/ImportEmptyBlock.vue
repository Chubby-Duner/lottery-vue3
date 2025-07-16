<script setup>
import { message, Modal } from "ant-design-vue";
import { useAwardStore } from "@/store/awardStore";

defineOptions({
  name: "ImportEmptyBlock"
});

const props = defineProps({
  description: { type: String, default: "请先导入数据" },
  image: { type: String, default: "https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original" },
  imageStyle: { type: Object, default: () => ({ height: "60px" }) }
});

const awardStore = useAwardStore();

const getTemplateUrl = () => {
  return new URL("/template/importTemplate.xlsx", import.meta.url).href;
};

// 清空所有数据
const clearAllData = () => {
  Modal.confirm({
    title: "确定要清空所有数据吗？",
    content: "此操作会清空上一次操作所产生的所有数据。",
    okText: "确定",
    cancelText: "取消",
    async onOk() {
      try {
        awardStore.clearAll();
        message.success("已清空所有数据");
      } catch (error) {
        console.error("error in clearAllData", error);
      }
    }
  });
};
</script>

<template>
  <a-empty :image="image" :image-style="imageStyle" class="margin-top30">
    <template #description>
      <slot name="description">
        <span>{{ description }}</span>
      </slot>
    </template>
    <a-button type="primary">
      <a :href="getTemplateUrl()" target="_blank">下载模板</a>
    </a-button>
    <a-button class="margin-left10" type="primary" @click="$emit('import')">导入抽奖名单数据</a-button>
    <a-button class="margin-left10" type="primary" @click="clearAllData">清空所有数据</a-button>
    <slot />
  </a-empty>
</template>

<style scoped>
.margin-top30 {
  margin-top: 30px;
}
</style>
