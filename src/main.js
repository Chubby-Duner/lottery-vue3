import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import router from './router'
import { setupAntd } from './plugins/antdv'

const app = createApp(App)


setupAntd(app)
app
  .use(router)
  // .use(setupAntd)
app.mount('#app')
