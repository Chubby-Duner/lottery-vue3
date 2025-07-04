<script setup>
import { ref, computed, watch } from "vue";
import { message } from "ant-design-vue";

const props = defineProps({
  visible: Boolean,
  lotteryData: Array,
});

const emit = defineEmits(["update:visible", "save"]);

const weightVisible = ref(false);
// 权重数据副本
const weightData = ref([]);

// 监听数据变化，创建副本
watch(
  () => props.lotteryData,
  (newData) => {
    if (newData && newData.length > 0) {
      weightData.value = newData.map((item) => ({
        ...item,
        awardWeights: { ...item.awardWeights },
      }));
    }
  },
  { immediate: true }
);

watch(
  () => props.visible,
  (newValue) => {
    weightVisible.value = newValue;
  }
);

watch(
  () => weightVisible.value,
  (val) => {
    emit("update:visible", val);
  }
);

// 表格列定义
const columns = [
  {
    title: "姓名",
    key: "name",
    width: 150,
    fixed: "left",
  },
  {
    title: "一等奖权重",
    key: "award1",
    width: 120,
    align: "center",
  },
  {
    title: "二等奖权重",
    key: "award2",
    width: 120,
    align: "center",
  },
  {
    title: "三等奖权重",
    key: "award3",
    width: 120,
    align: "center",
  },
  {
    title: "纪念奖权重",
    key: "award4",
    width: 120,
    align: "center",
  },
  {
    title: "锁定",
    key: "locked",
    width: 80,
    align: "center",
  },
];

// 权重变更处理
const handleWeightChange = () => {
  // 权重变更时自动保存到副本
};

// 重置所有权重为0
const resetAllWeights = () => {
  weightData.value.forEach((item) => {
    item.awardWeights = { 1: 0, 2: 0, 3: 0, 4: 0 };
  });
  message.success("已重置所有权重为0");
};

// 设置默认权重为1
const setDefaultWeights = () => {
  weightData.value.forEach((item) => {
    item.awardWeights = { 1: 1, 2: 1, 3: 1, 4: 1 };
  });
  message.success("已设置默认权重为1");
};

// 保存设置
const handleOk = () => {
  // 将修改后的数据传回父组件
  const updatedData = weightData.value.map((item) => ({
    ...item,
    awardWeights: { ...item.awardWeights },
  }));

  emit("save", updatedData);
  weightVisible.value = false;
  message.success("权重设置已保存");
};

// 取消编辑
const handleCancel = () => {
  weightVisible.value = false;
};
</script>

<template>
  <a-modal
    v-model:open="weightVisible"
    title="权重设置"
    width="600"
    :footer="null"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="weight-editor">
      <a-alert
        message="权重说明"
        description="有锁定人时只从锁定人中抽取。没有锁定人时按权重抽奖。权重越大，中奖概率越高。权重为0表示不参与该奖项抽奖。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-table
        :dataSource="weightData"
        :columns="columns"
        :pagination="false"
        size="small"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="person-info">
              <div class="person-name">{{ record.namezh }}</div>
              <div class="person-en">{{ record.nameen }}</div>
            </div>
          </template>

          <template v-else-if="column.key.startsWith('award')">
            <a-input-number
              v-model:value="
                record.awardWeights[column.key.replace('award', '')]
              "
              :min="0"
              :max="100"
              size="small"
              style="width: 80px"
              @change="handleWeightChange"
            />
          </template>
          <template v-else-if="column.key === 'locked'">
            <a-switch v-model:checked="record.locked" />
          </template>
        </template>
      </a-table>

      <div class="weight-actions" style="margin-top: 16px; text-align: center">
        <a-space>
          <a-button @click="resetAllWeights">重置所有权重</a-button>
          <a-button @click="setDefaultWeights">设置默认权重</a-button>
          <a-button type="primary" @click="handleOk">保存设置</a-button>
          <a-button @click="handleCancel">取消</a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.weight-editor {
  max-height: 500px;
  overflow-y: auto;
}

.person-info {
  text-align: left;
}

.person-name {
  font-weight: bold;
  color: #333;
}

.person-en {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.weight-actions {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}
</style>
