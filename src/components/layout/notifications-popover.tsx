import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { api } from "../../lib/api";
import { cn, formatDateTime, severityColor } from "../../lib/utils";
import { Badge } from "../ui/badge";
import type { Alert } from "../../types";

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unread = alerts.filter((a) => !a.isRead);
  const unreadCount = unread.length;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.alerts.getAll();
        if (alive) setAlerts(data);
      } catch {
        // ignore - fallback to empty
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAll() {
    const ids = unread.map((a) => a.id);
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    for (const id of ids) {
      try {
        await api.alerts.markAsRead(id);
      } catch {
        /* ignore */
      }
    }
  }

  async function onAlertClick(a: Alert) {
    if (!a.isRead) {
      setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, isRead: true } : x)));
      try {
        await api.alerts.markAsRead(a.id);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    const cat = a.category.toLowerCase();
    if (cat === "infection") navigate({ to: "/app/surveillance" });
    else if (cat === "outbreak") navigate({ to: "/app/outbreaks" });
    else if (cat === "compliance") navigate({ to: "/app/screening" });
    else if (cat === "risk") navigate({ to: "/app/hospital-map" });
    else navigate({ to: "/app/alerts" });
  }

  const recent = alerts.slice(0, 6);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700",
          open && "bg-neutral-100 text-neutral-800",
        )}
        title="Notifications"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Notifications</p>
              <p className="text-[11px] text-neutral-500">
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread ${unreadCount === 1 ? "alert" : "alerts"}`}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-sky-700 transition-colors hover:bg-sky-50"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && alerts.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-neutral-400">
                Loading...
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-6 w-6 text-neutral-300" />
                <p className="text-xs text-neutral-500">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recent.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => onAlertClick(a)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                        !a.isRead && "bg-sky-50/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          a.isRead ? "bg-neutral-300" : "bg-sky-500",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-medium text-neutral-900">
                            {a.title}
                          </p>
                          <Badge variant={severityColor(a.severity)} className="text-[9px]">
                            {a.severity}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-500">
                          {a.description}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-400">
                          {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-2.5">
            <Link
              to="/app/alerts"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-xs font-medium text-neutral-700 transition-colors hover:text-neutral-900"
            >
              View all alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
