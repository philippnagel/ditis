import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { api } from "./api.js";
import { uiRoutes } from "./routes/ui.js";

const app = new Hono();

app.use("/public/*", serveStatic({ root: "./" }));
app.route("/api", api);
app.route("/", uiRoutes);

export default { port: 3001, fetch: app.fetch };
