import { expect, test, type Locator, type Page } from '@playwright/test';

const username = 'theme-reviewer';
const password = 'ThemeReview1!';

const coreScreens = [
  {
    name: 'home',
    path: '/',
    heading: 'KrisPoint Dashboard',
  },
  {
    name: 'worklist',
    path: '/worklist',
    heading: 'Worklist',
    control: (page: Page) => page.getByRole('button', { name: /Add Patient/i }),
  },
  {
    name: 'settings',
    path: '/settings?tab=general',
    heading: 'Settings',
    control: (page: Page) => page.locator('#theme-select'),
  },
  {
    name: 'analytics',
    path: '/analytics',
    heading: 'Analytics',
    control: (page: Page) => page.getByRole('button', { name: /Export Excel/i }),
  },
  {
    name: 'reporting',
    path: '/reporting',
    heading: 'Report Editor',
    control: (page: Page) => page.getByRole('button', { name: /Start New Report/i }),
  },
  {
    name: 'reports',
    path: '/reports',
    heading: 'All Reports',
  },
  {
    name: 'templates',
    path: '/templates',
    heading: 'Templates',
  },
  {
    name: 'macros',
    path: '/macros',
    heading: 'Macros',
  },
  {
    name: 'audit-logs',
    path: '/admin/audit-logs',
    heading: 'Audit Logs',
  },
  {
    name: 'training-data',
    path: '/admin/training-data',
    heading: 'Training Data',
  },
] as const;

async function expectUsable(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  const box = await locator.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);
}

async function expectThemeContrast(page: Page) {
  const result = await page.evaluate(() => {
    function parseRgb(value: string) {
      const hex = value.trim().match(/^#([\da-f]{6})$/i)?.[1];
      if (hex) {
        return [
          Number.parseInt(hex.slice(0, 2), 16),
          Number.parseInt(hex.slice(2, 4), 16),
          Number.parseInt(hex.slice(4, 6), 16),
        ];
      }
      const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      return channels?.length === 3 ? channels : null;
    }

    function luminance(channels: number[]) {
      const normalized = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.03928
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return (0.2126 * normalized[0]) + (0.7152 * normalized[1]) + (0.0722 * normalized[2]);
    }

    function contrast(foreground: string, background: string) {
      const fg = parseRgb(foreground);
      const bg = parseRgb(background);
      if (!fg || !bg) return 0;
      const fgLum = luminance(fg);
      const bgLum = luminance(bg);
      return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
    }

    const root = getComputedStyle(document.documentElement);
    const foreground = root.getPropertyValue('--color-text-primary').trim();
    const background = root.getPropertyValue('--color-background').trim();
    return { foreground, background, ratio: contrast(foreground, background) };
  });

  expect(result.foreground).not.toBe('');
  expect(result.background).not.toBe('');
  expect(result.foreground).not.toBe(result.background);
  expect(result.ratio).toBeGreaterThanOrEqual(4.5);
}

async function chooseTheme(page: Page, theme: 'light' | 'dark') {
  await page.getByRole('button', { name: 'Open appearance settings' }).click();
  await page.getByRole('button', {
    name: theme === 'dark' ? 'Use Medical Night Mode' : 'Use Medical Professional',
  }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', theme);
}

async function registerOwner(page: Page) {
  const response = await page.request.post('/api/auth/register', {
    data: {
      username,
      password,
      fullName: 'Theme Reviewer',
      institution: 'KrisPoint Test Facility',
      specialty: 'Administration',
      title: 'Dr.',
    },
  });
  expect(response.status()).toBe(201);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'krispoint_solo_beta_terms_2026-09-14-v1',
      '2026-09-14-v1',
    );
  });
});

test('core screens remain usable in light and dark themes and persist after reload', async ({
  page,
}) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: 'Welcome to KrisPoint' })).toBeVisible();

  for (const theme of ['light', 'dark'] as const) {
    await chooseTheme(page, theme);
    await expectThemeContrast(page);
    await expectUsable(page.locator('#fullName'));
    await expectUsable(page.locator('#password'));
    await expectUsable(page.getByRole('button', { name: /Create.*Account/i }));
    await expect(page).toHaveScreenshot(`auth-${theme}.png`, {
      animations: 'disabled',
    });
  }

  await registerOwner(page);
  await page.reload();
  await expect(page.locator('#username')).toBeVisible();
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).not.toHaveURL(/\/auth$/);

  for (const theme of ['light', 'dark'] as const) {
    await page.goto('/worklist');
    await chooseTheme(page, theme);
    await expectThemeContrast(page);

    for (const screen of coreScreens) {
      await test.step(`${screen.name} is usable in ${theme} mode`, async () => {
        await page.goto(screen.path);
        await expect(page.locator('body')).toHaveAttribute('data-theme', theme);
        await expect(page.getByRole('heading', { name: screen.heading, exact: false }).first()).toBeVisible();
        await expectThemeContrast(page);
        if ('control' in screen) {
          await expectUsable(screen.control(page));
        } else {
          await expectUsable(page.locator('main').locator('a, button, input, select, textarea').filter({ visible: true }).first());
        }
        await expect(page).toHaveScreenshot(`${screen.name}-${theme}.png`, {
          animations: 'disabled',
        });
      });
    }
  }

  await page.goto('/worklist');
  await chooseTheme(page, 'dark');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await expect(page.evaluate(() => localStorage.getItem('KRISPOINT_THEME'))).resolves.toBe('dark');
  await expect(page.getByRole('heading', { name: 'Worklist', exact: false }).first()).toBeVisible();
});