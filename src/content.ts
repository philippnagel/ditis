import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

export interface LandingSection {
	id: string;
	title: string | null;
	html: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseFrontmatter(raw: string): {
	id: string | null;
	title: string | null;
	body: string;
} {
	const match = FRONTMATTER_RE.exec(raw);
	if (!match) return { id: null, title: null, body: raw };

	const fm = match[1];
	const body = raw.slice(match[0].length);

	const id = /^id:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? null;
	const title = /^title:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? null;

	return { id, title, body };
}

export function loadLandingSections(): LandingSection[] {
	const dir = join(process.cwd(), "content", "landing");
	const files = readdirSync(dir)
		.filter((f) => f.endsWith(".md"))
		.sort();

	return files.map((file) => {
		const raw = readFileSync(join(dir, file), "utf-8");
		const { id, title, body } = parseFrontmatter(raw);
		const stem = file.replace(/^\d+-/, "").replace(/\.md$/, "");
		return {
			id: id ?? stem,
			title,
			html: marked.parse(body) as string,
		};
	});
}
