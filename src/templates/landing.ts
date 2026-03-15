import type { LandingSection } from "../content.js";

export function renderLanding(sections: LandingSection[]): string {
	const navItems = sections
		.filter((s) => s.title !== null)
		.map(
			(s) =>
				`<a class="landing-nav-link" href="#${s.id}">${s.title}</a>`,
		)
		.join("");

	const sectionHtml = sections
		.map(
			(s) => `
    <section class="landing-section" id="${s.id}">
      <div class="landing-section-inner">
        ${s.html}
      </div>
    </section>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ditis — The Father of Riches</title>
  <link rel="stylesheet" href="/public/app.css">
</head>
<body class="landing-body">

  <nav class="landing-nav">
    <a class="landing-nav-logo" href="/">DITIS</a>
    <div class="landing-nav-links">
      ${navItems}
    </div>
    <a class="landing-nav-cta" href="/app">View Demo →</a>
  </nav>

  <main class="landing-main">
    ${sectionHtml}
  </main>

  <footer class="landing-footer">
    <span class="landing-footer-logo">DITIS</span>
    <span class="landing-footer-copy">© 2026 Ditis Inc. — Confidential. Not a public securities offering.</span>
    <a class="landing-footer-link" href="/app">Platform →</a>
  </footer>

</body>
</html>`;
}
