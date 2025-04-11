import { create } from 'zustand'

interface ErrorState {
  error: string | null
  setError: (error?: string) => void
}

export const useErrorStore = create<ErrorState>()((set) => ({
  error: null,
  setError: (error) => set((state) => ({ error })),
}))
