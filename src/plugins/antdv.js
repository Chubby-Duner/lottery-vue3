// import { App } from 'vue'
import {
  Button,
  Upload,
  UploadDragger,
  Progress,
  Alert,
  Tag,
  Table,
  Modal,
  Spin,
  message,
  Empty,
  InputNumber,
  Space,
  Switch,
  Input,
  InputSearch,
  Popconfirm,
  Timeline,
  TimelineItem,
  Row,
  Col,
  Statistic
} from 'ant-design-vue'

const components = [
  Button,
  Upload,
  UploadDragger,
  Progress,
  Alert,
  Tag,
  Table,
  Modal,
  Spin,
  message,
  Empty,
  InputNumber,
  Space,
  Switch,
  Input,
  InputSearch,
  Popconfirm,
  Timeline,
  TimelineItem,
  Row,
  Col,
  Statistic
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
