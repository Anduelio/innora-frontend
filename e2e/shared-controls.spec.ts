import { expect, test } from '@playwright/test'

test('filters guests and loads another page', async ({ page }) => {
  await page.goto('/klientet')
  await expect(page.getByRole('heading', { level: 1, name: 'Klientët' })).toBeVisible()
  const search = page.getByRole('searchbox', { name: 'Kërko me emër ose telefon' })
  await search.fill('Ana')
  await expect(page.getByRole('row', { name: /Ana Kola/ })).toBeVisible()
  await expect(page.getByText('+355 69 234 5566')).toBeVisible()
  await page.getByRole('switch', { name: 'Shfaq telefonin' }).click()
  await expect(page.getByText('+355 69 234 5566')).toHaveCount(0)
  await search.fill('')
  await page.getByRole('button', { name: 'Tjetra' }).click()
  await expect(page.getByText('Faqja 2 nga 2')).toBeVisible()
  await search.fill('Drita')
  await expect(page.getByRole('row', { name: /Drita Leka/ })).toBeVisible()
  await page.getByRole('button', { name: 'Vetëm me telefon' }).click()
  await expect(page.getByText('Asnjë klient')).toBeVisible()
})

test('changes the daily report date', async ({ page }) => {
  await page.goto('/raporte')
  await expect(page.getByRole('heading', { level: 1, name: 'Raporte' })).toBeVisible()
  await page.getByLabel('Raporti ditor').fill('2026-09-21')
  await expect(page.getByLabel('Raporti ditor')).toHaveValue('2026-09-21')
})
