// Starts three concurrent watchers for development:
//   1. Hono server (hot-reload on src changes)
//   2. Bun JS bundler (watch mode)
//   3. Tailwind CSS compiler (watch mode)

const processes = [
	Bun.spawn(["bun", "run", "--watch", "src/index.ts"], {
		stdout: "inherit",
		stderr: "inherit",
	}),
	Bun.spawn(
		[
			"bun",
			"build",
			"src/client/main.ts",
			"--outfile",
			"public/app.js",
			"--target",
			"browser",
			"--watch",
		],
		{ stdout: "inherit", stderr: "inherit" },
	),
	Bun.spawn(
		[
			"bunx",
			"@tailwindcss/cli",
			"-i",
			"styles/app.css",
			"-o",
			"public/app.css",
			"--watch",
		],
		{ stdout: "inherit", stderr: "inherit" },
	),
];

process.on("SIGINT", () => {
	for (const p of processes) p.kill();
	process.exit(0);
});

await Promise.all(processes.map((p) => p.exited));
