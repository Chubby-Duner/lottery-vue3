// #region 动画相关
export default function useAnimation({ isMoving, wrapPosition, lotteryWrap, animationFrame, speed, animationPaused }) {
  const startAnimation = () => {
    // 如果动画被暂停，则不启动
    if (animationPaused.value) {
      return;
    }
    let lastTime = 0;
    let scrollHeight = 0; // 缓存scrollHeight，避免重复查询DOM
    let frameCount = 0; // 帧数计数器
    let lastFrameTime = 0; // 上一帧时间
    let performanceWarning = false; // 性能警告标志
    const animate = timestamp => {
      if (!isMoving.value) return;
      if (!lotteryWrap.value) return; // 防止空指针
      // 性能检测：计算FPS
      frameCount++;
      if (timestamp - lastFrameTime >= 1000) { // 每秒检测一次
        const fps = frameCount;
        frameCount = 0;
        lastFrameTime = timestamp;
        // 如果FPS低于30，启用性能优化模式
        if (fps < 30 && !performanceWarning) {
          performanceWarning = true;
          console.warn('动画性能较低，启用优化模式');
        }
      }
      // 只在第一次或必要时更新scrollHeight
      if (scrollHeight === 0) {
        scrollHeight = lotteryWrap.value.scrollHeight;
      }
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      // 性能优化模式：降低动画速度
      const currentSpeed = performanceWarning ? speed.value * 0.7 : speed.value;
      wrapPosition.value -= currentSpeed;
      // 使用缓存的scrollHeight
      if (-wrapPosition.value >= scrollHeight / 2) {
        wrapPosition.value = 0;
      }
      animationFrame.value = window.requestAnimationFrame(animate);
    };
    // 立即获取一次scrollHeight
    if (lotteryWrap.value) {
      scrollHeight = lotteryWrap.value.scrollHeight;
    }
    // 重置性能警告
    performanceWarning = false;
    frameCount = 0;
    lastFrameTime = 0;
    animationFrame.value = window.requestAnimationFrame(animate);
  };
  const cancelAnimation = () => {
    if (animationFrame.value) {
      window.cancelAnimationFrame(animationFrame.value);
      animationFrame.value = null;
    }
  };
  return {
    startAnimation,
    cancelAnimation
  }
} 