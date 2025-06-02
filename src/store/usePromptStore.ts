import { create } from 'zustand'

// Assuming the prompt is a string for simplicity, adjust the type as needed.
interface PromptState {
  prompt: string | null;
  setPrompt: (t: string) => void;
}

const usePromptStore = create<PromptState>((set) => ({
  prompt: null,
  setPrompt: (t: string) => set(() => ({ prompt: t })),
}))

export default usePromptStore;