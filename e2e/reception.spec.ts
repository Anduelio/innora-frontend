import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Përmbledhje' })).toBeVisible()
  await page.evaluate(async () => {
    await fetch('/api/__reset', { method: 'POST' })
  })
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Përmbledhje' })).toBeVisible()
})

test('regjistron hyrjen pa dialog', async ({ page }) => {
  const row = page.getByRole('listitem').filter({ hasText: 'Arben Hoxha' })
  await row.getByRole('button', { name: 'Regjistro hyrjen' }).click()
  await expect(row.getByText('Në hotel')).toBeVisible()
})

test('anulon një rezervim', async ({ page }) => {
  await page.getByRole('link', { name: 'Rezervimet', exact: true }).click()
  await page.getByRole('button', { name: /Arben Hoxha/ }).click()
  await page.getByRole('button', { name: 'Anulo rezervimin' }).click()
  await expect(page.getByText('Rezervimi u anulua')).toBeVisible()
})

test('krijon rezervim duke tërhequr në kalendar', async ({ page }) => {
  await page.goto('/kalendari')
  const cell = page.getByRole('gridcell', { name: 'Dhoma 204, 21 Sht' })
  await cell.scrollIntoViewIfNeeded()
  const box = await cell.boundingBox()
  if (!box) throw new Error('Qelia e kalendarit nuk u gjet')
  await page.mouse.move(box.x + 12, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width + 30, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.getByLabel('Emri dhe mbiemri').fill('Elira Duka')
  const save = page.getByRole('button', { name: 'Krijo rezervimin' })
  await expect(save).toBeEnabled()
  await save.click()
  await expect(page.getByText('Rezervimi u krijua')).toBeVisible()
  await expect(page.getByRole('button', { name: /Elira Duka/ })).toBeVisible()
})
