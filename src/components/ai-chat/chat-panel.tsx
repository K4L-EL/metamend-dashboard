import { useState } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_SUGGESTIONS = [
  "Summarize today's infection trends",
  "Which patients are at highest risk?",
  "Explain the MRSA outbreak in ICU-A",
  "What antibiotics should be reviewed?",
];

export function AiChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const reply: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "This is a placeholder response. The MetaMed AI assistant will be available in a future release. It will provide real-time intelligence on infections, resistance patterns, risk forecasts, and outbreak investigations.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 800);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          open
            ? "bg-neutral-200 text-neutral-700"
            : "bg-sky-600 text-white hover:bg-sky-700",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[480px] w-[360px] flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
              <Sparkles className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">MetaMed AI</h3>
              <p className="text-[10px] text-neutral-400">Infection intelligence assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-sky-50 p-3">
                  <Bot className="h-4 w-4 shrink-0 text-sky-600" />
                  <p className="text-xs text-sky-800">
                    Hi! I'm the MetaMed AI assistant. How can I help you today?
                  </p>
                </div>
                <div className="space-y-1.5">
                  {WELCOME_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-600 transition-colors hover:border-sky-300 hover:bg-sky-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                    msg.role === "user"
                      ? "ml-auto bg-sky-600 text-white"
                      : "bg-neutral-100 text-neutral-700",
                  )}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask MetaMed AI..."
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-sky-300"
              />
              <button
                type="submit"
                disabled={!input.trim()}
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
