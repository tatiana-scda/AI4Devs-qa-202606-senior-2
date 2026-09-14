import { test, expect } from '@playwright/test';

test('basic test - frontend loads', async ({ page }) => {
  await page.goto('/');
  
  // Expect a title "to contain" a substring or equal a string
  await expect(page).toHaveTitle(/React App/);
  
  // Expect an element to be visible
  const heading = page.locator('h1, h2, h3');
  await expect(heading).toBeVisible();
});

test('navigate to a page', async ({ page }) => {
  await page.goto('/');
  
  // Click on a link or button if it exists
  const links = page.locator('a');
  const linkCount = await links.count();
  
  if (linkCount > 0) {
    await links.first().click();
    await expect(page).toHaveURL(/.*/);
  }
});
