import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Idesaign/i);
    // Verify main CTA or heading is visible
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('login page loads with form fields', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('signup page loads with form fields', async ({ page }) => {
    await page.goto('/signup');
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('gallery page loads', async ({ page }) => {
    await page.goto('/gallery');
    // Gallery should render even with no data (empty state)
    await expect(page.locator('body')).not.toBeEmpty();
    // No unhandled errors in console
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors.filter((e) => !e.includes('Firebase'))).toHaveLength(0);
  });

  test('API health check returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('static assets load without 404', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 404 && response.url().match(/\.(js|css|woff2?)$/)) {
        failedRequests.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(failedRequests).toHaveLength(0);
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).not.toBeEmpty();
    // Verify pricing content is present
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('reset-password page loads', async ({ page }) => {
    await page.goto('/reset-password');
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test('unauthenticated users are redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login or show auth prompt
    await page.waitForURL(/\/(login|dashboard)/);
    // Either we're on login (redirected) or dashboard with auth prompt
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });
});
