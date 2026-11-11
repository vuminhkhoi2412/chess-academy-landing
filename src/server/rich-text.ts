// src/server/rich-text.ts
//
// Lọc HTML của bài viết. Trình soạn thảo chỉ tạo ra một nhóm thẻ nhỏ, nhưng dữ liệu gửi lên server không
// đáng tin (có thể đến từ tài khoản bị lộ hoặc từ request tự dựng), nên MỌI nội dung đều qua bộ lọc này
// trước khi lưu và một lần nữa trước khi hiển thị. Chỉ thẻ/thuộc tính trong danh sách cho phép được giữ lại.

import sanitizeHtml from "sanitize-html";

const COLOR = [/^#(?:[0-9a-f]{3}){1,2}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i];
const ALIGN = [/^(?:left|center|right|justify)$/];
const BLOCK_STYLE = { "text-align": ALIGN };

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h1", "h2", "h3", "h4", "br", "strong", "em", "u", "a", "span", "ul", "ol", "li",
    // Danh sách việc cần làm (checklist) của trình soạn: <ul data-type="taskList"> với <label><input></label><div>.
    "label", "input", "div",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["style"],
    p: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    ul: ["data-type"],
    li: ["data-type", "data-checked"],
    input: ["type", "checked", "disabled"],
  },
  // Chỉ cho phép đúng `color` trên <span> và `text-align` trên đoạn/tiêu đề; mọi kiểu dáng khác bị bỏ.
  allowedStyles: {
    span: { color: COLOR },
    p: BLOCK_STYLE,
    h1: BLOCK_STYLE,
    h2: BLOCK_STYLE,
    h3: BLOCK_STYLE,
    h4: BLOCK_STYLE,
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    b: "strong",
    i: "em",
    a: (_tag, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName: "a",
        attribs: {
          href,
          ...(external ? { target: "_blank" } : {}),
          rel: "noopener noreferrer nofollow",
        },
      };
    },
    // Ô tích của checklist chỉ để xem: luôn là checkbox, luôn bị khoá, người đọc không đổi được.
    input: (_tag, attribs) => ({
      tagName: "input",
      attribs: { type: "checkbox", disabled: "disabled", ...("checked" in attribs ? { checked: "checked" } : {}) },
    }),
  },
};

export function sanitizeBody(html: string): string {
  // Đoạn trống (Enter thừa ở cuối hoặc giữa bài) bỏ đi: khoảng cách giữa các đoạn do kiểu trang quyết định.
  return sanitizeHtml(html, OPTIONS)
    .replace(/<p(?:\s[^>]*)?>(?:\s|<br\s*\/?>)*<\/p>/gi, "")
    .trim();
}

/** Chữ thuần của nội dung (để đếm độ dài, kiểm tra rỗng, và làm tóm tắt). */
export function htmlToText(html: string): string {
  // Hết một khối thì thêm dấu cách, để "đoạn một" và "mục" không dính thành một từ.
  return sanitizeHtml(html.replace(/<\/(?:p|h[1-4]|li|div)>|<br\s*\/?>/gi, " "), { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
