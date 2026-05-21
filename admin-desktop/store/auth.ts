import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthToken } from "../lib/api";

export const ADMIN_EMAIL = "admin@alhayaa.com";
export const ADMIN_PASSWORD = "Admin@12345";

interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  role: string;
}

export const DEFAULT_ADMIN_USER: AuthUser = {
  id: "admin",
  role: "SUPER_ADMIN",
  email: ADMIN_EMAIL,
  name: "مسؤول",
};

const LOCAL_SESSION = {
  accessToken: "local-dev-token",
  refreshToken: "local-dev-refresh",
  user: DEFAULT_ADMIN_USER,
};

interface AuthState {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  setSession: (s: { accessToken: string; refreshToken: string; user?: AuthUser }) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      ...LOCAL_SESSION,
      setSession: (s) => {
        setAuthToken(s.accessToken);
        set({
          accessToken: s.accessToken,
          refreshToken: s.refreshToken,
          user: s.user ?? DEFAULT_ADMIN_USER,
        });
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

setAuthToken(LOCAL_SESSION.accessToken);
