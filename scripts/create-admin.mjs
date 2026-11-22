// scripts/create-admin.mjs
//
// Tạo tài khoản quản trị đầu tiên (trang quản trị không có đăng ký công khai).
//   npm run admin:create -- <ten.dang.nhap> "<Tên hiển thị>"
// Mật khẩu lấy từ biến ADMIN_PASSWORD, nếu không có thì được hỏi và không hiện lên màn hình.
// Dữ liệu nằm ở $DATA_DIR/app.db (mặc định ./data/app.db), cùng nơi server đọc.
import { createInterface } from "node:readline";
import { AuthError, countUsers, createUser } from "../src/server/auth.ts";
import { getDb } from "../src/server/db.ts";

const [username, displayName] = process.argv.slice(2);
if (!username || !displayName) {
  console.error('Cách dùng: npm run admin:create -- <ten.dang.nhap> "<Tên hiển thị>"');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) process.stdout.write(question);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Mật khẩu: "));

try {
  const db = getDb();
  const first = countUsers(db) === 0;
  createUser(db, { username, displayName, password, role: "admin" }, null);
  console.log(`Đã tạo quản trị "${username.trim().toLowerCase()}"${first ? " (tài khoản đầu tiên)" : ""}.`);
} catch (error) {
  if (error instanceof AuthError) {
    console.error(`Không tạo được: ${error.message}`);
    process.exit(1);
  }
  throw error;
}
