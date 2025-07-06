<script setup>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { useAwardStore } from "@/store/awardStore";

defineOptions({
  name: "AwardSetting"
});

const props = defineProps({
  visible: Boolean,
  awards: Array
});
const emit = defineEmits(["update:visible", "save"]);

const awardStore = useAwardStore();
const settingVisible = ref(false);
const localAwards = ref([]);

// 计算实际的剩余数量
const getRemainingCount = awardKey => {
  const idx = awardStore.awards.findIndex(a => a.key === awardKey);
  if (idx === -1) return 0;
  const awardLogKey = `award0${idx + 1}`;
  return awardStore.awardLog[awardLogKey] || 0;
};

// 创建包含剩余数量的奖项数据
const createAwardsWithRemaining = () => {
  return props.awards.map(item => ({
    ...item,
    remainingCount: getRemainingCount(item.key),
    originalCount: item.count // 保留原始数量用于重置
  }));
};

// 分页配置
const paginationConfig = ref({
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ["5", "10", "20", "50"],
  size: "small"
});

// 分页事件处理
const handleTableChange = pagination => {
  paginationConfig.value.pageSize = pagination.pageSize;
  paginationConfig.value.current = pagination.current;
};

// 重置分页状态
const resetPagination = () => {
  paginationConfig.value.pageSize = 10;
  paginationConfig.value.current = 1;
};

// 监听数据变化，创建副本
watch(
  () => props.awards,
  val => {
    localAwards.value = createAwardsWithRemaining();
  },
  { immediate: true }
);

const columns = [
  { title: "奖项名称", key: "label", dataIndex: "label", width: 120 },
  { title: "原始数量", key: "originalCount", dataIndex: "originalCount", width: 80 },
  { title: "剩余数量", key: "remainingCount", dataIndex: "remainingCount", width: 100 },
  { title: "操作", key: "action", width: 80 }
];

// 新增
const addAward = () => {
  const idx = localAwards.value.length + 1;
  const newAward = {
    key: `award${idx}`,
    label: `新奖项${idx}`,
    count: 1,
    originalCount: 1,
    remainingCount: 1
  };
  localAwards.value.push(newAward);
};

// 删除
const removeAward = index => {
  localAwards.value.splice(index, 1);
};

// 重置
const resetAwardCounts = () => {
  awardStore.resetAwardCounts();
  // 更新本地数据
  localAwards.value = createAwardsWithRemaining();
  message.success("奖项剩余数量已重置为原始设置，中奖名单已保留");
};

// 手动设置剩余数量
const setRemainingCounts = () => {
  // 验证剩余数量不超过原始数量
  const invalidItems = localAwards.value.filter(item => item.remainingCount > item.originalCount);
  if (invalidItems.length > 0) {
    message.error(`剩余数量不能超过原始数量：${invalidItems.map(item => item.label).join(", ")}`);
    return;
  }

  const newLog = { ...awardStore.awardLog };
  localAwards.value.forEach((item, idx) => {
    const key = `award0${idx + 1}`;
    newLog[key] = item.remainingCount;
  });
  awardStore.setAwardLog(newLog);
  message.success("剩余数量已手动更新");
};

const handleOk = () => {
  // 验证剩余数量不超过原始数量
  const invalidItems = localAwards.value.filter(item => item.remainingCount > item.originalCount);
  if (invalidItems.length > 0) {
    message.error(`剩余数量不能超过原始数量：${invalidItems.map(item => item.label).join(", ")}`);
    return;
  }

  // 更新奖项数据，使用原始数量作为count
  const newAwards = localAwards.value.map(item => ({
    key: item.key,
    label: item.label,
    count: item.originalCount // 使用原始数量
  }));
  emit("save", newAwards);

  // 同时更新剩余数量
  const newLog = { ...awardStore.awardLog };
  localAwards.value.forEach((item, idx) => {
    const key = `award0${idx + 1}`;
    newLog[key] = item.remainingCount;
  });
  awardStore.setAwardLog(newLog);

  settingVisible.value = false;
  message.success("奖项设置已保存");
};

const handleCancel = () => {
  settingVisible.value = false;
  // 取消时重新加载原始数据，丢弃所有未保存的修改
  localAwards.value = createAwardsWithRemaining();
};

watch(
  () => props.visible,
  newValue => {
    settingVisible.value = newValue;
    if (newValue) {
      // 每次打开时重新计算剩余数量
      localAwards.value = createAwardsWithRemaining();
      // 重置分页状态
      resetPagination();
    }
  }
);

watch(
  () => settingVisible.value,
  val => {
    emit("update:visible", val);
  }
);
</script>

<template>
  <a-modal v-model:open="settingVisible" title="奖项设置" width="80%" @ok="handleOk" @cancel="handleCancel" okText="保存" cancelText="取消">
    <!-- 固定的说明区域 -->
    <div style="margin-bottom: 16px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center">
        <span style="margin-right: 8px">📋</span>
        使用说明
      </div>
      <div style="font-size: 12px; line-height: 1.6; opacity: 0.95">
        <div style="margin-bottom: 4px">• <strong>原始数量</strong>：奖项的初始设置数量（可编辑）</div>
        <div style="margin-bottom: 4px">• <strong>剩余数量</strong>：当前可抽奖的数量（可编辑，不能超过原始数量）</div>
        <div style="margin-bottom: 4px">• <strong>重置剩余数量</strong>：将所有奖项剩余数量恢复为原始设置</div>
        <div>• <strong>手动设置剩余数量</strong>：保存当前表格中的剩余数量设置</div>
      </div>
    </div>

    <!-- 表格区域 -->
    <a-table :dataSource="localAwards" :pagination="paginationConfig" :columns="columns" rowKey="key" size="small" bordered :scroll="{ y: 300 }" style="border-radius: 8px; overflow: hidden; margin-bottom: 16px" @change="handleTableChange">
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'label'">
          <a-input v-model:value="record.label" style="border-radius: 4px" />
        </template>
        <template v-else-if="column.key === 'originalCount'">
          <a-input-number v-model:value="record.originalCount" :min="1" :max="99" style="border-radius: 4px; width: 80px" />
        </template>
        <template v-else-if="column.key === 'remainingCount'">
          <a-input-number
            v-model:value="record.remainingCount"
            :min="0"
            :max="record.originalCount"
            style="width: 80px; border-radius: 4px"
            :style="{
              color: record.remainingCount === 0 ? '#ff4d4f' : '#52c41a',
              fontWeight: record.remainingCount === 0 ? 'bold' : 'normal'
            }"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <a-popconfirm title="确定删除该奖项？" okText="删除" okType="danger" cancelText="取消" @confirm="removeAward(index)">
            <a-button type="link" danger style="padding: 4px 8px; border-radius: 4px"> 🗑️ 删除 </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 固定的按钮区域 -->
    <div style="text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef">
      <a-space size="middle">
        <a-button type="primary" @click="addAward" style="border-radius: 6px">
          <template #icon>➕</template>
          添加奖项
        </a-button>
        <a-button @click="resetAwardCounts" style="border-radius: 6px">
          <template #icon>🔄</template>
          重置剩余数量
        </a-button>
        <a-button @click="setRemainingCounts" style="border-radius: 6px">
          <template #icon>✏️</template>
          手动设置剩余数量
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<style scoped></style>
