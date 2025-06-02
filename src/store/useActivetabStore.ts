import { create } from 'zustand'

interface ActiveTabState {
  activeTab: string
  setActiveTab: (tabName: string) => void
}

export const useActiveTabStore = create<ActiveTabState>((set) => ({
  activeTab: 'Home',
  setActiveTab: (tabName: string) => set({ activeTab: tabName }),
}))
