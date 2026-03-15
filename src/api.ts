import { Hono } from "hono";
import { describeRoute, openAPIRouteHandler, resolver } from "hono-openapi";
import z from "zod";
import {
	addNote,
	addSource,
	deleteNote,
	deleteSource,
	getAllTargets,
	getNotesForTarget,
	getSourcesForTarget,
	getTarget,
	updateScores,
} from "./db.js";
import {
	NewNoteSchema,
	NewSourceSchema,
	NoteSchema,
	ScoreFactorsSchema,
	SourceSchema,
	TargetSchema,
} from "./schemas.js";

export const api = new Hono();

const r404 = { description: "Target not found" };

// ─── Targets ──────────────────────────────────────────────────────────────────

api.get(
	"/targets",
	describeRoute({
		summary: "List all targets",
		description: "Returns all targets ordered by composite score descending.",
		tags: ["Targets"],
		responses: {
			200: {
				description: "Targets list",
				content: {
					"application/json": { schema: resolver(z.array(TargetSchema)) },
				},
			},
		},
	}),
	(c) => c.json(getAllTargets()),
);

api.get(
	"/targets/:id",
	describeRoute({
		summary: "Get a target",
		tags: ["Targets"],
		responses: {
			200: {
				description: "Target",
				content: { "application/json": { schema: resolver(TargetSchema) } },
			},
			404: r404,
		},
	}),
	(c) => {
		const target = getTarget(Number(c.req.param("id")));
		if (!target) return c.json({ error: "Not found" }, 404);
		return c.json(target);
	},
);

api.patch(
	"/targets/:id/scores",
	describeRoute({
		summary: "Update score factors",
		description:
			"Updates the six scoring factors and recomputes the composite score.",
		tags: ["Targets"],
		requestBody: {
			required: true,
			content: {
				// biome-ignore lint/suspicious/noExplicitAny: resolver() return is processed by hono-openapi at runtime
				"application/json": { schema: resolver(ScoreFactorsSchema) as any },
			},
		},
		responses: {
			200: {
				description: "Updated target",
				content: { "application/json": { schema: resolver(TargetSchema) } },
			},
			404: r404,
		},
	}),
	async (c) => {
		const id = Number(c.req.param("id"));
		const factors = await c.req.json();
		updateScores(id, factors);
		const target = getTarget(id);
		if (!target) return c.json({ error: "Not found" }, 404);
		return c.json(target);
	},
);

// ─── Sources ──────────────────────────────────────────────────────────────────

api.get(
	"/targets/:id/sources",
	describeRoute({
		summary: "List sources for a target",
		tags: ["Sources"],
		responses: {
			200: {
				description: "Sources list",
				content: {
					"application/json": { schema: resolver(z.array(SourceSchema)) },
				},
			},
			404: r404,
		},
	}),
	(c) => {
		const id = Number(c.req.param("id"));
		if (!getTarget(id)) return c.json({ error: "Not found" }, 404);
		return c.json(getSourcesForTarget(id));
	},
);

api.post(
	"/targets/:id/sources",
	describeRoute({
		summary: "Add a source to a target",
		tags: ["Sources"],
		requestBody: {
			required: true,
			content: {
				// biome-ignore lint/suspicious/noExplicitAny: resolver() return is processed by hono-openapi at runtime
				"application/json": { schema: resolver(NewSourceSchema) as any },
			},
		},
		responses: {
			201: {
				description: "Created source",
				content: { "application/json": { schema: resolver(SourceSchema) } },
			},
			404: r404,
		},
	}),
	async (c) => {
		const id = Number(c.req.param("id"));
		if (!getTarget(id)) return c.json({ error: "Not found" }, 404);
		const body = await c.req.json();
		addSource({ target_id: id, ...body });
		return c.json(getSourcesForTarget(id)[0], 201);
	},
);

api.delete(
	"/targets/:id/sources/:sid",
	describeRoute({
		summary: "Delete a source",
		tags: ["Sources"],
		responses: {
			200: {
				description: "Deleted",
				content: {
					"application/json": {
						schema: resolver(z.object({ success: z.literal(true) })),
					},
				},
			},
		},
	}),
	(c) => {
		deleteSource(Number(c.req.param("sid")));
		return c.json({ success: true as const });
	},
);

// ─── Notes ────────────────────────────────────────────────────────────────────

api.get(
	"/targets/:id/notes",
	describeRoute({
		summary: "List research notes for a target",
		tags: ["Notes"],
		responses: {
			200: {
				description: "Notes list",
				content: {
					"application/json": { schema: resolver(z.array(NoteSchema)) },
				},
			},
			404: r404,
		},
	}),
	(c) => {
		const id = Number(c.req.param("id"));
		if (!getTarget(id)) return c.json({ error: "Not found" }, 404);
		return c.json(getNotesForTarget(id));
	},
);

api.post(
	"/targets/:id/notes",
	describeRoute({
		summary: "Add a research note to a target",
		tags: ["Notes"],
		requestBody: {
			required: true,
			content: {
				// biome-ignore lint/suspicious/noExplicitAny: resolver() return is processed by hono-openapi at runtime
				"application/json": { schema: resolver(NewNoteSchema) as any },
			},
		},
		responses: {
			201: {
				description: "Created note",
				content: { "application/json": { schema: resolver(NoteSchema) } },
			},
			404: r404,
		},
	}),
	async (c) => {
		const id = Number(c.req.param("id"));
		if (!getTarget(id)) return c.json({ error: "Not found" }, 404);
		const { content } = await c.req.json();
		addNote(id, content);
		return c.json(getNotesForTarget(id)[0], 201);
	},
);

api.delete(
	"/targets/:id/notes/:nid",
	describeRoute({
		summary: "Delete a research note",
		tags: ["Notes"],
		responses: {
			200: {
				description: "Deleted",
				content: {
					"application/json": {
						schema: resolver(z.object({ success: z.literal(true) })),
					},
				},
			},
		},
	}),
	(c) => {
		deleteNote(Number(c.req.param("nid")));
		return c.json({ success: true as const });
	},
);

// ─── OpenAPI spec + docs ──────────────────────────────────────────────────────

api.get(
	"/openapi.json",
	openAPIRouteHandler(api, {
		documentation: {
			info: {
				title: "Ditis Core API",
				version: "0.1.0",
				description:
					"Target intelligence platform — programmatic access to targets, scoring, sources, and research notes.",
			},
			servers: [{ url: "/api", description: "Ditis Core" }],
			tags: [
				{
					name: "Targets",
					description: "Treasure targets with 6-factor scoring model",
				},
				{
					name: "Sources",
					description: "Archival documents, sonar data, and survey sources",
				},
				{ name: "Notes", description: "Researcher notes per target" },
			],
		},
	}),
);

api.get("/docs", (c) =>
	c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Ditis Core API Reference</title>
</head>
<body>
  <script id="api-reference" data-url="/api/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`),
);
