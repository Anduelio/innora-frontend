export type DropdownOption = {
  value: string
  label: string
  disabled?: boolean
}

type Base = {
  id?: string
  label: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  options: DropdownOption[]
  searchable?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  emptyLabel?: string
  loading?: boolean
  loadingLabel?: string
  hasMore?: boolean
  onLoadMore?: () => void
  loadMoreLabel?: string
}

export type SingleDropdownProps = Base & {
  multiple?: false
  value: string
  onChange: (value: string) => void
}

export type MultiDropdownProps = Base & {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

export type DropdownProps = SingleDropdownProps | MultiDropdownProps
