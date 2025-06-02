import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CreditsState {
  credits: number;
  localApiKey: string | null;
  usingLocalKey: boolean;
  isHydrated: boolean;
  
  // Credit management
  decrementCredits: () => boolean; // Returns true if successful, false if no credits
  resetCredits: () => void;
  getCredits: () => number;
  
  // API key management
  setLocalApiKey: (key: string) => void;
  removeLocalApiKey: () => void;
  getApiKey: () => string | null;
  isUsingLocalKey: () => boolean;
  
  // Hydration
  setHydrated: (hydrated: boolean) => void;
}

const INITIAL_CREDITS = 4;

const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      credits: INITIAL_CREDITS,
      localApiKey: null,
      usingLocalKey: false,
      isHydrated: false,
      
      decrementCredits: () => {
        const state = get();
        
        // If using local API key, don't decrement credits
        if (state.localApiKey) {
          return true;
        }
        
        // Check if user has credits
        if (state.credits <= 0) {
          return false;
        }
        
        // Decrement credits
        set({ credits: state.credits - 1 });
        return true;
      },
      
      resetCredits: () => {
        set({ credits: INITIAL_CREDITS });
      },
      
      getCredits: () => {
        return get().credits;
      },
      
      setLocalApiKey: (key: string) => {
        set({ 
          localApiKey: key,
          usingLocalKey: true
        });
      },
      
      removeLocalApiKey: () => {
        set({ 
          localApiKey: null,
          usingLocalKey: false
        });
      },
      
      getApiKey: () => {
        return get().localApiKey;
      },
      
      isUsingLocalKey: () => {
        return get().usingLocalKey && get().localApiKey !== null;
      },
      
      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: 'eduquest-credits',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);

export default useCreditsStore; 