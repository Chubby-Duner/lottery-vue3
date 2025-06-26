<script setup>
import { ref, onMounted } from 'vue'
import useLocalStorage from '@/composables/useLocalStorage'

const { storedValue: musicState, setValue: setMusicState } = useLocalStorage('music', '1')
const isMusicPlaying = ref(musicState.value === '1')
const audioElement = ref(null)

onMounted(() => {
  audioElement.value = new Audio(require('@/assets/audio/shiji.mp3'))
  audioElement.value.loop = true
  
  if (isMusicPlaying.value) {
    audioElement.value.play().catch(e => console.log('Autoplay prevented:', e))
  }
})

const toggleMusic = () => {
  isMusicPlaying.value = !isMusicPlaying.value
  setMusicState(isMusicPlaying.value ? '1' : '0')
  
  if (isMusicPlaying.value) {
    audioElement.value.play()
  } else {
    audioElement.value.pause()
  }
}
</script>

<template>
  <a 
    id="music-control" 
    href="javascript:;" 
    @click="toggleMusic"
    :class="{ 'animated infinite bounce': isMusicPlaying }"
  ></a>
</template>

<style scoped>
#music-control {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: url('@/assets/images/music-icon.png') no-repeat center;
  background-size: contain;
  z-index: 1000;
  cursor: pointer;
}
</style>