<script setup>
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import { usePrizeStore } from "@/store/prizeStore";
import { useAwardStore } from "@/store/awardStore";

const props = defineProps({
  visible: Boolean
});
const emit = defineEmits(["update:visible", "save"]);

const giftSettingVisible = ref(false);
const prizeStore = usePrizeStore();
const awardStore = useAwardStore();
const localGiftList = ref([]); // 本地所有礼物列表

// 打开弹窗时初始化本地礼物列表
watch(
  () => giftSettingVisible.value,
  val => {
    if (val) {
      localGiftList.value = JSON.parse(JSON.stringify(prizeStore.prizeList));
    }
  }
);

// 构建 treeData 用于表格展示
const treeData = computed(() => {
  return awardStore.awards.map(award => {
    const children = localGiftList.value
      .filter(gift => gift.giftLevel === award.key)
      .map((gift, idx) => {
        // 直接返回gift对象，并补充表格需要的字段
        gift.key = `${award.key}-${gift.__id ?? idx}`;
        gift.parentKey = award.key;
        gift.isAward = false;
        return gift;
      });
    const node = {
      key: award.key,
      title: award.label,
      totalCount: award.count,
      isAward: true
    };
    if (children.length > 0) {
      node.children = children;
    }
    return node;
  });
});

const columns = [
  { title: "名称", dataIndex: "giftName", key: "giftName" },
  { title: "数量", dataIndex: "giftQuantity", key: "giftQuantity" },
  { title: "剩余数量", dataIndex: "remainingQuantity", key: "remainingQuantity" },
  { title: "操作", dataIndex: "action", key: "action" }
];

// 计算奖项行的剩余数量，直接取awardStore.awardLog
const getAwardRemainingQuantity = awardKey => {
  // awardKey 形如 award1，转换为 award01
  const idx = Number(awardKey.replace("award", ""));
  const logKey = `award0${idx}`;
  return awardStore.awardLog[logKey] ?? 0;
};

const addGift = level => {
  // 统计该奖项下所有礼物数量之和
  const group = treeData.value.find(g => g.key === level);
  const total = group && group.children ? group.children.reduce((sum, g) => sum + (Number(g.giftQuantity) || 0), 0) : 0;
  const max = group ? group.totalCount : 0;
  if (total >= max) {
    message.warning("该奖项下所有礼物数量总和已达奖项总数，不能再新增！");
    return;
  }
  // 计算新id
  const maxId = localGiftList.value.length > 0 ? Math.max(...localGiftList.value.map(g => g.__id ?? 0)) : 0;
  // 获取奖项名称
  const award = awardStore.awards.find(a => a.key === level);
  localGiftList.value.push({
    giftLevel: level,
    giftCategory: award ? award.label : "",
    giftName: "",
    giftImage: null,
    giftQuantity: 1,
    __id: maxId + 1,
    remainingQuantity: 1
  });
};
const removeGift = gift => {
  const idx = localGiftList.value.findIndex(p => p.__id === gift.__id);
  if (idx !== -1) localGiftList.value.splice(idx, 1);
};
const getAwardRemainCount = level => {
  const idx = Number(level.replace("award", ""));
  const key = `award0${idx}`;
  return awardStore.awardLog[key] ?? 0;
};
const handleOk = () => {
  // 校验逻辑...
  for (const group of treeData.value) {
    const max = group.totalCount;
    // 1. 每个礼物的数量不能大于奖项总数量
    if (group.children && group.children.length > 0) {
      for (const gift of group.children) {
        if (Number(gift.giftQuantity) > max) {
          message.error(`${group.title}下礼物“${gift.giftName || '未命名'}”的数量不能大于奖项总数量（${max}）！`);
          return;
        }
      }
    }
    // 2. 所有礼物“剩余数量”总和不能大于奖项剩余数量
    const remainTotal = group.children.reduce((sum, g) => sum + (Number(g.remainingQuantity) || 0), 0);
    const idx = Number(group.key.replace("award", ""));
    const logKey = `award0${idx}`;
    const remain = awardStore.awardLog[logKey] ?? 0;
    if (remainTotal > remain) {
      message.error(`${group.title}下所有礼物的剩余数量总和不能超过奖项剩余数量（${remain}），请检查奖项剩余数量是否正确！`);
      return;
    }
  }
  // 收集所有子节点（礼物）数据，更新prizeStore
  const newPrizeList = localGiftList.value.map(gift => ({
    giftName: gift.giftName,
    giftQuantity: gift.giftQuantity,
    giftLevel: gift.giftLevel,
    giftCategory: gift.giftCategory,
    giftImage: gift.giftImage || null,
    __id: gift.__id,
    remainingQuantity: gift.remainingQuantity
  }));
  prizeStore.setPrizeList(newPrizeList);
  emit("save");
  giftSettingVisible.value = false;
};
const handleCancel = () => {
  giftSettingVisible.value = false;
};

watch(
  () => props.visible,
  newValue => {
    giftSettingVisible.value = newValue;
  }
);
watch(
  () => giftSettingVisible.value,
  val => {
    emit("update:visible", val);
  }
);
</script>

<template>
  <a-modal v-model:open="giftSettingVisible" title="礼物设置" @ok="handleOk" @cancel="handleCancel" width="80%" okText="保存" cancelText="取消">
    <!-- 固定的说明区域 -->
    <div class="desc-wrapper" style="margin-bottom: 16px">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center">
        <span style="margin-right: 8px">📋</span>
        使用说明
      </div>
      <div style="font-size: 12px; line-height: 1.6; opacity: 0.95">
        <div style="margin-bottom: 4px">• <strong>每个奖项必须分配至少一个礼物</strong>，否则该奖项无法正常抽奖。</div>
        <div style="margin-bottom: 4px">• <strong>每个奖项下所有礼物的数量总和不能超过奖项数量</strong>，否则无法保存。</div>
        <div style="margin-bottom: 4px">• <strong>每个礼物的“剩余数量”可手动调整</strong>，保存后生效。</div>
        <div style="margin-bottom: 4px">• <strong>奖项设置变更后务必检查并重新设置礼物</strong>，否则抽奖流程会受影响。</div>
      </div>
    </div>
    <a-table :columns="columns" :dataSource="treeData" :pagination="false" :rowKey="'key'" :scroll="{ y: 350 }" bordered>
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'giftName'">
          <template v-if="record.isAward">
            {{ record.title }}
          </template>
          <template v-else>
            <a-input v-model:value="record.giftName" placeholder="礼物名称" style="width: 150px" />
          </template>
        </template>
        <template v-else-if="column.key === 'giftQuantity'">
          <template v-if="record.isAward">
            <!-- 显示奖项总数量，不可编辑 -->
            {{ record.totalCount }}
          </template>
          <template v-else>
            <a-input-number v-model:value="record.giftQuantity" :min="0" style="width: 150px" />
          </template>
        </template>
        <template v-else-if="column.key === 'remainingQuantity'">
          <template v-if="record.isAward">
            <!-- 奖项行显示awardStore.awardLog中的剩余数量 -->
            {{ getAwardRemainingQuantity(record.key) }}
          </template>
          <template v-else>
            <a-input-number v-model:value="record.remainingQuantity" :min="0" style="width: 150px" />
          </template>
        </template>
        <template v-else-if="column.key === 'action'">
          <template v-if="record.isAward">
            <a-button type="primary" size="small" @click="addGift(record.key)">添加礼物</a-button>
          </template>
          <template v-else>
            <a-button type="link" danger size="small" @click="removeGift(record)">删除</a-button>
          </template>
        </template>
      </template>
    </a-table>
    <div v-for="award in awardStore.awards" :key="award.key" style="color: #888; font-size: 12px; margin-top: 4px">{{ award.label }} 奖项总数：{{ award.count }} / 剩余数量：{{ getAwardRemainCount(award.key) }}</div>
  </a-modal>
</template>

<style scoped></style>
