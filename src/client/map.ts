import { MapboxOverlay } from "@deck.gl/mapbox";
import { PathLayer, ScatterplotLayer } from "deck.gl";
import htmx from "htmx.org";
import maplibregl from "maplibre-gl";
import { scoreColor } from "./score.js";
import { TRADE_ROUTES } from "./trade-routes.js";

const MAP_STYLES: Record<string, string> = {
	dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
	light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
};

export interface ClientTarget {
	id: number;
	name: string;
	lat: number;
	lng: number;
	tier: number;
	score: number;
	status: string;
	est_value_usd: number;
}

let _overlay: MapboxOverlay | null = null;
let _map: maplibregl.Map | null = null;
let _selectedId: number | null = null;
let _targets: ClientTarget[] = [];
let _filterIds: Set<number> | null = null;
let _showRoutes = false;

function hexToRgba(hex: string, a: number): [number, number, number, number] {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return [r, g, b, a];
}

function buildLayers(selectedId: number | null) {
	const routesLayer = new PathLayer({
		id: "trade-routes",
		data: TRADE_ROUTES,
		visible: _showRoutes,
		getPath: (d) => d.path,
		getColor: (d) => d.color,
		getWidth: 2,
		widthUnits: "pixels",
		pickable: true,
	});

	return [
		routesLayer,
		new ScatterplotLayer<ClientTarget>({
			id: "targets",
			data: _targets,
			getPosition: (d) => [d.lng, d.lat],
			getRadius: (d) => (selectedId === d.id ? 110000 : 70000),
			radiusUnits: "meters",
			radiusMinPixels: 5,
			radiusMaxPixels: 28,
			getFillColor: (d) => {
				if (_filterIds && !_filterIds.has(d.id)) return [80, 80, 80, 50];
				return hexToRgba(scoreColor(d.score), selectedId === d.id ? 255 : 195);
			},
			getLineColor: (d) =>
				selectedId === d.id ? [16, 185, 129, 255] : [255, 255, 255, 50],
			lineWidthMinPixels: selectedId ? 1.5 : 1,
			stroked: true,
			pickable: true,
			autoHighlight: true,
			highlightColor: [16, 185, 129, 80],
			onClick: (info) =>
				info.object &&
				selectTarget(info.object.id, info.object.lng, info.object.lat),
			onHover: ({ object, x, y }) => {
				const tip = document.getElementById("tooltip");
				if (!tip) return;
				if (object) {
					tip.style.cssText = `display:block;left:${x + 14}px;top:${y + 14}px`;
					const nameEl =
						tip.querySelector(".tip-name") ??
						tip.appendChild(document.createElement("div"));
					const metaEl =
						tip.querySelector(".tip-meta") ??
						tip.appendChild(document.createElement("div"));
					nameEl.className = "tip-name";
					metaEl.className = "tip-meta";
					nameEl.textContent = object.name;
					metaEl.textContent = `Score: ${object.score} · Tier ${object.tier}`;
				} else {
					tip.style.display = "none";
				}
			},
			updateTriggers: {
				getRadius: selectedId,
				getFillColor: [selectedId, _filterIds],
				getLineColor: selectedId,
			},
		}),
	];
}

export function selectTarget(id: number, lng: number, lat: number): void {
	_selectedId = id;
	_overlay?.setProps({ layers: buildLayers(id) });
	_map?.flyTo({
		center: [lng, lat],
		zoom: Math.max(_map.getZoom(), 5),
		duration: 900,
	});
	for (const el of document.querySelectorAll(".target-row")) {
		el.classList.toggle(
			"active",
			Number((el as HTMLElement).dataset.id) === id,
		);
	}
	htmx.ajax("get", `/targets/${id}/detail`, {
		target: "#detail-panel",
		swap: "innerHTML",
	});
}

export function toggleTheme(): void {
	const html = document.documentElement;
	const next = html.dataset.theme === "light" ? "dark" : "light";
	html.dataset.theme = next;
	localStorage.setItem("theme", next);
	_map?.setStyle(MAP_STYLES[next]);
}

export function addMapTarget(target: ClientTarget): void {
	_targets = [..._targets, target];
	_overlay?.setProps({ layers: buildLayers(_selectedId) });
}

export function removeMapTarget(id: number): void {
	_targets = _targets.filter((t) => t.id !== id);
	if (_selectedId === id) _selectedId = null;
	_overlay?.setProps({ layers: buildLayers(_selectedId) });
}

export function setMapFilter(ids: number[] | null): void {
	_filterIds = ids ? new Set(ids) : null;
	_overlay?.setProps({ layers: buildLayers(_selectedId) });
}

export function toggleRoutes(): void {
	_showRoutes = !_showRoutes;
	_overlay?.setProps({ layers: buildLayers(_selectedId) });
	const btn = document.getElementById("routes-toggle");
	if (btn) btn.classList.toggle("active", _showRoutes);
}

export function setTargetScore(id: number, score: number): void {
	_targets = _targets.map((t) => (t.id === id ? { ...t, score } : t));
	_overlay?.setProps({ layers: buildLayers(_selectedId) });
}

export function initMap(targets: ClientTarget[]): void {
	_targets = targets;
	const theme = (document.documentElement.dataset.theme ?? "dark") as
		| "dark"
		| "light";

	_map = new maplibregl.Map({
		container: "map",
		style: MAP_STYLES[theme],
		center: [10, 25],
		zoom: 2,
		attributionControl: false,
	});
	_map.addControl(new maplibregl.AttributionControl({ compact: true }));

	_map.on("load", () => {
		_overlay = new MapboxOverlay({
			interleaved: false,
			layers: buildLayers(null),
		});
		_map?.addControl(_overlay as unknown as maplibregl.IControl);
	});
}
