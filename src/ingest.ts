/**
 * Local OCR pipeline for archival document ingestion.
 * - PDFs: pdf-parse for text layer, tesseract.js fallback for scanned pages
 * - Images (.jpg, .png, .webp): tesseract.js
 */

import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
// pdf-parse is CJS-only; load via require to avoid ESM default-export error
const pdfParse = _require("pdf-parse") as (
	buf: Buffer,
) => Promise<{ text: string }>;

import Tesseract from "tesseract.js";

export interface ExtractedSource {
	title: string;
	excerpt: string;
	confidence_weight: number;
}

// Persistent Tesseract worker — created once, reused across requests
let _worker: Tesseract.Worker | null = null;
async function getWorker(): Promise<Tesseract.Worker> {
	if (!_worker) {
		_worker = await Tesseract.createWorker("eng", undefined, {
			logger: () => {},
		});
	}
	return _worker;
}

function cleanFilename(filename: string): string {
	return filename
		.replace(/\.[^.]+$/, "") // remove extension
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/** Heuristic confidence: based on word count of extracted text */
function inferConfidence(text: string): number {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	if (words > 200) return 75;
	if (words > 50) return 60;
	if (words > 10) return 45;
	return 30;
}

function truncateExcerpt(text: string, maxChars = 500): string {
	const trimmed = text.replace(/\s+/g, " ").trim();
	if (trimmed.length <= maxChars) return trimmed;
	return `${trimmed.slice(0, maxChars - 1)}…`;
}

async function ocrWithTesseract(buffer: Buffer): Promise<string> {
	const worker = await getWorker();
	const result = await worker.recognize(buffer);
	return result.data.text ?? "";
}

export async function extractDocumentSource(
	fileBuffer: Buffer,
	filename: string,
	mediaType: string,
): Promise<ExtractedSource> {
	const title = cleanFilename(filename) || "Uploaded Document";
	let rawText = "";

	const isPdf =
		mediaType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");

	if (isPdf) {
		try {
			const parsed = await pdfParse(fileBuffer);
			rawText = parsed.text ?? "";
		} catch {
			// fall through to tesseract
		}

		// If pdf-parse got no meaningful text, fall back to OCR
		const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
		if (wordCount < 10) {
			rawText = await ocrWithTesseract(fileBuffer);
		}
	} else {
		// image types
		rawText = await ocrWithTesseract(fileBuffer);
	}

	return {
		title,
		excerpt: truncateExcerpt(rawText),
		confidence_weight: inferConfidence(rawText),
	};
}
