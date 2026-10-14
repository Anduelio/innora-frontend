import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/hyrje')
  await page.evaluate(async () => {
    await fetch('/api/__reset', { method: 'POST' })
  })
  await page.getByLabel('Email').fill('arta@devollihotel.al')
  await page.getByLabel('Fjalëkalimi', { exact: true }).fill('Recepsion2026!')
  await page.getByRole('button', { name: 'Hyr' }).click()
  await expect(page.getByRole('heading', { name: 'Mbërritjet sot' })).toBeVisible()
})

test('recepsioni nuk sheh cilësimet dhe raportet financiare', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Cilësimet' })).toHaveCount(0)
  await page.goto('/cilesimet')
  await expect(page.getByText('Nuk keni leje për këtë faqe')).toBeVisible()
  await page.goto('/raportet')
  await expect(page.getByText(/Të ardhurat, arkëtimet, parashikimi/)).toBeVisible()
})

test('bën check-in nga lista e mbërritjeve', async ({ page }) => {
  const row = page.getByRole('listitem').filter({ hasText: 'Arben Hoxha' })
  await row.getByRole('button', { name: 'Check-in' }).click()
  await expect(row.getByText('Në hotel')).toBeVisible()
})

test('cakton dhomën për një rezervim pa dhomë', async ({ page }) => {
  const row = page.getByRole('listitem').filter({ hasText: 'Maria Bruno' })
  await row.getByRole('button', { name: 'Cakto' }).click()
  await row.getByRole('combobox', { name: 'Zgjidh një dhomë të lirë' }).selectOption('204')
  await row.getByRole('button', { name: 'Cakto dhomën' }).click()
  await expect(page.getByText('Dhoma 204 u caktua për Maria Bruno')).toBeVisible()
  await expect(row.getByRole('button', { name: 'Check-in' })).toBeVisible()
})

test('anulon një rezervim me arsye', async ({ page }) => {
  await page.getByRole('link', { name: 'Rezervimet', exact: true }).first().click()
  await page.getByRole('tab', { name: /Të ardhshme/ }).click()
  await page.getByRole('row', { name: /Anila Prifti/ }).click()
  await page.getByRole('button', { name: 'Anulo rezervimin' }).click()
  await page.getByLabel('Arsyeja e anulimit').fill('Mysafiri telefonoi')
  await page.getByRole('button', { name: 'Konfirmo anulimin' }).click()
  await expect(page.getByText('Rezervimi u anulua')).toBeVisible()
})

test('nuk lejon ndryshimin e datave për Booking.com', async ({ page }) => {
  await page.getByRole('button', { name: 'John Smith' }).click()
  await expect(page.getByText('Ndryshimet bëhen në Booking.com')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Ndrysho' })).toHaveCount(0)
})

test('krijon rezervim duke tërhequr në kalendar', async ({ page }) => {
  await page.goto('/kalendari?pamja=jave&nga=2026-09-21')
  const cell = page.getByRole('gridcell', { name: 'Dhoma 204, 21.09.2026' })
  await cell.scrollIntoViewIfNeeded()
  const box = await cell.boundingBox()
  if (!box) throw new Error('Qelia e kalendarit nuk u gjet')
  await page.mouse.move(box.x + 12, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width + 30, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.getByLabel('Emri i mysafirit').fill('Elira Duka')
  await page.getByRole('button', { name: 'Ruaj rezervimin' }).click()
  await expect(page.getByText('Rezervimi u ruajt')).toBeVisible()
  await expect(page.getByRole('button', { name: /Elira Duka/ })).toBeVisible()
})
