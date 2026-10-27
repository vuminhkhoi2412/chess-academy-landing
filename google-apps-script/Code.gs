// google-apps-script/Code.gs
//
// Bản nguồn để ĐỌC và DÁN vào Extensions → Apps Script của Google Sheet; không được build
// hay import vào bundle. Hướng dẫn từng bước: docs/google-sheets-setup.md.
// Tên trường payload khớp với src/lib/enrolment.ts; sửa một bên phải sửa bên kia.
//
// Sau MỖI lần sửa file này phải Deploy → Manage deployments → Edit → New version,
// nếu không web app vẫn chạy bản cũ.

// ID nằm trong URL sheet: https://docs.google.com/spreadsheets/d/<ID>/edit
// Mặc định là sheet test; chuyển sang sheet thật chỉ cần sửa dòng này rồi deploy version mới.
const SPREADSHEET_ID = "1Zy_w09HQbZzotiUXPdZrRCMt0qgb-MuMuhYO83YqY-k";
const SHEET_NAME = "Đăng ký";
// Lần gửi dính bẫy spam được giữ lại ở đây thay vì bỏ, phòng trình duyệt tự điền nhầm ô ẩn
// làm mất một đăng ký thật.
const SPAM_SHEET_NAME = "Spam?";
const STATUSES = ["Mới", "Đã liên hệ", "Đã đăng ký", "Huỷ"];

const HEADERS = [
  "Thời gian gửi", "Trạng thái", "Họ tên bé", "Năm sinh / tuổi", "Họ tên phụ huynh",
  "SĐT Zalo", "Cơ sở", "Địa chỉ cơ sở", "Chương trình", "Cấp độ dự kiến", "Mã cấp độ",
  "Học phí tạm tính (đ)", "Ghi chú", "Mã gửi",
];
const COL_TUITION = 12;
const COL_ID = 14;
// Dài hơn timeout 10 giây của trình duyệt: lúc quá tải phụ huynh thấy lỗi và bấm Thử lại
// (an toàn nhờ chống trùng), thay vì thấy "đã gửi" mà không có dòng nào.
const LOCK_WAIT_MS = 30000;

// Mở URL /exec trên trình duyệt: thấy "ok" nghĩa là bản deploy đang sống.
function doGet() {
  return ContentService.createTextOutput("ok");
}

function validate_(p) {
  const required = ["child_name", "parent_name", "phone", "submission_id"];
  for (let i = 0; i < required.length; i++) {
    if (!p[required[i]]) return "missing_field";
  }
  return "ok";
}

function isDuplicate_(ids, id) {
  return ids.indexOf(id) !== -1;
}

// Thứ tự cột khớp bảng ở mục 7.5 của spec.
function buildRow_(p, timestamp) {
  return [
    timestamp, STATUSES[0], p.child_name, p.child_age, p.parent_name, p.phone, p.branch,
    p.branch_address, p.program, p.level_label, p.level_code, p.tuition_estimate, p.note,
    p.submission_id,
  ];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  let p;
  try {
    p = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "bad_json" });
  }

  // Bẫy spam: người thật không thấy ô này nên không bao giờ điền. Trả ok để bot không dò được.
  if (p._hp) {
    logSpam_(p);
    return json_({ ok: true });
  }

  if (validate_(p) !== "ok") return json_({ ok: false, error: "missing_field" });

  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    const sheet = getSheet_();
    const last = sheet.getLastRow();
    const ids = last > 1 ? sheet.getRange(2, COL_ID, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    if (isDuplicate_(ids, p.submission_id)) return json_({ ok: true });

    const row = buildRow_(p, now_());
    if (last + 1 > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
    const range = sheet.getRange(last + 1, 1, 1, HEADERS.length);
    // Cột chữ phải là text, nếu không 0901234567 mất số 0 và nội dung bắt đầu bằng "=" thành công thức.
    const formats = HEADERS.map(function (_, i) {
      if (i + 1 === COL_TUITION) return "#,##0";
      return "@";
    });
    range.setNumberFormats([formats]);
    range.setValues([row]);
    // Dropdown trạng thái của setupSheet_ chỉ phủ 999 dòng đầu; gắn lại cho từng dòng mới.
    sheet.getRange(last + 1, 2).setDataValidation(statusRule_());
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function now_() {
  return Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "yyyy-MM-dd HH:mm:ss");
}

// Ghi nguyên payload dưới dạng JSON (bắt đầu bằng "{" nên không thành công thức).
function logSpam_(p) {
  try {
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = book.getSheetByName(SPAM_SHEET_NAME) || book.insertSheet(SPAM_SHEET_NAME);
    sheet.appendRow([now_(), JSON.stringify(p)]);
  } catch (err) {
    // Không để việc ghi nhật ký làm hỏng phản hồi.
  }
}

function statusRule_() {
  return SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
}

function getSheet_() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) setupSheet_(sheet);
  return sheet;
}

// Chạy một lần khi tab còn trống: tiêu đề, đóng băng dòng 1, dropdown trạng thái, định dạng.
function setupSheet_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, HEADERS.length, 140);
  sheet.setColumnWidth(8, 260);
  sheet.setColumnWidth(13, 220);
  sheet.getRange(2, 2, 999, 1).setDataValidation(statusRule_());
  // Script dùng cột này để chống ghi trùng: ẩn đi, đừng xoá.
  sheet.hideColumns(COL_ID);
}
