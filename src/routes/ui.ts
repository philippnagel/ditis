import { Hono } from "hono";
import {
	addExpedition,
	addNote,
	addSource,
	addTarget,
	deleteExpedition,
	deleteNote,
	deleteSource,
	deleteTarget,
	getAllTargets,
	getExpeditionsForTarget,
	getNotesForTarget,
	getSourcesForTarget,
	getTarget,
	type Target,
	updateScores,
	updateStatus,
} from "../db.js";
import type { ScoreFactors } from "../scoring.js";
import { runMonteCarlo } from "../simulation.js";
import { renderDetail } from "../templates/detail.js";
import { renderExpeditionsInner } from "../templates/expeditions.js";
import { renderNotesInner } from "../templates/notes.js";
import { renderPage, renderPipelineStats } from "../templates/page.js";
import { renderSimulationResults } from "../templates/simulation.js";
import { renderTargetRow } from "../templates/target-row.js";

export const uiRoutes = new Hono();

uiRoutes.get("/", (c) => {
	return c.html(renderPage(getAllTargets()));
});

uiRoutes.delete("/targets/:id", (c) => {
	const id = Number(c.req.param("id"));
	deleteTarget(id);
	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;
	const statsOob = `<div id="pipeline-stats" hx-swap-oob="true">${renderPipelineStats(allTargets)}</div>`;
	c.header("HX-Trigger", JSON.stringify({ targetRemoved: { id } }));
	return c.html(
		`<p class="detail-empty">Target deleted.</p>${listOob}${statsOob}`,
	);
});

uiRoutes.post("/targets", async (c) => {
	const body = await c.req.parseBody();
	const depthRaw = String(body.depth_m ?? "").trim();
	const target = addTarget({
		name: String(body.name).trim(),
		description: String(body.description ?? "").trim(),
		lat: Number.parseFloat(String(body.lat)),
		lng: Number.parseFloat(String(body.lng)),
		tier: Number.parseInt(String(body.tier), 10),
		est_value_usd: Number.parseInt(String(body.est_value_usd), 10),
		legal_framework: String(body.legal_framework ?? "").trim(),
		depth_m: depthRaw ? Number.parseInt(depthRaw, 10) : null,
		historical_confidence: 50,
		value_score: 50,
		location_precision: 50,
		legal_feasibility: 50,
		recovery_ease: 50,
		sensor_validation: 0,
	});
	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;
	const statsOob = `<div id="pipeline-stats" hx-swap-oob="true">${renderPipelineStats(allTargets)}</div>`;
	c.header(
		"HX-Trigger",
		JSON.stringify({
			targetAdded: {
				id: target.id,
				name: target.name,
				lat: target.lat,
				lng: target.lng,
				tier: target.tier,
				score: target.score,
				status: target.status,
				est_value_usd: target.est_value_usd,
			},
		}),
	);
	return c.html(renderDetail(target, [], [], []) + listOob + statsOob);
});

uiRoutes.get("/targets/:id/detail", (c) => {
	const id = Number(c.req.param("id"));
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);
	return c.html(
		renderDetail(
			target,
			getSourcesForTarget(id),
			getNotesForTarget(id),
			getExpeditionsForTarget(id),
		),
	);
});

uiRoutes.patch("/targets/:id/scores", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const factors: ScoreFactors = {
		historical_confidence: Number(body.historical_confidence),
		value_score: Number(body.value_score),
		location_precision: Number(body.location_precision),
		legal_feasibility: Number(body.legal_feasibility),
		recovery_ease: Number(body.recovery_ease),
		sensor_validation: Number(body.sensor_validation),
	};
	updateScores(id, factors);
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);

	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;

	c.header(
		"HX-Trigger",
		JSON.stringify({ scoreUpdated: { id: target.id, score: target.score } }),
	);

	return c.html(
		renderDetail(
			target,
			getSourcesForTarget(id),
			getNotesForTarget(id),
			getExpeditionsForTarget(id),
		) + listOob,
	);
});

uiRoutes.patch("/targets/:id/status", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const status = String(body.status);
	const validStatuses = [
		"research",
		"survey",
		"validation",
		"recovery",
		"complete",
	];
	if (!validStatuses.includes(status)) return c.text("Invalid status", 400);
	updateStatus(id, status as Target["status"]);
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);
	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;
	return c.html(
		renderDetail(
			target,
			getSourcesForTarget(id),
			getNotesForTarget(id),
			getExpeditionsForTarget(id),
		) + listOob,
	);
});

uiRoutes.post("/targets/:id/sources", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const type = String(body.type);
	if (!["archival", "sonar", "survey", "imagery"].includes(type))
		return c.text("Invalid type", 400);
	addSource({
		target_id: id,
		title: String(body.title),
		url: body.url ? String(body.url) : null,
		type: type as "archival" | "sonar" | "survey" | "imagery",
		confidence_weight: Number(body.confidence_weight) || 70,
		excerpt: body.excerpt ? String(body.excerpt) : null,
	});
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);
	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;
	c.header(
		"HX-Trigger",
		JSON.stringify({ scoreUpdated: { id: target.id, score: target.score } }),
	);
	return c.html(
		renderDetail(
			target,
			getSourcesForTarget(id),
			getNotesForTarget(id),
			getExpeditionsForTarget(id),
		) + listOob,
	);
});

uiRoutes.delete("/targets/:id/sources/:sid", (c) => {
	const id = Number(c.req.param("id"));
	deleteSource(Number(c.req.param("sid")));
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);
	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;
	c.header(
		"HX-Trigger",
		JSON.stringify({ scoreUpdated: { id: target.id, score: target.score } }),
	);
	return c.html(
		renderDetail(
			target,
			getSourcesForTarget(id),
			getNotesForTarget(id),
			getExpeditionsForTarget(id),
		) + listOob,
	);
});

uiRoutes.post("/targets/:id/notes", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const content = String(body.content).trim();
	if (content) addNote(id, content);
	return c.html(renderNotesInner(id, getNotesForTarget(id)));
});

uiRoutes.delete("/targets/:id/notes/:nid", (c) => {
	const id = Number(c.req.param("id"));
	deleteNote(Number(c.req.param("nid")));
	return c.html(renderNotesInner(id, getNotesForTarget(id)));
});

uiRoutes.post("/targets/:id/expeditions", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const validStages = ["research", "survey", "validation", "recovery"] as const;
	const validStatuses = ["planned", "active", "complete", "cancelled"] as const;
	const stage = String(body.stage);
	const status = String(body.status);
	if (!validStages.includes(stage as (typeof validStages)[number]))
		return c.text("Invalid stage", 400);
	if (!validStatuses.includes(status as (typeof validStatuses)[number]))
		return c.text("Invalid status", 400);
	const budgetRaw = String(body.budget_usd ?? "").trim();
	addExpedition({
		target_id: id,
		name: String(body.name).trim(),
		stage: stage as (typeof validStages)[number],
		status: status as (typeof validStatuses)[number],
		budget_usd: budgetRaw ? Number.parseInt(budgetRaw, 10) : null,
		team: String(body.team ?? "").trim() || null,
		start_date: String(body.start_date ?? "").trim() || null,
		end_date: String(body.end_date ?? "").trim() || null,
		notes: String(body.notes ?? "").trim() || null,
	});
	return c.html(renderExpeditionsInner(id, getExpeditionsForTarget(id)));
});

uiRoutes.post("/targets/:id/simulate", async (c) => {
	const id = Number(c.req.param("id"));
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);
	const body = await c.req.parseBody();
	const budget = Math.max(0, Number(body.budget) || 50_000);
	const finderSharePct = Math.min(
		100,
		Math.max(1, Number(body.finder_share) || 80),
	);
	const result = runMonteCarlo({
		est_value_usd: target.est_value_usd,
		legal_feasibility: target.legal_feasibility,
		location_precision: target.location_precision,
		recovery_ease: target.recovery_ease,
		expedition_budget: budget,
		finder_share: finderSharePct / 100,
	});
	return c.html(renderSimulationResults(id, result, budget, finderSharePct));
});

uiRoutes.delete("/targets/:id/expeditions/:eid", (c) => {
	const id = Number(c.req.param("id"));
	deleteExpedition(Number(c.req.param("eid")));
	return c.html(renderExpeditionsInner(id, getExpeditionsForTarget(id)));
});
