import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/hyrje')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Fjalëkalimi', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Hyr' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sot' })).toBeVisible()
}

test('refuzon fjalëkalimin e gabuar me mesazh në shqip', async ({ page }) => {
  await page.goto('/hyrje')
  await page.getByLabel('Email').fill('arta@devollihotel.al')
  await page.getByLabel('Fjalëkalimi', { exact: true }).fill('gabim')
  await page.getByRole('button', { name: 'Hyr' }).click()
  await expect(page.getByText(/nuk është i saktë/)).toBeVisible()
})

test('gjen një rezervim nga kërkimi në krye', async ({ page }) => {
  await signIn(page, 'ilir@devollihotel.al', 'Pronari2026!')
  await page.getByRole('combobox', { name: 'Kërko rezervim' }).fill('Hoxha')
  await page.getByRole('option', { name: /Arben Hoxha/ }).click()
  await expect(page.getByRole('dialog', { name: 'Arben Hoxha' })).toBeVisible()
})

test('pronari shton një përdorues të ri', async ({ page }) => {
  await signIn(page, 'ilir@devollihotel.al', 'Pronari2026!')
  await page.goto('/cilesimet?seksioni=perdoruesit')
  await page.getByRole('button', { name: 'Shto përdorues' }).click()
  await page.getByLabel('Emri dhe mbiemri').fill('Blerina Shehu')
  await page.getByLabel('Email').fill('blerina@devollihotel.al')
  await page.getByRole('button', { name: 'Krijo llogarinë' }).click()
  await expect(page.getByText('Llogaria për Blerina Shehu u krijua')).toBeVisible()
})

test('ndryshon periudhën e raportit dhe e mban në adresë', async ({ page }) => {
  await signIn(page, 'ilir@devollihotel.al', 'Pronari2026!')
  await page.goto('/raportet')
  await page.getByRole('button', { name: 'Muaji i kaluar' }).click()
  await expect(page).toHaveURL(/lastMonth/)
  await expect(page.getByText('Të dhëna jo të plota')).toBeVisible()
})
