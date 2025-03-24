import { Book } from '@prisma/client'
import { create } from 'zustand'

interface BookState {
  book: Book | null
  setActiveBook: (book?: Book) => void
  editBook: Book | null
}

export const useBookStore = create<BookState>()((set) => ({
  book: null,
  setActiveBook: (book) => set((state) => ({ book })),
  editBook: null,
}))
