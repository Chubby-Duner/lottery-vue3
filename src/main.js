import { createApp } from 'vue'
import { createPinia } from "pinia";
import App from './App.vue'
import router from './router'
import { setupAntd } from './plugins/antdv'
import "../src/styles/index.scss"
import "../src/styles/animate.css"

const app = createApp(App)
const store = createPinia();

setupAntd(app)
app
  .use(router)
  .use(store);
app.mount('#app')
