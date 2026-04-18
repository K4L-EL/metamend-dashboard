import { api } from "../lib/api";
import type { AuthUser, AuthResponse } from "../types";

const STORAGE_KEY = "metamed.session";

interface StoredSession {
  token: string;
  user: AuthUser;
  loggedInAt: string;
}

function readStored(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function writeStored(session: StoredSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function storeAuthResponse(res: AuthResponse): StoredSession {
  const session: StoredSession = {
    token: res.accessToken,
    user: res.user,
    loggedInAt: new Date().toISOString(),
  };
  writeStored(session);
  return session;
}

export const authService = {
  isAuthenticated(): boolean {
    const s = readStored();
    return !!s?.token;
  },
  getSession(): StoredSession | null {
    return readStored();
  },
  getUser(): AuthUser | null {
    return readStored()?.user ?? null;
  },
  getToken(): string | null {
    return readStored()?.token ?? null;
  },
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await api.auth.login({ email, password });
    const session = storeAuthResponse(res);
    return session.user;
  },
  async register(data: { email: string; password: string; displayName: string; title?: string; organization?: string; inviteToken?: string }): Promise<AuthUser> {
    const res = await api.auth.register(data);
    const session = storeAuthResponse(res);
    return session.user;
  },
  async logout(): Promise<void> {
    try {
      await api.auth.logout();
    } catch {
      // ignore server errors
    }
    writeStored(null);
  },
  async refresh(): Promise<AuthUser | null> {
    try {
      const user = await api.auth.me();
      const current = readStored();
      if (current) writeStored({ ...current, user });
      return user;
    } catch {
      return null;
    }
  },
  updateStoredUser(user: AuthUser) {
    const current = readStored();
    if (current) writeStored({ ...current, user });
  },
};

export type { StoredSession };
