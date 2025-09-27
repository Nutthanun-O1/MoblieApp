// lib/useAuth.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

type Role = "admin" | "member";
export type MinimalUser = {
  psu_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
};

type AuthContextValue = {
  user: MinimalUser | null;
  loading: boolean;
  signIn: (u: MinimalUser) => Promise<void>;
  signOut: () => Promise<void>;
  hydrateUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "AUTH_USER";

const storage = {
  async getItem(key: string) {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async setItem(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  async removeItem(key: string) {
    try { await SecureStore.deleteItemAsync(key); } catch {}
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MinimalUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = async () => {
    setLoading(true);
    try {
      const raw = await storage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
      else setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateUser();
  }, []);

  const signIn = async (u: MinimalUser) => {
    setUser(u);
    await storage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const signOut = async () => {
    setUser(null);
    await storage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn,
    signOut,
    hydrateUser,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used within <AuthProvider>");
  return ctx;
}
