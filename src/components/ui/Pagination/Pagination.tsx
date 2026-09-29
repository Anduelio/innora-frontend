import s from './Pagination.module.scss'

export function Pagination({
  page,
  lastPage,
  pageSize,
  pageSizes,
  navLabel,
  pageLabel,
  previousLabel,
  nextLabel,
  pageSizeLabel,
  onPage,
  onPageSize,
}: {
  page: number
  lastPage: number
  pageSize: number
  pageSizes: readonly number[]
  navLabel: string
  pageLabel: string
  previousLabel: string
  nextLabel: string
  pageSizeLabel: string
  onPage: (page: number) => void
  onPageSize: (pageSize: number) => void
}) {
  return (
    <nav className={s.bar} aria-label={navLabel}>
      <button type="button" className={s.step} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {previousLabel}
      </button>
      <span className={s.label}>{pageLabel}</span>
      <button type="button" className={s.step} disabled={page >= lastPage} onClick={() => onPage(page + 1)}>
        {nextLabel}
      </button>
      <label className={s.size}>
        <select
          className={s.select}
          value={pageSize}
          aria-label={pageSizeLabel}
          onChange={(event) => onPageSize(Number(event.target.value))}
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </nav>
  )
}
