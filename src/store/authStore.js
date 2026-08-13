import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  profile: null,
  loading: true,
  error: null,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
