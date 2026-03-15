import { Hono } from "hono";
import { loadLandingSections } from "../content.js";
import { renderLanding } from "../templates/landing.js";

export const landingRoutes = new Hono();

const sections = loadLandingSections();

landingRoutes.get("/", (c) => c.html(renderLanding(sections)));
