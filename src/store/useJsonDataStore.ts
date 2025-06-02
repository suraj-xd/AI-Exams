import { create } from 'zustand'

interface JsonDataState {
  jsonData: any | null;
  setJsonData: (data: any) => void;
}

const useJsonDataStore = create<JsonDataState>((set) => ({
  jsonData: null,
  setJsonData: (data: any) => set(() => ({ jsonData: data })),
}))

export default useJsonDataStore
