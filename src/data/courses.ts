// src/data/courses.ts

export const BRAND_INFO = {
  name: "GLOBAL CHESS",
  slogan1: "Một nước đi, mở tư duy",
  slogan2: "Học cờ rèn tư duy vững tương lai!",
  hotlines: ["0789.059.440", "0963.848.430"],
  zaloPhone: "0789059440",
};

export const BRANCHES = [
  {
    id: "CS1",
    name: "Cơ sở Bình Phú (Q.6)",
    address: "811 Hậu Giang, P. Bình Phú, TP.HCM",
  },
  {
    id: "CS2",
    name: "Cơ sở Tên Lửa (Bình Tân)",
    address: "55 Tên Lửa, P. An Lạc, TP.HCM",
  },
  {
    id: "CS3",
    name: "Cơ sở Tây Thạnh (Tân Phú)",
    address: "93 đường T6, P. Tây Thạnh, TP.HCM",
  },
  {
    id: "CS4",
    name: "Cơ sở Phú Thọ Hoà (Tân Phú)",
    address: "152 Nguyễn Sơn, P. Phú Thọ Hoà, TP.HCM",
  },
  {
    id: "CS5",
    name: "Cơ sở Vinhomes Grand Park (TP. Thủ Đức)",
    address: "Khu đô thị Vinhomes Grand Park, TP.HCM",
  },
];

export const FLEXIBLE_TIME_SLOTS = [
  "Tối trong tuần (Thứ 2 - Thứ 6 | 17:30 - 20:30)",
  "Sáng Thứ 7 / Chủ Nhật (08:00 - 11:30)",
  "Chiều Thứ 7 / Chủ Nhật (14:00 - 17:30)",
  "Tối Thứ 7 / Chủ Nhật (17:30 - 20:30)",
];

export const SESSION_TIMELINE = [
  { time: "5 phút", title: "Ôn bài cũ", desc: "Nhắc lại kiến thức đã học buổi trước" },
  { time: "15 phút", title: "Giảng bài mới", desc: "Giải thích nguyên lý & minh họa trực quan" },
  { time: "20 phút", title: "Luyện tập", desc: "Giải bài tập tình huống trên giáo trình" },
  { time: "15 phút", title: "Thực hành bàn cờ", desc: "Thi đấu áp dụng kiến thức vừa học" },
  { time: "5 phút", title: "Nhận xét & Giao bài", desc: "Tổng kết lỗi sai, chuẩn bị bài buổi sau" },
];

export interface SubLevel {
  code: string;
  name: string;
  duration: string;
  lessonCount: string;
  goal: string;
  syllabus: { label: string; topic: string }[];
  outcomes: string[];
}

export interface MajorProgram {
  id: string;
  title: string;
  badge: string;
  totalDuration: string;
  targetAudience: string;
  sessionLength: string;
  objectives: string[];
  evaluation: string[];
  subLevels: SubLevel[];
}

export const CURRICULUM_PROGRAMS: MajorProgram[] = [
  {
    id: "so-cap",
    title: "Lộ Trình Global Chess Sơ Cấp",
    badge: "7 – 12 tuổi • Học viên mới & Đã biết chơi",
    totalDuration: "48 buổi (2 giáo trình – 1 lộ trình hoàn chỉnh)",
    targetAudience: "Trẻ từ 7 – 12 tuổi (cả học viên mới và đã biết chơi)",
    sessionLength: "60 – 90 phút / buổi",
    objectives: [
      "Nắm vững các chiến thuật nâng cao và cách vận dụng trong thực tế.",
      "Biết tránh những sai lầm phổ biến trong khai cuộc.",
      "Hiểu cách xử lý ưu thế hơn quân và khai thác yếu điểm của đối thủ.",
      "Tự tin thi đấu và nâng cao kỹ năng trong các ván cờ thực tế.",
    ],
    evaluation: [
      "Buổi 1 – 24: Nắm vững khai cuộc, chiến thuật cơ bản, biết áp dụng trong ván cờ.",
      "Buổi 25 – 48: Vận dụng chiến thuật nâng cao, thành thạo thi đấu.",
      "Đánh giá toàn diện qua: Bài tập giáo trình, thực hành, thi đấu và tiến độ học tập.",
    ],
    subLevels: [
      {
        code: "SC1",
        name: "Level 1 – Global Chess Sơ cấp 1",
        duration: "24 buổi",
        lessonCount: "Từ bài 1 – 5",
        goal: "Tập trung vào chiến thuật cơ bản, nguyên tắc phát triển quân và cách vận dụng trong ván cờ.",
        syllabus: [
          { label: "Buổi 1 – 5", topic: "Khai cuộc Ý (Italian Game)" },
          { label: "Buổi 6 – 10", topic: "Khai cuộc Tây Ban Nha (Ruy Lopez)" },
          { label: "Buổi 11 – 15", topic: "Khai cuộc Scotland (Scotch Game)" },
          { label: "Buổi 16 – 20", topic: "Khai cuộc Tứ Mã (Four Knights Game)" },
          { label: "Buổi 21 – 24", topic: "Đòn tấn công đôi (Nâng cao)" },
        ],
        outcomes: [
          "Nắm vững các khai cuộc cơ bản, hiểu nguyên tắc phát triển quân.",
          "Nhận diện và vận dụng đòn tấn công đôi trong thế cờ.",
          "Tự tin hơn trong việc lựa chọn nước đi ở giai đoạn khai cuộc.",
        ],
      },
      {
        code: "SC2",
        name: "Level 2 – Global Chess Sơ cấp 2",
        duration: "24 buổi",
        lessonCount: "Từ bài 1 – 8",
        goal: "Tập trung vào các đòn chiến thuật nâng cao, tàn cuộc cơ bản và kỹ năng thi đấu.",
        syllabus: [
          { label: "Buổi 25 – 28", topic: "Tấn công đôi (Nâng cao)" },
          { label: "Buổi 29 – 32", topic: "Ghim quân (Nâng cao)" },
          { label: "Buổi 33 – 36", topic: "Xiên quân (Nâng cao)" },
          { label: "Buổi 37 – 40", topic: "Mở đường chiếu & Mở đường tấn công" },
          { label: "Buổi 41 – 44", topic: "Hậu chống chốt sắp phong cấp" },
          { label: "Buổi 45 – 46", topic: "Vua – Chốt chống Vua" },
          { label: "Buổi 47 – 48", topic: "Thi đấu cờ vua & Kiểm tra cuối khóa" },
        ],
        outcomes: [
          "Nhận diện và vận dụng các đòn chiến thuật nâng cao.",
          "Biết cách xử lý ưu thế hơn quân và khai thác yếu điểm đối thủ.",
          "Tự tin thi đấu và áp dụng kiến thức vào thực tế.",
        ],
      },
    ],
  },
  {
    id: "trung-cap",
    title: "Lộ Trình Global Chess Trung Cấp",
    badge: "7 – 12 tuổi • Đã nắm vững cơ bản",
    totalDuration: "48 buổi (2 quyển – 15 bài học chuyên sâu)",
    targetAudience: "Trẻ từ 7 – 12 tuổi (đã nắm vững kiến thức cơ bản, muốn nâng cao kỹ năng)",
    sessionLength: "60 – 90 phút / buổi (điều chỉnh theo độ tuổi)",
    objectives: [
      "Nắm vững các khai cuộc và hệ thống phòng thủ phổ biến.",
      "Hiểu và vận dụng các đòn chiến thuật nâng cao trong trung cuộc.",
      "Phát triển tư duy chiến lược và khả năng phân tích thế cờ sâu.",
      "Tự tin thi đấu và xử lý tình huống thực tế.",
    ],
    evaluation: [
      "Sau 24 buổi đầu: Làm chủ các khai cuộc và phòng thủ cơ bản, biết xử lý giai đoạn mở đầu.",
      "Sau 48 buổi: Nắm vững chiến thuật trung - tàn cuộc nâng cao, áp dụng linh hoạt trong thực chiến.",
    ],
    subLevels: [
      {
        code: "TC1",
        name: "Global Chess Trung cấp – Quyển 1",
        duration: "24 buổi",
        lessonCount: "5 Bài học hệ thống khai cuộc & phòng thủ",
        goal: "Làm chủ các hệ thống phòng thủ kinh điển và hình thành tư duy chiến lược ngay từ khai cuộc.",
        syllabus: [
          { label: "Bài 1", topic: "Khai cuộc nửa thoáng" },
          { label: "Bài 2", topic: "Sai lầm cần tránh trong khai cuộc nửa thoáng" },
          { label: "Bài 3", topic: "Phòng thủ Sicilian (Sicilian Defense)" },
          { label: "Bài 4", topic: "Phòng thủ Pháp (French Defense)" },
          { label: "Bài 5", topic: "Phòng thủ Caro-Kann (Caro-Kann Defense)" },
        ],
        outcomes: [
          "Nắm vững các khai cuộc phổ biến và cách ứng dụng.",
          "Nhận diện sai lầm thường gặp trong khai cuộc nửa thoáng.",
          "Hiểu rõ đặc điểm và cách phòng thủ của từng hệ thống.",
          "Có tư duy chiến lược ngay từ giai đoạn mở màn.",
        ],
      },
      {
        code: "TC2",
        name: "Global Chess Trung cấp – Quyển 2",
        duration: "24 buổi",
        lessonCount: "10 Bài học chiến thuật & tàn cuộc thực chiến",
        goal: "Kiểm soát thế cờ bằng các đòn phối hợp trung cuộc phức tạp và kỹ năng tàn cuộc chống chốt.",
        syllabus: [
          { label: "Bài 1", topic: "Phòng thủ Scandinavian" },
          { label: "Bài 2", topic: "Đòn tiêu diệt quân bảo vệ" },
          { label: "Bài 3", topic: "Đòn quá tải (Overloading)" },
          { label: "Bài 4", topic: "Đòn thu hút (Attraction)" },
          { label: "Bài 5", topic: "Đòn đánh lạc hướng (Deflection)" },
          { label: "Bài 6", topic: "Đòn phong toả (Blockade)" },
          { label: "Bài 7", topic: "Đòn giải phóng ô, đường (Clearance)" },
          { label: "Bài 8", topic: "Mã chống chốt" },
          { label: "Bài 9", topic: "Tượng chống chốt" },
          { label: "Bài 10", topic: "Xe chống chốt" },
        ],
        outcomes: [
          "Làm chủ các đòn chiến thuật nâng cao trong trung cuộc.",
          "Kỹ năng xử lý quân và kiểm soát thế cờ chặt chẽ.",
          "Tư duy phân tích và lựa chọn nước đi tối ưu.",
          "Vận dụng chiến thuật linh hoạt trong ván đấu thực tế.",
        ],
      },
    ],
  },
];

export const PRICING_PACKAGES = [
  {
    id: "hoc-phan-24",
    name: "Khóa Tiêu Chuẩn (1 Giáo Trình / 24 Buổi)",
    subtitle: "Đăng ký theo từng cấp độ nhỏ (Sơ cấp 1, Sơ cấp 2, Trung cấp Q1 hoặc Q2)",
    price: 3600000, // Bạn có thể sửa lại đúng mức học phí thực tế của Global Chess
    duration: "/ 24 buổi (60 - 90 phút/buổi)",
    popular: false,
    features: [
      "Tặng kèm bộ Giáo trình chuẩn Global Chess",
      "Lớp tiêu chuẩn: Ôn bài - Giảng mới - Giải bài tập - Đấu thực hành",
      "Kiểm tra đánh giá định kỳ & cuối khóa",
      "Linh hoạt chọn cơ sở và khung giờ học hàng tuần",
    ],
  },
  {
    id: "lo-trinh-48",
    name: "Trọn Gói Lộ Trình Hoàn Chỉnh (48 Buổi)",
    subtitle: "Cam kết đầu ra toàn diện (Trọn bộ 2 Giáo trình Sơ Cấp hoặc Trung Cấp)",
    price: 6500000, // Bạn có thể sửa lại đúng mức học phí ưu đãi 48 buổi
    duration: "/ 48 buổi (Tiết kiệm ưu đãi)",
    popular: true,
    features: [
      "Bao gồm toàn bộ 2 cấp độ (48 buổi thực chiến bài bản)",
      "Tặng trọn bộ 2 Giáo trình Global Chess chuyên sâu",
      "Ưu tiên xếp lịch tại cả 5 cơ sở TP.HCM",
      "Theo dõi sát sao tiến độ qua bài tập, thực hành & giải đấu nội bộ",
    ],
  },
  {
    id: "kem-1-1",
    name: "Lớp Kèm Riêng 1-1 (Theo Yêu Cầu)",
    subtitle: "Lộ trình cá nhân hóa & thời gian linh hoạt tuyệt đối theo học viên",
    price: 4800000, // Bạn có thể sửa lại mức học phí 1-1
    duration: "/ khóa 12 buổi (Linh hoạt)",
    popular: false,
    features: [
      "Huấn luyện viên kèm trực tiếp 1-1, đẩy nhanh tốc độ tiếp thu",
      "Bám sát giáo trình Sơ cấp / Trung cấp hoặc ôn luyện thi đấu",
      "Chủ động chọn khung giờ học và cơ sở thuận tiện nhất",
      "Phân tích chuyên sâu từng ván đấu thực tế của bé",
    ],
  },
];

/**
 * Thế cờ đố tương tác ở đầu trang chủ (InteractivePuzzle).
 *
 * Đây là đòn "Chĩa đôi" (Fork) thật: Mã Trắng đi từ g5 sang f7, chiếu Vua Đen ở h8
 * và đồng thời tấn công Xe Đen ở d8.
 * Vua h8 không kề ô f7, và Đen không còn quân nào bắt được Mã f7, nên Đen buộc phải
 * đi Vua h8 -> g8. Sau đó Trắng ăn Xe d8.
 *
 * Không sửa FEN mà không chạy lại `npm test`: test sẽ báo lỗi nếu thế cờ không còn
 * là đòn chĩa đôi hợp lệ.
 */
export interface InteractivePuzzleConfig {
  fen: string;
  solution: { from: string; to: string };
}

export const INTERACTIVE_PUZZLE: InteractivePuzzleConfig = {
  fen: "3r3k/ppp2ppp/8/4p1N1/8/8/PPPP1PPP/R1BQK2R w KQ - 0 1",
  solution: { from: "g5", to: "f7" },
};