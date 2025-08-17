import { test, expect } from '@playwright/test';

// Minimal smoke test to validate the SPA renders and navigation works
 test('loads app shell and navigates', async ({ page, baseURL }) => {
  await page.goto(baseURL || 'http://localhost:8080');

  await expect(page.getByText('Docker Management GUI')).toBeVisible();

  // Navigate to Settings
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/.*\/settings$/);

  // Navigate to Logs
  await page.getByRole('link', { name: 'Logs (WS)' }).click();
  await expect(page).toHaveURL(/.*\/logs$/);
});
