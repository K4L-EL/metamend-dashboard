import { useMemo } from "react";

interface ProseProps {
  text: string;
  className?: string;
  variant?: "default" | "compact";
}

export function Prose({ text, className = "", variant = "default" }: ProseProps) {
  const html = useMemo(() => markdownToHtml(text ?? ""), [text]);

  const base =
    variant === "compact"
      ? "text-xs leading-relaxed text-neutral-700"
      : "text-sm leading-relaxed text-neutral-700";

  return (
    <div
      className={
        base +
        " [&_strong]:font-semibold [&_strong]:text-neutral-900" +
        " [&_em]:italic" +
        " [&_h1]:mt-3 [&_h1]:mb-1 [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-neutral-900" +
        " [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-neutral-900" +
        " [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-neutral-900" +
        " [&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-xs [&_h4]:font-bold [&_h4]:uppercase [&_h4]:tracking-wider [&_h4]:text-neutral-600" +
        " [&_ul]:my-1.5 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-0.5" +
        " [&_ol]:my-1.5 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-0.5" +
        " [&_li]:text-inherit" +
        " [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-neutral-800" +
        " [&_a]:text-sky-600 [&_a]:underline" +
        " [&_p]:my-1.5" +
        " first:[&>*]:mt-0 last:[&>*]:mb-0 " +
        className
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function markdownToHtml(input: string): string {
  if (!input) return "";
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inParagraph = false;

  const closeList = () => {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };
  const closeParagraph = () => {
    if (inParagraph) {
      out.push("</p>");
      inParagraph = false;
    }
  };

  for (let raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeList();
      closeParagraph();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      closeList();
      closeParagraph();
      const level = Math.min((headingMatch[1] ?? "").length, 4);
      out.push(`<h${level}>${inline(headingMatch[2] ?? "")}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      closeParagraph();
      if (inList !== "ul") {
        closeList();
        out.push("<ul>");
        inList = "ul";
      }
      out.push(`<li>${inline(ulMatch[1] ?? "")}</li>`);
      continue;
    }

    const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (olMatch) {
      closeParagraph();
      if (inList !== "ol") {
        closeList();
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${inline(olMatch[1] ?? "")}</li>`);
      continue;
    }

    if (/^-{3,}$/.test(line.trim())) {
      closeList();
      closeParagraph();
      out.push('<hr class="my-3 border-neutral-200" />');
      continue;
    }

    closeList();
    if (!inParagraph) {
      out.push("<p>");
      inParagraph = true;
    } else {
      out.push("<br/>");
    }
    out.push(inline(line));
  }

  closeList();
  closeParagraph();
  return out.join("");
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
