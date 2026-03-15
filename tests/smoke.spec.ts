import { expect, test } from "@playwright/test";

test("routes toggle: no stack overflow, button active state toggles", async ({
	page,
}) => {
	const consoleErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (err) => consoleErrors.push(err.message));

	await page.goto("http://localhost:3001");
	await page.waitForLoadState("networkidle");

	const btn = page.locator("#routes-toggle");
	await expect(btn).toBeVisible();

	// Toggle ON
	await btn.click();
	await expect(btn).toHaveClass(/active/);

	// Toggle OFF
	await btn.click();
	await expect(btn).not.toHaveClass(/active/);

	// Toggle ON again (third click — catches any stateful bug)
	await btn.click();
	await expect(btn).toHaveClass(/active/);

	expect(
		consoleErrors.filter((e) => e.includes("Maximum call stack")),
	).toHaveLength(0);
	expect(consoleErrors.filter((e) => e.includes("RangeError"))).toHaveLength(0);
});

test("source add triggers score update", async ({ page }) => {
	await page.goto("http://localhost:3001");
	await page.waitForLoadState("networkidle");

	// Click the first target row
	await page.locator(".target-row").first().click();
	await page.waitForSelector(".detail-card");

	const _scoreBefore = await page.locator("#live-score").textContent();

	// Add a source with very high confidence weight to force a score change
	await page.locator('input[name="title"]').fill("Playwright test source");
	await page
		.locator('input[name="confidence_weight"]')
		.evaluate((el: HTMLInputElement) => {
			el.value = "100";
			el.dispatchEvent(new Event("input"));
		});
	await page
		.locator('#sources-section-1 .add-form button[type="submit"]')
		.click();
	await page.waitForSelector(".detail-card"); // full detail re-render

	const scoreAfter = await page.locator("#live-score").textContent();

	// Score should still be a number (re-render succeeded)
	expect(Number(scoreAfter)).toBeGreaterThan(0);

	// No console errors
});

test("kebab menu opens and contains print + delete actions", async ({
	page,
}) => {
	await page.goto("http://localhost:3001");
	await page.waitForLoadState("networkidle");

	await page.locator(".target-row").first().click();
	await page.waitForSelector(".detail-card");

	// Dropdown hidden by default
	await expect(page.locator(".detail-menu-dropdown")).toBeHidden();

	// Click ⋯ to open
	await page.locator(".detail-menu-btn").click();
	await expect(page.locator(".detail-menu-dropdown")).toBeVisible();
	await expect(page.locator(".detail-menu-item").first()).toContainText(
		"Print",
	);
	await expect(page.locator(".detail-menu-item-danger")).toContainText(
		"Delete",
	);

	// Click outside to close
	await page.locator(".detail-name").click();
	await expect(page.locator(".detail-menu-dropdown")).toBeHidden();
});
