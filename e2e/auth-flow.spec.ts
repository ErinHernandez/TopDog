/**
 * Authentication flow tests
 * Tests login, logout, redirects, error handling, and session persistence
 */

import { test, expect } from '@playwright/test';
import { DEV_USER, loginViaForm, setupDevAuth, logout } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test('should login with valid dev credentials via form', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#identifier', DEV_USER.username);
    await page.fill('#password', DEV_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#identifier', 'wronguser');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should stay on login page and show error
    await expect(page).toHaveURL(/login/);
    // Look for error message (could be in .errorBanner or .errorText)
    const errorElement = page.locator('[class*="error"]');
    await expect(errorElement.first()).toBeVisible({ timeout: 5000 });
  });

  test('should login with email instead of username', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#identifier', DEV_USER.email);
    await page.fill('#password', DEV_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });

  test('should include returnUrl when redirecting from protected page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('returnUrl');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await setupDevAuth(page);
    await page.goto('/dashboard');
    // Wait for page to load with auth
    await page.waitForTimeout(1000);
    // Logout via localStorage removal
    await logout(page);
    // Navigate to protected page - should redirect to login
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });

  test('should persist auth across page navigation', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    // Navigate to gallery
    await page.goto('/gallery');
    await page.waitForTimeout(500);
    // Navigate back to dashboard (should still be authenticated)
    await page.goto('/dashboard');
    // Should NOT redirect to login
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/dashboard/);
  });
});
