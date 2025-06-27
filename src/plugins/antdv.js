// import { App } from 'vue'
import {
  Button,
  Upload,
  Progress,
  Alert,
  Tag,
  Table,
  Modal,
  message,
} from 'ant-design-vue'

const components = [
  Button,
  Upload,
  Progress,
  Alert,
  Tag,
  Table,
  Modal
]

const plugins = []

export const setupAntd = (app) => {
  // 全局注册组件
  components.forEach((component) => {
    app.component(component.name, component);
  });
  // 全局注册插件
  plugins.forEach(plugin => {
    app.use(plugin);
  });
}
