// src/server/db.ts
//
// Kết nối SQLite và các bước tạo bảng. Dùng `node:sqlite` có sẵn trong Node 22, không cần
// module native. API này còn được Node đánh dấu thử nghiệm: toàn bộ chỗ dùng nó nằm trong
// thư mục `src/server`, đổi sang thư viện khác chỉ phải sửa ở đây.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Db = DatabaseSync;

// Mỗi phần tử là một bước nâng cấp, chạy theo thứ tự; `PRAGMA user_version` nhớ đã chạy tới đâu.
// Không bao giờ sửa bước đã phát hành: thêm bước mới ở cuối.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'editor')),
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    INTEGER NOT NULL,
    last_login_at INTEGER
  );
  CREATE TABLE sessions (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);
  CREATE TABLE login_failures (
    id       INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    ip       TEXT NOT NULL,
    at       INTEGER NOT NULL
  );
  CREATE INDEX login_failures_at ON login_failures(at);
  CREATE TABLE audit_log (
    id       INTEGER PRIMARY KEY,
    at       INTEGER NOT NULL,
    user_id  INTEGER,
    username TEXT,
    action   TEXT NOT NULL,
    target   TEXT,
    detail   TEXT
  );
  CREATE INDEX audit_at ON audit_log(at DESC);
  `,
  `
  CREATE TABLE feature_flags (
    key        TEXT PRIMARY KEY,
    enabled    INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT
  );
  CREATE TABLE site_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT
  );
  `,
  `
  CREATE TABLE posts (
    id           INTEGER PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    summary      TEXT NOT NULL,
    body         TEXT NOT NULL,
    status       TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    published_at INTEGER,
    created_at   INTEGER NOT NULL,
    created_by   TEXT,
    updated_at   INTEGER NOT NULL,
    updated_by   TEXT
  );
  CREATE INDEX posts_published ON posts (status, published_at DESC);
  CREATE TABLE post_images (
    id       INTEGER PRIMARY KEY,
    post_id  INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    file     TEXT NOT NULL,
    caption  TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL
  );
  CREATE INDEX post_images_post ON post_images (post_id, position);
  `,
  // Bài viết trước đây là văn bản thuần ('text'); trình soạn thảo mới lưu HTML đã lọc ('html').
  `
  ALTER TABLE posts ADD COLUMN body_format TEXT NOT NULL DEFAULT 'text' CHECK (body_format IN ('text', 'html'));
  `,
];

export function migrate(db: Db): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let i = row.user_version; i < MIGRATIONS.length; i++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

/** Mở (và nâng cấp) một file DB. Truyền ":memory:" cho test. */
export function openDb(file: string): Db {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  if (file !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  migrate(db);
  return db;
}

let shared: Db | undefined;

/** DB dùng chung của cả tiến trình. Thư mục dữ liệu lấy từ biến môi trường DATA_DIR. */
export function getDb(): Db {
  shared ??= openDb(`${process.env.DATA_DIR ?? "./data"}/app.db`);
  return shared;
}
