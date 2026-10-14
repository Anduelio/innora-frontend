import { create } from 'zustand'

export interface CreateDraft {
  mode: 'create'
  token: string
  checkIn: string
  checkOut: string
  roomId?: string
  roomTypeId?: number
}

export interface EditDraft {
  mode: 'edit'
  token: string
  reservationId: string
}

export type ModalState = CreateDraft | EditDraft | null
export type ToastTone = 'success' | 'error' | 'info'

interface ToastState {
  id: string
  tone: ToastTone
  lines: string[]
}

interface UiState {
  modal: ModalState
  drawerId: string | null
  toast: ToastState | null
  openCreate: (draft: Omit<CreateDraft, 'mode' | 'token'>) => void
  openEdit: (reservationId: string) => void
  openDrawer: (reservationId: string) => void
  closeModal: () => void
  closeDrawer: () => void
  showToast: (lines: string[], tone?: ToastTone) => void
  dismissToast: () => void
}

export const useUiStore = create<UiState>((set) => ({
  modal: null,
  drawerId: null,
  toast: null,
  openCreate: (draft) => set({ modal: { mode: 'create', ...draft, token: crypto.randomUUID() }, drawerId: null }),
  openEdit: (reservationId) =>
    set({ modal: { mode: 'edit', token: crypto.randomUUID(), reservationId }, drawerId: null }),
  openDrawer: (drawerId) => set({ drawerId, modal: null }),
  closeModal: () => set({ modal: null }),
  closeDrawer: () => set({ drawerId: null }),
  showToast: (lines, tone = 'success') => set({ toast: { id: crypto.randomUUID(), tone, lines } }),
  dismissToast: () => set({ toast: null }),
}))
