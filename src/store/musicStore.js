import { defineStore } from "pinia";

export const useMusicStore = defineStore("musicStore", {
  state: () => ({
    isMusicPlaying: true, // 默认播放
  }),
  actions: {
    toggleMusic() {
      this.isMusicPlaying = !this.isMusicPlaying;
    },
    setMusicState(val) {
      this.isMusicPlaying = val;
    },
  },
}); 