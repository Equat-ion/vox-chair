import { create } from 'zustand';

interface SidePaneStore {
  isOpen: boolean;
  lastEditedDraftId: string | null;
  lastEditedDraftTitle: string | null;
  editorContent: string;
  isSaved: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setLastEditedDraft: (draftId: string | null, draftTitle: string | null) => void;
  setEditorContent: (content: string) => void;
  setIsSaved: (saved: boolean) => void;
}

export const useSidePaneStore = create<SidePaneStore>((set) => ({
  isOpen: false,
  lastEditedDraftId: null,
  lastEditedDraftTitle: null,
  editorContent: "",
  isSaved: true,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setLastEditedDraft: (draftId, draftTitle) => set({ lastEditedDraftId: draftId, lastEditedDraftTitle: draftTitle }),
  setEditorContent: (content) => set({ editorContent: content }),
  setIsSaved: (saved) => set({ isSaved: saved }),
}));
