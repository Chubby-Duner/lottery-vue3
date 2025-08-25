import axios from 'axios'
import { message } from 'ant-design-vue'

// 创建axios实例
const request = axios.create({
  baseURL: `${window.location.protocol}//${window.location.hostname}:3000/api`,
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    // 可以在这里添加token等认证信息
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config
  },
  (error) => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    const { data } = response

    // 如果响应成功
    if (data.code === 100200) {
      return data
    } else {
      // 业务错误处理
      const errorMsg = `code: ${data.code}, message: ${data.message || '请求失败'}`
      message.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }
  },
  (error) => {
    // 对响应错误做点什么
    console.error('响应错误:', error)

    let errorMessage = '网络错误'

    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response

      switch (status) {
        case 400:
          errorMessage = data.code ? `code: ${data.code} message: ${data.message || '请求参数错误'}` : '请求参数错误'
          break
        case 401:
          errorMessage = data.code ? `code: ${data.code} message: ${data.message || '未授权，请重新登录'}` : '未授权，请重新登录'
          // 可以在这里处理登录过期逻辑
          break
        case 403:
          errorMessage = data.code ? `code: ${data.code} message: ${data.message || '拒绝访问'}` : '拒绝访问'
          break
        case 404:
          errorMessage = data.code ? `code: ${data.code} message: ${data.message || '请求的资源不存在'}` : '请求的资源不存在'
          break
        case 410:
          errorMessage = data.code ? `code: ${data.code} message: ${data.message || '资源已过期'}` : '资源已过期'
          break
        case 500:
          errorMessage = data.code ? `code: ${data.code} message: ${data.message || '服务器内部错误'}` : '服务器内部错误'
          break
        default:
          errorMessage = data.code ? `code: ${data.code} message: ${data.message || `请求失败 (${status})`}` : `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接超时，请检查网络'
    } else {
      // 其他错误
      errorMessage = error.message || '请求失败'
    }

    message.error(errorMessage)
    return Promise.reject(error)
  }
)

export default request