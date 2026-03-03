import { create } from "zustand";
import api from "@/lib/axios";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get("/api/auth/me");
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
      window.location.href = "/login";
    }
  },

  clearUser: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
