import { create } from 'zustand'

export interface CreateDraft {
  mode: 'create'
  token: string
  roomId: string
  checkIn: string
  nights: number
}

export interface EditDraft {
  mode: 'edit'
  token: string
  reservationId: string
}

export type ModalState = CreateDraft | EditDraft | null

interface ToastState {
  id: string
  lines: string[]
}

interface UiState {
  modal: ModalState
  drawerId: string | null
  folioId: number | null
  toast: ToastState | null
  openCreate: (draft: Omit<CreateDraft, 'mode' | 'token'>) => void
  openEdit: (reservationId: string) => void
  openDrawer: (reservationId: string) => void
  openFolio: (folioId: number) => void
  closeModal: () => void
  closeDrawer: () => void
  closeFolio: () => void
  showToast: (lines: string[]) => void
  dismissToast: () => void
}

export const useUiStore = create<UiState>((set) => ({
  modal: null,
  drawerId: null,
  folioId: null,
  toast: null,
  openCreate: (draft) =>
    set({ modal: { mode: 'create', ...draft, token: crypto.randomUUID() }, drawerId: null, folioId: null }),
  openEdit: (reservationId) =>
    set({ modal: { mode: 'edit', token: crypto.randomUUID(), reservationId }, drawerId: null, folioId: null }),
  openDrawer: (drawerId) => set({ drawerId, modal: null, folioId: null }),
  openFolio: (folioId) => set({ folioId, drawerId: null, modal: null }),
  closeModal: () => set({ modal: null }),
  closeDrawer: () => set({ drawerId: null }),
  closeFolio: () => set({ folioId: null }),
  showToast: (lines) => set({ toast: { id: crypto.randomUUID(), lines } }),
  dismissToast: () => set({ toast: null }),
}))
