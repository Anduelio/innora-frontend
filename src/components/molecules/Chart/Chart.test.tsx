import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ColumnChart } from './ColumnChart'
import { DonutChart } from './DonutChart'
import { TrendChart } from './TrendChart'

const data = [
  { key: 'a', label: '19', title: '19.09.2026', value: 100 },
  { key: 'b', label: '20', title: '20.09.2026', value: 300 },
  { key: 'c', label: '21', title: '21.09.2026', value: 200, future: true },
]

describe('charts', () => {
  it('gives every point as a table for screen readers', () => {
    render(<ColumnChart data={data} ariaLabel="Të ardhurat" formatValue={(v) => `${v} €`} headers={['Dita', 'EUR']} />)
    const table = screen.getByRole('table', { name: 'Të ardhurat' })
    expect(within(table).getByRole('row', { name: /20\.09\.2026.*300 €/ })).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(4)
  })

  it('moves through the points with the arrow keys and announces them', () => {
    render(<ColumnChart data={data} ariaLabel="Të ardhurat" formatValue={(v) => `${v} €`} headers={['Dita', 'EUR']} />)
    const chart = screen.getByRole('group', { name: 'Të ardhurat' })
    chart.focus()
    fireEvent.keyDown(chart, { key: 'ArrowRight' })
    expect(screen.getByText('19.09.2026: 100 €', { selector: 'p' })).toBeInTheDocument()
    fireEvent.keyDown(chart, { key: 'End' })
    expect(screen.getByText('21.09.2026: 200 €', { selector: 'p' })).toBeInTheDocument()
    fireEvent.keyDown(chart, { key: 'Escape' })
    expect(screen.queryByText('21.09.2026: 200 €', { selector: 'p' })).not.toBeInTheDocument()
  })

  it('labels the striped future bars in the legend', () => {
    render(
      <ColumnChart
        data={data}
        ariaLabel="x"
        formatValue={String}
        legend={{ now: 'E fituar', future: 'Parashikim' }}
        headers={['Dita', 'EUR']}
      />,
    )
    expect(screen.getByText('E fituar')).toBeInTheDocument()
    expect(screen.getByText('Parashikim')).toBeInTheDocument()
  })

  it('draws a trend with missing days without crashing', () => {
    render(
      <TrendChart
        data={[
          { key: 'a', label: '1', title: 'Dita 1', value: 0.5 },
          { key: 'b', label: '2', title: 'Dita 2', value: null },
          { key: 'c', label: '3', title: 'Dita 3', value: 0.8, future: true },
        ]}
        ariaLabel="Zënia"
        formatValue={(v) => (v === null ? '—' : `${Math.round(v * 100)}%`)}
        formatTick={(v) => `${Math.round(v * 100)}%`}
        headers={['Nata', 'Zënia']}
      />,
    )
    expect(screen.getByRole('row', { name: /Dita 2.*—/ })).toBeInTheDocument()
  })

  it('shows donut shares as text, not just colour', () => {
    render(
      <DonutChart
        ariaLabel="Burimet"
        centerValue="10"
        centerLabel="rezervime"
        slices={[
          {
            key: 'b',
            label: 'Booking.com',
            value: 6,
            valueLabel: '6 rezervime',
            percentLabel: '60%',
          },
          { key: 't', label: 'Telefon', value: 4, valueLabel: '4 rezervime', percentLabel: '40%' },
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: 'Burimet' })).toHaveTextContent('10')
    expect(screen.getByText('Booking.com').closest('li')).toHaveTextContent('60%')
  })
})
