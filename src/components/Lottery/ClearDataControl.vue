<script setup>
import { useRouter } from 'vue-router'
import useLocalStorage from '@/composables/useLocalStorage'

const router = useRouter()
const { clear: clearLocalStorage } = useLocalStorage()

const confirmClear = () => {
  if (confirm('警告：确定清除所有数据？！')) {
    clearAllData()
  }
}

const clearAllData = () => {
  // 清除所有相关 localStorage 数据
  clearLocalStorage()
  
  // 如果需要，可以在这里添加清除其他数据的逻辑
  
  // 刷新页面
  router.go(0)
}
</script>

<template>
  <a 
    id="clear-control" 
    href="javascript:;" 
    @click="confirmClear"
  ></a>
</template>

<style scoped>
#clear-control {
  position: fixed;
  bottom: 70px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: url('@/assets/images/clear-icon.png') no-repeat center;
  background-size: contain;
  z-index: 1000;
  cursor: pointer;
}
</style>