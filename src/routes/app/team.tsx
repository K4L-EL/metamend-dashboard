import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UsersRound, Plus, Loader2, Mail, Trash2, UserMinus, Copy, Check } from "lucide-react";
import { Header } from "../../components/layout/header";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import type { TeamSummary, TeamDetail } from "../../types";
import { ModalShell, ModalInput, ModalFooter } from "./admin";

export const Route = createFileRoute("/app/team")({
  component: TeamPage,
});

function TeamPage() {
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function refresh() {
    const list = await api.teams.myTeams();
    setTeams(list);
    if (!selected && list.length > 0 && list[0]) setSelected(list[0].id);
  }

  useEffect(() => {
    refresh().catch(() => setTeams([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Header title="Teams" subtitle="Collaborate with your IPC colleagues" />
      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[280px_1fr] max-w-6xl">
        <Card>
          <CardContent className="p-3">
            <button
              onClick={() => setShowCreate(true)}
              className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" />
              New team
            </button>

            {teams === null ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-neutral-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </div>
            ) : teams.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                You're not in any teams yet.
              </div>
            ) : (
              <div className="space-y-1">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors " +
                      (selected === t.id ? "bg-neutral-100 text-neutral-900" : "text-neutral-600 hover:bg-neutral-50")
                    }
                  >
                    <UsersRound className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span className="flex-1 truncate font-medium">{t.name}</span>
                    <span className="text-[10px] text-neutral-400">{t.memberCount}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          {selected ? <TeamDetailCard teamId={selected} onChanged={refresh} /> : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-neutral-400">
                Select a team to see details.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={async (id) => {
            setShowCreate(false);
            await refresh();
            setSelected(id);
          }}
        />
      )}
    </div>
  );
}

function TeamDetailCard({ teamId, onChanged }: { teamId: string; onChanged: () => void }) {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function load() {
    setTeam(null);
    try {
      const t = await api.teams.getTeam(teamId);
      setTeam(t);
    } catch {
      setTeam(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (!team) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 p-8 text-xs text-neutral-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </CardContent>
      </Card>
    );
  }

  const canManage = team.myRole === "Owner" || team.myRole === "Admin" || !!user?.isAdmin;
  const roles = ["Viewer", "Editor", "Admin"];

  function copyInvite(token: string) {
    const url = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((prev) => (prev === token ? null : prev)), 1500);
    });
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{team.name}</h2>
            <p className="text-xs text-neutral-500">{team.description || "No description"}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="metamed">{team.myRole}</Badge>
              <span className="text-[11px] text-neutral-500">{team.members.length} member{team.members.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
            >
              <Mail className="h-3.5 w-3.5" />
              Invite
            </button>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Role</th>
                  <th className="py-2 pr-3 font-semibold">Joined</th>
                  <th className="py-2 pr-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((m) => {
                  const isSelf = m.userId === user?.id;
                  return (
                    <tr key={m.userId} className="border-b border-neutral-100">
                      <td className="py-2 pr-3 font-medium text-neutral-900">{m.displayName} {isSelf && <span className="text-[10px] text-neutral-400">(you)</span>}</td>
                      <td className="py-2 pr-3 text-neutral-700">{m.email}</td>
                      <td className="py-2 pr-3 text-neutral-700">
                        {canManage && m.role !== "Owner" && !isSelf ? (
                          <select
                            value={m.role}
                            onChange={async (e) => {
                              await api.teams.updateMemberRole(team.id, m.userId, e.target.value);
                              load();
                            }}
                            className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[11px]"
                          >
                            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          m.role
                        )}
                      </td>
                      <td className="py-2 pr-3 text-neutral-700">{new Date(m.joinedAt).toLocaleDateString("en-GB")}</td>
                      <td className="py-2 pr-3 text-right">
                        {m.role !== "Owner" && (canManage || isSelf) && (
                          <button
                            onClick={async () => {
                              const ok = confirm(isSelf ? "Leave this team?" : `Remove ${m.displayName}?`);
                              if (!ok) return;
                              await api.teams.removeMember(team.id, m.userId);
                              if (isSelf) onChanged();
                              else load();
                            }}
                            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-red-600"
                            title={isSelf ? "Leave team" : "Remove member"}
                          >
                            {isSelf ? <UserMinus className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {canManage && team.pendingInvites.length > 0 && (
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Pending invites</h3>
            <div className="space-y-1.5">
              {team.pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-xs">
                  <div>
                    <p className="font-medium text-neutral-900">{inv.email}</p>
                    <p className="text-[11px] text-neutral-500">Role: {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString("en-GB")}</p>
                  </div>
                  <button
                    onClick={() => copyInvite(inv.token)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-1 text-[11px] hover:bg-neutral-50"
                  >
                    {copiedToken === inv.token ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedToken === inv.token ? "Copied" : "Copy link"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {showInvite && (
        <InviteModal
          teamId={team.id}
          onClose={() => setShowInvite(false)}
          onInvited={async () => { setShowInvite(false); load(); }}
        />
      )}
    </Card>
  );
}

function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const created = await api.teams.create({ name: form.name.trim(), description: form.description.trim() || undefined });
      onCreated(created.id);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unable to create team";
      setError(msg);
      setLoading(false);
    }
  }
  return (
    <ModalShell title="Create team" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalInput label="Team name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required autoFocus />
        <ModalInput label="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        {error && <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}
        <ModalFooter loading={loading} onClose={onClose} submitLabel="Create team" />
      </form>
    </ModalShell>
  );
}

function InviteModal({ teamId, onClose, onInvited }: { teamId: string; onClose: () => void; onInvited: () => void }) {
  const [form, setForm] = useState({ email: "", role: "Viewer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.teams.invite(teamId, { email: form.email.trim().toLowerCase(), role: form.role });
      onInvited();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Unable to send invite";
      setError(msg);
      setLoading(false);
    }
  }
  return (
    <ModalShell title="Invite team member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required autoFocus />
        <div>
          <label className="mb-1 block text-[11px] font-medium text-neutral-600">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:bg-white"
          >
            <option value="Viewer">Viewer</option>
            <option value="Editor">Editor</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}
        <ModalFooter loading={loading} onClose={onClose} submitLabel="Send invite" />
      </form>
    </ModalShell>
  );
}
