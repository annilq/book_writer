import { Chapter } from '@prisma/client'
import { create } from 'zustand'

interface ChapterState {
  chapter: Chapter | null
  setActiveChapter: (chapter?: Chapter) => void
}

export const useChapterStore = create<ChapterState>()((set) => ({
  chapter: null,
  setActiveChapter: (chapter) => set((state) => ({ chapter })),
}))
