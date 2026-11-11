// src/server/rich-text.ts
//
// Lọc HTML của bài viết. Trình soạn thảo chỉ tạo ra một nhóm thẻ nhỏ, nhưng dữ liệu gửi lên server không
// đáng tin (có thể đến từ tài khoản bị lộ hoặc từ request tự dựng), nên MỌI nội dung đều qua bộ lọc này
// trước khi lưu và một lần nữa trước khi hiển thị. Chỉ thẻ/thuộc tính trong danh sách cho phép được giữ lại.

import sanitizeHtml from "sanitize-html";

const COLOR = [/^#(?:[0-9a-f]{3}){1,2}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "h2", "br", "strong", "em", "u", "a", "span", "ul", "ol", "li"],
  allowedAttributes: { a: ["href", "target", "rel"], span: ["style"] },
  // Chỉ cho phép đúng thuộc tính `color` trên <span>; mọi kiểu dáng khác (position, background...) bị bỏ.
  allowedStyles: { span: { color: COLOR } },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    // Tiêu đề lớn hơn / nhỏ hơn trong nội dung dán vào đều quy về một cấp duy nhất.
    h1: "h2",
    h3: "h2",
    h4: "h2",
    b: "strong",
    i: "em",
    a: (tag, attribs) => {
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
  },
};

export function sanitizeBody(html: string): string {
  // Đoạn trống (Enter thừa ở cuối hoặc giữa bài) bỏ đi: khoảng cách giữa các đoạn do kiểu trang quyết định.
  return sanitizeHtml(html, OPTIONS)
    .replace(/<p>(?:\s|<br\s*\/?>)*<\/p>/gi, "")
    .trim();
}

/** Chữ thuần của nội dung (để đếm độ dài, kiểm tra rỗng, và làm tóm tắt). */
export function htmlToText(html: string): string {
  // Hết một khối thì thêm dấu cách, để "đoạn một" và "mục" không dính thành một từ.
  return sanitizeHtml(html.replace(/<\/(?:p|h2|li)>|<br\s*\/?>/gi, " "), { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
