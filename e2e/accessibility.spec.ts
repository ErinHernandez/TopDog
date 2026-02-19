/**
 * Accessibility (a11y) tests using @axe-core/playwright
 *
 * Runs axe-core automated accessibility checks on key pages.
 * Reports violations by impact level (critical, serious, moderate, minor).
 *
 * Install: npm install -D @axe-core/playwright
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupDevAuth } from './helpers/auth';

// Helper to run axe and assert no critical/serious violations
async function checkA11y(page: any, pageName: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Separate by severity
  const critical = results.violations.filter(v => v.impact === 'critical');
  const serious = results.violations.filter(v => v.impact === 'serious');
  const moderate = results.violations.filter(v => v.impact === 'moderate');

  // Log all violations for debugging
  if (results.violations.length > 0) {
    console.log(`\n📋 ${pageName} — ${results.violations.length} a11y violation(s):`);
    for (const v of results.violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
    }
  }

  // Fail on critical and serious violations only
  expect(
    critical.length,
    `${pageName}: ${critical.length} critical a11y violation(s): ${critical.map(v => v.id).join(', ')}`,
  ).toBe(0);

  expect(
    serious.length,
    `${pageName}: ${serious.length} serious a11y violation(s): ${serious.map(v => v.id).join(', ')}`,
  ).toBe(0);

  return { critical, serious, moderate, total: results.violations.length };
}

test.describe('Accessibility', () => {
  test('landing page passes a11y checks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Landing');
  });

  test('login page passes a11y checks', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Login');
  });

  test('signup page passes a11y checks', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Signup');
  });

  test('gallery page passes a11y checks', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Gallery');
  });

  test('pricing page passes a11y checks', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Pricing');
  });

  test('reset-password page passes a11y checks', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('networkidle');
    await checkA11y(page, 'Reset Password');
  });

  test('dashboard passes a11y checks (authenticated)', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await checkA11y(page, 'Dashboard');
  });

  test('settings passes a11y checks (authenticated)', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/settings');
    await page.waitForTimeout(2000);
    await checkA11y(page, 'Settings');
  });
});
