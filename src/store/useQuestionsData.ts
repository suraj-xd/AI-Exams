import { create } from 'zustand'

interface QuestionsState {
  questionData: any[] | any | null;
  mcqData: any[];
  fillData: any[];
  trueFalseData: any[];
  shortData: any[];
  longData: any[];
  setMcqData: (mcq: any[]) => void;
  setFillData: (fill: any[]) => void;
  setTrueFalseData: (trueFalse: any[]) => void;
  setShortData: (short: any[]) => void;
  setLongData: (long: any[]) => void;
}

const useQuestionsData = create<QuestionsState>((set) => ({
  questionData: null,
  mcqData: [],
  fillData: [],
  trueFalseData: [],
  shortData: [],
  longData: [],
  setMcqData: (mcq: any[]) => set((state) => ({ ...state, mcqData: mcq })),
  setFillData: (fill: any[]) => set((state) => ({ ...state, fillData: fill })),
  setTrueFalseData: (trueFalse: any[]) => set((state) => ({ ...state, trueFalseData: trueFalse })),
  setShortData: (short: any[]) => set((state) => ({ ...state, shortData: short })),
  setLongData: (long: any[]) => set((state) => ({ ...state, longData: long })),
}))

export default useQuestionsData

