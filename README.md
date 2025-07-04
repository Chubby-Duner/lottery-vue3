# Lottery

[参考链接](https://github.com/henry-fun/hanshan-lottery)

```bash
src/
├── assets/
│   ├── images/
│   └── styles/
├── components/
│   ├── LotteryMain.vue       # 主抽奖区域
│   ├── AwardList.vue         # 中奖名单展示
│   ├── PrizeList.vue         # 奖品展示
│   ├── LotteryResult.vue     # 抽奖结果弹窗
│   └── SnowEffect.vue        # 雪花效果
├── composables/
│   └── useLocalStorage.js    # localStorage 封装
├── App.vue
└── main.js
```

## Todo

1、AwardList.vue 抽奖名单展示 每次打开获取的不是最新的
2、获奖名单，选择奖项，奖项剩余名额，改成使用pinia管理，需要同步至loacalStorage
