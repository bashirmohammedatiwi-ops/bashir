import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthToken } from "../lib/api";

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  role: string;
}

interface AuthState {
  accessToken: string;
  refreshToken: string;
  user: AuthUser | null;
  setSession: (s: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clearSession: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: "",
      refreshToken: "",
      user: null,
      setSession: (s) => {
        setAuthToken(s.accessToken);
        set({
          accessToken: s.accessToken,
          refreshToken: s.refreshToken,
          user: s.user,
        });
      },
      clearSession: () => {
        setAuthToken(null);
        set({ accessToken: "", refreshToken: "", user: null });
      },
    }),
    {
      name: "alhayaa-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAuthToken(state.accessToken);
      },
    },
  ),
);
