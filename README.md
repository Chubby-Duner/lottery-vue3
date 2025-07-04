# Lottery

[参考链接](https://github.com/henry-fun/hanshan-lottery)

```bash
src/
├── assets/
│   ├── images/
│   └── styles/
├── components/
│   ├── index.vue       # 主抽奖区域
│   ├── AwardList.vue         # 中奖名单展示
│   ├── PrizeList.vue         # 奖品展示
│   ├── LotteryResult.vue     # 抽奖结果弹窗
│   └── SnowEffect.vue        # 雪花效果
├── composables/
│   └── useLocalStorage.js    # localStorage 封装
├── App.vue
└── main.js
```

```bash
3. 功能说明
现在你的权重编辑功能已经完整集成了！主要特性包括：
�� 核心功能
导入数据后自动设置默认权重：每个人每个奖项权重都为1
权重编辑弹窗：使用 Ant Design Vue 的 Modal + Table 组件
权重抽奖算法：根据权重进行概率抽奖
实时保存：权重修改后立即生效
�� UI 特性
表格形式编辑：清晰展示每个人的权重设置
数字输入框：支持 0-100 的权重范围
批量操作：一键重置或设置默认权重
响应式设计：适配不同屏幕尺寸
�� 操作流程
导入抽奖名单数据
点击"权重设置"按钮打开编辑弹窗
在表格中修改每个人的权重
点击"保存设置"应用更改
开始抽奖时自动按权重抽取
📊 权重规则
权重越大：中奖概率越高
权重为0：不参与该奖项抽奖
所有权重为0：提示无法抽奖
```
