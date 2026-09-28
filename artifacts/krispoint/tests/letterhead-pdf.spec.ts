import { expect, test, type Page } from '@playwright/test';
import { PDFDict, PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { deflateSync, inflateSync } from 'node:zlib';

// Run with: pnpm exec playwright test --config artifacts/krispoint/playwright.letterhead.config.ts
// Real Solo API and PDF generation, with a disposable database. No patient data leaves the test.
function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, crc]);
}

function solidLetterhead(color: [number, number, number]) {
  const width = 400;
  const height = 70;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 8-bit RGB
  header[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => color).flat())]);
  const image = Buffer.concat(Array.from({ length: height }, () => row));
  const png = Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(image)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

const red = { id: 'red', name: 'Red clinic', url: solidLetterhead([255, 0, 0]) };
const blue = { id: 'blue', name: 'Blue clinic', url: solidLetterhead([0, 0, 255]) };

async function pdfImageColor(bytes: Buffer): Promise<string | null> {
  const document = await PDFDocument.load(bytes);
  const resources = document.getPage(0).node.Resources();
  const images = resources?.lookup(PDFName.of('XObject'), PDFDict);
  if (!images) return null;
  for (const key of images.keys()) {
    const stream = images.lookup(key);
    if (!(stream instanceof PDFRawStream)) continue;
    const data = inflateSync(Buffer.from(stream.contents));
    // The only image in this fixture is the RGB letterhead.
    if (data.length === 400 * 70 * 3) {
      const [r, g, b] = data;
      return r > 240 && g < 15 && b < 15 ? 'red' : b > 240 && r < 15 && g < 15 ? 'blue' : 'unknown';
    }
  }
  return null;
}

async function previewColor(page: Page) {
  const canvas = page.locator('.pdf-viewer .canvas-container canvas').last();
  await expect(canvas).toBeVisible();
  return canvas.evaluate((element: HTMLCanvasElement) => {
    // Image is centred at x=297, from y=10 to 80 on the A4 page.
    const [r, g, b] = element.getContext('2d')!.getImageData(297, 40, 1, 1).data;
    return r > 240 && g < 15 && b < 15 ? 'red' : b > 240 && r < 15 && g < 15 ? 'blue' : 'none';
  });
}

async function assertChoice(page: Page, choice: string, expected: string) {
  await page.locator('#pdf-letterhead').selectOption(choice);
  await expect.poll(() => previewColor(page)).toBe(expected);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  const download = await downloadPromise;
  const { readFile } = await import('node:fs/promises');
  expect(await pdfImageColor(await readFile(await download.path()))).toBe(expected === 'none' ? null : expected);
  const saved = await (await page.request.get('/api/organization/letterhead')).json();
  expect(saved.letterhead.currentLetterhead.id).toBe('red');
  expect(saved.letterhead.letterheads.map((item: { id: string }) => item.id)).toEqual(['red', 'blue']);
}

test('Solo preview and export use each saved letterhead or none without changing the default', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('krispoint_solo_beta_terms_2026-09-14-v1', '2026-09-14-v1'));
  await page.goto('/auth');
  const registration = await page.request.post('/api/auth/register', {
    data: {
      username: 'letterhead-owner', password: 'LetterheadOwner9!', fullName: 'Letterhead Owner',
      institution: 'Test Clinic', specialty: 'Radiology', title: 'Dr.',
    },
  });
  expect(registration.status()).toBe(201);
  await page.reload();
  await page.locator('#username').fill('letterhead-owner');
  await page.locator('#password').fill('LetterheadOwner9!');
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).not.toHaveURL(/\/auth$/);

  const save = await page.request.post('/api/organization/letterhead', {
    data: { letterhead: red, letterheads: [red, blue], settings: { height: 120, opacity: 1, position: 'top', margin: 20, topMargin: 10 } },
  });
  expect(save.ok(), await save.text()).toBe(true);
  const report = await page.request.post('/api/reports', {
    data: {
      patientName: 'Fixture Patient', hospitalNumber: 'PDF-TEST-001',
      modality: 'CT', bodyRegion: 'Chest', content: 'FINDINGS: Normal.',
      status: 'SIGNED',
    },
  });
  expect(report.ok(), await report.text()).toBe(true);

  // The list API formats SIGNED as "Completed", while the existing export button
  // checks the raw status. Adapt only that list label so this test can reach the
  // real detail endpoint, preview generator and download path.
  await page.route('**/api/reports', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch();
    const body = await response.json();
    body.reports = body.reports.map((item: { status: string }) => ({
      ...item, status: item.status === 'Completed' ? 'SIGNED' : item.status,
    }));
    await route.fulfill({ response, json: body });
  });
  await page.goto('/reports');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(page.locator('#pdf-letterhead')).toHaveValue('red');
  await expect.poll(() => previewColor(page)).toBe('red');

  // Export closes the modal; reopen it to test the next selection.
  for (const [choice, color] of [['blue', 'blue'], ['', 'none'], ['red', 'red']]) {
    await assertChoice(page, choice, color);
    if (choice !== 'red') {
      await page.getByRole('button', { name: 'Export', exact: true }).click();
      await expect(page.locator('#pdf-letterhead')).toHaveValue('red');
    }
  }

  await page.reload();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(page.locator('#pdf-letterhead')).toHaveValue('red');
  await expect(page.locator('#pdf-letterhead option')).toHaveText(['No letterhead', 'Red clinic', 'Blue clinic']);
  await expect.poll(() => previewColor(page)).toBe('red');
});