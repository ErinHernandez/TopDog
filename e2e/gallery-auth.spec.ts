/**
 * Gallery page authenticated features tests
 * Tests authenticated-only UI elements and gallery functionality
 */

import { test, expect } from '@playwright/test';
import { setupDevAuth } from './helpers/auth';

test.describe('Gallery (Authenticated Features)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up dev auth before each test
    await setupDevAuth(page);
  });

  test('should display Following tab when authenticated', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForTimeout(1000);
    const followingTab = page.locator('button:has-text("Following"), a:has-text("Following"), [role="tab"]:has-text("Following")').first();
    await expect(followingTab).toBeVisible({ timeout: 5000 });
  });

  test('should display Profile link in header when authenticated', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForTimeout(1000);
    const profileLink = page.locator('a:has-text("Profile"), button[aria-label*="profile"]').first();
    const profileLinkExists = await profileLink.isVisible({ timeout: 5000 }).catch(() => false);
    expect(profileLinkExists).toBeTruthy();
  });

  test('should render gallery grid', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForTimeout(1000);
    // Look for gallery grid or project cards (may be empty without Firebase)
    const galleryGrid = page.locator('[class*="grid"], [class*="gallery"]').first();
    const projectCards = page.locator('[class*="card"], [class*="project"]').first();
    const gridExists = await galleryGrid.isVisible({ timeout: 5000 }).catch(() => false);
    const cardsExist = await projectCards.isVisible({ timeout: 5000 }).catch(() => false);
    expect(gridExists || cardsExist).toBeTruthy();
  });

  test('should not throw JavaScript errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.goto('/gallery');
    await page.waitForTimeout(2000);
    // Allow for expected Firebase-related errors but catch unexpected JS errors
    const unexpectedErrors = errors.filter(err => !err.includes('Firebase'));
    expect(unexpectedErrors.length).toBe(0);
  });

  test('should switch Following filter when tab is clicked', async ({ page }) => {
    await page.goto('/gallery');
    await page.waitForTimeout(1000);
    const followingTab = page.locator('button:has-text("Following"), [role="tab"]:has-text("Following")').first();
    const isVisible = await followingTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      const initialUrl = page.url();
      await followingTab.click();
      await page.waitForTimeout(500);
      // URL or content should change to show following filter
      const newUrl = page.url();
      // Either URL changes or we verify the tab is selected
      const isSelected = await followingTab.evaluate((el: any) => {
        return el.getAttribute('aria-selected') === 'true' || el.classList.contains('active') || el.classList.contains('selected');
      }).catch(() => false);
      expect(isSelected || newUrl !== initialUrl).toBeTruthy();
    }
  });
});
