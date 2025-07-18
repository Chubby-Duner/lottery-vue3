<script setup>
import { ref, onMounted, watch } from "vue";
import { useMusicStore } from "@/store/musicStore";
import { defineEmits } from "vue";
import shijiMp3 from "@/assets/audio/shiji.mp3";

defineOptions({
  name: "MusicControl"
});

const emit = defineEmits(["musicLoaded"]);
const musicStore = useMusicStore();
const audioElement = ref(null);

onMounted(() => {
  if (audioElement.value) {
    audioElement.value.loop = true;
    // 音乐加载完成时派发事件
    audioElement.value.addEventListener(
      "canplaythrough",
      () => {
        // 这里延时是为了启动页效果更好，可自行删掉
        setTimeout(() => {
          emit("musicLoaded");
        }, 1000);
      },
      { once: true }
    );

    // 直接播放，不再处理拦截
    if (musicStore.isMusicPlaying) {
      audioElement.value.play();
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
