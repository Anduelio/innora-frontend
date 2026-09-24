import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/Checkbox/Checkbox'
import { RadioGroup } from '@/components/ui/RadioGroup/RadioGroup'
import { Switch } from '@/components/ui/Switch/Switch'
import { Textarea } from '@/components/ui/Textarea/Textarea'

describe('inputs', () => {
  it('toggles a checkbox', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox label="Phone" onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: 'Phone' }))
    expect(onChange).toHaveBeenCalled()
  })

  it('toggles a switch', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch label="Show" checked={false} onChange={onChange} />)
    await user.click(screen.getByRole('switch', { name: 'Show' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('types into a textarea', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Textarea aria-label="Notes" onChange={onChange} />)
    await user.type(screen.getByLabelText('Notes'), 'Hi')
    expect(onChange).toHaveBeenCalled()
  })

  it('selects one radio', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <RadioGroup
        name="pay"
        label="Method"
        value="cash"
        options={[
          { value: 'cash', label: 'Cash' },
          { value: 'card', label: 'Card' },
        ]}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('radio', { name: 'Card' }))
    expect(onChange).toHaveBeenCalledWith('card')
  })
})
