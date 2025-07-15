<script setup>
import { ref, computed, nextTick } from "vue";
import * as XLSX from "xlsx";
import { message, Modal } from "ant-design-vue";
import { UploadOutlined, CheckCircleOutlined } from "@ant-design/icons-vue";
import { isExcel } from "@/composables/utils";
import { readFileAsArrayBuffer, getHeaderRow, handleImageError } from "@/composables/uploadExcel/uploadUtils";
import { extractImagesFromExcel, mergeImagesWithData } from "@/composables/uploadExcel/excelImageExtract";
import { usePrizeStore } from "@/store/prizeStore";

defineOptions({
  name: "PrizeList"
});

const showList = ref(false);
const prizeStore = usePrizeStore();

// 导入窗口相关状态
const importModal = ref(false);
const previewData = ref(false);
const loading = ref(false);
const status = ref("idle");
const errorMessage = ref("");
const excelData = ref({ header: null, results: null });

// 分页配置
const paginationConfig = ref({
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ["5", "10", "20", "50"],
  size: "small"
});

// 礼物数据表头映射
const giftTitleMap = {
  giftLevel: "礼物等级",
  giftName: "礼物名称",
  giftCategory: "礼物类别",
  giftImage: "礼物图片",
  description: "礼物描述",
  giftQuantity: "礼物数量"
};

// 礼物等级映射
const giftLevelMap = {
  award1: "一等奖",
  award2: "二等奖", 
  award3: "三等奖",
  award4: "纪念奖"
};

// 计算是否有礼物数据
const hasGiftData = computed(() => {
  return prizeStore.hasPrizes;
});

// 表格数据（添加唯一key）
const tableData = computed(() => {
  return (excelData.value.results || []).map((item, index) => ({
    ...item,
    __id: index,
    remainingQuantity: item.giftQuantity // 直接取导入数量
  }));
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
    .filter(key => key !== "giftLevel") // 过滤掉 giftLevel 字段
    .map(key => ({
      title: giftTitleMap[key] || key,
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

// 礼物分组数据
const giftGroups = computed(() => {
  return prizeStore.getPrizeGroups;
});

// 显示数量控制
const visibleCounts = ref({});

// 初始化每个礼物等级的显示数量
const initVisibleCounts = () => {
  giftGroups.value.forEach(group => {
    if (!(group.key in visibleCounts.value)) {
      visibleCounts.value[group.key] = 5;
    }
  });
};

const showMore = giftLevel => {
  visibleCounts.value[giftLevel] += 5;
};

const showLess = giftLevel => {
  visibleCounts.value[giftLevel] = 5;
};

const getTemplateUrl = () => {
  return new URL("/template/giftTemplate.xlsx", import.meta.url).href;
};

const toggleList = () => {
  showList.value = !showList.value;
  if (showList.value) initVisibleCounts();
};

// 打开导入窗口
const openImportModal = () => {
  importModal.value = true;
  resetAll();
};

// 解析Excel文件，提取图片并合并数据
const parseExcel = async rawFile => {
  loading.value = true;
  status.value = "parsing";
  try {
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
  parseExcel(rawFile);
};

// 确认导入
const confirmImport = () => {
  prizeStore.setPrizeList(tableData.value);
  prizeStore.setPrizeListBackup(tableData.value); // 新增备份
  prizeStore.resetAllRemainingQuantity();
  message.success(`成功导入 ${tableData.value.length} 条礼物数据`);
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

// 清空礼物数据
const clearGiftData = () => {
  Modal.confirm({
    title: "确定要清空礼物数据吗？",
    content: "此操作会清空所有礼物数据。",
    okText: "确定",
    cancelText: "取消",
    async onOk() {
      try {
        prizeStore.clearPrizes();
        message.success("已清空礼物数据");
      } catch (error) {
        console.error("error in clearGiftData", error);
      }
    }
  });
};
</script>

<template>
  <aside class="aside-right">
    <!-- 侧边栏内容区域 -->
    <transition name="drawer">
      <div class="aside-main" v-show="showList">
        <div class="btn btn-red-outline award-list-btn" @click="toggleList">新年礼物</div>
        
        <!-- 礼物数据为空时显示导入按钮 -->
        <div v-if="!hasGiftData" class="gift-import-section">
          <div class="gift-empty-state">
            <p class="gift-empty-text">请先导入礼物数据</p>
            <div>
              <a-button type="primary" size="small">
                <a :href="getTemplateUrl()" target="_blank">下载模板</a>
              </a-button>
            </div>
            <div>
              <a-button class="margin-left10" size="small" type="primary" @click="openImportModal">导入礼物数据</a-button>
            </div>
          </div>
        </div>
        
        <!-- 有礼物数据时显示礼物列表 -->
        <div v-else class="award-main">
          <div class="gift-controls">
            <a-button size="small" @click="clearGiftData">清空礼物数据</a-button>
          </div>
          
          <!-- 礼物分组显示 -->
          <div v-if="giftGroups.length > 0" class="gift-groups">
            <template v-for="group in giftGroups" :key="group.key">
              <div class="award-con" v-if="group.data.length > 0">
                <h3 class="award-title">{{ group.title }}</h3>
                <ul class="win">
                  <li v-for="(gift, index) in group.data.slice(0, visibleCounts[group.key])" :key="index" class="clearfix win-li">
                    <div class="f-l avatar">
                      <!-- 优先使用导入图片，没有则显示礼物名称 -->
                      <img 
                        v-if="gift.giftImage && typeof gift.giftImage === 'object' && gift.giftImage.dataUrl" 
                        :src="gift.giftImage.dataUrl" 
                        width="34" 
                        :alt="gift.giftName" 
                        style="object-fit: contain; border-radius: 4px; display: block; margin: 0 auto" 
                      />
                      <div
                        v-else
                        class="avatar-text"
                        :style="{ 
                          width: '3rem', 
                          height: '3rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          background: '#ffe082', 
                          borderRadius: '50%', 
                          color: '#b8860b',
                          fontSize: '12px'
                        }"
                      >
                        {{ gift.giftName ? gift.giftName.charAt(0) : '礼' }}
                      </div>
                    </div>
                    <div class="f-l name">
                      {{ gift.giftName }}
                      <span class="quantity-info">
                        (剩余: {{ prizeStore.getPrizeRemainingQuantity(gift.giftName, gift.giftLevel) }}/{{ gift.giftQuantity || 1 }})
                      </span>
                    </div>
                  </li>
                </ul>
                <div class="action-btns" v-if="group.data.length > 5">
                  <a-button type="link" @click="showMore(group.key)" v-if="visibleCounts[group.key] < group.data.length"> 查看更多 </a-button>
                  <a-button type="link" @click="showLess(group.key)" v-if="visibleCounts[group.key] > 5"> 收起 </a-button>
                </div>
              </div>
            </template>
          </div>
          
          <!-- 无礼物数据时显示空状态 -->
          <div v-else class="empty-tip">
            <a-empty description="暂无礼物数据" />
          </div>
        </div>
      </div>
    </transition>

    <!-- 灯笼 - 同一个灯笼，跟随区域移动 -->
    <img src="@/assets/images/lantern.png" alt="" width="85" @click="toggleList" class="switch" :class="{ 'switch-expanded': showList }" />
  </aside>

  <!-- 礼物导入模态框 -->
  <a-modal v-model:open="importModal" title="导入礼物数据" width="50%" :footer="null" :maskClosable="false" @cancel="closeImportModal">
    <div class="excel-uploader">
      <!-- 上传说明区域 -->
      <div class="desc-wrapper">
        <div class="desc-title">
          <span style="margin-right: 8px">🎁</span>
          礼物数据导入说明
        </div>
        <div>
          <div style="margin-bottom: 4px">• <strong>有图片</strong>：礼物图片会自动提取并在预览和导入后显示，支持Excel嵌入图片（仅.xlsx）</div>
          <div style="margin-bottom: 4px">• <strong>无图片</strong>：仅导入文本、数字等普通数据，图片列为空</div>
          <div style="margin-bottom: 4px">• <strong>礼物名称</strong>：必填字段，用于显示礼物名称</div>
          <div style="margin-bottom: 4px">• <strong>礼物类别</strong>：可选字段，用于分类管理</div>
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
            成功解析 {{ tableData.length }} 条礼物数据
            <span v-if="hasImages" style="margin-left: 8px; color: #52c41a"> (包含图片) </span>
          </a-tag>
          <a-button type="link" size="small" @click="previewData = true" v-if="tableData.length > 0">查看详情</a-button>
        </div>
      </div>
    </div>
  </a-modal>

  <!-- 数据预览模态框 -->
  <a-modal v-model:open="previewData" title="礼物数据预览" width="80%" :footer="null" :maskClosable="false" style="top: 60px">
    <!-- 固定的说明区域 -->
    <div class="desc-wrapper">
      <div class="desc-title">
        <span style="margin-right: 8px">📊</span>
        礼物数据预览说明
      </div>
      <div>
        <div style="margin-bottom: 4px">
          • <strong>共 {{ tableData.length }} 条礼物记录</strong>：请仔细检查数据是否正确
        </div>
        <div style="margin-bottom: 4px">• <strong>空值显示</strong>：空单元格会显示为"空值"，图片列为空值时会显示礼物名称</div>
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
          <img :src="text.dataUrl" class="table-cell-img" alt="礼物图片" @error="handleImageError" />
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
.aside-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.aside-main {
  flex: 1;
  overflow-y: auto;
}

.switch {
  position: absolute;
  right: 2px;
  transform: translateX(-50%);
  z-index: 10;
  cursor: pointer;
  top: 2rem;
  transition: top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.switch-expanded {
  top: calc(100% - 2rem);
}

/* 在容器内的灯笼位置 */
.aside-container .switch {
  bottom: 0;
}

/* 礼物导入相关样式 */
.gift-import-section {
  padding: 20px;
  text-align: center;
}

.gift-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.gift-empty-text {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.gift-import-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.gift-controls {
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
}

.gift-groups {
  padding: 0 20px;
}

.empty-tip {
  margin-top: 50px;
  text-align: center;
}

.margin-left10 {
  margin-left: 10px;
}

/* 导入窗口相关样式 */
.excel-uploader {
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
}

.table-cell-img {
  max-width: 60px;
  max-height: 60px;
  object-fit: contain;
  border-radius: 4px;
  display: block;
  margin: 0 auto;
}

.quantity-info {
  font-size: 12px;
  color: #8b7355;
  margin-left: 8px;
  font-weight: normal;
}
</style>
