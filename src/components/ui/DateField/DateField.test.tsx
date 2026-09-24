import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateField } from '@/components/ui/DateField/DateField'
import { DateRangeField } from '@/components/ui/DateField/DateRangeField'

describe('DateField', () => {
  it.each([
    ['date', 'date'],
    ['time', 'time'],
    ['datetime', 'datetime-local'],
    ['month', 'month'],
    ['week', 'week'],
  ] as const)('renders a %s input', (mode, type) => {
    render(<DateField aria-label="When" mode={mode} value="" onChange={vi.fn()} />)
    expect(screen.getByLabelText('When')).toHaveAttribute('type', type)
  })

  it('reports the chosen value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DateField aria-label="When" mode="date" value="" onChange={onChange} />)
    await user.type(screen.getByLabelText('When'), '2026-09-24')
    expect(onChange).toHaveBeenCalled()
  })

  it('keeps the end on or after the start', () => {
    render(
      <DateRangeField
        from="2026-09-01"
        to="2026-09-04"
        onFromChange={vi.fn()}
        onToChange={vi.fn()}
        fromLabel="From"
        toLabel="To"
        fromId="from"
        toId="to"
      />,
    )
    expect(screen.getByLabelText('From')).toHaveAttribute('max', '2026-09-04')
    expect(screen.getByLabelText('To')).toHaveAttribute('min', '2026-09-01')
  })
})
