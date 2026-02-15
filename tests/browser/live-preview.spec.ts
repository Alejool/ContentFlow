import { expect, test } from "@playwright/test";

test.describe("Live Preview Visual Regression", () => {
  test("should show live preview in edit modal", async ({ page }) => {
    // 1. Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "dhowe@example.org");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Go to Content page
    await page.goto("/content");

    // 3. Find an existing publication and click to edit
    // We'll try ID 1 first, then any edit button
    const editButton = page.getByTestId("edit-publication-1");
    if ((await editButton.count()) > 0) {
      await editButton.click();
    } else {
      // Fallback to searching for the first available edit button by title if ID 1 is not found
      const anyEditButton = page.getByTitle(/Editar/i).first();
      await expect(anyEditButton).toBeVisible({ timeout: 10000 });
      await anyEditButton.click();
    }

    // 4. Check Live Preview
    // Wait for modal
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Find Live Preview section using data-testid
    const previewSection = page.getByTestId("live-preview-section");
    await expect(previewSection).toBeVisible();

    // Take a snapshot of the preview section
    await expect(previewSection).toHaveScreenshot("live-preview-section.png");
  });
});
