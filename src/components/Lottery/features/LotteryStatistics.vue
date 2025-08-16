<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useAwardStore } from "@/store/awardStore";
import { useLotteryHistoryStore } from "@/store/lotteryHistoryStore";
import echarts from "@/plugins/echarts";

defineOptions({
  name: "LotteryStatistics"
});

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  lotteryData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["update:visible"]);

const awardStore = useAwardStore();
const historyStore = useLotteryHistoryStore();

// 图表实例引用
const departmentPieRef = ref(null);
const awardDistributionRef = ref(null);
const subDepartmentBarRef = ref(null);

// 图表实例
let departmentPieChart = null;
let awardDistributionChart = null;
let subDepartmentBarChart = null;

// 处理部门数据
const processDepartmentData = data => {
  const departmentMap = new Map();
  const subDepartmentMap = new Map();

  data.forEach(item => {
    if (item.department) {
      // 检查用户是否参与抽奖（权重不全为0）
      const awardWeights = item.awardWeights || {};
      const isParticipating = Object.values(awardWeights).some(weight => weight > 0);
      
      // 只统计参与抽奖的用户
      if (isParticipating) {
        const parts = item.department.split("#");
        const mainDept = parts[0] || "未知部门";
        const subDept = parts[1] || "未分组";

        // 统计大部门
        if (!departmentMap.has(mainDept)) {
          departmentMap.set(mainDept, 0);
        }
        departmentMap.set(mainDept, departmentMap.get(mainDept) + 1);

        // 统计小部门
        const subDeptKey = `${mainDept}#${subDept}`;
        if (!subDepartmentMap.has(subDeptKey)) {
          subDepartmentMap.set(subDeptKey, 0);
        }
        subDepartmentMap.set(subDeptKey, subDepartmentMap.get(subDeptKey) + 1);
      }
    }
  });

  return { departmentMap, subDepartmentMap };
};

// 处理中奖数据
const processWinningData = () => {
  const winningByDept = new Map();
  const winningByAward = new Map();

  // 初始化奖项统计
  awardStore.awards.forEach(award => {
    winningByAward.set(award.key, new Map());
  });

  // 统计中奖数据
  Object.keys(awardStore.winnerMap).forEach(awardKey => {
    const winners = awardStore.winnerMap[awardKey] || [];
    const awardMap = winningByAward.get(awardKey) || new Map();

    winners.forEach(winner => {
      if (winner.department) {
        const mainDept = winner.department.split("#")[0] || "未知部门";

        // 统计部门中奖数
        if (!winningByDept.has(mainDept)) {
          winningByDept.set(mainDept, 0);
        }
        winningByDept.set(mainDept, winningByDept.get(mainDept) + 1);

        // 统计各奖项的部门分布
        if (!awardMap.has(mainDept)) {
          awardMap.set(mainDept, 0);
        }
        awardMap.set(mainDept, awardMap.get(mainDept) + 1);
      }
    });

    winningByAward.set(awardKey, awardMap);
  });

  return { winningByDept, winningByAward };
};

// 部门参与人数饼图数据
const departmentPieData = computed(() => {
  const { departmentMap } = processDepartmentData(props.lotteryData);
  return Array.from(departmentMap.entries()).map(([name, value]) => ({ name, value }));
});

// 实际参与抽奖的人数
const actualParticipants = computed(() => {
  console.log("🚀 ~ props.lotteryData:", props.lotteryData);
  return props.lotteryData.filter(item => {
    const awardWeights = item.awardWeights || {};
    return Object.values(awardWeights).some(weight => weight > 0);
  }).length;
});



// 各奖项部门分布数据
const awardDistributionData = computed(() => {
  const { winningByAward } = processWinningData();
  const series = [];
  const legendData = [];

  awardStore.awards.forEach((award, index) => {
    const awardMap = winningByAward.get(award.key) || new Map();
    const data = Array.from(awardMap.entries()).map(([name, value]) => ({ name, value }));

    if (data.length > 0) {
      legendData.push(award.label);
      series.push({
        name: award.label,
        type: "pie",
        radius: [20 + index * 15, 40 + index * 15],
        center: ["50%", "50%"],
        data,
        label: {
          show: index === 0,
          position: "outside"
        },
        labelLine: {
          show: index === 0
        }
      });
    }
  });

  return { series, legendData };
});

// 子部门统计数据
const subDepartmentData = computed(() => {
  const { subDepartmentMap } = processDepartmentData(props.lotteryData);
  const data = Array.from(subDepartmentMap.entries())
    .map(([key, value]) => {
      const [mainDept, subDept] = key.split('#');
      return { name: `${mainDept}-${subDept}`, value, mainDept, subDept };
    })
    // 先按大部门分组，再按人数排序
    .sort((a, b) => {
      // 首先按大部门名称排序
      if (a.mainDept !== b.mainDept) {
        return a.mainDept.localeCompare(b.mainDept);
      }
      // 同一大部门内按人数降序排序
      return b.value - a.value;
    });
  
  return {
    categories: data.map(item => item.name),
    values: data.map(item => item.value)
  };
});



// 初始化图表
const initCharts = async () => {
  await nextTick();

  // 部门参与人数饼图
  if (departmentPieRef.value && departmentPieData.value.length > 0) {
    departmentPieChart = echarts.init(departmentPieRef.value);
    const option = {
      title: {
        text: "各部门参与人数分布",
        left: "center",
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)"
      },
      legend: {
        orient: "vertical",
        left: "left",
        top: "middle"
      },
      series: [
        {
          name: "参与人数",
          type: "pie",
          radius: "60%",
          center: ["60%", "50%"],
          data: departmentPieData.value,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          }
        }
      ]
    };
    departmentPieChart.setOption(option);
  }

  // 各奖项部门分布环形图
  if (awardDistributionRef.value && awardDistributionData.value.series.length > 0) {
    awardDistributionChart = echarts.init(awardDistributionRef.value);
    const option = {
      title: {
        text: "各奖项部门分布",
        left: "center",
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)"
      },
      legend: {
        data: awardDistributionData.value.legendData,
        bottom: 10
      },
      series: awardDistributionData.value.series
    };
    awardDistributionChart.setOption(option);
  }

  // 子部门统计柱状图
  if (subDepartmentBarRef.value && subDepartmentData.value.categories.length > 0) {
    subDepartmentBarChart = echarts.init(subDepartmentBarRef.value);
    const option = {
      title: {
        text: "各子部门参与人数",
        left: "center",
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" }
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: subDepartmentData.value.categories,
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: "value"
      },
      series: [
        {
          name: "参与人数",
          type: "bar",
          data: subDepartmentData.value.values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#83bff6" },
              { offset: 0.5, color: "#188df0" },
              { offset: 1, color: "#188df0" }
            ])
          }
        }
      ]
    };
    subDepartmentBarChart.setOption(option);
  }

};

// 销毁图表
const destroyCharts = () => {
  if (departmentPieChart) {
    departmentPieChart.dispose();
    departmentPieChart = null;
  }
  if (awardDistributionChart) {
    awardDistributionChart.dispose();
    awardDistributionChart = null;
  }
  if (subDepartmentBarChart) {
    subDepartmentBarChart.dispose();
    subDepartmentBarChart = null;
  }
};

// 监听弹窗显示状态
const handleVisibleChange = visible => {
  if (visible) {
    setTimeout(initCharts, 100);
  } else {
    destroyCharts();
  }
};

// 关闭弹窗
const handleClose = () => {
  emit("update:visible", false);
};

// 窗口大小变化时重新调整图表
const handleResize = () => {
  if (departmentPieChart) departmentPieChart.resize();
  if (awardDistributionChart) awardDistributionChart.resize();
  if (subDepartmentBarChart) subDepartmentBarChart.resize();
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

// 监听visible变化
watch(() => props.visible, handleVisibleChange);

// 监听lotteryData变化，重新初始化图表
watch(() => props.lotteryData, () => {
  if (props.visible) {
    // 延迟重新初始化图表，确保数据更新完成
    setTimeout(() => {
      destroyCharts();
      initCharts();
    }, 100);
  }
}, { deep: true });
</script>

<template>
  <a-modal :open="visible" title="抽奖统计分析" :width="1200" :footer="null" @cancel="handleClose" @update:open="val => $emit('update:visible', val)">
    <div class="statistics-container">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <a-row :gutter="16">
          <a-col :span="5">
            <a-statistic title="总人数" :value="lotteryData.length" :value-style="{ color: '#722ed1' }" />
          </a-col>
          <a-col :span="5">
            <a-statistic title="实际参与人数" :value="actualParticipants" :value-style="{ color: '#1890ff' }" />
          </a-col>
          <a-col :span="5">
            <a-statistic title="总中奖人数" :value="Object.values(awardStore.winnerMap).flat().length" :value-style="{ color: '#52c41a' }" />
          </a-col>
          <a-col :span="4">
            <a-statistic title="参与部门数" :value="departmentPieData.length" :value-style="{ color: '#faad14' }" />
          </a-col>
          <a-col :span="5">
            <a-statistic title="中奖率" :value="actualParticipants > 0 ? ((Object.values(awardStore.winnerMap).flat().length / actualParticipants) * 100).toFixed(1) : 0" suffix="%" :value-style="{ color: '#f5222d' }" />
          </a-col>
        </a-row>
      </div>

      <!-- 图表区域 -->
      <div class="charts-container">
        <a-row :gutter="[16, 16]">
          <!-- 部门参与人数分布 -->
          <a-col :span="12">
            <div class="chart-card">
              <div ref="departmentPieRef" class="chart"></div>
            </div>
          </a-col>

          <!-- 各奖项部门分布 -->
          <a-col :span="12">
            <div class="chart-card">
              <div ref="awardDistributionRef" class="chart"></div>
            </div>
          </a-col>

          <!-- 子部门统计 -->
          <a-col :span="24">
            <div class="chart-card">
              <div ref="subDepartmentBarRef" class="chart" style="height: 400px"></div>
            </div>
          </a-col>

        </a-row>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.statistics-container {
  .stats-overview {
    margin-bottom: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;
  }

  .charts-container {
    .chart-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .chart {
        width: 100%;
        height: 300px;
      }
    }
  }
}
</style>
