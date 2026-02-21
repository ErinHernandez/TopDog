/**
 * Authentication helpers for E2E tests
 * Provides utilities for dev mode auth including localStorage setup and form-based login
 */

import { Page } from '@playwright/test';

export const DEV_USER = {
  uid: process.env.E2E_DEV_UID || 'dev-001',
  email: process.env.E2E_DEV_EMAIL || 'test@example.com',
  username: process.env.E2E_DEV_USERNAME || 'testuser',
  password: process.env.E2E_DEV_PASSWORD || 'testpassword',
  displayName: process.env.E2E_DEV_DISPLAY_NAME || 'Test User',
};

/**
 * Set up dev auth directly via localStorage
 * Faster than form login, useful for setup before authenticated tests
 * Must navigate to app domain first so localStorage is accessible
 */
export async function setupDevAuth(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(account => {
    localStorage.setItem('idesaign_dev_user', JSON.stringify(account));
  }, DEV_USER);
}

/**
 * Login through the actual form
 * Tests the login flow end-to-end including form validation and redirects
 */
export async function loginViaForm(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('#identifier', DEV_USER.username);
  await page.fill('#password', DEV_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

/**
 * Logout helper
 * Removes auth token from localStorage to simulate logout
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('idesaign_dev_user');
  });
}
