<script setup>
import { ref, computed, watch, nextTick } from "vue";
import * as XLSX from "xlsx";
import { message } from "ant-design-vue";
import { UploadOutlined, CheckCircleOutlined } from "@ant-design/icons-vue";
import { isExcel } from "@/composables/utils";
import { readFileAsArrayBuffer, getHeaderRow, handleImageError } from "@/composables/uploadExcel/uploadUtils";
import { extractImagesFromExcel, mergeImagesWithData } from "@/composables/uploadExcel/excelImageExtract";

// ========== 组件配置 ==========
defineOptions({
  name: "UploadExcel"
});

// ========== 组件 Props 和 Emits ==========
const props = defineProps({
  visible: Boolean, // 是否显示导入弹窗
  beforeUpload: Function, // 上传前的校验函数
  onSuccess: Function // 解析成功后的回调
});
const emit = defineEmits(["update:visible"]);

// ========== 状态管理 ==========
const importModal = ref(false); // 导入弹窗显示状态
const previewData = ref(false); // 预览弹窗显示状态
const loading = ref(false); // 加载状态
const status = ref("idle"); // idle|parsing|success|error
const errorMessage = ref(""); // 错误信息
const excelData = ref({ header: null, results: null }); // Excel数据
const paginationConfig = ref({
  // 分页配置
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ["5", "10", "20", "50"],
  size: "small"
});
const titleMap = {
  namezh: "名称",
  wish: "愿望",
  image: "头像"
};

// ========== 计算属性 ==========
// 表格数据（添加唯一key）
const tableData = computed(() => {
  return (excelData.value.results || []).map((item, index) => ({ ...item, __id: index }));
});

// 是否包含图片
const hasImages = computed(() => {
  return tableData.value.some(item => {
    return Object.keys(item).some(key => {
      const value = item[key];
      return value && typeof value === "object" && value.dataUrl;
    });
  });
});

// 预览表格的列配置
const previewColumns = computed(() => {
  if (!excelData.value.header) return [];
  return excelData.value.header
    .filter(key => key !== "nameen") // 过滤掉 nameen 字段
    .map(key => ({
      title: titleMap[key] || key, // 中文表头
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
      }
    }));
});

// ========== 核心方法 ==========
// 生成最终数据并回调
const generateData = () => {
  message.success(`成功导入 ${tableData.value.length} 条数据`);
  props.onSuccess?.(excelData.value);
};

// 解析Excel文件，提取图片并合并数据
const parseExcel = async rawFile => {
  loading.value = true;
  status.value = "parsing";
  try {
    // 解析Excel（异步，主线程不阻塞UI）
    let imageList = [];
    let implantBlobList = [];
    try {
      const imageResult = await extractImagesFromExcel(rawFile);
      imageList = imageResult.imageList;
      implantBlobList = imageResult.implantBlobList;
    } catch (imageErr) {
      console.warn("图片提取失败，继续处理数据:", imageErr);
    }
    const data = await readFileAsArrayBuffer(rawFile);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const header = getHeaderRow(firstSheet);
    const results = XLSX.utils.sheet_to_json(firstSheet);
    if (!results.length) throw new Error("文件没有包含有效数据");
    const resultsWithImages = mergeImagesWithData(results, imageList, implantBlobList);
    excelData.value.header = header;
    excelData.value.results = resultsWithImages;
    status.value = "success";
    errorMessage.value = "";
  } catch (err) {
    showError(`解析失败: ${err.message}`);
  } finally {
    loading.value = false;
  }
};

// ========== 事件处理 ==========

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

// 工具方法：错误提示
const showError = msg => {
  status.value = "error";
  errorMessage.value = msg;
  message.error(msg);
};

// 工具方法：重置上传状态
const resetStatus = () => {
  errorMessage.value = "";
};

// 重置所有状态
const resetAll = () => {
  status.value = "idle";
  errorMessage.value = "";
  excelData.value = { header: null, results: null };
  previewData.value = false;
  loading.value = false;
  resetPagination();
};

// 关闭导入窗口
const closeImportModal = () => {
  resetAll();
  importModal.value = false;
};

// ========== 监听器 ==========
// 监听外部visible变化，重置状态
watch(
  () => props.visible,
  newValue => {
    importModal.value = newValue;
    if (newValue) {
      resetAll();
    }
  }
);
// 监听内部modal变化，通知父组件
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
      <!-- 上传说明区域 -->
      <div class="desc-wrapper">
        <div class="desc-title">
          <span style="margin-right: 8px">📥</span>
          上传说明
        </div>
        <div>
          <div style="margin-bottom: 4px">• <strong>有图片</strong>：图片会自动提取并在预览和导入后显示，支持Excel嵌入图片（仅.xlsx）</div>
          <div style="margin-bottom: 4px">• <strong>无图片</strong>：仅导入文本、数字等普通数据，图片列为空</div>
          <div>• <strong>建议</strong>：如需导入图片，请确保图片已嵌入Excel单元格</div>
        </div>
      </div>
      <!-- 拖拽区域 -->
      <a-upload-dragger accept=".xlsx,.xls" :showUploadList="false" :customRequest="() => {}" @change="handleClick">
        <upload-outlined class="upload-icon" />
        <div class="upload-text">拖拽Excel文件到此处或点击上传</div>
        <div class="upload-hint">支持.xlsx, .xls 格式文件，图片功能仅支持.xlsx格式(图片要嵌入到单元格中)</div>
      </a-upload-dragger>
      <!-- 状态显示区 -->
      <div v-if="status !== 'idle'" class="status-area">
        <div v-if="status === 'parsing'" class="upload-spin">
          <a-spin tip="正在解析Excel，请稍候..." />
        </div>
        <a-alert v-if="status === 'error'" :message="errorMessage" type="error" show-icon closable />
        <div v-if="status === 'success'" class="success-area">
          <a-tag color="green">
            <template #icon><check-circle-outlined /></template>
            成功解析 {{ tableData.length }} 条数据
            <span v-if="hasImages" style="margin-left: 8px; color: #52c41a"> (包含图片) </span>
          </a-tag>
          <a-button type="link" size="small" @click="previewData = true" v-if="tableData.length > 0">查看详情</a-button>
        </div>
      </div>
    </div>
  </a-modal>
  <!-- 数据预览模态框 -->
  <a-modal v-model:open="previewData" title="数据预览" width="80%" :footer="null" :maskClosable="false" style="top: 60px">
    <!-- 固定的说明区域 -->
    <div class="desc-wrapper">
      <div class="desc-title">
        <span style="margin-right: 8px">📊</span>
        数据预览说明
      </div>
      <div>
        <div style="margin-bottom: 4px">
          • <strong>共 {{ tableData.length }} 条记录</strong>：请仔细检查数据是否正确
        </div>
        <div style="margin-bottom: 4px">• <strong>空值显示</strong>：空单元格会显示为"空值"，图片列为空值后期抽奖时就会展示名称</div>
        <div style="margin-bottom: 4px">• <strong>数字格式</strong>：数字会自动格式化显示</div>
        <div style="margin-bottom: 4px">• <strong>图片支持</strong>：Excel中的图片会自动提取并显示</div>
        <div>• <strong>确认导入</strong>：确认无误后点击"确认导入"按钮</div>
      </div>
    </div>
    <!-- 表格区域 -->
    <a-table :dataSource="tableData" :columns="previewColumns" bordered size="small" :scroll="{ x: 'max-content', y: 500 }" :pagination="paginationConfig" rowKey="__id" style="border-radius: 8px; overflow: hidden; margin-bottom: 16px" @change="handleTableChange">
      <template #emptyText>
        <a-empty description="没有可显示的数据" />
      </template>
      <template #bodyCell="{ column, text, record }">
        <div v-if="text && typeof text === 'object' && text.dataUrl">
          <img :src="text.dataUrl" class="table-cell-img" alt="Excel图片" @error="handleImageError" />
        </div>
        <span v-else-if="text == null">空值</span>
        <span v-else-if="typeof text === 'number'">{{ text.toLocaleString() }}</span>
        <span v-else>{{ text }}</span>
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

<style lang="scss" scoped>
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

.success-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.table-cell-img {
  max-width: 60px;
  max-height: 60px;
  object-fit: contain;
  border-radius: 4px;
  display: block;
  margin: 0 auto;
}
</style>
