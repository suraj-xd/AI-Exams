import { create } from 'zustand'

// Assuming the prompt is a string for simplicity, adjust the type as needed.
interface LoadingState {
  isLoading: boolean | null;
  setIsLoading: (t: boolean | null) => void;
}

const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: null,
  setIsLoading: (t: boolean | null) => set(() => ({ isLoading: t })),
}))

export default useLoadingStore;