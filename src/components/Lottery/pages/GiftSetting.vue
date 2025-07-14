<script setup>
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { usePrizeStore } from '@/store/prizeStore';
import { useAwardStore } from '@/store/awardStore';

const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(['update:visible', 'save']);

const giftSettingVisible = ref(false);
const prizeStore = usePrizeStore();
const awardStore = useAwardStore();
const localGiftList = ref([]); // 本地所有礼物列表

// 打开弹窗时初始化本地礼物列表
watch(
  () => giftSettingVisible.value,
  (val) => {
    if (val) {
      localGiftList.value = JSON.parse(JSON.stringify(prizeStore.prizeList));
    }
  }
);

// 构建 treeData 用于表格展示
const treeData = computed(() => {
  return awardStore.awards.map(award => {
    const children = localGiftList.value.filter(gift => gift.giftLevel === award.key)
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
  { title: '名称', dataIndex: 'giftName', key: 'giftName' },
  { title: '数量', dataIndex: 'giftQuantity', key: 'giftQuantity' },
  { title: '操作', dataIndex: 'action', key: 'action' }
];

const addGift = (level) => {
  // 统计该奖项下所有礼物数量之和
  const group = treeData.value.find(g => g.key === level);
  const total = group && group.children
    ? group.children.reduce((sum, g) => sum + (Number(g.giftQuantity) || 0), 0)
    : 0;
  const max = group ? group.totalCount : 0;
  if (total >= max) {
    message.warning('该奖项下所有礼物数量总和已达奖项总数，不能再新增！');
    return;
  }
  // 计算新id
  const maxId = localGiftList.value.length > 0 ? Math.max(...localGiftList.value.map(g => g.__id ?? 0)) : 0;
  // 获取奖项名称
  const award = awardStore.awards.find(a => a.key === level);
  localGiftList.value.push({
    giftLevel: level,
    giftCategory: award ? award.label : '',
    giftName: '',
    giftImage: null,
    giftQuantity: 1,
    __id: maxId + 1,
    remainingQuantity: 1
  });
};
const removeGift = (gift) => {
  const idx = localGiftList.value.findIndex(
    p => p.__id === gift.__id
  );
  if (idx !== -1) localGiftList.value.splice(idx, 1);
};
const getAwardRemainCount = (level) => {
  const idx = Number(level.replace('award', ''));
  const key = `award0${idx}`;
  return awardStore.awardLog[key] ?? 0;
};
const handleOk = () => {
  // 校验逻辑...
  for (const group of treeData.value) {
    const total = group.children.reduce((sum, g) => sum + (Number(g.giftQuantity) || 0), 0);
    const max = group.totalCount;
    if (total > max) {
      message.error(`${group.title}下所有礼物数量总和不能超过奖项剩余数量（${max}）！`);
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
    remainingQuantity: gift.giftQuantity
  }));
  prizeStore.setPrizeList(newPrizeList);
  emit('save');
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
    <a-table
      :columns="columns"
      :dataSource="treeData"
      :pagination="false"
      :rowKey="'key'"
      :scroll="{ y: 500 }"
      bordered
    >
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
    <div v-for="award in awardStore.awards" :key="award.key" style="color: #888; font-size: 12px; margin-top: 4px">
      {{ award.label }} 奖项总数：{{ award.count }} / 剩余数量：{{ getAwardRemainCount(award.key) }}
    </div>
  </a-modal>
</template>

<style scoped></style> 