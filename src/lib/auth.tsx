"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Role, User } from "./types";
import { buildSeed } from "./mockData";

const USERS_KEY = "gomov_users_v1";
const SESSION_KEY = "gomov_session_v1";

interface AuthContextValue {
  user: User | null;
  users: User[];
  ready: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  setUsers: (users: User[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUsers(): User[] {
  if (typeof window === "undefined") return buildSeed().users;
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch {
    /* ignore */
  }
  const seeded = buildSeed().users;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
  return seeded;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsersState] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadUsers();
    setUsersState(loaded);
    try {
      const rawSession = window.localStorage.getItem(SESSION_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as { username: string };
        const found = loaded.find((u) => u.username === parsed.username);
        if (found) setUser(found);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persistUsers = useCallback((next: User[]) => {
    setUsersState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(next));
    }
  }, []);

  const login = useCallback(
    (username: string, password: string) => {
      const found = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
      );
      if (!found || found.password !== password) {
        return { ok: false, error: "Username atau password salah." };
      }
      setUser(found);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ username: found.username }),
        );
      }
      return { ok: true };
    },
    [users],
  );

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, users, ready, login, logout, setUsers: persistUsers }),
    [user, users, ready, login, logout, persistUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

export function hasAccess(role: Role | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
