import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { root, alias, pathResolve, warpperEnv } from "./build/utils";


// https://vite.dev/config/
export default ({ mode }) => {
  const { VITE_PORT, VITE_PUBLIC_PATH } = warpperEnv(loadEnv(mode, root));
  return {
    base: "/lottery-vue3/",
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {},
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    plugins: [vue()],
    optimizeDeps: {
      include: ['pinia'],  // 显式包含 Pinia
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
          // 手动分包
          // manualChunks: {
          //   vue: ["vue", "pinia", "vue-router"],
          //   "ant-design-vue": ["ant-design-vue"],
          // }
        }
      }
    }
  };
}
