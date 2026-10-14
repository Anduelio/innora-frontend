import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { ApiError } from '@/lib/api/client'
import { useAssignRoom, useCancelReservation, useCheckIn, useCheckOut, useNoShow } from '@/lib/api/reservations'
import { useUiStore } from '@/store/uiStore'

export function useActionError() {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  return (error: unknown) => {
    if (error instanceof ApiError && error.status === 409 && error.code === 'VERSION_CONFLICT') {
      showToast([t('toast.conflict')], 'error')
      return
    }
    showToast([error instanceof ApiError && error.message ? error.message : t('toast.failed')], 'error')
  }
}

/** Veprimet e recepsionit me njoftimet e tyre, të njëjta në Sot, Kalendar dhe detaje. */
export function useStayActions() {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const onError = useActionError()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const noShow = useNoShow()
  const cancel = useCancelReservation()
  const assign = useAssignRoom()

  return {
    pending: checkIn.isPending || checkOut.isPending || noShow.isPending || cancel.isPending || assign.isPending,
    checkIn: (reservation: Reservation, onDone?: () => void) =>
      checkIn.mutate(reservation.id, {
        onSuccess: (updated) => {
          showToast([t('toast.checkedIn', { name: updated.guestName })])
          onDone?.()
        },
        onError,
      }),
    checkOut: (reservation: Reservation, onDone?: () => void) =>
      checkOut.mutate(reservation.id, {
        onSuccess: (updated) => {
          showToast([t('toast.checkedOut', { name: updated.guestName }), t('toast.syncPending')])
          onDone?.()
        },
        onError,
      }),
    noShow: (reservation: Reservation, onDone?: () => void) =>
      noShow.mutate(reservation.id, {
        onSuccess: (updated) => {
          showToast([t('toast.noShow', { name: updated.guestName }), t('toast.nightsReleased')])
          onDone?.()
        },
        onError,
      }),
    cancel: (reservation: Reservation, reason: string, onDone?: () => void) =>
      cancel.mutate(
        { id: reservation.id, reason },
        {
          onSuccess: () => {
            showToast([t('toast.cancelled'), t('toast.nightsReleased')])
            onDone?.()
          },
          onError,
        },
      ),
    assign: (reservation: Reservation, roomId: string, onDone?: () => void) =>
      assign.mutate(
        { id: reservation.id, roomId },
        {
          onSuccess: (updated) => {
            showToast([t('toast.assigned', { room: roomId, name: updated.guestName })])
            onDone?.()
          },
          onError,
        },
      ),
  }
}
