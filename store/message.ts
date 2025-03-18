import { Message } from '@prisma/client'
import { create } from 'zustand'

interface MessageState {
  message: Message | null
  setActiveMessage: (message?: Message) => void
  editMessage: Message | null
  setEditMessage: (message?: Message) => void
}

export const useMessageStore = create<MessageState>()((set) => ({
  message: null,
  setActiveMessage: (message) => set((state) => ({ message })),
  editMessage: null,
  setEditMessage: (editMessage) => set((state) => ({ editMessage })),
}))
