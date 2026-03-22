import { create } from 'zustand'

const MOBILE_BREAKPOINT = 768

interface EntryStore {
  activeEntryIndex: number
  setActiveEntryIndex: (index: number) => void
  isMobile: boolean
}

export const useEntryStore = create<EntryStore>((set) => ({
  activeEntryIndex: 0,
  setActiveEntryIndex: (index) => set({ activeEntryIndex: index }),
  isMobile: window.innerWidth < MOBILE_BREAKPOINT,
}))

function updateIsMobile() {
  useEntryStore.setState({ isMobile: window.innerWidth < MOBILE_BREAKPOINT })
}
window.addEventListener('resize', updateIsMobile)
