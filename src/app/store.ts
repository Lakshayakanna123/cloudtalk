import { create } from 'zustand';
import type { ConversationListItem } from '../types';

interface ChatStore {
  selectedConversationId: string | null;
  sidebarOpen: boolean;
  searchQuery: string;
  setSelectedConversation: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  selectedConversationId: null,
  sidebarOpen: true,
  searchQuery: '',
  setSelectedConversation: (id) =>
    set({ selectedConversationId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
