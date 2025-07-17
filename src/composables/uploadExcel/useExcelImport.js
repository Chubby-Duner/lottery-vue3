import { ref, computed } from "vue";
import * as XLSX from "xlsx";
import { message } from "ant-design-vue";
import { isExcel } from "@/composables/utils";
import { readFileAsArrayBuffer, getHeaderRow } from "@/composables/uploadExcel/uploadUtils";
import { extractImagesFromExcel, mergeImagesWithData } from "@/composables/uploadExcel/excelImageExtract";

export function useExcelImport({ fieldFilter = () => true, titleMap = {}, beforeUpload, onSuccess, resultType = 'excel' } = {}) {
  const importModal = ref(false);
  const previewData = ref(false);
  const loading = ref(false);
  const status = ref("idle"); // idle|parsing|success|error
  const errorMessage = ref("");
  const excelData = ref({ header: null, results: null }); // Excel数据
  const paginationConfig = ref({
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
    pageSizeOptions: ["5", "10", "20", "50"],
    size: "small"
  });

  // 表格数据（添加唯一key）
  const tableData = computed(() => (excelData.value.results || []).map((item, index) => ({ ...item, __id: index })));

  // 是否包含图片
  const hasImages = computed(() => tableData.value.some(item =>
    Object.values(item).some(value => value && typeof value === "object" && value.dataUrl)
  ));

  // 预览表格的列配置
  const previewColumns = computed(() => {
    if (!excelData.value.header) return [];
    return excelData.value.header
      .filter(fieldFilter)
      .map(key => ({
        title: titleMap[key] || key,
        dataIndex: key,
        key,
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

  const showError = msg => {
    status.value = "error";
    errorMessage.value = msg;
    message.error(msg);
  };

  const resetStatus = () => { errorMessage.value = ""; };

  const resetAll = () => {
    status.value = "idle";
    errorMessage.value = "";
    excelData.value = { header: null, results: null };
    previewData.value = false;
    loading.value = false;
    resetPagination();
  };
  
  const resetPagination = () => {
    paginationConfig.value.pageSize = 10;
    paginationConfig.value.current = 1;
  };

  // 解析Excel文件，提取图片并合并数据
  const parseExcel = async rawFile => {
    loading.value = true;
    status.value = "parsing";
    try {
      let imageList = [], implantBlobList = [];
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

  // 处理文件上传
  const processFile = rawFile => {
    if (!isExcel(rawFile)) return showError("仅支持.xlsx, .xls 格式文件");
    if (beforeUpload && !beforeUpload(rawFile)) return;
    parseExcel(rawFile);
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

  // 确认导入
  const confirmImport = () => {
    onSuccess?.(resultType === 'table' ? tableData.value : excelData.value);
    resetAll();
    importModal.value = false;
  };

  const closeImportModal = () => {
    resetAll();
    importModal.value = false;
  };

  const handleTableChange = pagination => {
    paginationConfig.value.pageSize = pagination.pageSize;
    paginationConfig.value.current = pagination.current;
  };

  return {
    importModal,
    previewData,
    loading,
    status,
    errorMessage,
    excelData,
    tableData,
    hasImages,
    previewColumns,
    paginationConfig,
    handleClick,
    confirmImport,
    closeImportModal,
    previewData,
    handleTableChange,
    resetAll
  };
} 