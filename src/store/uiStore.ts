import { create } from 'zustand'

export interface CreateDraft {
  mode: 'create'
  token: string
  checkIn: string
  checkOut: string
  roomId?: string
  roomTypeId?: number
  /** Klient ekzistues që plotëson kontaktin. */
  guest?: { name: string; phone: string; email?: string | null }
}

export interface EditDraft {
  mode: 'edit'
  token: string
  reservationId: string
}

export type ModalState = CreateDraft | EditDraft | null

interface UiState {
  modal: ModalState
  drawerId: string | null
  openCreate: (draft: Omit<CreateDraft, 'mode' | 'token'>) => void
  openEdit: (reservationId: string) => void
  openDrawer: (reservationId: string) => void
  closeModal: () => void
  closeDrawer: () => void
}

export const useUiStore = create<UiState>((set) => ({
  modal: null,
  drawerId: null,
  openCreate: (draft) => set({ modal: { mode: 'create', ...draft, token: crypto.randomUUID() }, drawerId: null }),
  openEdit: (reservationId) =>
    set({ modal: { mode: 'edit', token: crypto.randomUUID(), reservationId }, drawerId: null }),
  openDrawer: (drawerId) => set({ drawerId, modal: null }),
  closeModal: () => set({ modal: null }),
  closeDrawer: () => set({ drawerId: null }),
}))
