<script setup>
import { ref, onMounted, watch } from "vue";
import { useMusicStore } from "@/store/musicStore";
import shijiMp3 from "@/assets/audio/shiji.mp3";

defineOptions({
  name: "MusicControl"
});

const musicStore = useMusicStore();
const audioElement = ref(null);

onMounted(() => {
  if (audioElement.value) {
    audioElement.value.loop = true;
    if (musicStore.isMusicPlaying) {
      audioElement.value.play().catch(e => {
        // 自动播放被拦截，等待用户交互
        const tryPlay = () => {
          audioElement.value.play();
          window.removeEventListener("click", tryPlay);
        };
        window.addEventListener("click", tryPlay);
      });
    }
  }
});

watch(
  () => musicStore.isMusicPlaying,
  newVal => {
    if (!audioElement.value) return;
    if (newVal) {
      audioElement.value.play();
    } else {
      audioElement.value.pause();
    }
  }
);

const toggleMusic = () => {
  musicStore.toggleMusic();
};
</script>

<template>
  <a id="music-control" href="javascript:;" @click="toggleMusic" :class="{ 'animated infinite bounce': musicStore.isMusicPlaying }"></a>
  <audio ref="audioElement" :src="shijiMp3" style="display: none" />
</template>

<style scoped>
#music-control {
  position: fixed;
  bottom: 50px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: url("@/assets/images/music.png") no-repeat center;
  background-size: contain;
  z-index: 1000;
  cursor: pointer;
}
</style>
