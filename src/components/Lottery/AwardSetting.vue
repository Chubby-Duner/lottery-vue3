<template>
  <a-modal
    v-model:open="settingVisible"
    title="奖项设置"
    width="500px"
    @ok="handleOk"
    @cancel="handleCancel"
    okText="保存"
    cancelText="取消"
  >
    <a-table
      :dataSource="localAwards"
      :pagination="false"
      :columns="columns"
      rowKey="key"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'label'">
          <a-input v-model:value="record.label" />
        </template>
        <template v-else-if="column.key === 'count'">
          <a-input-number v-model:value="record.count" :min="1" :max="99" />
        </template>
        <template v-else-if="column.key === 'action'">
          <a-popconfirm
            title="确定删除该奖项？"
            okText="删除"
            okType="danger"
            cancelText="取消"
            @confirm="removeAward(index)"
          >
            <a-button type="link" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    <div style="margin-top: 16px; text-align: center">
      <a-button type="dashed" @click="addAward">添加奖项</a-button>
      <a-button type="dashed" class="margin-left10" @click="resetAwardCounts">重置奖项个数</a-button>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { useAwardStore } from "@/store/awardStore";

defineOptions({
  name: "AwardSetting",
});

const props = defineProps({
  visible: Boolean,
  awards: Array,
});
const emit = defineEmits(["update:visible", "save"]);

const awardStore = useAwardStore();
const settingVisible = ref(false);
const localAwards = ref([]);
watch(
  () => props.awards,
  (val) => {
    localAwards.value = val.map((item) => ({ ...item }));
  },
  { immediate: true }
);

const columns = [
  { title: "奖项名称", key: "label", dataIndex: "label", width: 120 },
  { title: "数量", key: "count", dataIndex: "count", width: 80 },
  { title: "操作", key: "action", width: 80 },
];

// 新增
const addAward = () => {
  const idx = localAwards.value.length + 1;
  localAwards.value.push({
    key: `award${idx}`,
    label: `新奖项${idx}`,
    count: 1,
  });
};

// 删除
const removeAward = (index) => {
  localAwards.value.splice(index, 1);
};

// 重置
const resetAwardCounts = () => {
  awardStore.resetAwardCounts();
  message.success("奖项个数已重置");
};

const handleOk = () => {
  emit(
    "save",
    localAwards.value.map((item) => ({ ...item }))
  );
  settingVisible.value = false;
};

const handleCancel = () => {
  settingVisible.value = false;
};

watch(
  () => props.visible,
  (newValue) => {
    settingVisible.value = newValue;
  }
);

watch(
  () => settingVisible.value,
  (val) => {
    emit("update:visible", val);
  }
);
</script>

<style scoped></style>
