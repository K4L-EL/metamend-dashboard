import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { generateAiResponse } from "../../lib/ai-engine";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_SUGGESTIONS = [
  "Summarize today's infection trends",
  "Which patients are at highest risk?",
  "Explain the current outbreak situation",
  "What antibiotics should be reviewed?",
  "Show me screening compliance",
  "Analyze the transmission network",
];

export function AiChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await generateAiResponse(text.trim());
      const reply: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      const errorMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "I encountered an error while analyzing the data. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function renderContent(content: string) {
    return content.split("\n").map((line, i) => {
      let rendered = line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");

      return (
        <span key={i} className="block" dangerouslySetInnerHTML={{ __html: rendered || "&nbsp;" }} />
      );
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-20 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          open
            ? "bg-neutral-200 text-neutral-700"
            : "bg-sky-600 text-white hover:bg-sky-700",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-20 z-50 flex h-[540px] w-[400px] flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
              <Sparkles className="h-4 w-4 text-sky-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-neutral-900">MetaMed AI</h3>
              <p className="text-[10px] text-neutral-400">Infection intelligence assistant — real-time data access</p>
            </div>
            <div className="flex h-2 w-2 rounded-full bg-green-500" title="Connected to dashboard data" />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-sky-50 p-3">
                  <Bot className="h-4 w-4 shrink-0 text-sky-600" />
                  <p className="text-xs text-sky-800">
                    Hi! I'm the MetaMed AI assistant. I have access to all your dashboard data — infections, patients, outbreaks, resistance patterns, and more. Ask me anything.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {WELCOME_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-left text-[11px] text-neutral-600 transition-colors hover:border-sky-300 hover:bg-sky-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "ml-auto max-w-[85%] bg-sky-600 text-white"
                        : "bg-neutral-50 text-neutral-700 border border-neutral-100",
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-0.5">{renderContent(msg.content)}</div>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                    <span className="text-xs text-neutral-500">Analyzing dashboard data...</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-neutral-200 p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about infections, risks, outbreaks..."
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-sky-300"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-700 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
