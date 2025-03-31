import { Message } from '@prisma/client'
import { UIMessage } from 'ai'
import { create } from 'zustand'

interface MessageState {
  message: Message | UIMessage | null
  setActiveMessage: (message?: Message | UIMessage) => void
  editMessage: Message | UIMessage | null
  setEditMessage: (message?: Message | UIMessage) => void
}

export const useMessageStore = create<MessageState>()((set) => ({
  message: null,
  setActiveMessage: (message) => set((state) => ({ message })),
  editMessage: null,
  setEditMessage: (editMessage) => set((state) => ({ editMessage })),
}))
