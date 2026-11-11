// src/components/admin/RichEditor.tsx
//
// Trình soạn bài cho nhân viên: thanh biểu tượng gọn (có chú thích khi rê chuột), thấy ngay kết quả, không cần
// biết markdown hay HTML. Giá trị được ghi vào một ô ẩn `name` của form; server lọc lại toàn bộ bằng
// src/server/rich-text.ts nên trình duyệt không phải là nơi bảo đảm an toàn.
import { useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Baseline, Bold, Heading2, Italic, Link2, List, ListOrdered, Redo2, Underline as UnderlineIcon, Undo2, Unlink } from "lucide-react";
import { EDITOR_PALETTE } from "../../data/editor-palette";

interface Props {
  name: string;
  /** HTML ban đầu (đã lọc ở server). */
  html: string;
}

const DEFAULT_COLOR = "#0f172a";

/** Nút biểu tượng: chú thích hiện khi rê chuột hoặc dùng bàn phím, đọc được bằng trình đọc màn hình. */
function Tool(props: {
  cmd: string;
  label: string;
  shortcut?: string;
  active?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const { cmd, label, shortcut, active, expanded, disabled, onClick, children } = props;
  return (
    <button
      type="button"
      data-cmd={cmd}
      data-tip={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={expanded === undefined ? Boolean(active) : undefined}
      aria-expanded={expanded}
      disabled={disabled}
      onClick={onClick}
      className="gc-tip relative inline-flex size-10 items-center justify-center text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent aria-pressed:bg-brand-800 aria-pressed:text-white aria-expanded:bg-slate-200"
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1.5 h-6 w-px bg-slate-300" aria-hidden="true" />;

function normaliseLink(raw: string): string | null {
  const text = raw.trim();
  if (text === "") return null;
  const hasAllowedScheme = /^(https?:|mailto:|tel:)/i.test(text);
  const hasOtherScheme = !hasAllowedScheme && /^[a-z][a-z0-9+.-]*:/i.test(text);
  if (hasOtherScheme) return null;
  try {
    return new URL(hasAllowedScheme ? text : `https://${text}`).href;
  } catch {
    return null;
  }
}

export default function RichEditor({ name, html }: Props) {
  // Giá trị gửi lên server. Là state (ô ẩn có kiểm soát) để React không ghi đè lại giá trị ban đầu mỗi lần vẽ lại.
  const [value, setValue] = useState(html);
  const [panel, setPanel] = useState<"color" | "link" | null>(null);
  const [freeColor, setFreeColor] = useState(DEFAULT_COLOR);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    content: html,
    extensions: [
      // Chỉ bật đúng những gì trang cho phép; phần còn lại tắt để dán từ Word/web không mang theo định dạng lạ.
      StarterKit.configure({
        heading: { levels: [2] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, autolink: false, protocols: ["mailto", "tel"] },
      }),
      TextStyle,
      Color,
    ],
    editorProps: {
      attributes: { "aria-label": "Nội dung bài viết", role: "textbox", "aria-multiline": "true" },
    },
    // Nội dung rỗng thì ghi chuỗi rỗng, để server coi là chưa có nội dung.
    onCreate: ({ editor }) => setValue(editor.isEmpty ? "" : editor.getHTML()),
    onUpdate: ({ editor }) => setValue(editor.isEmpty ? "" : editor.getHTML()),
  });

  if (!editor) return <div className="min-h-[24rem] border-2 border-slate-300 bg-white" aria-busy="true" />;

  // Cập nhật lại sau mỗi thay đổi của vùng soạn (shouldRerenderOnTransaction) nên trạng thái nút luôn đúng.
  const state = {
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    heading: editor.isActive("heading", { level: 2 }),
    bullets: editor.isActive("bulletList"),
    numbers: editor.isActive("orderedList"),
    link: editor.isActive("link"),
    color: (editor.getAttributes("textStyle").color as string | undefined) ?? DEFAULT_COLOR,
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
  };

  // Khi vùng soạn đang giữ con trỏ thì chạy lệnh ngay, không chờ khung hình kế; chỉ khi con trỏ đang ở ô
  // liên kết/màu mới cần trả con trỏ về vùng soạn.
  const chain = () => (editor.isFocused ? editor.chain() : editor.chain().focus());
  const toggle = (next: "color" | "link") => {
    const opening = panel !== next;
    setPanel(opening ? next : null);
    if (opening && next === "link") {
      setLinkError("");
      setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    }
  };
  const setColor = (value: string) => {
    chain().setColor(value).run();
    setPanel(null);
  };
  const applyLink = () => {
    const href = normaliseLink(linkUrl);
    if (!href) {
      setLinkError("Địa chỉ chưa đúng. Ví dụ: https://globalchess.edu.vn");
      return;
    }
    chain().extendMarkRange("link").setLink({ href }).run();
    setPanel(null);
  };
  const removeLink = () => {
    chain().extendMarkRange("link").unsetLink().run();
    setPanel(null);
  };

  const icon = { size: 20, strokeWidth: 2.25, "aria-hidden": true } as const;

  return (
    <div
      className="gc-editor"
      // Bấm nút không được lấy con trỏ khỏi vùng soạn: giữ nguyên vùng đang bôi đen và gõ tiếp được ngay.
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) event.preventDefault();
      }}
    >
      <input type="hidden" name={name} value={value} readOnly />

      <div role="toolbar" aria-label="Định dạng chữ" className="sticky top-0 z-10 flex flex-wrap items-center border-2 border-b-0 border-slate-300 bg-white px-2 py-1.5">
        <Tool cmd="undo" label="Hoàn tác" shortcut="Ctrl+Z" disabled={!state.canUndo} onClick={() => chain().undo().run()}><Undo2 {...icon} /></Tool>
        <Tool cmd="redo" label="Làm lại" shortcut="Ctrl+Y" disabled={!state.canRedo} onClick={() => chain().redo().run()}><Redo2 {...icon} /></Tool>
        <Divider />
        <Tool cmd="heading" label="Tiêu đề mục" active={state.heading} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 {...icon} /></Tool>
        <Tool cmd="bullets" label="Danh sách chấm" active={state.bullets} onClick={() => chain().toggleBulletList().run()}><List {...icon} /></Tool>
        <Tool cmd="numbers" label="Danh sách đánh số" active={state.numbers} onClick={() => chain().toggleOrderedList().run()}><ListOrdered {...icon} /></Tool>
        <Divider />
        <Tool cmd="bold" label="Chữ đậm" shortcut="Ctrl+B" active={state.bold} onClick={() => chain().toggleBold().run()}><Bold {...icon} /></Tool>
        <Tool cmd="italic" label="Chữ nghiêng" shortcut="Ctrl+I" active={state.italic} onClick={() => chain().toggleItalic().run()}><Italic {...icon} /></Tool>
        <Tool cmd="underline" label="Gạch chân" shortcut="Ctrl+U" active={state.underline} onClick={() => chain().toggleUnderline().run()}><UnderlineIcon {...icon} /></Tool>
        <Divider />
        <Tool cmd="color" label="Màu chữ" expanded={panel === "color"} onClick={() => toggle("color")}>
          <span className="flex flex-col items-center">
            <Baseline {...icon} />
            <span data-color-chip className="-mt-0.5 block h-1 w-5" style={{ background: state.color }} />
          </span>
        </Tool>
        <Tool cmd="link" label="Liên kết" active={state.link} expanded={panel === "link"} onClick={() => toggle("link")}><Link2 {...icon} /></Tool>
      </div>

      {panel === "color" && (
        <div className="border-2 border-b-0 border-slate-300 bg-slate-50 p-3">
          <p className="font-semibold">Chọn màu cho phần chữ đang bôi đen</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {EDITOR_PALETTE.map((color) => (
              <li key={color.value}>
                <button type="button" data-color={color.value} onClick={() => setColor(color.value)} className="flex min-h-10 items-center gap-2 border border-slate-300 bg-white px-3 font-semibold hover:bg-slate-100">
                  <span className="inline-block size-5 border border-slate-400" style={{ background: color.value }} />
                  {color.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-semibold">
              Màu khác
              <input type="color" data-color-free value={freeColor} onChange={(event) => setFreeColor(event.target.value)} className="h-10 w-14 cursor-pointer border border-slate-300 bg-white p-0.5" />
            </label>
            <button type="button" data-color-apply-free onClick={() => setColor(freeColor)} className="min-h-10 border border-brand-800 px-4 font-bold text-brand-800 hover:bg-brand-50">Dùng màu này</button>
            <button type="button" data-color-clear onClick={() => { chain().unsetColor().run(); setPanel(null); }} className="min-h-10 border border-slate-400 bg-white px-4 font-bold hover:bg-slate-100">Bỏ màu (về màu mặc định)</button>
          </div>
        </div>
      )}

      {panel === "link" && (
        <div className="border-2 border-b-0 border-slate-300 bg-slate-50 p-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Địa chỉ liên kết cho phần chữ đang bôi đen</span>
            <input
              type="text"
              data-link-url
              inputMode="url"
              autoComplete="off"
              autoFocus
              placeholder="https://..."
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
              className="min-h-10 w-full border border-slate-300 bg-white px-3 text-base focus:border-brand-600 focus:outline-none"
            />
          </label>
          {linkError && <p data-link-error role="alert" className="mt-1 font-semibold text-seal-red">{linkError}</p>}
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" data-link-apply onClick={applyLink} className="min-h-10 border border-brand-800 bg-brand-800 px-4 font-bold text-white hover:bg-brand-700">Gắn liên kết</button>
            <button type="button" data-link-remove onClick={removeLink} className="inline-flex min-h-10 items-center gap-2 border border-slate-400 bg-white px-4 font-bold hover:bg-slate-100"><Unlink size={18} aria-hidden="true" />Gỡ liên kết</button>
          </div>
        </div>
      )}

      <EditorContent editor={editor} className="gc-prose gc-editor__surface min-h-[24rem] border-2 border-slate-300 bg-white p-4 focus-within:border-brand-600" />
    </div>
  );
}
