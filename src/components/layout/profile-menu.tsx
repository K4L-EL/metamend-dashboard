import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User, Users, ShieldCheck, ChevronDown } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { cn } from "../../lib/utils";

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const initials = (user?.displayName ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "U";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50",
          open && "bg-neutral-50",
        )}
        title={user?.displayName ?? "Account"}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-bold text-white">
          {initials}
        </div>
        <div className="hidden text-left lg:block">
          <p className="text-xs font-medium leading-tight text-neutral-900">{user?.displayName ?? "Guest"}</p>
          <p className="text-[10px] text-neutral-500">
            {user?.title ?? (user?.isAdmin ? "Administrator" : "Member")}
          </p>
        </div>
        <ChevronDown
          className={cn("hidden h-3 w-3 text-neutral-400 transition-transform lg:block", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {user?.displayName ?? "Guest"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-neutral-500">
              {user?.email ?? "-"}
            </p>
            {user?.isAdmin && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
          </div>

          <div className="py-1">
            <MenuItem to="/app/account" icon={User} label="Account" onClick={() => setOpen(false)} />
            <MenuItem to="/app/team" icon={Users} label="Team" onClick={() => setOpen(false)} />
            <MenuItem to="/app/settings" icon={Settings} label="Settings" onClick={() => setOpen(false)} />
            {user?.isAdmin && (
              <MenuItem to="/app/admin" icon={ShieldCheck} label="Admin panel" onClick={() => setOpen(false)} />
            )}
          </div>

          <div className="border-t border-neutral-100 py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs text-neutral-700 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      <Icon className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.8} />
      {label}
    </Link>
  );
}
