<script setup>
import { ref, computed, watch } from "vue";
import * as XLSX from "xlsx";
import { message } from "ant-design-vue";
import { UploadOutlined, CheckCircleOutlined } from "@ant-design/icons-vue";

defineOptions({
  name: "UploadExcel"
});

/* ========== 组件 Props 和 Emits ========== */
const props = defineProps({
  visible: Boolean, // 是否显示导入弹窗
  beforeUpload: Function, // 上传前的校验函数
  onSuccess: Function // 解析成功后的回调
});

const emit = defineEmits(["update:visible"]);

/* ========== 状态管理 ========== */
// 模态框状态
const importModal = ref(false);
const previewData = ref(false); // 是否显示预览弹窗

// 上传状态
const loading = ref(false);
const status = ref("idle"); // idle|parsing|success|error
const progress = ref(0); // 进度百分比
const progressStatus = ref("normal");
const errorMessage = ref("");

// Excel 数据
const excelData = ref({
  header: null, // 表头
  results: null // 表格数据
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

/* ========== 计算属性 ========== */
// 表格数据（添加唯一key）
const tableData = computed(() => {
  return (excelData.value.results || []).map((item, index) => ({
    ...item,
    __id: index // 添加唯一标识用于表格渲染
  }));
});

// 预览表格的列配置
const previewColumns = computed(() => {
  if (!excelData.value.header) return [];

  return excelData.value.header.map(key => ({
    title: key,
    dataIndex: key,
    key: key,
    ellipsis: true,
    align: "center",
    customCell: record => {
      const text = record[key];
      const style = {};
      if (text == null) {
        style.color = "#ccc";
        style.fontStyle = "italic";
      } else if (typeof text === "number") {
        style.textAlign = "center";
      }
      return { style };
    },
    customRender: ({ text }) => {
      if (text == null) return "空值";
      if (typeof text === "number") return text.toLocaleString();
      return text;
    }
  }));
});

/* ========== 核心方法 ========== */
// 生成最终数据
const generateData = () => {
  message.success(`成功导入 ${tableData.value.length} 条数据`);
  props.onSuccess?.(excelData.value);
};

// 解析Excel文件
const parseExcel = rawFile => {
  loading.value = true;

  // 模拟进度条
  const timer = setInterval(() => {
    progress.value = Math.min(progress.value + 10, 90);
  }, 100);

  const reader = new FileReader();
  reader.onload = e => {
    clearInterval(timer);
    progress.value = 100;

    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const header = getHeaderRow(firstSheet);
      const results = XLSX.utils.sheet_to_json(firstSheet);

      if (!results.length) throw new Error("文件没有包含有效数据");

      // generateData({ header, results })
      excelData.value.header = header;
      excelData.value.results = results;
      status.value = "success";
      errorMessage.value = "";
    } catch (err) {
      showError(`解析失败: ${err.message}`);
    } finally {
      loading.value = false;
    }
  };

  reader.onerror = () => {
    clearInterval(timer);
    showError("文件读取失败");
    loading.value = false;
  };

  reader.readAsArrayBuffer(rawFile);
};

// 获取表头行
const getHeaderRow = sheet => {
  const headers = [];
  const range = XLSX.utils.decode_range(sheet["!ref"]);

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ c: col, r: range.s.r })];
    let header = `列${col + 1}`;
    if (cell && cell.t) header = XLSX.utils.format_cell(cell);
    headers.push(header);
  }

  return headers;
};

/* ========== 事件处理 ========== */
// 拖放相关
const handleDrop = e => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length !== 1) return showError("请上传单个文件");
  processFile(files[0]);
};

const handleDragover = e => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
};

// 点击上传
const handleClick = e => {
  const file = e.file;
  const rawFile = file.originFileObj;
  if (!rawFile) return;

  resetStatus();
  status.value = "parsing";
  processFile(rawFile);
};

// 处理文件上传
const processFile = rawFile => {
  if (!isExcel(rawFile)) return showError("仅支持.xlsx, .xls 格式文件");
  if (props.beforeUpload && !props.beforeUpload(rawFile)) return;
  parseExcel(rawFile);
};

// 确认导入
const confirmImport = () => {
  generateData();
  closeImportModal();
};

/* ========== 工具方法 ========== */
const isExcel = file => /\.(xlsx|xls)$/i.test(file.name);

const showError = msg => {
  status.value = "error";
  errorMessage.value = msg;
  message.error(msg);
};

const resetStatus = () => {
  progress.value = 0;
  errorMessage.value = "";
};

// 重置所有状态
const resetAll = () => {
  status.value = "idle";
  progress.value = 0;
  errorMessage.value = "";
  excelData.value = { header: null, results: null };
  previewData.value = false;
  loading.value = false;
  // 重置分页状态
  resetPagination();
};

// 关闭导入窗口
const closeImportModal = () => {
  resetAll();
  importModal.value = false;
};

/* ========== 监听器 ========== */
watch(
  () => props.visible,
  newValue => {
    importModal.value = newValue;
    if (newValue) {
      resetAll();
    }
  }
);

watch(
  () => importModal.value,
  val => {
    emit("update:visible", val);
  }
);

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
  <!-- 主导入模态框 -->
  <a-modal v-model:open="importModal" title="导入数据" width="50%" :footer="null" :maskClosable="false" @cancel="closeImportModal">
    <div class="excel-uploader">
      <!-- 拖拽区域 -->
      <div class="drop-area" @drop.prevent="handleDrop" @dragover.prevent="handleDragover">
        <upload-outlined class="upload-icon" />
        <div class="upload-text">
          拖拽Excel文件到此处或
          <a-upload accept=".xlsx,.xls" :showUploadList="false" @change="handleClick">
            <a-button type="primary" size="small">点击上传</a-button>
          </a-upload>
        </div>
        <div class="upload-hint">支持.xlsx, .xls 格式文件</div>
      </div>

      <!-- 状态显示区 -->
      <div v-if="status !== 'idle'" class="status-area">
        <a-progress v-if="status === 'parsing'" :percent="progress" :status="progressStatus" stroke-color="#1890ff" />

        <a-alert v-if="status === 'error'" :message="errorMessage" type="error" show-icon closable />

        <div v-if="status === 'success'" class="success-area">
          <a-tag color="green">
            <template #icon><check-circle-outlined /></template>
            成功解析 {{ tableData.length }} 条数据
          </a-tag>
          <a-button type="link" size="small" @click="previewData = true" v-if="tableData.length > 0">查看详情</a-button>
        </div>
      </div>
    </div>
  </a-modal>

  <!-- 数据预览模态框 -->
  <a-modal v-model:open="previewData" title="数据预览" width="80%" :footer="null" :maskClosable="false" style="top: 60px">
    <!-- 固定的说明区域 -->
    <div style="margin-bottom: 16px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center">
        <span style="margin-right: 8px">📊</span>
        数据预览说明
      </div>
      <div style="font-size: 12px; line-height: 1.6; opacity: 0.95">
        <div style="margin-bottom: 4px">
          • <strong>共 {{ tableData.length }} 条记录</strong>：请仔细检查数据是否正确
        </div>
        <div style="margin-bottom: 4px">• <strong>空值显示</strong>：空单元格会显示为"空值"</div>
        <div style="margin-bottom: 4px">• <strong>数字格式</strong>：数字会自动格式化显示</div>
        <div>• <strong>确认导入</strong>：确认无误后点击"确认导入"按钮</div>
      </div>
    </div>

    <!-- 表格区域 -->
    <a-table :dataSource="tableData" :columns="previewColumns" bordered size="small" :scroll="{ x: 'max-content', y: 300 }" :pagination="paginationConfig" rowKey="__id" style="border-radius: 8px; overflow: hidden; margin-bottom: 16px" @change="handleTableChange">
      <template #emptyText>
        <a-empty description="没有可显示的数据" />
      </template>
    </a-table>

    <!-- 固定的按钮区域 -->
    <div style="text-align: center; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef">
      <a-space size="middle">
        <a-button type="primary" @click="confirmImport" :loading="loading" style="border-radius: 6px">
          <template #icon>✅</template>
          确认导入
        </a-button>
        <a-button @click="previewData = false" style="border-radius: 6px">
          <template #icon>❌</template>
          取消
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<style scoped>
.excel-uploader {
  max-width: 600px;
  margin: 0 auto;
}

.drop-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.drop-area:hover {
  border-color: #1890ff;
}

.upload-icon {
  font-size: 48px;
  color: #1890ff;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.upload-hint {
  color: #999;
  font-size: 12px;
}

.status-area {
  margin-top: 20px;
}

.success-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}
</style>
