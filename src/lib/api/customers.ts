import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Customer, SaveContactInput } from '@/types/domain'
import { api } from '@/lib/api/client'

export function fetchCustomers(): Promise<Customer[]> {
  return api<Customer[]>('/api/customers')
}

export function useCustomers() {
  return useQuery({ queryKey: ['customers'], queryFn: fetchCustomers, staleTime: 30_000 })
}

const json = (method: string, body?: unknown) => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

function useCustomersMutation<TVariables, TResult>(fn: (variables: TVariables) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSettled: () => qc.invalidateQueries({ queryKey: ['customers'] }) })
}

export function useCreateCustomer() {
  return useCustomersMutation((input: SaveContactInput) => api<Customer>('/api/customers', json('POST', input)))
}

export function useUpdateCustomer() {
  return useCustomersMutation(({ contactId, input }: { contactId: string; input: SaveContactInput }) =>
    api<Customer>(`/api/customers/contacts/${encodeURIComponent(contactId)}`, json('PATCH', input)),
  )
}

export function useDeleteCustomer() {
  return useCustomersMutation((contactId: string) =>
    api<void>(`/api/customers/contacts/${encodeURIComponent(contactId)}`, json('DELETE')),
  )
}
