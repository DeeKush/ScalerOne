import { create } from 'zustand';
import { HUB_SECTIONS } from '@/src/data/hubSections';

export const useNavStore = create((set, get) => ({
  mode: 'root',
  activeSectionId: null,
  activeSubIndex: 0,
  rootTitle: 'Hub',
  enterSection: (sectionId) =>
    set({
      mode: 'section',
      activeSectionId: sectionId,
      activeSubIndex: 0,
    }),
  exitToRoot: () =>
    set({
      mode: 'root',
      activeSectionId: null,
      activeSubIndex: 0,
    }),
  setActiveSubIndex: (index) => set({ activeSubIndex: index }),
  headerTitle: () => {
    const { mode, activeSectionId, rootTitle } = get();
    if (mode === 'root' || !activeSectionId) return rootTitle;
    return HUB_SECTIONS.find((s) => s.id === activeSectionId)?.title ?? rootTitle;
  },
}));
