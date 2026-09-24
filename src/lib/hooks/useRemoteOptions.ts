import { useInfiniteQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { useState } from 'react'
import type { DropdownOption } from '@/components/ui/Dropdown/types'

type Page<T> = { items: T[]; hasMore: boolean }

export function useRemoteOptions<T>({
  queryKey,
  fetchPage,
  mapOption,
  enabled = true,
}: {
  queryKey: readonly unknown[]
  fetchPage: (query: string, page: number) => Promise<Page<T>>
  mapOption: (item: T) => DropdownOption
  enabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 250)
  const result = useInfiniteQuery({
    queryKey: [...queryKey, debounced],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) => fetchPage(debounced, pageParam),
    getNextPageParam: (last, _pages, lastPage) => (last.hasMore ? (lastPage as number) + 1 : undefined),
  })

  const options = (result.data?.pages ?? []).flatMap((page) => page.items.map(mapOption))

  return {
    query,
    setQuery,
    options,
    loading: result.isFetching,
    hasMore: Boolean(result.hasNextPage),
    loadMore: () => {
      void result.fetchNextPage()
    },
  }
}
