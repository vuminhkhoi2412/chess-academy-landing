// src/server/uploads.ts
//
// Ảnh tải lên cho bài đăng: kiểm tra đúng là ảnh, xoay theo EXIF rồi XOÁ toàn bộ EXIF (kể cả toạ độ
// GPS), thu nhỏ và đổi sang webp. Tên file là chuỗi ngẫu nhiên, không dùng tên người tải lên.

import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { POSTS_POLICY } from "./policy.ts";

export class UploadError extends Error {}

const NAME = /^[a-f0-9]{32}\.webp$/;
const ACCEPTED = new Set(["jpeg", "png", "webp", "heif", "gif"]);

export function isUploadName(name: string): boolean {
  return NAME.test(name);
}

export function uploadsDir(): string {
  return join(process.env.DATA_DIR ?? "./data", "uploads");
}

/** Xử lý ảnh trong bộ nhớ, chưa ghi đĩa; dùng được cho test. */
export async function processImage(input: Uint8Array): Promise<Buffer> {
  if (input.byteLength === 0) throw new UploadError("File trống.");
  if (input.byteLength > POSTS_POLICY.maxUploadBytes)
    throw new UploadError(`Ảnh lớn quá ${POSTS_POLICY.maxUploadBytes / 1024 / 1024} MB. Hãy chọn ảnh nhỏ hơn.`);
  try {
    const meta = await sharp(input).metadata();
    if (!meta.format || !ACCEPTED.has(meta.format)) throw new UploadError("Chỉ nhận ảnh JPG, PNG, WebP hoặc HEIC.");
    return await sharp(input)
      .rotate()
      .resize({ width: POSTS_POLICY.imageMaxWidth, withoutEnlargement: true })
      .webp({ quality: POSTS_POLICY.imageQuality })
      .toBuffer();
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("Không đọc được file này như một tấm ảnh.");
  }
}

export async function saveImage(input: Uint8Array): Promise<string> {
  const data = await processImage(input);
  const name = `${randomBytes(16).toString("hex")}.webp`;
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(join(uploadsDir(), name), data);
  return name;
}

export async function readImage(name: string): Promise<Buffer | null> {
  if (!isUploadName(name)) return null;
  try {
    return await readFile(join(uploadsDir(), name));
  } catch {
    return null;
  }
}

export async function deleteImages(names: string[]): Promise<void> {
  await Promise.all(names.filter(isUploadName).map((name) => rm(join(uploadsDir(), name), { force: true })));
}
