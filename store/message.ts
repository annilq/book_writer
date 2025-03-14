import { Message } from '@prisma/client'
import { create } from 'zustand'

interface MessageState {
  message: Message | null
  setMessage: (message?: Message) => void
}

export const useMessageStore = create<MessageState>()((set) => ({
  message: null,
  setMessage: (message) => set((state) => ({ message })),
}))
