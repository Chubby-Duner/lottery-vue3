# 弹幕服务API封装使用说明

本项目已完成对弹幕服务API的完整封装，包含axios配置、代理设置和所有API接口的封装。

## 📁 文件结构

```
src/
├── utils/
│   └── request.js          # axios封装，包含请求/响应拦截器
├── api/
│   ├── index.js            # API统一入口文件
│   ├── barrage.js          # 弹幕和二维码API封装
│   └── README.md           # 本说明文档
└── examples/
    └── BarrageExample.vue  # 使用示例组件
```

## ⚙️ 配置说明

### 1. Vite代理配置

已在 `vite.config.js` 中配置代理，将前端的 `/api` 请求代理到弹幕服务器：

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/api')
  }
}
```

### 2. Axios封装

`src/utils/request.js` 提供了完整的axios封装：

- ✅ 统一的baseURL配置
- ✅ 请求/响应拦截器
- ✅ 错误处理和消息提示
- ✅ 超时设置
- ✅ 响应数据格式化

## 🚀 API使用方法

### 方式1：按需导入

```javascript
import { barrageApi, qrcodeApi } from '@/api'

// 发送弹幕
const sendBarrage = async () => {
  try {
    const result = await barrageApi.send({
      content: '这是一条测试弹幕',
      nickname: '测试用户',
      roomId: 'room123',
      color: '#ffffff',
      fontSize: 16
    })
    console.log('发送成功:', result)
  } catch (error) {
    console.error('发送失败:', error)
  }
}

// 获取弹幕列表
const getBarrageList = async () => {
  try {
    const result = await barrageApi.getList({
      roomId: 'room123',
      limit: 20,
      offset: 0
    })
    console.log('弹幕列表:', result.data.barrages)
  } catch (error) {
    console.error('获取失败:', error)
  }
}
```

### 方式2：默认导入

```javascript
import api from '@/api'

// 生成二维码
const generateQR = async () => {
  try {
    const result = await api.qrcode.generate({
      roomId: 'room123'
    })
    console.log('二维码:', result.data.qrCodeData)
  } catch (error) {
    console.error('生成失败:', error)
  }
}

// 获取统计信息
const getStats = async () => {
  try {
    const result = await api.barrage.getStats()
    console.log('统计信息:', result.data)
  } catch (error) {
    console.error('获取失败:', error)
  }
}
```

## 📋 API接口列表

### 弹幕相关API (barrageApi)

| 方法 | 说明 | 参数 |
|------|------|------|
| `send(data)` | 发送弹幕 | `{ content, nickname?, roomId?, color?, fontSize? }` |
| `getList(params)` | 获取弹幕列表 | `{ roomId?, limit?, offset? }` |
| `getLatest(params)` | 获取最新弹幕 | `{ roomId, since?, limit? }` |
| `clear(params)` | 清空弹幕 | `{ roomId? }` |
| `getStats(params)` | 获取统计信息 | `{ roomId? }` |
| `delete(id)` | 删除指定弹幕 | `id` |

### 二维码相关API (qrcodeApi)

| 方法 | 说明 | 参数 |
|------|------|------|
| `generate(params)` | 生成二维码 | `{ roomId?, baseUrl? }` |
| `getByRoom(roomId, params)` | 获取房间二维码 | `roomId, { baseUrl?, refresh? }` |
| `getInfo(qrId)` | 获取二维码信息 | `qrId` |
| `getStats()` | 获取二维码统计 | - |
| `cleanup()` | 清理过期二维码 | - |
| `delete(qrId)` | 删除指定二维码 | `qrId` |
| `deleteExpired(params)` | 批量删除过期二维码 | `{ daysOld? }` |

## 🎯 使用示例

查看 `src/examples/BarrageExample.vue` 文件，其中包含了所有API的完整使用示例，包括：

- 发送弹幕表单
- 弹幕列表展示
- 二维码生成和显示
- 统计信息获取
- 错误处理示例

## 🔧 开发建议

1. **错误处理**：所有API调用都应该使用try-catch包装
2. **加载状态**：在API调用时显示loading状态提升用户体验
3. **参数验证**：在调用API前验证必要参数
4. **响应数据**：API返回的数据结构已经过处理，直接使用`result.data`即可

## 🚨 注意事项

1. 确保弹幕服务器运行在 `http://localhost:3000`
2. 所有API调用都会自动添加 `/api` 前缀
3. 错误信息会自动通过ant-design-vue的message组件显示
4. 请求超时时间设置为10秒

## 🔄 实时数据

对于需要实时获取弹幕数据的场景，建议使用：

```javascript
// 轮询获取最新弹幕
const pollLatestBarrages = () => {
  setInterval(async () => {
    try {
      const result = await barrageApi.getLatest({
        roomId: 'room123',
        since: lastTimestamp
      })
      // 处理新弹幕
      if (result.data.barrages.length > 0) {
        handleNewBarrages(result.data.barrages)
        lastTimestamp = result.data.timestamp
      }
    } catch (error) {
      console.error('轮询失败:', error)
    }
  }, 1000) // 每秒轮询一次
}
```