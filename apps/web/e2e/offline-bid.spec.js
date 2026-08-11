const { test, expect } = require('@playwright/test');
const { seedSupplierAndTender } = require('./utils');

test.describe('Offline bid draft critical path', () => {
  let supplier;
  let tender;

  test.beforeAll(async () => {
    const seeded = await seedSupplierAndTender();
    supplier = seeded.supplier;
    tender = seeded.tender;
  });

  test('supplier drafts a bid offline and syncs it when connectivity returns', async ({ page, context }) => {
    await page.goto('/');
    // Inject the supplier session so the portal treats the browser as logged in
    await page.evaluate(
      (session) => window.localStorage.setItem('zets-session', JSON.stringify(session)),
      supplier,
    );

    await page.goto('/offline/bid-draft');
    await expect(page.getByText('Bid draft editor')).toBeVisible();

    // Simulate intermittent connectivity (e.g. rural mobile data drop)
    await context.setOffline(true);

    await page.getByLabel('Tender ID').fill(tender.id);
    await page.getByLabel('Bid amount').fill('95000');
    await page.getByLabel('Company name').fill('E2E Supplier Ltd');
    await page.getByLabel('Known conflicts').fill('None known');
    await page.getByRole('button', { name: /Save draft locally/i }).click();

    await expect(page.getByText(/Draft saved locally/i)).toBeVisible();
    await expect(page.getByText(/Saved drafts/i)).toBeVisible();

    // Connectivity restored
    await context.setOffline(false);

    await page.getByRole('button', { name: /Sync 1 draft/i }).click();
    await expect(page.getByText(/Synced 1 draft/i)).toBeVisible();

    // Verify the bid appears in the supplier portal
    await page.goto('/supplier');
    await expect(page.getByText(tender.title)).toBeVisible();
    await expect(page.getByText(/Draft/i).first()).toBeVisible();
  });
});
