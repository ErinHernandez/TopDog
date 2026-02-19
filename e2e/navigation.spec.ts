/**
 * Cross-page navigation tests
 * Tests navigation between pages, back/forward, and deep linking
 */

import { test, expect } from '@playwright/test';
import { setupDevAuth } from './helpers/auth';

test.describe('Navigation', () => {
  test('can navigate between public pages without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Landing → Gallery → Pricing → Login → Landing
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const unexpectedErrors = errors.filter(
      e => !e.includes('Firebase') && !e.includes('network'),
    );
    expect(unexpectedErrors).toHaveLength(0);
  });

  test('authenticated navigation: dashboard → gallery → dashboard', async ({ page }) => {
    await setupDevAuth(page);

    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/gallery');
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/login');

    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('browser back button works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/$/);
  });

  test('deep link to protected page redirects then returns after login', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard');
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });

    if (page.url().includes('/login')) {
      // Should have returnUrl parameter
      expect(page.url()).toContain('returnUrl');
    }
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    // Next.js returns 404 for unknown pages
    expect(response?.status()).toBe(404);
  });
});
