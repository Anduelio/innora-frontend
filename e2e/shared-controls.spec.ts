import { expect, test } from '@playwright/test'

test('filters guests and loads another page', async ({ page }) => {
  await page.goto('/klientet')
  await expect(page.getByRole('heading', { level: 1, name: 'Klientët' })).toBeVisible()
  await page.getByRole('button', { name: 'Klientët' }).click()
  await expect(page.getByRole('option', { name: 'Ana Kola' })).toBeVisible()
  await page.getByRole('button', { name: 'Ngarko më shumë' }).click()
  await expect(page.getByRole('listbox', { name: 'Klientët' })).toBeVisible()
  await page.getByRole('option', { name: 'Ana Kola' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Ana Kola' })).toBeVisible()
  await page.getByRole('switch', { name: 'Shfaq telefonin' }).click()
  await expect(page.getByText('+355 69 234 5566')).toHaveCount(0)
})

test('changes the daily report date', async ({ page }) => {
  await page.goto('/raporte')
  await expect(page.getByRole('heading', { level: 1, name: 'Raporte' })).toBeVisible()
  await page.getByLabel('Raporti ditor').fill('2026-09-21')
  await expect(page.getByLabel('Raporti ditor')).toHaveValue('2026-09-21')
})
