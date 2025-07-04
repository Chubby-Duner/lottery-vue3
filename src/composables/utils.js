// 把excel文件中的日期格式的内容转回成标准时间
// https://blog.csdn.net/qq_15054679/article/details/107712966
const formatExcelDate = (numb, format = '/') => {
  const time = new Date((numb - 25567) * 24 * 3600000 - 5 * 60 * 1000 - 43 * 1000 - 24 * 3600000 - 8 * 3600000)
  time.setYear(time.getFullYear())
  const year = time.getFullYear() + ''
  const month = time.getMonth() + 1 + ''
  const date = time.getDate() + ''
  if (format && format.length === 1) {
    return year + format + month + format + date
  }
  return year + (month < 10 ? '0' + month : month) + (date < 10 ? '0' + date : date)
}

/**
 * 将对象数组中的中文键名转换为英文键名
 * @param {Array} data - 原始数据数组
 * @param {Object} keyMap - 键名映射表（如：{ '姓名': 'username' }）
 * @returns {Array} 转换后的新数组
 */
const translateKeys = (data, keyMap) => {
  return data.map(item => {
    const translatedItem = {};
    for (const [chineseKey, value] of Object.entries(item)) {
      // 如果 keyMap 中有对应的英文键，则转换；否则保留原键名
      const englishKey = keyMap[chineseKey] || chineseKey;
      translatedItem[englishKey] = value;
    }
    return translatedItem;
  });
}


/**
 * 获取图片路径
 * @param {string} name 图片名称
 * @param {string} type 图片所在文件夹
 */
const getImageUrl = (name, type) => {
  if (!name || !type) {
    console.warn('getImageUrl 参数缺失:', { name, type })
    return ''
  }

  return new URL(`../assets/images/${type}/${name}.jpg`, import.meta.url).href
}

/**
 * 权重抽奖函数
 * @param {array} list 名单
 * @param {number} awardType 奖项
 */
const weightedRandomIndex = (list, awardType) => {
  const weights = list.map((item) => item.awardWeights?.[awardType] ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return -1;
  }

  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return 0;
};

export { formatExcelDate, translateKeys, getImageUrl, weightedRandomIndex }
