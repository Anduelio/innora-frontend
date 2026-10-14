import { toCsv, type CsvCell, type ReportPeriod } from '@/lib/reports'

export function csvFileName(metric: string, period: ReportPeriod): string {
  return `raporti-${metric}-${period.start}_${period.end}.csv`
}

export function downloadCsv(fileName: string, rows: readonly (readonly CsvCell[])[]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
