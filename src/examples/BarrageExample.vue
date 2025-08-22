<template>
  <div class="barrage-example">
    <h2>弹幕服务API使用示例</h2>

    <!-- 发送弹幕 -->
    <div class="section">
      <h3>发送弹幕</h3>
      <a-form :model="barrageForm" layout="inline">
        <a-form-item label="弹幕内容">
          <a-input v-model:value="barrageForm.content" placeholder="请输入弹幕内容" style="width: 200px" />
        </a-form-item>
        <a-form-item label="昵称">
          <a-input v-model:value="barrageForm.nickname" placeholder="昵称" style="width: 120px" />
        </a-form-item>
        <a-form-item label="房间ID">
          <a-input v-model:value="barrageForm.roomId" placeholder="房间ID" style="width: 120px" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="sendBarrage" :loading="sending">发送弹幕</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 弹幕列表 -->
    <div class="section">
      <h3>弹幕列表</h3>
      <div class="controls">
        <a-input v-model:value="listRoomId" placeholder="房间ID" style="width: 120px; margin-right: 10px" />
        <a-button @click="getBarrageList" :loading="loading">获取列表</a-button>
        <a-button @click="clearBarrages" :loading="clearing" danger style="margin-left: 10px">清空弹幕</a-button>
      </div>

      <a-table :dataSource="barrageList" :columns="barrageColumns" :pagination="false" :scroll="{ y: 300 }" size="small" style="margin-top: 10px" />
    </div>

    <!-- 二维码生成 -->
    <div class="section">
      <h3>二维码生成</h3>
      <div class="controls">
        <a-input v-model:value="qrRoomId" placeholder="房间ID" style="width: 120px; margin-right: 10px" />
        <a-button @click="generateQRCode" :loading="generating">生成二维码</a-button>
      </div>

      <div v-if="qrCodeData" class="qr-result">
        <img :src="qrCodeData.qrCode" alt="二维码" style="max-width: 200px" />
        <p>房间ID: {{ qrCodeData.roomId }}</p>
        <p>扫描次数: {{ qrCodeData.scanCount }}</p>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="section">
      <h3>统计信息</h3>
      <a-button @click="getStats" :loading="statsLoading">获取统计</a-button>

      <div v-if="stats" class="stats-result">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="总弹幕数">{{ stats.totalBarrages }}</a-descriptions-item>
          <a-descriptions-item label="总房间数">{{ stats.totalRooms }}</a-descriptions-item>
        </a-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
import { barrageApi, qrcodeApi } from "@/api";

// 发送弹幕相关
const barrageForm = reactive({
  content: "",
  nickname: "测试用户",
  roomId: "room123",
  color: "#ffffff",
  fontSize: 16
});
const sending = ref(false);

// 弹幕列表相关
const barrageList = ref([]);
const listRoomId = ref("room123");
const loading = ref(false);
const clearing = ref(false);

// 二维码相关
const qrRoomId = ref("room123");
const qrCodeData = ref(null);
const generating = ref(false);

// 统计信息相关
const stats = ref(null);
const statsLoading = ref(false);

// 弹幕列表表格列配置
const barrageColumns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 60
  },
  {
    title: "内容",
    dataIndex: "content",
    key: "content"
  },
  {
    title: "昵称",
    dataIndex: "nickname",
    key: "nickname",
    width: 100
  },
  {
    title: "房间ID",
    dataIndex: "roomId",
    key: "roomId",
    width: 100
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 160,
    customRender: ({ text }) => new Date(text).toLocaleString()
  }
];

// 发送弹幕
const sendBarrage = async () => {
  if (!barrageForm.content.trim()) {
    message.warning("请输入弹幕内容");
    return;
  }

  sending.value = true;
  try {
    const result = await barrageApi.send(barrageForm);
    message.success("弹幕发送成功");
    console.log("发送结果:", result);

    // 发送成功后刷新列表
    if (listRoomId.value === barrageForm.roomId) {
      await getBarrageList();
    }
  } catch (error) {
    console.error("发送弹幕失败:", error);
  } finally {
    sending.value = false;
  }
};

// 获取弹幕列表
const getBarrageList = async () => {
  loading.value = true;
  try {
    const result = await barrageApi.getList({
      roomId: listRoomId.value,
      limit: 20
    });
    barrageList.value = result.data.barrages;
    console.log("弹幕列表:", result);
  } catch (error) {
    console.error("获取弹幕列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 清空弹幕
const clearBarrages = async () => {
  clearing.value = true;
  try {
    const result = await barrageApi.clear({ roomId: listRoomId.value });
    message.success("弹幕清空成功");
    console.log("清空结果:", result);

    // 清空后刷新列表
    await getBarrageList();
  } catch (error) {
    console.error("清空弹幕失败:", error);
  } finally {
    clearing.value = false;
  }
};

// 生成二维码
const generateQRCode = async () => {
  if (!qrRoomId.value.trim()) {
    message.warning("请输入房间ID");
    return;
  }

  generating.value = true;
  try {
    const result = await qrcodeApi.generate({ roomId: qrRoomId.value });
    qrCodeData.value = result.data;
    message.success("二维码生成成功");
    console.log("二维码数据:", result);
  } catch (error) {
    console.error("生成二维码失败:", error);
  } finally {
    generating.value = false;
  }
};

// 获取统计信息
const getStats = async () => {
  statsLoading.value = true;
  try {
    const result = await barrageApi.getStats();
    stats.value = result.data;
    console.log("统计信息:", result);
  } catch (error) {
    console.error("获取统计信息失败:", error);
  } finally {
    statsLoading.value = false;
  }
};

// 页面加载时获取初始数据
getBarrageList();
getStats();
</script>

<style scoped>
.barrage-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
}

.section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1890ff;
}

.controls {
  margin-bottom: 15px;
}

.qr-result {
  margin-top: 15px;
  text-align: center;
}

.qr-result img {
  display: block;
  margin: 0 auto 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.stats-result {
  margin-top: 15px;
}
</style>
