export function escHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function fmtDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function fmtUsd(v: number): string {
	return `$${v.toLocaleString("en-US")}`;
}

export function fmtBig(v: number): string {
	if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
	if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
	if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
	return `$${Math.round(v)}`;
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
	archival: "ARCHIVAL",
	sonar: "SONAR",
	survey: "SURVEY",
	imagery: "IMAGERY",
};
