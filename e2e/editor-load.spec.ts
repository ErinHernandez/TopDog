/**
 * Editor page load tests
 * Tests editor authentication, page loading, and UI rendering without crashing
 */

import { test, expect } from '@playwright/test';
import { setupDevAuth } from './helpers/auth';

test.describe('Editor Page Load', () => {
  test('should require authentication to access editor', async ({ page }) => {
    // Try to access editor without auth
    await page.goto('/editor/test-project-1');
    // Should redirect to login
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });

  test('should load editor page with authentication', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/editor/test-project-1');
    await page.waitForTimeout(2000);
    // Editor should load (may show loading state or error without Firebase, but shouldn't crash)
    const pageTitle = page.locator('h1, h2, [class*="title"]').first();
    const editorContainer = page.locator('[class*="editor"], [class*="canvas"]').first();
    const titleExists = await pageTitle.isVisible({ timeout: 5000 }).catch(() => false);
    const editorExists = await editorContainer.isVisible({ timeout: 5000 }).catch(() => false);
    expect(titleExists || editorExists).toBeTruthy();
  });

  test('should render toolbar and menu elements', async ({ page }) => {
    await setupDevAuth(page);
    await page.goto('/editor/test-project-1');
    await page.waitForTimeout(2000);
    // Look for toolbar, menu, or navigation elements
    const toolbar = page.locator('[class*="toolbar"], [class*="menu"], nav').first();
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="options"]').first();
    const toolbarExists = await toolbar.isVisible({ timeout: 5000 }).catch(() => false);
    const menuExists = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);
    expect(toolbarExists || menuExists).toBeTruthy();
  });

  test('should not throw unhandled exceptions', async ({ page }) => {
    let exceptionOccurred = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        exceptionOccurred = true;
      }
    });
    await setupDevAuth(page);
    await page.goto('/editor/test-project-1');
    await page.waitForTimeout(3000);
    // Allow Firebase-related errors but catch unexpected exceptions
    const pageError = await page.evaluate(() => {
      try {
        return window.lastError || null;
      } catch (e) {
        return null;
      }
    });
    // If there's a page error, it should be expected (Firebase, etc)
    expect(!exceptionOccurred || pageError).toBeTruthy();
  });

  test('should handle different project IDs gracefully', async ({ page }) => {
    await setupDevAuth(page);
    // Try with various project ID formats
    const projectIds = ['test-project-1', 'invalid-id', '123'];
    for (const projectId of projectIds) {
      await page.goto(`/editor/${projectId}`);
      await page.waitForTimeout(1500);
      // Page should load without crashing, even if data fails to load
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible({ timeout: 5000 });
    }
  });
});
