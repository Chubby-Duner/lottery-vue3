import * as XLSX from "xlsx";
import { message } from "ant-design-vue";

// 通用工具函数

// base64转blob
export const dataURLToBlob = (dataURL) => {
  const arr = dataURL.split(",");
  const mimeType = arr[0].match(/:(.*?);/)?.[1];
  const base64Data = arr[1];
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

// 读取文件为ArrayBuffer
export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsArrayBuffer(file);
  });
};

// 获取表头行
export const getHeaderRow = (sheet) => {
  const headers = [];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ c: col, r: range.s.r })];
    // 只取有内容的表头
    if (cell && cell.t && XLSX.utils.format_cell(cell).trim() !== "") {
      headers.push(XLSX.utils.format_cell(cell));
    }
  }
  return headers;
};

// 处理图片加载错误
export const handleImageError = (event) => {
  message.warn(`图片加载失败: ${event.target.src}`);
  event.target.style.display = 'none';
}; 