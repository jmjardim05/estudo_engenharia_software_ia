const { test, expect } = require('@playwright/test');

test('homepage loads and shows the gallery cards', async ({ page }) => {
  await page.goto('/vanilla-js-web-app-example/');

  await expect(page).toHaveTitle(/TDD Frontend Example/i);
  await expect(page.getByRole('button', { name: /submit form/i })).toBeVisible();
  await expect(page.locator('#card-list article')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'AI Alien' })).toBeVisible();
});

test('submitting the form adds a new card to the list', async ({ page }) => {
  await page.goto('/vanilla-js-web-app-example/');
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole('textbox', { name: 'Image Title' }).fill('AI Test Card');
  await page.getByRole('textbox', { name: 'Image URL' }).fill('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80');
  await page.getByRole('button', { name: /submit form/i }).click();

  await expect(page.getByRole('heading', { name: 'AI Test Card' })).toBeVisible();
  await expect(page.locator('#card-list article')).toHaveCount(4);
});

test('form validation blocks invalid submissions', async ({ page }) => {
  await page.goto('/vanilla-js-web-app-example/');
  await page.getByRole('button', { name: /submit form/i }).click();

  await expect(page.locator('#titleFeedback')).toBeVisible();
  await expect(page.locator('#urlFeedback')).toBeVisible();
  await expect(page.locator('#card-list article')).toHaveCount(3);
});
