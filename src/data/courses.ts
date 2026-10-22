// src/data/courses.ts

export const BRAND_INFO = {
  name: "GLOBAL CHESS",
  slogan1: "Một nước đi, mở tư duy",
  slogan2: "Học cờ rèn tư duy vững tương lai!",
  hotlines: ["0789.059.440", "0963.848.430"],
  zaloPhone: "0789059440",
};

/*
 * `district` tách từ chính tên cơ sở, dùng làm nhãn phân biệt trên thẻ cơ sở.
 * Trước đây cả 5 thẻ đều gắn chung một nhãn "Đang tuyển sinh", lặp lại 5 lần nên
 * không truyền thêm thông tin gì; tình trạng tuyển sinh nay nói một lần ở tiêu đề mục.
 */
export const BRANCHES = [
  {
    id: "CS1",
    name: "Cơ sở Bình Phú (Q.6)",
    district: "Q.6",
    address: "811 Hậu Giang, P. Bình Phú, TP.HCM",
  },
  {
    id: "CS2",
    name: "Cơ sở Tên Lửa (Bình Tân)",
    district: "Bình Tân",
    address: "55 Tên Lửa, P. An Lạc, TP.HCM",
  },
  {
    id: "CS3",
    name: "Cơ sở Tây Thạnh (Tân Phú)",
    district: "Tân Phú",
    address: "93 đường T6, P. Tây Thạnh, TP.HCM",
  },
  {
    id: "CS4",
    name: "Cơ sở Phú Thọ Hoà (Tân Phú)",
    district: "Tân Phú",
    address: "152 Nguyễn Sơn, P. Phú Thọ Hoà, TP.HCM",
  },
  {
    id: "CS5",
    name: "Cơ sở Vinhomes Grand Park (TP. Thủ Đức)",
    district: "Thủ Đức",
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
    id: "happy-chess",
    title: "Lộ Trình Happy Chess",
    badge: "4 – 12 tuổi • Nền tảng vững chắc",
    totalDuration: "72 buổi (3 Level – mỗi Level 24 buổi)",
    targetAudience: "Trẻ từ 4 – 12 tuổi (cả học viên mới và đã biết chơi)",
    sessionLength: "60 – 90 phút / buổi (điều chỉnh theo độ tuổi)",
    objectives: [
      "Nắm vững luật chơi và cách di chuyển 6 loại quân.",
      "Hiểu và áp dụng các chiến thuật cơ bản.",
      "Phát triển tư duy logic và khả năng tính toán.",
      "Tự tin thi đấu và xử lý các thế cờ thực tế.",
    ],
    evaluation: [
      "Level 1 (24 buổi): Chơi được ván cờ cơ bản, hiểu luật, biết chiếu bí, nhập thành và phong cấp.",
      "Level 2 (48 buổi): Có tư duy chiến thuật ban đầu, biết tìm nước đi có mục đích và áp dụng trong ván đấu.",
      "Level 3 (72 buổi): Vận dụng chiến thuật nâng cao, tự tin thi đấu và xử lý các thế cờ phức tạp.",
    ],
    subLevels: [
      {
        code: "HC1",
        name: "Level 1 – Happy Chess 1",
        duration: "24 buổi",
        lessonCount: "Làm quen và nắm vững luật chơi",
        goal: "Nhận biết và di chuyển 6 loại quân, nắm luật chơi cơ bản và biết cách chiếu bí.",
        syllabus: [
          { label: "Nội dung 1", topic: "Nhận biết và di chuyển 6 loại quân" },
          { label: "Nội dung 2", topic: "Luật chơi cơ bản, chiếu – chiếu bí" },
          { label: "Nội dung 3", topic: "Nhập thành, phong cấp, bắt tốt qua đường" },
          { label: "Nội dung 4", topic: "Ghi chép nước đi và thi đấu" },
        ],
        outcomes: [
          "Chơi được một ván cờ cơ bản.",
          "Hiểu luật và biết cách chiếu bí.",
          "Biết nhập thành và phong cấp.",
        ],
      },
      {
        code: "HC2",
        name: "Level 2 – Happy Chess 2",
        duration: "24 buổi",
        lessonCount: "Hoàn thiện kỹ năng cơ bản",
        goal: "Hoàn thiện kỹ năng cơ bản và hình thành tư duy chiến thuật ban đầu.",
        syllabus: [
          { label: "Nội dung 1", topic: "Ghi chép nước đi, thi đấu" },
          { label: "Nội dung 2", topic: "Chiếu bí với các quân (tốt, tượng, xe, hậu, mã)" },
          { label: "Nội dung 3", topic: "Khai cuộc cơ bản" },
          { label: "Nội dung 4", topic: "Phòng thủ 4 mã" },
          { label: "Nội dung 5", topic: "Phong cấp tốt" },
        ],
        outcomes: [
          "Có tư duy chiến thuật ban đầu.",
          "Biết tìm nước đi có mục đích.",
          "Áp dụng được trong ván đấu thực tế.",
        ],
      },
      {
        code: "HC3",
        name: "Level 3 – Happy Chess 3",
        duration: "24 buổi",
        lessonCount: "Phát triển chiến thuật và vận dụng",
        goal: "Phát triển chiến thuật và vận dụng vào các thế cờ phức tạp.",
        syllabus: [
          { label: "Nội dung 1", topic: "Chiếu bí với 2 xe, 1 hậu, 1 xe, 2 tượng" },
          { label: "Nội dung 2", topic: "Khai cuộc cơ bản và các biến thể" },
          { label: "Nội dung 3", topic: "Phòng thủ 4 mã" },
          { label: "Nội dung 4", topic: "Phong cấp tốt (nhiều thế cờ nâng cao)" },
          { label: "Nội dung 5", topic: "Thi đấu và kiểm tra cuối khóa" },
        ],
        outcomes: [
          "Vận dụng chiến thuật nâng cao.",
          "Tự tin thi đấu.",
          "Xử lý được các thế cờ phức tạp.",
        ],
      },
    ],
  },
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

/**
 * Học phí chính thức — nguồn: "Bảng học phí Global Chess các cơ sở.pdf".
 *
 * Bảng gốc chia theo nhóm lớp:
 *   - Happy Chess 1–3 (Căn bản, 60 phút)
 *   - Global Chess 1,2 (Sơ cấp, 60 phút)
 *   - Global Chess 3,4 (Sơ cấp, 90 phút)
 *   - Global Chess 5,6 (Trung cấp, 90 phút)
 *   - Global Chess 7,8 (Trung cấp, 90 phút)
 *   - Global Chess 9,10 (Chuyên nghiệp): giá theo cấp kiện tướng, chưa mở form.
 *
 * Mỗi nhóm có 4 mức:
 *   group12  — lớp group, 1 buổi/tuần, 12 buổi
 *   group24  — lớp group, 2 buổi/tuần, 24 buổi
 *   oneOnOne — lớp 1 kèm 1, đơn giá MỖI BUỔI
 *   oneOnTwo — lớp 1 kèm 2, đơn giá MỖI BUỔI
 *
 * Mã HC1–TC2 khớp đúng `subLevels` trong CURRICULUM_PROGRAMS. Không tự sửa giá
 * mà không đối chiếu lại bảng gốc và tests/tuition.test.mjs.
 */
export interface TuitionLevel {
  code: string;
  programId: "happy-chess" | "so-cap" | "trung-cap";
  label: string;
  sessionLength: string;
  group12: number;
  group24: number;
  oneOnOne: number;
  oneOnTwo: number;
}

export const TUITION_LEVELS: TuitionLevel[] = [
  {
    code: "HC1",
    programId: "happy-chess",
    label: "Happy Chess 1 (Level 1)",
    sessionLength: "60 phút",
    group12: 1800000,
    group24: 2700000,
    oneOnOne: 350000,
    oneOnTwo: 250000,
  },
  {
    code: "HC2",
    programId: "happy-chess",
    label: "Happy Chess 2 (Level 2)",
    sessionLength: "60 phút",
    group12: 1800000,
    group24: 2700000,
    oneOnOne: 350000,
    oneOnTwo: 250000,
  },
  {
    code: "HC3",
    programId: "happy-chess",
    label: "Happy Chess 3 (Level 3)",
    sessionLength: "60 phút",
    group12: 1800000,
    group24: 2700000,
    oneOnOne: 350000,
    oneOnTwo: 250000,
  },
  {
    code: "SC1",
    programId: "so-cap",
    label: "Sơ cấp 1 (Global 1, 2)",
    sessionLength: "60 phút",
    group12: 2100000,
    group24: 3240000,
    oneOnOne: 400000,
    oneOnTwo: 300000,
  },
  {
    code: "SC2",
    programId: "so-cap",
    label: "Sơ cấp 2 (Global 3, 4)",
    sessionLength: "90 phút",
    group12: 2700000,
    group24: 4860000,
    oneOnOne: 400000,
    oneOnTwo: 300000,
  },
  {
    code: "TC1",
    programId: "trung-cap",
    label: "Trung cấp 1 (Global 5, 6)",
    sessionLength: "90 phút",
    group12: 3240000,
    group24: 5830000,
    oneOnOne: 450000,
    oneOnTwo: 350000,
  },
  {
    code: "TC2",
    programId: "trung-cap",
    label: "Trung cấp 2 (Global 7, 8)",
    sessionLength: "90 phút",
    group12: 3888000,
    group24: 6996000,
    oneOnOne: 450000,
    oneOnTwo: 350000,
  },
];

export interface TuitionProgram {
  id: "happy-chess" | "so-cap" | "trung-cap";
  name: string;
  subtitle: string;
  popular: boolean;
  features: string[];
}

export const TUITION_PROGRAMS: TuitionProgram[] = [
  {
    id: "happy-chess",
    name: "Happy Chess (Căn bản)",
    subtitle: "3 Level × 24 buổi, dành cho bé từ 4 tuổi",
    popular: false,
    features: [
      "Happy Chess 1 – 3, mỗi Level 24 buổi",
      "60 phút mỗi buổi",
      "Lớp group từ 2 học viên",
      "12 buổi (1 buổi/tuần) hoặc 24 buổi (2 buổi/tuần)",
    ],
  },
  {
    id: "so-cap",
    name: "Global Chess Sơ cấp",
    subtitle: "Global Chess 1 – 4, nền tảng khai cuộc và chiến thuật",
    popular: true,
    features: [
      "Global Chess 1 – 4",
      "60 phút (Global 1–2) • 90 phút (Global 3–4)",
      "Lớp group từ 2 học viên",
      "Luyện khai cuộc, chiến thuật và thi đấu",
    ],
  },
  {
    id: "trung-cap",
    name: "Global Chess Trung cấp",
    subtitle: "Global Chess 5 – 8, chiến thuật trung – tàn cuộc",
    popular: false,
    features: [
      "Global Chess 5 – 8",
      "90 phút mỗi buổi",
      "Lớp group từ 2 học viên",
      "Chiến thuật trung – tàn cuộc nâng cao",
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

/**
 * Nhận xét của phụ huynh.
 *
 * Nguồn: `assets/nguon/trichdan.txt` do trung tâm cung cấp. Giữ nguyên câu chữ và tên bé;
 * không tự viết thêm, không sửa lời trích dẫn. Cơ sở ghi theo tên chi nhánh
 * chính thức trong `BRANCHES`.
 *
 * Khi mảng còn rỗng, giao diện tự hiển thị ô trống TODO rất rõ nên không thể vô
 * tình đưa lên production. Có ít nhất 1 mục là giao diện chuyển sang bản thật.
 */
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  branch: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Bé học tiến bộ lắm á thầy, chơi tốt hơn lúc chưa học, chiếu bí ba hoài luôn",
    author: "Phụ huynh bé Bảo Khang",
    role: "Phụ huynh học viên",
    branch: "Cơ sở Bình Phú (Q.6)",
  },
  {
    quote:
      "Bé thích học ở đây lắm á thầy, có các bạn chơi chung và biết thêm được nhiều thế cờ hay",
    author: "Phụ huynh bé Kính Long",
    role: "Phụ huynh học viên",
    branch: "Cơ sở Tên Lửa (Bình Tân)",
  },
  {
    quote:
      "Học ở Global Chess ngoài cờ vua ra bé còn học được robotics, đưa bé đến 1 chỗ mà học được nhiều môn, mẹ đỡ phải chạy đi chạy lại",
    author: "Phụ huynh bé Văn Minh",
    role: "Phụ huynh học viên",
    branch: "Cơ sở Tên Lửa (Bình Tân)",
  },
];

/**
 * Câu hỏi thường gặp.
 *
 * Mọi câu trả lời ở đây chỉ được dựa trên dữ liệu đã có trong file này (lịch học,
 * giáo trình, học phí, cơ sở) hoặc trên thông tin vận hành do Global Chess xác
 * nhận. Không tự thêm chính sách mới (hoàn tiền, bảo lưu, học bù...) khi chưa
 * được trung tâm xác nhận.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "Bé mấy tuổi thì tham gia được?",
    a: "Global Chess nhận học viên từ 4 đến 12 tuổi. Lộ trình Happy Chess dành cho bé từ 4 tuổi; lộ trình Global Sơ cấp và Trung cấp dành cho bé từ 7 tuổi. Các bé được xếp theo trình độ thực tế chứ không chỉ theo tuổi.",
  },
  {
    q: "Một lộ trình học kéo dài bao lâu?",
    a: "Happy Chess gồm 72 buổi (3 Level, mỗi Level 24 buổi). Lộ trình Global Sơ cấp và Trung cấp mỗi lộ trình gồm 48 buổi, chia thành 2 cấp độ nhỏ 24 buổi. Mỗi buổi kéo dài 60 – 90 phút.",
  },
  {
    q: "Học phí đã bao gồm sách chưa?",
    a: "Học phí niêm yết là học phí lớp học. Sách học theo cấp độ 50.000đ, sách bài tập bổ trợ 90.000đ; áo đồng phục 150.000đ, bộ cờ tiêu chuẩn thi đấu 250.000đ, đồng hồ thi đấu 400.000đ (theo bảng giá của trung tâm).",
  },
  {
    q: "Học 1 buổi/tuần hay 2 buổi/tuần?",
    a: "Trung tâm có cả hai hình thức: gói 12 buổi học 1 buổi/tuần, gói 24 buổi học 2 buổi/tuần. Ngoài ra có lớp 1 kèm 1 và 1 kèm 2, học phí tính theo từng buổi.",
  },
  {
    q: "Có lớp cuối tuần không?",
    a: "Có. Khung giờ gồm ca tối trong tuần (Thứ 2 – Thứ 6) và ba ca cuối tuần: sáng, chiều và tối Thứ 7 / Chủ Nhật.",
  },
  {
    q: "Trung tâm có những cơ sở nào?",
    a: "Hiện có 5 cơ sở tại TP.HCM. Danh sách địa chỉ đầy đủ nằm ở mục “Hệ thống 5 Cơ sở” phía trên.",
  },
  {
    q: "Đóng học phí bằng cách nào?",
    a: "Điền form đăng ký, hệ thống tạo mã VietQR kèm đúng số tiền và nội dung chuyển khoản. Quét mã bằng app ngân hàng bất kỳ, sau đó báo Zalo cho trung tâm.",
  },
  {
    q: "Chưa rõ trình độ của bé thì sao?",
    a: "Ghi chú khi đăng ký hoặc gọi hotline. Bộ phận giáo vụ sẽ kiểm tra trình độ đầu vào và xếp lớp phù hợp.",
  },
  {
    q: "Bé nghỉ một buổi thì xử lý thế nào?",
    a: "Việc học bù và bảo lưu tuỳ theo chính sách hiện hành của trung tâm. Vui lòng liên hệ giáo vụ qua hotline hoặc Zalo để được hướng dẫn cụ thể.",
  },
];

/**
 * Cách lớp học vận hành. Đây là điểm khác biệt thật so với lớp cờ tự phát, nên
 * mọi dòng ở đây đều phải bám vào dữ liệu vận hành đã có (giáo trình, khung giờ,
 * cấu trúc buổi học), không phải lời khen tự đánh giá.
 */
export const OPERATING_POINTS = [
  {
    title: "Đúng 5 bước mỗi buổi",
    desc: "Ôn bài cũ, giảng bài mới, luyện tập, thực hành bàn cờ, nhận xét và giao bài.",
    icon: "steps",
  },
  {
    title: "Giáo trình chuẩn hoá",
    desc: "24 buổi mỗi cấp độ, có sách và mục tiêu rõ ràng cho từng buổi.",
    icon: "book",
  },
  {
    title: "Thực chiến và giải đấu",
    desc: "Đấu thực hành trong buổi học và giải đấu nội bộ theo lộ trình.",
    icon: "trophy",
  },
  {
    title: "Lịch học linh hoạt",
    desc: "Ca tối trong tuần và ba ca cuối tuần, chọn cơ sở theo khu vực nhà bạn.",
    icon: "clock",
  },
] as const;
