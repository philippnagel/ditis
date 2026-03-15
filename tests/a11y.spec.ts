import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const BASE = "http://localhost:3001";

// Runs the full WCAG 2 AA ruleset via axe-core.
const AXE_OPTIONS = {
	runOnly: { type: "tag" as const, values: ["wcag2aa"] },
};

async function openFirstTarget(page: Page) {
	await page.goto(BASE);
	await page.waitForLoadState("networkidle");
	await page.locator(".target-row").first().click();
	await page.waitForSelector(".detail-card");
}

test.describe("Accessibility — dark mode (default)", () => {
	test("main page: no WCAG 2 AA violations", async ({ page }) => {
		await page.goto(BASE);
		await page.waitForLoadState("networkidle");
		// Ensure dark theme is active (default)
		await page.evaluate(() =>
			document.documentElement.setAttribute("data-theme", "dark"),
		);

		const results = await new AxeBuilder({ page })
			.options(AXE_OPTIONS)
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test("detail panel open: no WCAG 2 AA violations", async ({ page }) => {
		await openFirstTarget(page);
		await page.evaluate(() =>
			document.documentElement.setAttribute("data-theme", "dark"),
		);

		const results = await new AxeBuilder({ page })
			.options(AXE_OPTIONS)
			.analyze();

		expect(results.violations).toEqual([]);
	});
});

test.describe("Accessibility — light mode", () => {
	test("main page: no WCAG 2 AA violations", async ({ page }) => {
		await page.goto(BASE);
		await page.waitForLoadState("networkidle");
		await page.evaluate(() =>
			document.documentElement.setAttribute("data-theme", "light"),
		);

		const results = await new AxeBuilder({ page })
			.options(AXE_OPTIONS)
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test("detail panel open: no WCAG 2 AA violations", async ({ page }) => {
		await openFirstTarget(page);
		await page.evaluate(() =>
			document.documentElement.setAttribute("data-theme", "light"),
		);

		const results = await new AxeBuilder({ page })
			.options(AXE_OPTIONS)
			.analyze();

		expect(results.violations).toEqual([]);
	});
});
