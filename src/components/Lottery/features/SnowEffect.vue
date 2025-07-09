<script setup>
import { ref, onMounted, onUnmounted } from "vue";

defineOptions({
  name: "SnowEffect"
});

const props = defineProps({
  speed: {
    type: Number,
    default: 2
  },
  interaction: {
    type: Boolean,
    default: true
  },
  size: {
    type: Number,
    default: 10
  },
  count: {
    type: Number,
    default: 30
  },
  startColor: {
    type: String,
    default: "rgba(253,252,251,1)"
  },
  endColor: {
    type: String,
    default: "rgba(251,252,253,0.3)"
  },
  opacity: {
    type: Number,
    default: 0.8
  },
  windPower: {
    type: Number,
    default: 2
  },
  image: {
    type: [Boolean, String],
    default: false
  }
});

const snowCanvas = ref(null);
const canvasWidth = ref(window.innerWidth);
const canvasHeight = ref(window.innerHeight);
const snowflakes = ref([]);
const animationFrameId = ref(null);
const mouseX = ref(null);
const mouseY = ref(null);

class Snowflake {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * -canvas.height;
    this.size = Math.random() * (options.sizeMax - options.sizeMin) + options.sizeMin;
    this.speed = Math.random() * options.speed;
    this.velocityY = this.speed;
    this.velocityX = (Math.random() - 0.5) * options.windPower;
    this.opacity = Math.random() * options.opacity;
    this.color = options.useImage ? null : this.lerpColor(options.startColor, options.endColor, Math.random());
    this.image = options.image;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
  }

  lerpColor(color1, color2, ratio) {
    // 简单的颜色插值实现
    const hex = color => {
      const rgb = color.match(/\d+/g);
      return {
        r: parseInt(rgb[0]),
        g: parseInt(rgb[1]),
        b: parseInt(rgb[2]),
        a: parseFloat(rgb[3] || 1)
      };
    };

    const c1 = hex(color1);
    const c2 = hex(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
    const a = c1.a + (c2.a - c1.a) * ratio;

    return `rgba(${r},${g},${b},${a})`;
  }

  update(mouseX, mouseY, interaction) {
    this.y += this.velocityY;
    this.x += this.velocityX;
    this.angle += this.rotationSpeed;

    // 鼠标交互效果
    if (interaction && mouseX !== null && mouseY !== null) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        const force = 100 / distance;
        this.x -= dx * force * 0.01;
        this.y -= dy * force * 0.01;
      }
    }

    // 边界检查
    if (this.y > this.canvas.height) {
      this.y = Math.random() * -50;
      this.x = Math.random() * this.canvas.width;
    }

    if (this.x > this.canvas.width + this.size) {
      this.x = -this.size;
    } else if (this.x < -this.size) {
      this.x = this.canvas.width + this.size;
    }
  }

  draw() {
    this.ctx.save();
    this.ctx.translate(this.x, this.y);
    this.ctx.rotate(this.angle);

    if (this.image) {
      this.ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      this.ctx.fillStyle = this.color;
      this.ctx.globalAlpha = this.opacity;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }
}

const initSnowflakes = () => {
  const canvas = snowCanvas.value;
  const options = {
    speed: props.speed,
    sizeMin: props.size * 0.5,
    sizeMax: props.size * 1.5,
    windPower: props.windPower,
    opacity: props.opacity,
    startColor: props.startColor,
    endColor: props.endColor,
    useImage: !!props.image,
    image: null
  };

  if (props.image && typeof props.image === "string") {
    const img = new Image();
    img.src = props.image;
    options.image = img;
  }

  snowflakes.value = Array.from({ length: props.count }, () => new Snowflake(canvas, options));
};

const animate = () => {
  const canvas = snowCanvas.value;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snowflakes.value.forEach(flake => {
    flake.update(mouseX.value, mouseY.value, props.interaction);
    flake.draw();
  });

  animationFrameId.value = requestAnimationFrame(animate);
};

const handleResize = () => {
  canvasWidth.value = window.innerWidth;
  canvasHeight.value = window.innerHeight;
};

const handleMouseMove = e => {
  if (!props.interaction) return;
  const rect = snowCanvas.value.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
};

const handleMouseLeave = () => {
  mouseX.value = null;
  mouseY.value = null;
};

onMounted(() => {
  initSnowflakes();
  animate();

  window.addEventListener("resize", handleResize);

  if (props.interaction) {
    window.addEventListener("mousemove", handleMouseMove);
    snowCanvas.value.addEventListener("mouseleave", handleMouseLeave);
  }
});

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }

  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", handleMouseMove);

  if (snowCanvas.value) {
    snowCanvas.value.removeEventListener("mouseleave", handleMouseLeave);
  }
});
</script>

<template>
  <canvas class="snow-canvas" ref="snowCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
</template>

<style scoped>
.snow-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
