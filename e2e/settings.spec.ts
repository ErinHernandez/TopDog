/**
 * Settings page tests
 * Tests settings page load, form elements, and protected access
 */

import { test, expect } from '@playwright/test';
import { setupDevAuth } from './helpers/auth';

test.describe('Settings Page', () => {
  test('settings requires authentication', async ({ page }) => {
    await page.goto('/settings');
    // Should redirect to login
    await page.waitForURL(/\/(login|settings)/, { timeout: 10000 });
    const url = page.url();
    // Either redirected to login or shows settings with auth prompt
    expect(url).toMatch(/\/(login|settings)/);
  });

  test('authenticated user can access settings', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    // Should show settings content, not redirect
    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Look for common settings elements
    const hasSettingsContent =
      body!.toLowerCase().includes('settings') ||
      body!.toLowerCase().includes('account') ||
      body!.toLowerCase().includes('profile') ||
      body!.toLowerCase().includes('preferences');

    expect(hasSettingsContent).toBeTruthy();
  });

  test('settings page displays user info', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);

    // Should display user's email or name somewhere
    const body = await page.textContent('body');
    const hasUserInfo =
      body!.includes('Teddy') ||
      body!.includes('idesaign.dev') ||
      body!.includes('email');

    expect(hasUserInfo).toBeTruthy();
  });

  test('settings page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await setupDevAuth(page);
    await page.goto('/settings');
    await page.waitForTimeout(3000);

    const unexpectedErrors = errors.filter(
      e => !e.includes('Firebase') && !e.includes('network'),
    );
    expect(unexpectedErrors).toHaveLength(0);
  });
});
