// src/components/admin/RichEditor.tsx
//
// Trình soạn bài cho nhân viên: thanh biểu tượng gọn có chú thích khi rê chuột, menu thả xuống cho tiêu đề,
// danh sách và màu chữ, căn lề, tìm/thay. Thấy ngay kết quả, không cần biết markdown hay HTML. Giá trị được ghi
// vào một ô ẩn `name` của form; server lọc lại toàn bộ bằng src/server/rich-text.ts nên trình duyệt không phải
// là nơi bảo đảm an toàn.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowUp, Ban, Baseline, Bold, ChevronDown,
  Heading, Heading1, Heading2, Heading3, Heading4, Italic, Link2, List, ListOrdered, ListTodo, Redo2, Search,
  Underline as UnderlineIcon, Undo2, Unlink, X,
} from "lucide-react";
import { EDITOR_PALETTE } from "../../data/editor-palette";
import { SearchHighlight, goToMatch, replaceAll, replaceCurrent, searchState, setSearch } from "./search-extension";

interface Props {
  name: string;
  /** HTML ban đầu (đã lọc ở server). */
  html: string;
}

const DEFAULT_COLOR = "#0f172a";
type Menu = "heading" | "list" | "color" | "link" | null;

/** "#abc", "#aabbcc" hoặc "rgb(1, 2, 3)" → "#aabbcc"; không hiểu được thì dùng màu mặc định. */
function toHex(value: string | undefined): string {
  if (!value) return DEFAULT_COLOR;
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  const rgb = v.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgb) return `#${[rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, Number(n)).toString(16).padStart(2, "0")).join("")}`;
  return DEFAULT_COLOR;
}

const TOOL = "gc-tip relative inline-flex h-10 items-center justify-center gap-0.5 text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent aria-pressed:bg-brand-800 aria-pressed:text-white aria-expanded:bg-slate-200";

/** Nút biểu tượng: chú thích hiện khi rê chuột hoặc dùng bàn phím, đọc được bằng trình đọc màn hình. */
function Tool(props: {
  cmd: string;
  label: string;
  shortcut?: string;
  active?: boolean;
  expanded?: boolean;
  menu?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const { cmd, label, shortcut, active, expanded, menu, disabled, onClick, children } = props;
  return (
    <button
      type="button"
      data-cmd={cmd}
      data-tip={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={expanded === undefined ? Boolean(active) : undefined}
      aria-expanded={expanded}
      aria-haspopup={menu ? "menu" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`${TOOL} ${menu ? "w-11 pl-1" : "w-9"}`}
    >
      {children}
      {menu && <ChevronDown size={14} strokeWidth={2.5} aria-hidden="true" />}
    </button>
  );
}

function MenuItem(props: { item: string; label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      data-item={props.item}
      aria-pressed={props.active}
      onClick={props.onClick}
      className="flex min-h-10 w-full items-center gap-3 px-3 text-left font-semibold text-slate-800 hover:bg-slate-100 aria-pressed:bg-brand-50 aria-pressed:text-brand-800"
    >
      {props.children}
      {props.label}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />;
const POPOVER = "absolute left-0 top-full z-30 mt-1 border-2 border-slate-300 bg-white shadow-lg";

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
  const [menu, setMenu] = useState<Menu>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const colorInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    content: html,
    extensions: [
      // Chỉ bật đúng những gì trang cho phép; phần còn lại tắt để dán từ Word/web không mang theo định dạng lạ.
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, autolink: false, protocols: ["mailto", "tel"] },
      }),
      TaskList,
      TaskItem.configure({ nested: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      SearchHighlight,
    ],
    editorProps: {
      attributes: { "aria-label": "Nội dung bài viết", role: "textbox", "aria-multiline": "true" },
    },
    // Nội dung rỗng thì ghi chuỗi rỗng, để server coi là chưa có nội dung.
    onCreate: ({ editor }) => setValue(editor.isEmpty ? "" : editor.getHTML()),
    onUpdate: ({ editor }) => setValue(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Đóng menu khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-menu]")) setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Ô chọn màu tự do của trình duyệt báo "change" khi người dùng chốt màu (khác "input" bắn liên tục khi kéo).
  const applyFree = useRef<(hex: string) => void>(() => {});
  useEffect(() => {
    const el = colorInput.current;
    if (!el) return;
    const handler = () => applyFree.current(el.value);
    el.addEventListener("change", handler);
    return () => el.removeEventListener("change", handler);
  }, [menu]);

  if (!editor) return <div className="min-h-[24rem] border-2 border-slate-300 bg-white" aria-busy="true" />;

  // Cập nhật lại sau mỗi thay đổi của vùng soạn (shouldRerenderOnTransaction) nên trạng thái nút luôn đúng.
  const level = ([1, 2, 3, 4] as const).find((n) => editor.isActive("heading", { level: n }));
  const listKind = editor.isActive("taskList") ? "task" : editor.isActive("orderedList") ? "ordered" : editor.isActive("bulletList") ? "bullet" : null;
  const currentColor = toHex(editor.getAttributes("textStyle").color as string | undefined);
  const found = searchState(editor);

  // Khi vùng soạn đang giữ con trỏ thì chạy lệnh ngay, không chờ khung hình kế; chỉ khi con trỏ đang ở ô
  // liên kết/tìm kiếm mới cần trả con trỏ về vùng soạn.
  const chain = () => (editor.isFocused ? editor.chain() : editor.chain().focus());
  const pick = (action: () => void) => {
    action();
    setMenu(null);
  };
  const toggleMenu = (next: Exclude<Menu, null>) => {
    const opening = menu !== next;
    setMenu(opening ? next : null);
    if (opening && next === "link") {
      setLinkError("");
      setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    }
  };
  const setColor = (hex: string) => pick(() => chain().setColor(hex).run());
  applyFree.current = setColor;
  const applyLink = () => {
    const href = normaliseLink(linkUrl);
    if (!href) {
      setLinkError("Địa chỉ chưa đúng. Ví dụ: https://globalchess.edu.vn");
      return;
    }
    pick(() => chain().extendMarkRange("link").setLink({ href }).run());
  };

  const openSearch = () => {
    setSearching(true);
    setMenu(null);
    // Dùng chữ đang bôi đen (nếu ngắn, một dòng) làm từ khoá, như hầu hết trình soạn thảo.
    const { from, to, empty } = editor.state.selection;
    const selected = empty ? "" : editor.state.doc.textBetween(from, to, " ");
    if (selected !== "" && selected.length <= 60) {
      setQuery(selected);
      setSearch(editor, selected);
    } else setSearch(editor, query);
    setTimeout(() => searchInput.current?.focus(), 0);
  };
  const closeSearch = () => {
    setSearching(false);
    setSearch(editor, "");
  };

  const icon = { size: 20, strokeWidth: 2.25, "aria-hidden": true } as const;
  const HeadingIcon = level === 1 ? Heading1 : level === 2 ? Heading2 : level === 3 ? Heading3 : level === 4 ? Heading4 : Heading;
  const ListIcon = listKind === "ordered" ? ListOrdered : listKind === "task" ? ListTodo : List;
  const align = (kind: "left" | "center" | "right" | "justify") => chain().setTextAlign(kind).run();

  return (
    <div
      className="gc-editor"
      // Bấm nút không được lấy con trỏ khỏi vùng soạn: giữ nguyên vùng đang bôi đen và gõ tiếp được ngay.
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) event.preventDefault();
      }}
    >
      <input type="hidden" name={name} value={value} readOnly />

      <div className="sticky top-0 z-10">
        <div role="toolbar" aria-label="Định dạng chữ" className="flex flex-wrap items-center border-2 border-slate-300 bg-white px-2 py-1.5">
          <Tool cmd="undo" label="Hoàn tác" shortcut="Ctrl+Z" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}><Undo2 {...icon} /></Tool>
          <Tool cmd="redo" label="Làm lại" shortcut="Ctrl+Y" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}><Redo2 {...icon} /></Tool>
          <Divider />

          <div data-menu className="relative">
            <Tool cmd="heading" label="Tiêu đề" menu active={level !== undefined} expanded={menu === "heading"} onClick={() => toggleMenu("heading")}><HeadingIcon {...icon} /></Tool>
            {menu === "heading" && (
              <div role="menu" aria-label="Tiêu đề" className={`${POPOVER} w-56`}>
                {([1, 2, 3, 4] as const).map((n) => {
                  const Icon = [Heading1, Heading2, Heading3, Heading4][n - 1];
                  return (
                    <MenuItem key={n} item={`h${n}`} label={`Tiêu đề ${n}`} active={level === n} onClick={() => pick(() => chain().toggleHeading({ level: n }).run())}>
                      <Icon size={20} aria-hidden="true" />
                    </MenuItem>
                  );
                })}
                <MenuItem item="paragraph" label="Văn bản thường" active={level === undefined && listKind === null} onClick={() => pick(() => chain().setParagraph().run())}>
                  <span className="inline-flex w-5 justify-center font-bold" aria-hidden="true">¶</span>
                </MenuItem>
              </div>
            )}
          </div>
          <div data-menu className="relative">
            <Tool cmd="list" label="Danh sách" menu active={listKind !== null} expanded={menu === "list"} onClick={() => toggleMenu("list")}><ListIcon {...icon} /></Tool>
            {menu === "list" && (
              <div role="menu" aria-label="Danh sách" className={`${POPOVER} w-64`}>
                <MenuItem item="bullet" label="Danh sách chấm" active={listKind === "bullet"} onClick={() => pick(() => chain().toggleBulletList().run())}><List size={20} aria-hidden="true" /></MenuItem>
                <MenuItem item="ordered" label="Danh sách đánh số" active={listKind === "ordered"} onClick={() => pick(() => chain().toggleOrderedList().run())}><ListOrdered size={20} aria-hidden="true" /></MenuItem>
                <MenuItem item="task" label="Danh sách có ô tích" active={listKind === "task"} onClick={() => pick(() => chain().toggleTaskList().run())}><ListTodo size={20} aria-hidden="true" /></MenuItem>
              </div>
            )}
          </div>
          <Divider />

          <Tool cmd="bold" label="Chữ đậm" shortcut="Ctrl+B" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}><Bold {...icon} /></Tool>
          <Tool cmd="italic" label="Chữ nghiêng" shortcut="Ctrl+I" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}><Italic {...icon} /></Tool>
          <Tool cmd="underline" label="Gạch chân" shortcut="Ctrl+U" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()}><UnderlineIcon {...icon} /></Tool>
          <Divider />

          <div data-menu className="relative">
            <Tool cmd="color" label="Màu chữ" menu expanded={menu === "color"} onClick={() => toggleMenu("color")}>
              <span className="flex flex-col items-center">
                <Baseline {...icon} />
                <span data-color-chip className="-mt-0.5 block h-1 w-5" style={{ background: currentColor }} />
              </span>
            </Tool>
            {menu === "color" && (
              <div role="menu" aria-label="Màu chữ" className={`${POPOVER} flex items-center gap-2.5 px-3 py-2.5`}>
                {EDITOR_PALETTE.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    role="menuitem"
                    data-color={color.value}
                    aria-label={color.name}
                    aria-pressed={currentColor === color.value}
                    onClick={() => setColor(color.value)}
                    className="gc-tip relative size-7 rounded-full border border-slate-400 ring-offset-2 hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-brand-800"
                    data-tip={color.name}
                    style={{ background: color.value }}
                  />
                ))}
                <span className="mx-0.5 h-6 w-px bg-slate-300" aria-hidden="true" />
                {/* Ô cầu vồng: mở bảng chọn màu của trình duyệt, đang đặt sẵn ở màu hiện tại. */}
                <label
                  className="gc-tip relative size-7 cursor-pointer rounded-full border border-slate-400 hover:scale-110"
                  data-tip="Chọn màu khác"
                  style={{ background: "conic-gradient(#ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ef4444)" }}
                >
                  <input ref={colorInput} type="color" data-color-free defaultValue={currentColor} aria-label="Chọn màu khác" className="absolute inset-0 size-full cursor-pointer opacity-0" />
                </label>
                <button type="button" role="menuitem" data-color-clear aria-label="Bỏ màu (về màu mặc định)" data-tip="Bỏ màu" onClick={() => pick(() => chain().unsetColor().run())} className="gc-tip relative inline-flex size-7 items-center justify-center text-slate-600 hover:text-slate-900">
                  <Ban size={22} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          <div data-menu className="relative">
            <Tool cmd="link" label="Liên kết" active={editor.isActive("link")} expanded={menu === "link"} onClick={() => toggleMenu("link")}><Link2 {...icon} /></Tool>
            {menu === "link" && (
              <div className={`${POPOVER} w-[22rem] max-w-[85vw] p-3`}>
                <label className="flex flex-col gap-1.5">
                  <span className="font-semibold">Địa chỉ liên kết cho chữ đang bôi đen</span>
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" data-link-apply onClick={applyLink} className="min-h-10 border border-brand-800 bg-brand-800 px-4 font-bold text-white hover:bg-brand-700">Gắn liên kết</button>
                  <button type="button" data-link-remove onClick={() => pick(() => chain().extendMarkRange("link").unsetLink().run())} className="inline-flex min-h-10 items-center gap-2 border border-slate-400 bg-white px-4 font-bold hover:bg-slate-100"><Unlink size={18} aria-hidden="true" />Gỡ liên kết</button>
                </div>
              </div>
            )}
          </div>
          <Divider />

          <Tool cmd="align-left" label="Căn trái" active={editor.isActive({ textAlign: "left" })} onClick={() => align("left")}><AlignLeft {...icon} /></Tool>
          <Tool cmd="align-center" label="Căn giữa" active={editor.isActive({ textAlign: "center" })} onClick={() => align("center")}><AlignCenter {...icon} /></Tool>
          <Tool cmd="align-right" label="Căn phải" active={editor.isActive({ textAlign: "right" })} onClick={() => align("right")}><AlignRight {...icon} /></Tool>
          <Tool cmd="align-justify" label="Căn đều hai bên" active={editor.isActive({ textAlign: "justify" })} onClick={() => align("justify")}><AlignJustify {...icon} /></Tool>

          <span className="ml-auto" />
          <Tool cmd="search" label="Tìm và thay thế" shortcut="" expanded={searching} onClick={() => (searching ? closeSearch() : openSearch())}><Search {...icon} /></Tool>
        </div>

        {searching && (
          <div role="search" className="flex flex-wrap items-center gap-2 border-2 border-t-0 border-slate-300 bg-slate-50 p-2">
            <input
              ref={searchInput}
              data-search-input
              type="text"
              value={query}
              placeholder="Tìm..."
              aria-label="Tìm trong bài"
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                setSearch(editor, event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  goToMatch(editor, event.shiftKey ? -1 : 1);
                } else if (event.key === "Escape") closeSearch();
              }}
              className="min-h-10 w-48 border border-slate-300 bg-white px-3 text-base focus:border-brand-600 focus:outline-none"
            />
            <span data-search-count role="status" className="min-w-20 text-sm font-semibold text-slate-600">
              {query.trim() === "" ? "" : found.matches.length === 0 ? "Không thấy" : `${found.current + 1}/${found.matches.length}`}
            </span>
            <button type="button" data-search-prev aria-label="Kết quả trước" disabled={found.matches.length === 0} onClick={() => goToMatch(editor, -1)} className="inline-flex size-10 items-center justify-center border border-slate-300 bg-white hover:bg-slate-100 disabled:text-slate-300"><ArrowUp size={18} aria-hidden="true" /></button>
            <button type="button" data-search-next aria-label="Kết quả kế tiếp" disabled={found.matches.length === 0} onClick={() => goToMatch(editor, 1)} className="inline-flex size-10 items-center justify-center border border-slate-300 bg-white hover:bg-slate-100 disabled:text-slate-300"><ArrowDown size={18} aria-hidden="true" /></button>
            <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />
            <input
              data-replace-input
              type="text"
              value={replacement}
              placeholder="Thay bằng..."
              aria-label="Thay bằng"
              autoComplete="off"
              onChange={(event) => setReplacement(event.target.value)}
              className="min-h-10 w-48 border border-slate-300 bg-white px-3 text-base focus:border-brand-600 focus:outline-none"
            />
            <button type="button" data-replace-one disabled={found.matches.length === 0} onClick={() => replaceCurrent(editor, replacement)} className="min-h-10 border border-brand-800 px-3 font-bold text-brand-800 hover:bg-brand-50 disabled:border-slate-300 disabled:text-slate-300">Thay</button>
            <button type="button" data-replace-all disabled={found.matches.length === 0} onClick={() => replaceAll(editor, replacement)} className="min-h-10 border border-brand-800 px-3 font-bold text-brand-800 hover:bg-brand-50 disabled:border-slate-300 disabled:text-slate-300">Thay tất cả</button>
            <button type="button" data-search-close aria-label="Đóng tìm kiếm" onClick={closeSearch} className="ml-auto inline-flex size-10 items-center justify-center hover:bg-slate-200"><X size={18} aria-hidden="true" /></button>
          </div>
        )}
      </div>

      <EditorContent editor={editor} className="gc-prose gc-editor__surface min-h-[24rem] border-2 border-t-0 border-slate-300 bg-white p-4 focus-within:border-brand-600" />
    </div>
  );
}
