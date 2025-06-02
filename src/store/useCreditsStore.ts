import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface CreditsState {
  credits: number;
  localApiKey: string | null;
  usingLocalKey: boolean;
  isHydrated: boolean;
  sessionId: string | null;
  
  // Credit management (now server-side)
  decrementCredits: () => Promise<boolean>;
  resetCredits: () => Promise<boolean>;
  getCredits: () => number;
  syncWithServer: () => Promise<void>;
  
  // API key management (still client-side for security)
  setLocalApiKey: (key: string) => Promise<void>;
  removeLocalApiKey: () => Promise<void>;
  getApiKey: () => string | null;
  isUsingLocalKey: () => boolean;
  
  // Hydration
  setHydrated: (hydrated: boolean) => void;
}

const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      credits: 4, // Default value, will be synced with server
      localApiKey: null,
      usingLocalKey: false,
      isHydrated: false,
      sessionId: null,
      
      decrementCredits: async () => {
        const state = get();
        
        // If using local API key, don't decrement credits
        if (state.localApiKey) {
          return true;
        }
        
        try {
          const response = await axios.post('/api/session/credits', {
            action: 'decrement'
          });
          
          if (response.data.success) {
            set({ 
              credits: response.data.data.credits,
              sessionId: response.data.data.sessionId 
            });
            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.error('Failed to decrement credits:', error);
          return false;
        }
      },
      
      resetCredits: async () => {
        try {
          const response = await axios.post('/api/session/credits', {
            action: 'reset'
          });
          
          if (response.data.success) {
            set({ 
              credits: response.data.data.credits,
              sessionId: response.data.data.sessionId 
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to reset credits:', error);
          return false;
        }
      },
      
      getCredits: () => {
        return get().credits;
      },
      
      syncWithServer: async () => {
        try {
          const response = await axios.get('/api/session/credits');
          
          if (response.data.success) {
            set({
              credits: response.data.data.credits,
              sessionId: response.data.data.sessionId,
            });
            
            // Update server with local API key status if different
            const state = get();
            if (state.usingLocalKey !== response.data.data.hasLocalApiKey) {
              await axios.post('/api/session/credits', {
                action: 'setApiKeyStatus',
                hasLocalApiKey: state.usingLocalKey
              });
            }
          }
        } catch (error) {
          console.error('Failed to sync with server:', error);
        }
      },
      
      setLocalApiKey: async (key: string) => {
        set({ 
          localApiKey: key,
          usingLocalKey: true
        });
        
        // Update server about API key status
        try {
          await axios.post('/api/session/credits', {
            action: 'setApiKeyStatus',
            hasLocalApiKey: true
          });
        } catch (error) {
          console.error('Failed to update API key status on server:', error);
        }
      },
      
      removeLocalApiKey: async () => {
        set({ 
          localApiKey: null,
          usingLocalKey: false
        });
        
        // Update server about API key status
        try {
          await axios.post('/api/session/credits', {
            action: 'setApiKeyStatus',
            hasLocalApiKey: false
          });
          
          // Also sync credits from server since we might need to track them again
          await get().syncWithServer();
        } catch (error) {
          console.error('Failed to update API key status on server:', error);
        }
      },
      
      getApiKey: () => {
        return get().localApiKey;
      },
      
      isUsingLocalKey: () => {
        return get().usingLocalKey && get().localApiKey !== null;
      },
      
      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
        
        // Sync with server when hydrated
        if (hydrated) {
          get().syncWithServer();
        }
      },
    }),
    {
      name: 'eduquest-credits',
      // Only persist API key data, not credits (credits are server-side)
      partialize: (state) => ({
        localApiKey: state.localApiKey,
        usingLocalKey: state.usingLocalKey,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);

export default useCreditsStore; 