<template>
  <div class="not-found-bg">
    <div class="not-found-card">
      <div class="not-found-svg">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="60" fill="#f2f6fc"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".35em" font-size="48" fill="#409eff" font-weight="bold">404</text>
        </svg>
      </div>
      <h1>页面未找到</h1>
      <p>抱歉，您访问的页面不存在或已被删除。</p>
      <button @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  methods: {
    goHome() {
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.not-found-bg {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
}

.not-found-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(64, 158, 255, 0.08);
  padding: 48px 32px 32px 32px;
  text-align: center;
  max-width: 350px;
  width: 90vw;
  animation: fadeIn 0.8s;
}

.not-found-svg {
  margin-bottom: 16px;
}

h1 {
  font-size: 32px;
  margin-bottom: 12px;
  color: #409eff;
  font-weight: bold;
}

p {
  color: #888;
  margin-bottom: 28px;
  font-size: 16px;
}

button {
  padding: 10px 36px;
  font-size: 16px;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, background 0.2s;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}

button:hover {
  background: linear-gradient(90deg, #66b1ff 0%, #409eff 100%);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.18);
}

@media (max-width: 500px) {
  .not-found-card {
    padding: 32px 8vw 24px 8vw;
    max-width: 98vw;
  }
  h1 {
    font-size: 24px;
  }
  .not-found-svg svg {
    width: 80px;
    height: 80px;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 