<script setup>
import { ref, computed } from "vue";
import * as ExcelJS from "exceljs";
import { UploadOutlined } from "@ant-design/icons-vue";

defineOptions({
  name: "ExcelImport"
});

// 状态管理
const status = ref("idle"); // idle | parsing | success | error
const progress = ref(0);
const progressStatus = ref("normal");
const errorMessage = ref("");
const previewData = ref(false);
const loading = ref(false);

// 数据存储
const tableData = ref([]);
const headers = ref([]);

// 计算预览表格列
const previewColumns = computed(() => {
  return headers.value.map(header => ({
    title: header,
    dataIndex: header,
    key: header,
    ellipsis: true
  }));
});

// 文件上传前处理
const beforeUpload = async file => {
  if (!file) return false;

  resetState();
  status.value = "parsing";
  loading.value = true;

  try {
    // 文件校验
    if (!isExcel(file)) {
      throw new Error("请上传有效的Excel文件 (.xlsx, .xls)");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("文件大小不能超过10MB");
    }

    // 解析Excel
    tableData.value = await parseExcel(file);
    headers.value = Object.keys(tableData.value[0] || {});
    status.value = "success";
    message.success("Excel解析成功");
  } catch (error) {
    handleError(error);
  } finally {
    loading.value = false;
  }

  return false; // 阻止自动上传
};

// Excel解析核心方法
const parseExcel = async file => {
  // const arrayBuffer = await file.arrayBuffer()
  // const workbook = new ExcelJS.Workbook()

  // // 1. 读取工作簿
  // await workbook.xlsx.load(arrayBuffer)
  // progress.value = 30

  // // 2. 获取第一个工作表
  // const worksheet = workbook.worksheets[1]
  // console.log("🚀 ~ parseExcel ~ worksheet:", worksheet);
  // // if (!worksheet) throw new Error('Excel文件中没有工作表')
  // try {
  //   // 3. 解析表头 (跳过空行)
  //   let firstDataRow = 1
  //   while (worksheet.getRow(firstDataRow).actualCellCount === 0) {
  //     firstDataRow++
  //   }

  //   const headerRow = worksheet.getRow(firstDataRow)
  //   headers.value = headerRow.values
  //     .slice(0, headerRow.actualCellCount)
  //     .filter(Boolean)
  //     .map(String)

  //   progress.value = 50

  //   // 4. 解析数据行
  //   const data = []
  //   for (let i = firstDataRow + 1; i <= worksheet.rowCount; i++) {
  //     const row = worksheet.getRow(i)
  //     if (row.actualCellCount === 0) continue

  //     const rowData = {}
  //     row.eachCell((cell, colNumber) => {
  //       let value = cell.value

  //       // 特殊类型处理
  //       if (value instanceof Date) {
  //         value = value.toISOString().split('T')[0]
  //       } else if (cell.formula) {
  //         value = cell.result
  //       }

  //       const header = headers.value[colNumber - 1]
  //       if (header) {
  //         rowData[header] = value ?? ''
  //       }
  //     })

  //     if (Object.keys(rowData).length > 0) {
  //       data.push(rowData)
  //     }

  //     progress.value = 50 + (i / worksheet.rowCount * 50)
  //   }
  // } catch (error) {
  //   throw new Error(error)
  // }

  // return data
  const arrayBuffer = await file.arrayBuffer();

  const tableData = [];
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(arrayBuffer);
    // 获取第一个工作表
    console.log("🚀 ~ parseExcel ~ workbook:", workbook);
    const worksheet = workbook.getWorksheet(0);
    console.log("🚀 ~ parseExcel ~ worksheet:", worksheet);

    // 读取工作表中的数据
    worksheet?.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      console.log(`Row ${rowNumber}:`, row.values);
      // 去掉表头
      if (rowNumber > 1) {
        tableData.push({
          key: rowNumber.toString(),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          app: row.values[1].trim(),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          name: row.values[2].trim(),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          works: row.values[3].trim()
        });
      }
    });
  } catch (error) {
    console.error("Error loading workbook:", error);
  }

  console.log(tableData);
  return tableData;
};

// 文件类型校验
const isExcel = file => {
  const types = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
  return types.includes(file.type) || [".xlsx", ".xls"].some(ext => file.name.endsWith(ext));
};

// 错误处理
const handleError = error => {
  console.error("Excel导入错误:", error);
  status.value = "error";
  progressStatus.value = "exception";
  errorMessage.value = error.message || "Excel文件解析失败";
  message.error(errorMessage.value);
};

// 重置状态
const resetState = () => {
  tableData.value = [];
  headers.value = [];
  progress.value = 0;
  errorMessage.value = "";
  progressStatus.value = "normal";
};

// 确认导入
const confirmImport = () => {
  previewData.value = false;
  emit("import", tableData.value);
  resetState();
};

// 暴露方法
defineExpose({
  getCurrentData: () => tableData.value
});

// 定义事件
const emit = defineEmits(["import"]);
</script>

<template>
  <div class="exca-import">
    <!-- 上传按钮 -->
    <a-upload :before-upload="beforeUpload" accept=".xlsx,.xls" :showUploadList="false">
      <a-button type="primary">
        <template #icon><UploadOutlined /></template>
        选择Excel文件
      </a-button>
    </a-upload>

    <!-- 状态显示 -->
    <div v-if="status !== 'idle'" class="status-area">
      <a-progress v-if="status === 'parsing'" :percent="progress" :status="progressStatus" />

      <a-alert v-if="errorMessage" :message="errorMessage" type="error" show-icon class="mt-10" />

      <div v-if="status === 'success'" class="result-summary mt-10">
        <a-tag color="green">成功解析 {{ tableData.length }} 条数据</a-tag>
        <a-button size="small" class="ml-10" @click="previewData = true"> 预览数据 </a-button>
      </div>
    </div>

    <!-- 数据预览模态框 -->
    <a-modal v-model:open="previewData" title="导入数据预览" width="80%">
      <a-table :dataSource="tableData" :columns="previewColumns" bordered size="small" :scroll="{ y: 400 }" :loading="loading" />
      <template #footer>
        <a-button key="back" @click="previewData = false">取消</a-button>,
        <a-button key="submit" type="primary" @click="confirmImport"> 确认导入 </a-button>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.exca-import {
  padding: 16px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
}
.status-area {
  margin-top: 16px;
}
.mt-10 {
  margin-top: 10px;
}
.ml-10 {
  margin-left: 10px;
}
</style>
