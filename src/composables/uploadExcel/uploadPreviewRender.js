import { h } from "vue";

export function renderImageCell({ text }) {
  if (text && typeof text === "object" && text.dataUrl) {
    return {
      children: h(
        "img",
        {
          src: text.dataUrl,
          style: {
            maxWidth: "60px",
            maxHeight: "60px",
            objectFit: "contain",
            borderRadius: "4px",
            display: "block",
            margin: "0 auto"
          },
          alt: "头像",
          onError: e => {
            e.target.style.display = "none";
          }
        },
        null
      )
    };
  }
  return "无";
} 