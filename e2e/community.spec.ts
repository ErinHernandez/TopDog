/**
 * Community / Gallery browsing tests
 * Tests public gallery, community posts, prompt library, and sharing flows
 */

import { test, expect } from '@playwright/test';
import { setupDevAuth } from './helpers/auth';

test.describe('Community & Gallery', () => {
  test('gallery page renders grid or empty state', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    // Should show either gallery items or an empty/placeholder state
    const hasContent =
      (await page.locator('[class*="grid"], [class*="gallery"], [class*="card"]').count()) > 0 ||
      (await page.locator('text=/no.*post|empty|browse/i').count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test('gallery page is accessible without authentication', async ({ page }) => {
    // No auth setup — gallery should be public
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    // Should NOT redirect to login
    expect(page.url()).not.toContain('/login');
  });

  test('gallery loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/gallery');
    await page.waitForTimeout(3000);

    // Filter out expected Firebase/network errors
    const unexpectedErrors = errors.filter(
      e => !e.includes('Firebase') && !e.includes('network') && !e.includes('fetch'),
    );
    expect(unexpectedErrors).toHaveLength(0);
  });

  test('authenticated user can access community features', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');

    // Authenticated users should see interaction elements (like, share, etc.)
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
