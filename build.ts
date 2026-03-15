const result = await Bun.build({
	entrypoints: ["src/client/main.ts"],
	outdir: "public",
	naming: { entry: "app.js" },
	target: "browser",
	minify: process.env.NODE_ENV === "production",
	sourcemap: process.env.NODE_ENV === "production" ? "none" : "linked",
});

if (!result.success) {
	console.error("JS build failed:");
	for (const message of result.logs) console.error(message);
	process.exit(1);
}

console.log("JS build complete:", result.outputs.map((o) => o.path).join(", "));
