import { createRouter, createWebHistory } from 'vue-router'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Lottery',
    component: () => import('../views/Lottery.vue')
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory("/lottery-vue3/"),
  routes
})

export default router
