import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'

const options = [
  { value: 'a', label: 'Ana' },
  { value: 'b', label: 'Besa' },
  { value: 'c', label: 'Cela', disabled: true },
]

describe('Dropdown', () => {
  it('chooses a single option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Dropdown label="Guest" placeholder="Pick" value="" options={options} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Guest' }))
    await user.click(screen.getByRole('option', { name: 'Besa' }))
    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('toggles several options', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Dropdown multiple label="Guests" placeholder="Pick" value={['a']} options={options} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Guests' }))
    await user.click(screen.getByRole('option', { name: 'Besa' }))
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })

  it('filters while searching and loads another page', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    const onLoadMore = vi.fn()
    render(
      <Dropdown
        label="Guests"
        placeholder="Pick"
        value=""
        options={options}
        searchable
        searchValue=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Search"
        emptyLabel="None"
        hasMore
        onLoadMore={onLoadMore}
        loadMoreLabel="More"
        onChange={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Guests' }))
    await user.type(screen.getByLabelText('Search'), 'An')
    expect(onSearchChange).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'More' }))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })

  it('ignores a disabled option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Dropdown label="Guest" value="" options={options} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Guest' }))
    expect(screen.getByRole('option', { name: 'Cela' })).toBeDisabled()
  })
})
