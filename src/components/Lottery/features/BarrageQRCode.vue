<script setup>
import { ref, computed, watch } from "vue";
import { message } from "ant-design-vue";
import { qrcodeApi } from "@/api/barrage";

defineOptions({
  name: "BarrageQRCode"
});

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  roomId: {
    type: String,
    default: "lottery-room"
  },
  serverUrl: {
    type: String,
    default: () => {
      // 动态获取服务器地址，线上和本地环境都使用3000端口
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:3000`;
    }
  }
});

const emit = defineEmits(["update:visible", "close"]);

const loading = ref(false);
const qrCodeUrl = ref("");
const qrCodeData = ref(null);
const inputUrl = ref("");

const qrCodePageUrl = computed(() => {
  return `${props.serverUrl}/static/qrcode-display.html?roomId=${props.roomId}`;
});

// 生成二维码
const generateQRCode = async () => {
  try {
    loading.value = true;
    const response = await qrcodeApi.generate({
      roomId: props.roomId,
      baseUrl: props.serverUrl
    });

    if (response.code === 100200) {
      qrCodeData.value = response.data;
      qrCodeUrl.value = response.data.qrCode;
      inputUrl.value = response.data.url;
      message.success("二维码生成成功");
    } else {
      message.error(response.message || "生成二维码失败");
    }
  } catch (error) {
    console.error("生成二维码失败:", error);
    message.error("生成二维码失败，请重试");
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  emit("update:visible", false);
  emit("close");
};

// 复制二维码链接
const copyQRCodeLink = async () => {
  try {
    await navigator.clipboard.writeText(inputUrl.value);
    message.success("二维码链接已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    message.error("复制失败，请手动复制");
  }
};

// 在新窗口打开二维码页面
const openQRCodeWindow = () => {
  const width = 600;
  const height = 700;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;

  window.open(qrCodePageUrl.value, "qrcode-window", `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);

  message.success("二维码页面已在新窗口打开");
};

// 监听visible属性变化
watch(
  () => props.visible,
  newVisible => {
    if (newVisible) {
      // 立即设置加载状态，避免显示错误容器
      loading.value = true;
      qrCodeUrl.value = "";
      inputUrl.value = "";

      // 生成二维码
      generateQRCode();
    } else {
      // 弹窗关闭时重置状态
      loading.value = false;
      qrCodeUrl.value = "";
      inputUrl.value = "";
      qrCodeData.value = null;
    }
  }
);
</script>

<template>
  <a-modal :open="visible" title="弹幕二维码" :width="400" :footer="null" @cancel="handleClose">
    <div class="qrcode-container">
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
        <p>正在生成二维码...</p>
      </div>

      <div v-else-if="qrCodeUrl" class="qrcode-content">
        <div class="qrcode-image">
          <img :src="qrCodeUrl" alt="弹幕二维码" class="qr-code" />
        </div>
        <p class="qr-tip">扫描二维码参与弹幕互动</p>

        <div class="url-section">
          <label>二维码链接：</label>
          <div class="url-input">
            <a-input :value="inputUrl" readonly class="url-field" />
            <a-button type="primary" @click="copyQRCodeLink" class="copy-btn" size="small"> 复制 </a-button>
          </div>
        </div>
      </div>

      <div v-else class="error-container">
        <p>二维码生成失败</p>
        <a-button type="primary" @click="generateQRCode" :loading="loading"> 重新生成 </a-button>
      </div>

      <div class="action-buttons">
        <a-button @click="openQRCodeWindow" type="default"> 🔗 新窗口打开 </a-button>
        <a-button type="primary" @click="handleClose"> 关闭 </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.qrcode-container {
  text-align: center;
  padding: 20px;
}

.loading-container {
  padding: 40px 0;

  p {
    margin-top: 16px;
    color: #666;
  }
}

.qrcode-content {
  .qrcode-image {
    margin-bottom: 16px;

    .qr-code {
      width: 250px;
      height: 250px;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .qr-tip {
    color: #666;
    font-size: 16px;
    margin-bottom: 16px;
  }

  .url-section {
    margin-bottom: 20px;
    text-align: left;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #555;
      font-size: 14px;
    }

    .url-input {
      display: flex;
      gap: 8px;

      .url-field {
        flex: 1;
        font-size: 12px;
      }

      .copy-btn {
        flex-shrink: 0;
      }
    }
  }
}

.error-container {
  padding: 40px 0;

  p {
    margin-bottom: 16px;
    color: #ff4d4f;
    font-size: 16px;
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

// 响应式设计
@media (max-width: 480px) {
  .qrcode-container {
    padding: 15px;
  }

  .qrcode-content {
    .qrcode-image {
      .qr-code {
        width: 200px;
        height: 200px;
      }
    }

    .url-section {
      .url-input {
        flex-direction: column;
        gap: 8px;

        .copy-btn {
          width: 100%;
        }
      }
    }
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;

    button {
      width: 100%;
    }
  }
}
</style>
