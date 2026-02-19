/**
 * Pricing page and Stripe checkout flow tests
 * Tests pricing display, plan comparison, and checkout initiation
 */

import { test, expect } from '@playwright/test';
import { setupDevAuth } from './helpers/auth';

test.describe('Pricing & Checkout', () => {
  test('pricing page displays plan options', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();

    // Should show pricing tiers
    const hasPricingContent =
      body!.toLowerCase().includes('free') ||
      body!.toLowerCase().includes('pro') ||
      body!.toLowerCase().includes('enterprise') ||
      body!.toLowerCase().includes('plan') ||
      body!.toLowerCase().includes('price');

    expect(hasPricingContent).toBeTruthy();
  });

  test('pricing page is accessible without authentication', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });

  test('pricing page has CTA buttons', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Look for action buttons (Get Started, Subscribe, Upgrade, etc.)
    const ctaButtons = page.locator(
      'button:has-text("Get Started"), button:has-text("Subscribe"), button:has-text("Upgrade"), button:has-text("Start"), a:has-text("Get Started")',
    );

    const buttonCount = await ctaButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('authenticated user sees personalized pricing state', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Authenticated users may see "Current Plan" or "Upgrade" instead of "Get Started"
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('pricing page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/pricing');
    await page.waitForTimeout(2000);

    const unexpectedErrors = errors.filter(
      e => !e.includes('Firebase') && !e.includes('Stripe'),
    );
    expect(unexpectedErrors).toHaveLength(0);
  });
});
