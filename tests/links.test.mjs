// tests/links.test.mjs
// Chạy: npm test
// Mọi đường dẫn nội bộ trong menu, chân trang, banner và thẻ cơ sở phải trỏ tới một trang có thật
// (src/pages), để đổi tên/xoá trang không để lại liên kết chết.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const FILES = [
  "src/components/SiteHeader.astro",
  "src/components/SiteFooter.astro",
  "src/components/home/HomeBanner.astro",
  "src/components/home/BranchesSection.astro",
];
// Đường dẫn gắn với tệp tĩnh/động, không phải trang.
const SKIP = new Set(["/uploads/", "/brand/"]);

const pageExists = (path) =>
  ["", "/index"].some((tail) => ["astro", "ts"].some((ext) => existsSync(`src/pages${path === "/" ? "/index" : path + tail}.${ext}`)));

test("liên kết nội bộ ở menu, chân trang, banner và thẻ cơ sở đều có trang", () => {
  const missing = [];
  let checked = 0;
  for (const file of FILES) {
    const source = readFileSync(file, "utf8");
    for (const [, path] of source.matchAll(/["'`](\/[a-z][a-z0-9/-]*)(?=[#?"'`$])/g)) {
      if (SKIP.has(path)) continue;
      checked++;
      if (!pageExists(path)) missing.push(`${file}: ${path}`);
    }
  }
  assert.ok(checked > 15, `chỉ tìm thấy ${checked} liên kết, regex có thể hỏng`);
  assert.deepEqual(missing, []);
});
