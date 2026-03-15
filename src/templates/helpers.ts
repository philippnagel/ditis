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

export const SOURCE_TYPE_LABELS: Record<string, string> = {
	archival: "ARCHIVAL",
	sonar: "SONAR",
	survey: "SURVEY",
	imagery: "IMAGERY",
};
