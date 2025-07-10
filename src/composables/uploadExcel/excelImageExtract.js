import JSZip from "jszip";
import { v4 as uuid } from "uuid";
import { dataURLToBlob } from "./uploadUtils";
import { message } from "ant-design-vue";

export const extractImagesFromExcel = async (file) => {
  // console.log("🚀 ~ extractImagesFromExcel ~ file:", file);
  // console.log("文件类型:", file.type);
  // console.log("文件大小:", file.size);
  // console.log("文件名:", file.name);

  let imageList = [];
  let implantBlobList = [];
  const zip = new JSZip();

  try {
    // 检查文件是否为.xlsx格式
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      console.log("文件不是.xlsx格式，跳过图片提取");
      return { imageList, implantBlobList };
    }
    // 将File转换为Blob
    console.log("开始加载ZIP文件...");
    const blob = new Blob([file], { type: file.type });
    let zipLoadRes;
    try {
      zipLoadRes = await zip.loadAsync(blob);
    } catch (zipError) {
      message.error(`ZIP加载失败，尝试使用ArrayBuffer: ${zipError}`);
      const arrayBuffer = await file.arrayBuffer();
      zipLoadRes = await zip.loadAsync(arrayBuffer);
    }
    // console.log("Excel文件结构:", zipLoadRes);
    // console.log("ZIP文件中的文件列表:", Object.keys(zipLoadRes.files));

    // 嵌入单元格图片
    const implantFile = zipLoadRes.files["xl/cellimages.xml"];
    if (implantFile) {
      const xmlContent = await implantFile.async("string");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        message.error(`XML 解析错误: ${xmlDoc.getElementsByTagName("parsererror")[0].textContent}`);
      } else {
        const cellImage = xmlDoc.querySelectorAll("etc\\:cellImage, cellImage");
        cellImage.forEach((cellImage) => {
          const picElement = cellImage.querySelector("xdr\\:pic, pic");
          if (picElement) {
            let obj = {};
            const nvPicPrElement = picElement.querySelector("xdr\\:nvPicPr, nvPicPr");
            const blipFillElement = picElement.querySelector("xdr\\:blipFill, blipFill");
            if (nvPicPrElement && blipFillElement) {
              const blipElement = blipFillElement.querySelector("a\\:blip, blip");
              if (blipElement) {
                const embedValue = blipElement.getAttribute("r:embed") || "";
                obj.rid = embedValue;
              }
              const cNvPrElement = nvPicPrElement.querySelector("xdr\\:cNvPr, cNvPr");
              if (cNvPrElement) {
                const nameValue = cNvPrElement.getAttribute("name") || "";
                obj.name = nameValue;
              }
              imageList.push(obj);
            }
          }
        });
      }
    } else {
      console.warn("未找到 xl/cellimages.xml 文件");
    }
    // rid查找图片media名称
    const implantRelsFile = zipLoadRes.files["xl/_rels/cellimages.xml.rels"];
    if (implantRelsFile) {
      const xmlRelsContent = await implantRelsFile.async("string");
      const parser = new DOMParser();
      const xmlRelsDoc = parser.parseFromString(xmlRelsContent, "text/xml");
      if (xmlRelsDoc.getElementsByTagName("parsererror").length > 0) {
        message.error(`XML 解析错误: ${xmlRelsDoc.getElementsByTagName("parsererror")[0].textContent}`);
      } else {
        const relationshipTags = xmlRelsDoc.querySelectorAll("Relationship");
        const blobUrlList = [];
        relationshipTags.forEach((relationship) => {
          const idValue = relationship.getAttribute("Id");
          const targetValue = relationship.getAttribute("Target") || "";
          const lastSlashIndex = targetValue.lastIndexOf("/");
          const imageName = targetValue.substring(lastSlashIndex + 1);
          const imageType = imageName.split(".")[1];
          blobUrlList.push(
            zip.file(`xl/media/${imageName}`)?.async("base64").then((res) => {
              let dataUrl = res;
              if (!res.includes("data:image")) {
                dataUrl = `data:image/${imageType};base64,${res}`;
              }
              const blob = dataURLToBlob(dataUrl);
              return {
                rid: idValue,
                blob,
              };
            })
          );
        });
        implantBlobList = await Promise.all(blobUrlList);
      }
    } else {
      console.warn("未找到 xl/_rels/cellimages.xml.rels 文件");
    }
    // console.log("提取的图片列表:", imageList);
    // console.log("图片Blob列表:", implantBlobList);
  } catch (err) {
    message.error(`提取图片失败: ${err}`);
    if (err.message.includes("Corrupted zip") || err.message.includes("unexpected signature")) {
      message.warn("文件格式不支持图片提取，继续处理数据");
    }
  }
  return { imageList, implantBlobList };
};

export const mergeImagesWithData = (results, imageList, implantBlobList) => {
  return results.map((item, itemIndex) => {
    const obj = { ...item };
    for (let keyName in obj) {
      if (obj[keyName] && typeof obj[keyName] === "string" && obj[keyName].startsWith("=DISPIMG")) {
        const regex = /=DISPIMG\("([^\"]+)",\d+\)/;
        const match = obj[keyName].match(regex);
        if (match) {
          const id = match[1];
          const rowImplantImgList = imageList.filter((img) => img.name === id);
          if (rowImplantImgList.length > 0) {
            rowImplantImgList.forEach((img) => {
              const imageInfo = implantBlobList.find((blobInfo) => blobInfo.rid === img.rid);
              if (imageInfo) {
                const fileName = `${uuid()}.${imageInfo.blob.type.split("/")[1]}`;
                const file = new File([imageInfo.blob], fileName, {
                  type: imageInfo.blob.type,
                });
                obj[keyName] = {
                  file,
                  blob: imageInfo.blob,
                  dataUrl: URL.createObjectURL(imageInfo.blob)
                };
              }
            });
          }
        }
      }
    }
    return obj;
  });
}; 