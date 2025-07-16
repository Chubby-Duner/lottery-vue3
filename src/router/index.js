import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

/** 获取路由历史模式 https://next.router.vuejs.org/zh/guide/essentials/history-mode.html */
const getHistoryMode = (routerHistory) => {
  // len为1 代表只有历史模式 为2 代表历史模式中存在base参数 https://next.router.vuejs.org/zh/api/#%E5%8F%82%E6%95%B0-1
  const historyMode = routerHistory.split(",");
  const leftMode = historyMode[0];
  const rightMode = historyMode[1];
  // no param
  if (historyMode.length === 1) {
    if (leftMode === "hash") {
      return createWebHashHistory("");
    } else if (leftMode === "h5") {
      return createWebHistory("");
    }
  } //has param
  else if (historyMode.length === 2) {
    if (leftMode === "hash") {
      return createWebHashHistory(rightMode);
    } else if (leftMode === "h5") {
      return createWebHistory(rightMode);
    }
  }
}

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Lottery',
    component: () => import('../views/Lottery.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/error/404.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes,
  strict: true
})

export default router
