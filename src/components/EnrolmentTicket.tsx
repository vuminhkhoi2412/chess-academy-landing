// src/components/EnrolmentTicket.tsx
//
// Vé xác nhận hiện ra thay form sau khi gửi đăng ký. Chỉ trình bày lại những gì phụ huynh vừa
// điền, không tạo thêm thông tin nào (không có mã vé: hệ thống không sinh mã nào để in lên).
// Nửa trái: tên trung tâm và con dấu. Giữa: thông tin phụ huynh điền. Phải: cuống nâu đất.
// Phần cuống và con dấu trùng với dữ liệu ở giữa nên ẩn khỏi trình đọc màn hình.
import { LEARNING_MODES } from "../data/courses";
import { formatAge } from "../lib/enrolment";
import CentreStamp from "./CentreStamp";

export interface EnrolmentTicketProps {
  childName: string;
  childAge: string;
  parentName: string;
  phone: string;
  mode: string;
  branchName: string;
  submittedAt: Date;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Flourish({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 50 12" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path
        d="M1 9C8 1 15 12 25 6S40 9 49 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function EnrolmentTicket({
  childName,
  childAge,
  parentName,
  phone,
  mode,
  branchName,
  submittedAt,
}: EnrolmentTicketProps) {
  const name = childName.trim();
  // Tên Việt có tên gọi ở cuối: lấy chữ cái đầu của từ cuối làm chữ lớn.
  const initial = (name.split(/\s+/).pop()?.[0] ?? "").toLocaleUpperCase("vi");
  const date = `${pad(submittedAt.getDate())}/${pad(submittedAt.getMonth() + 1)}/${String(submittedAt.getFullYear()).slice(-2)}`;
  const time = `${pad(submittedAt.getHours())}:${pad(submittedAt.getMinutes())}`;
  const modeShort = LEARNING_MODES.find((m) => m.value === mode)?.short ?? mode;

  return (
    <div className="gc-pass-wrap gc-pass-wrap--in">
      <article className="gc-pass" aria-label="Vé xác nhận học thử Global Chess">
        <div className="gc-pass__paper">
          <section className="gc-pass__brand">
            <div className="gc-pass__kick" aria-hidden="true">
              <Flourish />
              <span>VÉ XÁC NHẬN</span>
              <Flourish flip />
            </div>
            <p className="gc-pass__title">GLOBAL CHESS</p>
            <p className="gc-pass__sub" aria-hidden="true">
              <i />
              <span>HỌC THỬ MIỄN PHÍ</span>
              <i />
            </p>
            <CentreStamp className="gc-pass__seal" />
          </section>

          <section className="gc-pass__info">
            <p className="gc-pass__branch">{branchName}</p>
            <p className="gc-pass__phone">SĐT. {phone.trim()}</p>
            <div className="gc-pass__who">
              <div>
                <small>Học viên:</small>
                <span className="gc-pass__initial" aria-hidden="true">
                  {initial}
                </span>
              </div>
              <div>
                <small>Họ tên bé:</small>
                <span className="gc-pass__name">{name}</span>
              </div>
            </div>
            <div className="gc-pass__tbl">
              <div>
                <small>Phụ huynh:</small>
                <b>{parentName.trim()}</b>
              </div>
              <div>
                <small>Tuổi:</small>
                <b>{formatAge(childAge)}</b>
              </div>
              <div>
                <small>Ngày:</small>
                <b>{date}</b>
              </div>
              <div>
                <small>Giờ:</small>
                <b>{time}</b>
              </div>
            </div>
            <p className="gc-pass__mode">
              Hình thức: <b>{mode}</b>
            </p>
            <p className="gc-pass__next">Trung tâm sẽ liên hệ tư vấn.</p>
          </section>

          <aside className="gc-pass__ctl" aria-hidden="true">
            <div className="gc-pass__panel">
              <p className="gc-pass__pill">{name}</p>
              <p className="gc-pass__big">
                <span>XÁC</span> <span>NHẬN</span>
              </p>
              <p className="gc-pass__tags">
                <span>{modeShort}</span>
                <span>Miễn Phí</span>
              </p>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
