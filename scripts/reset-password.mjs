// scripts/reset-password.mjs
//
// Đặt lại mật khẩu khi quản trị duy nhất quên mật khẩu (không còn ai đăng nhập để đặt giúp).
//   npm run admin:reset -- <ten.dang.nhap>
// Mật khẩu mới lấy từ biến ADMIN_PASSWORD, nếu không có thì được hỏi và không hiện lên màn hình.
// Trong Docker: docker compose exec app npm run admin:reset -- <ten.dang.nhap>
import { createInterface } from "node:readline";
import { AuthError, resetPassword } from "../src/server/auth.ts";
import { getDb } from "../src/server/db.ts";

const [username] = process.argv.slice(2);
if (!username) {
  console.error("Cách dùng: npm run admin:reset -- <ten.dang.nhap>");
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

try {
  const db = getDb();
  const user = db.prepare("SELECT id, username FROM users WHERE username = ?").get(username.trim().toLowerCase());
  if (!user) {
    console.error(`Không có tài khoản "${username}".`);
    process.exit(1);
  }
  const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Mật khẩu mới: "));
  // Người thực hiện ghi vào nhật ký là chính tài khoản này, kèm dấu hiệu làm từ dòng lệnh.
  resetPassword(db, user.id, password, { id: user.id, username: `${user.username} (dòng lệnh)` });
  console.log(`Đã đặt lại mật khẩu cho "${user.username}". Mọi phiên đăng nhập cũ đã hết hiệu lực.`);
} catch (error) {
  if (error instanceof AuthError) {
    console.error(`Không đặt lại được: ${error.message}`);
    process.exit(1);
  }
  throw error;
}
