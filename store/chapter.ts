import { Chapter } from '@prisma/client'
import { create } from 'zustand'

interface ChapterState {
  chapter: Chapter | null
  setChapter: (chapter?: Chapter) => void
}

export const useChaperStore = create<ChapterState>()((set) => ({
  chapter: null,
  setChapter: (chapter) => set((state) => ({ chapter })),
}))
