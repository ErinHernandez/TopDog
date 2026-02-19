/**
 * Dashboard authenticated tests
 * Tests dashboard page rendering, user info display, navigation, and protected access
 */

import { test, expect, Page } from '@playwright/test';
import { setupDevAuth, DEV_USER } from './helpers/auth';

test.describe('Dashboard (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up dev auth before each test
    await setupDevAuth(page);
  });

  test('should display welcome message with user display name', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const welcomeText = page.locator('text=Welcome back');
    await expect(welcomeText).toBeVisible({ timeout: 5000 });
    // Check for display name
    const displayNameText = page.locator(`text=${DEV_USER.displayName}`);
    await expect(displayNameText).toBeVisible({ timeout: 5000 });
  });

  test('should display New Project button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const newProjectButton = page.locator('button:has-text("New Project")');
    await expect(newProjectButton).toBeVisible({ timeout: 5000 });
  });

  test('should display user menu button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    // Look for user menu - could be avatar, initials, or user icon
    const userMenu = page.locator('button[aria-label*="user"], button[aria-label*="account"], button[aria-label*="menu"]').first();
    const userInitials = page.locator('text=T'); // First letter of "Teddy"
    const userMenuExists = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);
    const userInitialsVisible = await userInitials.isVisible({ timeout: 5000 }).catch(() => false);
    expect(userMenuExists || userInitialsVisible).toBeTruthy();
  });

  test('should display projects grid or empty state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    // In dev mode without Firebase, should show either projects grid or empty state
    const projectsGrid = page.locator('[class*="grid"], [class*="projects"]').first();
    const emptyState = page.locator('text=No projects|Create First Project|create a project').first();
    const gridExists = await projectsGrid.isVisible({ timeout: 5000 }).catch(() => false);
    const emptyStateExists = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    expect(gridExists || emptyStateExists).toBeTruthy();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    // Look for navigation links to gallery or other pages
    const galleryLink = page.locator('a:has-text("Gallery"), a[href*="gallery"]').first();
    const galleryLinkExists = await galleryLink.isVisible({ timeout: 5000 }).catch(() => false);
    expect(galleryLinkExists).toBeTruthy();
  });

  test('should load without errors', async ({ page }) => {
    let errorOccurred = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorOccurred = true;
      }
    });
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    expect(errorOccurred).toBeFalsy();
  });
});
