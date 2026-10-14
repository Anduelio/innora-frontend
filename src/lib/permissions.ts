import type { UserRole } from '@/types/domain'

export const PERMISSIONS = [
  'desk.use',
  'reservations.manage',
  'payments.record',
  'payments.refund',
  'reports.operational',
  'reports.financial',
  'settings.manage',
  'channel.manage',
  'users.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

/**
 * Pronari bën gjithçka. Recepsioni: Sot, kalendari, rezervimet, check-in/out dhe regjistrimi i pagesave;
 * pa cilësime, pa përdorues, pa rimbursime dhe vetëm raportet operative.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  owner: PERMISSIONS,
  staff: ['desk.use', 'reservations.manage', 'payments.record', 'reports.operational'],
}

export function permissionsFor(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]]
}

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false
}
