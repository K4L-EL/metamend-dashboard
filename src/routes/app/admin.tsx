import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  UsersRound,
  UserPlus,
  Loader2,
  Pencil,
  KeyRound,
  Trash2,
  Shield,
  Mail,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { Header } from "../../components/layout/header";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";
import { authService } from "../../services/auth-service";
import type { AuthUser, AdminTeamRow, AdminInviteRow } from "../../types";
import { ArticlesAdminTab } from "../../features/admin/articles-tab";

type AdminTab = "users" | "teams" | "invites" | "articles";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: () => {
    const user = authService.getUser();
    if (!user?.isAdmin) throw redirect({ to: "/app" });
  },
  component: AdminPage,
});

function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <div>
      <Header title="Admin" subtitle="Manage users, teams, invites, and blog articles" />
      <div className="space-y-4 p-4 sm:p-6 max-w-6xl">
        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-xs">
          <TabBtn icon={UsersRound} label="Users" active={tab === "users"} onClick={() => setTab("users")} />
          <TabBtn icon={Shield} label="Teams" active={tab === "teams"} onClick={() => setTab("teams")} />
          <TabBtn icon={Mail} label="Invites" active={tab === "invites"} onClick={() => setTab("invites")} />
          <TabBtn icon={FileText} label="Articles" active={tab === "articles"} onClick={() => setTab("articles")} />
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "teams" && <TeamsTab />}
        {tab === "invites" && <InvitesTab />}
        {tab === "articles" && <ArticlesAdminTab />}
      </div>
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }: { icon: typeof ShieldCheck; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors " +
        (active ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700")
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ----- Users ----- */

function UsersTab() {
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [resetting, setResetting] = useState<AuthUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AuthUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function refresh() {
    const res = await api.admin.listUsers({ search: search || undefined, page: 1, pageSize: 200 });
    setUsers(res.users);
  }

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await api.admin.listUsers({ search: search || undefined, page: 1, pageSize: 200 });
        if (!cancelled) setUsers(res.users);
      } catch {
        if (!cancelled) setUsers([]);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-60 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-sky-400 focus:bg-white"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            <UserPlus className="h-3.5 w-3.5" />
            New user
          </button>
        </div>

        {users === null ? (
          <LoadingRow />
        ) : users.length === 0 ? (
          <EmptyRow label="No users found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Title</Th>
                  <Th>Role</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100">
                    <Td className="font-medium text-neutral-900">{u.displayName}</Td>
                    <Td>{u.email}</Td>
                    <Td>{u.title ?? "—"}</Td>
                    <Td>{u.isAdmin ? <Badge variant="metamed">Admin</Badge> : <Badge variant="success">Member</Badge>}</Td>
                    <Td>{new Date(u.createdAt).toLocaleDateString("en-GB")}</Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <IconBtn title="Edit" onClick={() => setEditing(u)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn title="Reset password" onClick={() => setResetting(u)}><KeyRound className="h-3.5 w-3.5" /></IconBtn>
                        <IconBtn title="Delete" onClick={() => { setConfirmDelete(u); setDeleteError(null); }}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </IconBtn>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refresh(); }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
      {resetting && (
        <ResetPasswordModal
          user={resetting}
          onClose={() => setResetting(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteUserModal
          user={confirmDelete}
          error={deleteError}
          loading={deleteLoading}
          onCancel={() => { setConfirmDelete(null); setDeleteError(null); }}
          onConfirm={async () => {
            setDeleteLoading(true);
            setDeleteError(null);
            try {
              await api.admin.deleteUser(confirmDelete.id);
              setConfirmDelete(null);
              refresh();
            } catch (e) {
              const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not delete user";
              setDeleteError(msg);
            } finally {
              setDeleteLoading(false);
            }
          }}
        />
      )}
    </Card>
  );
}

function ConfirmDeleteUserModal({
  user, error, loading, onCancel, onConfirm,
}: {
  user: AuthUser;
  error: string | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Delete user?</h3>
            <p className="mt-1 text-xs text-neutral-600">
              <span className="font-medium">{user.displayName}</span> ({user.email}) will lose access immediately. This cannot be undone.
            </p>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
          >
            {loading ? "Deleting…" : "Delete user"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", displayName: "", title: "", organization: "", isAdmin: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.admin.createUser(form);
      onCreated();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unable to create user";
      setError(msg);
      setLoading(false);
    }
  }
  return (
    <ModalShell title="Create user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalInput label="Full name" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} required autoFocus />
        <ModalInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <ModalInput label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        <div className="grid grid-cols-2 gap-3">
          <ModalInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <ModalInput label="Organisation" value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} />
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
          Grant administrator privileges
        </label>
        {error && <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}
        <ModalFooter loading={loading} onClose={onClose} submitLabel="Create user" />
      </form>
    </ModalShell>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: AuthUser; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ displayName: user.displayName, title: user.title ?? "", organization: user.organization ?? "", isAdmin: user.isAdmin });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.admin.updateUser(user.id, form);
      onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unable to update user";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <ModalShell title={`Edit ${user.displayName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalInput label="Full name" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} required autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <ModalInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <ModalInput label="Organisation" value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} />
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
          Administrator
        </label>
        {error && <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}
        <ModalFooter loading={loading} onClose={onClose} submitLabel="Save changes" />
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.admin.resetPassword(user.id, pw);
      setDone(true);
      setLoading(false);
      setTimeout(onClose, 1200);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unable to reset password";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <ModalShell title={`Reset password for ${user.displayName}`} onClose={onClose}>
      {done ? (
        <div className="text-sm text-emerald-700">Password updated.</div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <ModalInput label="New password" type="password" value={pw} onChange={setPw} required autoFocus />
          {error && <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}
          <ModalFooter loading={loading} onClose={onClose} submitLabel="Reset password" />
        </form>
      )}
    </ModalShell>
  );
}

/* ----- Teams ----- */

function TeamsTab() {
  const [teams, setTeams] = useState<AdminTeamRow[] | null>(null);

  useEffect(() => {
    api.admin.listAllTeams().then(setTeams).catch(() => setTeams([]));
  }, []);

  return (
    <Card>
      <CardContent className="p-5">
        {teams === null ? (
          <LoadingRow />
        ) : teams.length === 0 ? (
          <EmptyRow label="No teams yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th>Members</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100">
                    <Td className="font-medium text-neutral-900">{t.name}</Td>
                    <Td>{t.slug}</Td>
                    <Td>{t.memberCount}</Td>
                    <Td>{new Date(t.createdAt).toLocaleDateString("en-GB")}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----- Invites ----- */

function InvitesTab() {
  const [invites, setInvites] = useState<AdminInviteRow[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.admin.listAllInvites().then(setInvites).catch(() => setInvites([]));
  }, []);

  function copyLink(token: string) {
    const url = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied((prev) => (prev === token ? null : prev)), 1500);
    });
  }

  return (
    <Card>
      <CardContent className="p-5">
        {invites === null ? (
          <LoadingRow />
        ) : invites.length === 0 ? (
          <EmptyRow label="No invites." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <Th>Team</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Expires</Th>
                  <Th className="text-right">Link</Th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id} className="border-b border-neutral-100">
                    <Td className="font-medium text-neutral-900">{i.teamName}</Td>
                    <Td>{i.email}</Td>
                    <Td>{roleLabel(i.role)}</Td>
                    <Td>{i.status}</Td>
                    <Td>{new Date(i.expiresAt).toLocaleDateString("en-GB")}</Td>
                    <Td className="text-right">
                      <button
                        onClick={() => copyLink(i.token)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-1 text-[11px] hover:bg-neutral-50"
                      >
                        {copied === i.token ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copied === i.token ? "Copied" : "Copy link"}
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function roleLabel(role: number | string) {
  const map: Record<number, string> = { 0: "Viewer", 1: "Editor", 2: "Admin", 3: "Owner" };
  if (typeof role === "string") return role;
  return map[role] ?? String(role);
}

/* ----- Shared helpers ----- */

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-2 pr-3 font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2 pr-3 text-neutral-700 ${className}`}>{children}</td>;
}
function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700">
      {children}
    </button>
  );
}
function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-xs text-neutral-400">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
    </div>
  );
}
function EmptyRow({ label }: { label: string }) {
  return <div className="py-10 text-center text-xs text-neutral-400">{label}</div>;
}

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-100">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ModalInput({ label, value, onChange, type = "text", required, autoFocus }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; autoFocus?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-neutral-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white"
      />
    </div>
  );
}

export function ModalFooter({ loading, onClose, submitLabel }: { loading: boolean; onClose: () => void; submitLabel: string }) {
  return (
    <div className="mt-2 flex items-center justify-end gap-2">
      <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100">Cancel</button>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
