import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { ReservationSource } from '@/types/domain'
import { REPORT_SOURCES, resolvePeriod, type PeriodPreset } from '@/lib/reports'

type Patch = Record<string, string | null>

function parseRoomType(value: string | null): number | null {
  const id = Number(value)
  return value && Number.isInteger(id) && id > 0 ? id : null
}

function parseSource(value: string | null): ReservationSource | null {
  return REPORT_SOURCES.find((source) => source === value) ?? null
}

/** Gjendja e raportit jeton në URL (periudha, nga, deri, tipi, burimi) që lidhja të ndahet. */
export function useReportParams(today: string) {
  const [params, setParams] = useSearchParams()
  const presetParam = params.get('periudha')
  const fromParam = params.get('nga')
  const toParam = params.get('deri')
  const roomTypeId = parseRoomType(params.get('tipi'))
  const source = parseSource(params.get('burimi'))

  const { preset, period } = useMemo(
    () => resolvePeriod(presetParam, fromParam, toParam, today),
    [presetParam, fromParam, toParam, today],
  )
  const { start, end } = period

  const update = useCallback(
    (patch: Patch) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  const setPreset = useCallback(
    (value: PeriodPreset) =>
      update(
        value === 'custom'
          ? { periudha: 'custom', nga: start, deri: end }
          : { periudha: value === 'thisMonth' ? null : value, nga: null, deri: null },
      ),
    [update, start, end],
  )

  const setFrom = useCallback(
    (value: string) => update({ periudha: 'custom', nga: value, deri: value > end ? value : end }),
    [update, end],
  )

  const setTo = useCallback(
    (value: string) => update({ periudha: 'custom', nga: value < start ? value : start, deri: value }),
    [update, start],
  )

  const setRoomType = useCallback((value: string) => update({ tipi: value || null }), [update])
  const setSource = useCallback((value: string) => update({ burimi: value || null }), [update])

  return {
    preset,
    start,
    end,
    roomTypeId,
    source,
    setPreset,
    setFrom,
    setTo,
    setRoomType,
    setSource,
  }
}
