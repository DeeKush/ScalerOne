import { create } from 'zustand';
import type { UserProfile } from '@/src/lib/userProfile';

type AuthStore = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  profile: null,
  loading: true,
  error: null,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
