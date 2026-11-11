// src/components/admin/search-extension.ts
//
// Tìm (và thay) trong trình soạn bài. Chỉ tô sáng kết quả bằng decoration của ProseMirror, không sửa nội dung
// cho đến khi bấm "Thay". Tìm không phân biệt hoa/thường và DẤU tiếng Việt ("chao" tìm thấy "Chào"), vì nhân
// viên thường không gõ đủ dấu khi tìm.
import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

export interface Match {
  from: number;
  to: number;
}
interface SearchState {
  query: string;
  matches: Match[];
  current: number;
}

export const searchKey = new PluginKey<SearchState>("gcSearch");

const COMBINING = /[̀-ͯ]/;

/** Bỏ dấu và hạ chữ thường, nhớ vị trí gốc của từng ký tự giữ lại. */
function fold(text: string): { folded: string; origin: number[] } {
  let folded = "";
  const origin: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (COMBINING.test(ch)) continue;
    const base = ch.normalize("NFD")[0] ?? ch;
    folded += (base === "đ" || base === "Đ" ? "d" : base).toLowerCase();
    origin.push(i);
  }
  return { folded, origin };
}

export function findMatches(doc: PMNode, query: string): Match[] {
  const needle = fold(query.trim() === "" ? "" : query).folded;
  if (needle === "") return [];
  const matches: Match[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // Ký tự thay thế cho nút không phải chữ (xuống dòng) để mỗi ký tự ứng với đúng một vị trí trong tài liệu.
    const text = node.textBetween(0, node.content.size, undefined, "￼");
    const { folded, origin } = fold(text);
    for (let at = folded.indexOf(needle); at !== -1; at = folded.indexOf(needle, at + needle.length)) {
      const end = at + needle.length;
      const startOffset = origin[at];
      const endOffset = end < origin.length ? origin[end] : text.length;
      matches.push({ from: pos + 1 + startOffset, to: pos + 1 + endOffset });
    }
    return false;
  });
  return matches;
}

export const SearchHighlight = Extension.create({
  name: "gcSearch",
  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchKey,
        state: {
          init: () => ({ query: "", matches: [], current: 0 }),
          apply(tr, prev, _old, next) {
            const meta = tr.getMeta(searchKey) as { query?: string; current?: number } | undefined;
            if (!meta && !tr.docChanged) return prev;
            const query = meta?.query ?? prev.query;
            const matches = findMatches(next.doc, query);
            const wanted = meta?.query !== undefined ? 0 : (meta?.current ?? prev.current);
            const current = matches.length === 0 ? 0 : Math.min(Math.max(wanted, 0), matches.length - 1);
            return { query, matches, current };
          },
        },
        props: {
          decorations(state) {
            const s = searchKey.getState(state);
            if (!s || s.matches.length === 0) return null;
            return DecorationSet.create(
              state.doc,
              s.matches.map((m, i) =>
                Decoration.inline(m.from, m.to, { class: i === s.current ? "gc-search gc-search--current" : "gc-search" }),
              ),
            );
          },
        },
      }),
    ];
  },
});

export function searchState(editor: Editor): SearchState {
  return searchKey.getState(editor.state) ?? { query: "", matches: [], current: 0 };
}

export function setSearch(editor: Editor, query: string): void {
  editor.view.dispatch(editor.state.tr.setMeta(searchKey, { query }));
}

/** Nhảy tới kết quả kế tiếp (+1) hoặc trước đó (-1), vòng quanh; cuộn tới chỗ đó mà không lấy con trỏ khỏi ô tìm. */
export function goToMatch(editor: Editor, step: 1 | -1): void {
  const s = searchState(editor);
  if (s.matches.length === 0) return;
  const current = (s.current + step + s.matches.length) % s.matches.length;
  const m = s.matches[current];
  const tr = editor.state.tr.setMeta(searchKey, { current });
  tr.setSelection(TextSelection.create(tr.doc, m.from, m.to)).scrollIntoView();
  editor.view.dispatch(tr);
}

export function replaceCurrent(editor: Editor, replacement: string): void {
  const s = searchState(editor);
  const m = s.matches[s.current];
  if (!m) return;
  const tr = editor.state.tr;
  if (replacement === "") tr.delete(m.from, m.to);
  else tr.insertText(replacement, m.from, m.to);
  tr.setMeta(searchKey, { current: s.current });
  editor.view.dispatch(tr);
}

export function replaceAll(editor: Editor, replacement: string): number {
  const s = searchState(editor);
  if (s.matches.length === 0) return 0;
  const tr = editor.state.tr;
  // Từ cuối lên đầu để các vị trí phía trước không bị lệch.
  for (const m of [...s.matches].reverse()) {
    if (replacement === "") tr.delete(m.from, m.to);
    else tr.insertText(replacement, m.from, m.to);
  }
  editor.view.dispatch(tr);
  return s.matches.length;
}
