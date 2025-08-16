<script setup>
import { watch } from "vue";
import { UploadOutlined, CheckCircleOutlined } from "@ant-design/icons-vue";
import { useExcelImport } from "@/composables/uploadExcel/useExcelImport";

defineOptions({
  name: "UploadExcel"
});

const props = defineProps({
  visible: Boolean, // 是否显示导入弹窗
  beforeUpload: Function, // 上传前的校验函数
  onSuccess: Function // 解析成功后的回调
});

const emit = defineEmits(["update:visible"]);

const titleMap = {
  namezh: "名称",
  wish: "愿望",
  department: "部门",
  image: "头像"
};

const { importModal, previewData, loading, status, errorMessage, tableData, hasImages, previewColumns, paginationConfig, handleClick, confirmImport, closeImportModal, handleTableChange, resetAll } = useExcelImport({
  fieldFilter: key => key !== "nameen",
  titleMap,
  beforeUpload: props.beforeUpload,
  onSuccess: data => props.onSuccess?.(data),
  resultType: "excel"
});

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

watch(
  () => importModal.value,
  val => {
    emit("update:visible", val);
  }
);
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
        <a-alert v-if="status === 'error'" :message="errorMessage" type="error" show-icon closable class="margin-top10" />
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
          <img :src="text.dataUrl" class="table-cell-img" alt="Excel图片" />
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
