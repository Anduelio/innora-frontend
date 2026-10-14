import { describe, expect, it } from 'vitest'
import { hasPermission, permissionsFor } from '@/lib/permissions'

describe('lejet sipas rolit', () => {
  it('lets the owner do everything', () => {
    expect(hasPermission('owner', 'users.manage')).toBe(true)
    expect(hasPermission('owner', 'reports.financial')).toBe(true)
    expect(hasPermission('owner', 'payments.refund')).toBe(true)
  })

  it('gives reception daily work only', () => {
    expect(permissionsFor('staff')).toEqual(['desk.use', 'reservations.manage', 'payments.record', 'reports.operational'])
    expect(hasPermission('staff', 'settings.manage')).toBe(false)
    expect(hasPermission('staff', 'users.manage')).toBe(false)
    expect(hasPermission('staff', 'reports.financial')).toBe(false)
    expect(hasPermission('staff', 'payments.refund')).toBe(false)
  })

  it('denies everything without a user', () => {
    expect(hasPermission(undefined, 'desk.use')).toBe(false)
  })
})
