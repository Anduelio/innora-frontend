import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'

/** Titull + shpjegim i qartë për një gabim, i përdorur nga njoftimet. */
export function describeError(t: TFunction) {
  return (error: unknown): { title: string; description: string } => {
    if (error instanceof ApiError && error.status === 409 && error.code === 'VERSION_CONFLICT') {
      return { title: t('toast.conflictTitle'), description: t('toast.conflict') }
    }
    return {
      title: t('toast.failedTitle'),
      description: error instanceof ApiError && error.message ? error.message : t('toast.failed'),
    }
  }
}
