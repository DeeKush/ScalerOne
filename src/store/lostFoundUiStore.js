import { create } from 'zustand';

export const useLostFoundUiStore = create((set) => ({
  tab: 'all',
  category: 'all',
  search: '',
  toastMessage: null,
  setTab: (tab) => set({ tab }),
  setCategory: (category) => set({ category }),
  setSearch: (search) => set({ search }),
  setToast: (toastMessage) => set({ toastMessage }),
  clearToast: () => set({ toastMessage: null }),
}));
