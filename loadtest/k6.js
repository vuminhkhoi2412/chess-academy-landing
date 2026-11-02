// Chạy trang:  k6 run -e BASE_URL=https://<ban-preview>.vercel.app loadtest/k6.js
// Chạy form:   k6 run -e SHEETS_URL=https://script.google.com/macros/s/<SHEET_TEST>/exec loadtest/k6.js
// CHỈ trỏ SHEETS_URL vào bản sao Apps Script + Sheet dùng để test, không bao giờ vào Sheet thật.
import http from "k6/http";
import { check, sleep } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const { BASE_URL, SHEETS_URL } = __ENV;

// Tăng dần để thấy điểm gãy: đọc cột http_req_failed và p(95) ở từng nấc trong kết quả.
const ramp = (peak) => [
  { duration: "30s", target: peak / 4 },
  { duration: "1m", target: peak / 2 },
  { duration: "1m", target: peak },
  { duration: "30s", target: 0 },
];

export const options = {
  scenarios: {
    ...(BASE_URL && {
      page: { executor: "ramping-vus", exec: "page", stages: ramp(200) },
    }),
    // Apps Script chịu được rất ít luồng đồng thời, nên đỉnh form chỉ 20.
    ...(SHEETS_URL && {
      form: { executor: "ramping-vus", exec: "form", stages: ramp(20) },
    }),
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

export function page() {
  // BYPASS: secret "Protection Bypass for Automation" của Vercel, chỉ cần khi preview bị khóa.
  const headers = __ENV.BYPASS ? { "x-vercel-protection-bypass": __ENV.BYPASS } : {};
  check(http.get(BASE_URL, { headers }), { "200": (r) => r.status === 200 });
  sleep(1);
}

export function form() {
  const body = JSON.stringify({
    child_name: "LOADTEST bé",
    child_age: "10 tuổi",
    parent_name: "LOADTEST phụ huynh",
    phone: "0900000000",
    branch: "Test",
    branch_address: "Test",
    program: "Test",
    level_label: "Test",
    level_code: "auto",
    tuition_estimate: 0,
    note: "loadtest",
    submission_id: uuidv4(), // mỗi lượt một id, nếu không Code.gs coi là trùng và bỏ qua
    _hp: "",
  });
  const r = http.post(SHEETS_URL, body, { headers: { "Content-Type": "text/plain;charset=utf-8" } });
  check(r, { "2xx": (res) => res.status >= 200 && res.status < 400 });
  sleep(1);
}
