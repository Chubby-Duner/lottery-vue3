<script setup>
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import { useAwardStore } from "@/store/awardStore";

defineOptions({
  name: "WeightEditor"
});

const props = defineProps({
  visible: Boolean,
  lotteryData: Array
});

const emit = defineEmits(["update:visible", "save", "close", "onOpen", "onClose"]);

const awardStore = useAwardStore();
const weightVisible = ref(false);
// 权重数据副本
const weightData = ref([]);
const searchKeyword = ref("");
const departmentKeyword = ref("");

// 过滤后的数据
const filteredWeightData = computed(() => {
  let filteredData = weightData.value;
  
  // 按姓名过滤
  if (searchKeyword.value) {
    filteredData = filteredData.filter(item => {
      const namezh = item.namezh || "";
      const nameen = item.nameen || "";
      return namezh.includes(searchKeyword.value) || nameen.toLowerCase().includes(searchKeyword.value.toLowerCase());
    });
  }
  
  // 按部门过滤
  if (departmentKeyword.value) {
    filteredData = filteredData.filter(item => {
      const department = item.department || "";
      return department.includes(departmentKeyword.value);
    });
  }
  
  return filteredData;
});

// 分页配置
const paginationConfig = ref({
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ["5", "10", "20", "50"],
  size: "small"
});

// 动态生成表格列
const columns = computed(() => {
  const baseColumns = [
    {
      title: "姓名",
      key: "name",
      width: 160,
      fixed: "left"
    }
  ];

  // 动态添加奖项列
  awardStore.awards.forEach((award, index) => {
    baseColumns.push({
      title: `${award.label}权重`,
      key: `award${index + 1}`,
      width: 120,
      align: "center"
    });
  });

  // 添加锁定列
  baseColumns.push({
    title: "锁定",
    key: "locked",
    width: 80,
    align: "center"
  });

  return baseColumns;
});

// 监听数据变化，创建副本
watch(
  () => props.lotteryData,
  newData => {
    if (newData && newData.length > 0) {
      weightData.value = newData.map(item => {
        // 确保权重数据结构包含所有奖项
        const awardWeights = { ...item.awardWeights };
        awardStore.awards.forEach((award, index) => {
          const key = index + 1;
          if (!(key in awardWeights)) {
            awardWeights[key] = 1; // 默认权重为1
          }
        });

        return {
          ...item,
          awardWeights
        };
      });
    }
  },
  { immediate: true }
);

// 监听奖项变化，更新权重数据结构
watch(
  () => awardStore.awards,
  () => {
    if (weightData.value.length > 0) {
      weightData.value = weightData.value.map(item => {
        const awardWeights = { ...item.awardWeights };
        // 确保包含所有奖项的权重
        awardStore.awards.forEach((award, index) => {
          const key = index + 1;
          if (!(key in awardWeights)) {
            awardWeights[key] = 1; // 默认权重为1
          }
        });

        return {
          ...item,
          awardWeights
        };
      });
    }
  },
  { deep: true }
);

watch(
  () => props.visible,
  newValue => {
    weightVisible.value = newValue;
    if (newValue) {
      // 重置状态
      searchKeyword.value = "";
      departmentKeyword.value = "";
      resetPagination();
      emit("onOpen");
    } else {
      emit("onClose");
    }
  }
);

watch(
  () => weightVisible.value,
  val => {
    emit("update:visible", val);
  }
);

// 权重变更处理
const handleWeightChange = () => {
  // 权重变更时自动保存到副本
};

// 重置所有权重为0
const resetAllWeights = () => {
  weightData.value.forEach(item => {
    const awardWeights = {};
    awardStore.awards.forEach((award, index) => {
      awardWeights[index + 1] = 0;
    });
    item.awardWeights = awardWeights;
  });
  message.success("已重置所有权重为0");
};

// 设置默认权重为1
const setDefaultWeights = () => {
  weightData.value.forEach(item => {
    const awardWeights = {};
    awardStore.awards.forEach((award, index) => {
      awardWeights[index + 1] = 1;
    });
    item.awardWeights = awardWeights;
  });
  message.success("已设置默认权重为1");
};

// 保存设置
const handleOk = () => {
  // 将修改后的数据传回父组件
  const updatedData = weightData.value.map(item => ({
    ...item,
    awardWeights: { ...item.awardWeights }
  }));

  emit("save", updatedData);
  weightVisible.value = false;
  message.success("权重设置已保存");
};

// 取消编辑
const handleCancel = () => {
  weightVisible.value = false;
  emit("close");
};

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
</script>

<template>
  <a-modal v-model:open="weightVisible" title="权重设置" width="80%" :footer="null" @ok="handleOk" @cancel="handleCancel">
    <div class="weight-editor">
      <!-- 固定的说明区域 -->
      <div class="desc-wrapper" style="margin-bottom: 16px">
        <div class="desc-title">
          <span style="margin-right: 8px">⚖️</span>
          权重说明
        </div>
        <div>
          <div style="margin-bottom: 4px">• <strong>有锁定人时</strong>：只从锁定人中抽取</div>
          <div style="margin-bottom: 4px">• <strong>没有锁定人时</strong>：按权重抽奖</div>
          <div style="margin-bottom: 4px">• <strong>权重越大</strong>：中奖概率越高</div>
          <div style="margin-bottom: 4px">• <strong>权重为0</strong>：不参与该奖项抽奖</div>
          <div>• <strong>所有权重为0</strong>：提示无法抽奖</div>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
        <a-input-search v-model:value="searchKeyword" placeholder="请输入姓名进行搜索" allowClear style="width: 240px" />
        <a-input-search v-model:value="departmentKeyword" placeholder="请输入部门进行搜索" allowClear style="width: 240px" />
      </div>

      <!-- 表格区域 -->
      <a-table :dataSource="filteredWeightData" :columns="columns" :pagination="paginationConfig" size="small" bordered :scroll="{ y: 500 }" style="border-radius: 8px; overflow: hidden; margin-bottom: 16px" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="person-info">
              <div class="person-name">{{ record.namezh }}</div>
              <div class="person-en">{{ record.nameen }}</div>
              <div class="person-en">{{ record.department }}</div>
            </div>
          </template>

          <template v-else-if="column.key.startsWith('award')">
            <a-input-number v-model:value="record.awardWeights[column.key.replace('award', '')]" :min="0" :max="100" style="width: 80px; border-radius: 4px" @change="handleWeightChange" />
          </template>
          <template v-else-if="column.key === 'locked'">
            <a-switch v-model:checked="record.locked" size="small" style="border-radius: 12px" />
          </template>
        </template>
      </a-table>

      <!-- 固定的按钮区域 -->
      <div style="text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef">
        <a-space size="middle">
          <a-button @click="resetAllWeights" style="border-radius: 6px">
            <template #icon>🔄</template>
            重置所有权重
          </a-button>
          <a-button @click="setDefaultWeights" style="border-radius: 6px">
            <template #icon>⚙️</template>
            设置默认权重
          </a-button>
          <a-button type="primary" @click="handleOk" style="border-radius: 6px">
            <template #icon>💾</template>
            保存设置
          </a-button>
          <a-button @click="handleCancel" style="border-radius: 6px">
            <template #icon>❌</template>
            取消
          </a-button>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.person-info {
  text-align: left;
  padding: 4px 0;
}

.person-name {
  font-weight: bold;
  color: #333;
  font-size: 13px;
  line-height: 1.4;
}

.person-en {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
  line-height: 1.2;
}
</style>
