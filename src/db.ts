import { Database } from "bun:sqlite";
import { count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { notes, sources, targets } from "./schema.js";
import { computeScore, type ScoreFactors } from "./scoring.js";

export type Target = typeof targets.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Note = typeof notes.$inferSelect;
type NewTarget = typeof targets.$inferInsert;

const sqlite = new Database("ditis.db", { create: true });
export const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./drizzle" });

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Omit<NewTarget, "id" | "score">[] = [
	{
		name: "1715 Spanish Treasure Fleet",
		description:
			"Ten galleons lost in a hurricane off Vero Beach. Active recovery operations ongoing under FL state lease. Gold and silver coins recovered annually. Drone mag survey would systematically cover the remaining search area.",
		lat: 27.64,
		lng: -80.37,
		tier: 1,
		est_value_usd: 5_000_000,
		legal_framework: "FL Historical Resources Act — state lease, 80/20 split",
		depth_m: 7,
		status: "research",
		historical_confidence: 90,
		value_score: 65,
		location_precision: 85,
		legal_feasibility: 85,
		recovery_ease: 88,
		sensor_validation: 35,
	},
	{
		name: "English Farmland Hoards",
		description:
			"Systematic drone magnetometer survey of farmland with known Roman and medieval occupation across England. PAS (Portable Antiquities Scheme) records guide target selection. Landowner agreements required. Transformative drone advantage over handheld detectors.",
		lat: 52.19,
		lng: 0.97,
		tier: 1,
		est_value_usd: 500_000,
		legal_framework:
			"UK Treasure Act 1996 — Coroner report, state first-refusal at market value",
		depth_m: null,
		status: "research",
		historical_confidence: 65,
		value_score: 42,
		location_precision: 55,
		legal_feasibility: 92,
		recovery_ease: 95,
		sensor_validation: 5,
	},
	{
		name: "American West Caches",
		description:
			"Outlaw caches, Spanish colonial deposits, and lost mine locations across BLM land in AZ, NV, and UT. High-volume, lower individual value. GPR drone sweeps under BLM casual use permit. Lore-based targeting supplemented by archival mining and Army records.",
		lat: 34.05,
		lng: -111.09,
		tier: 1,
		est_value_usd: 200_000,
		legal_framework:
			"BLM casual use rules — no permit required below surface disturbance threshold",
		depth_m: null,
		status: "research",
		historical_confidence: 45,
		value_score: 38,
		location_precision: 40,
		legal_feasibility: 82,
		recovery_ease: 85,
		sensor_validation: 0,
	},
	{
		name: "Bahamas / FL Keys Wrecks",
		description:
			"Dense colonial-era wreck fields across the Bahamas and Florida Keys. Clear shallow water makes AUV survey extremely cost-effective. Spanish, British, and Dutch colonial vessels. Government share ~25% under Bahamas antiquities license.",
		lat: 25.04,
		lng: -77.4,
		tier: 2,
		est_value_usd: 1_000_000,
		legal_framework:
			"Bahamas Antiquities, Monuments & Museum Act / FL state lease",
		depth_m: 8,
		status: "research",
		historical_confidence: 70,
		value_score: 60,
		location_precision: 65,
		legal_feasibility: 72,
		recovery_ease: 75,
		sensor_validation: 15,
	},
	{
		name: "Great Lakes Shipwrecks",
		description:
			"Cold freshwater preserves hulls and cargo with exceptional fidelity. 19th–early 20th century commercial and passenger vessels in Lake Michigan and Lake Huron. Many are located via existing NOAA surveys. ROV inspection plus targeted recovery.",
		lat: 44.5,
		lng: -86.33,
		tier: 2,
		est_value_usd: 200_000,
		legal_framework:
			"US Abandoned Shipwreck Act — state jurisdiction varies (MI, WI, OH)",
		depth_m: 27,
		status: "research",
		historical_confidence: 75,
		value_score: 45,
		location_precision: 70,
		legal_feasibility: 68,
		recovery_ease: 60,
		sensor_validation: 20,
	},
	{
		name: "NC WWII Merchant Wrecks",
		description:
			"'Torpedo Junction' — highest density of WWII U-boat sinkings off the US coast. Naval records are precise. Commercial cargo including metals, machinery, and valuables. Outer Banks visibility is variable; AUV side-scan then targeted ROV.",
		lat: 35.56,
		lng: -75.46,
		tier: 2,
		est_value_usd: 1_000_000,
		legal_framework:
			"Admiralty salvage law — Law of Finds, federal district court arrest",
		depth_m: 35,
		status: "research",
		historical_confidence: 80,
		value_score: 55,
		location_precision: 72,
		legal_feasibility: 70,
		recovery_ease: 45,
		sensor_validation: 25,
	},
	{
		name: "San José Galleon",
		description:
			"Arguably the richest shipwreck ever found. Sunk 1708 by the British Navy off Cartagena with 11 million gold coins, emeralds, and jewels. Colombian government located it circa 2015 but exact coordinates are classified. Massive ongoing legal dispute between Colombia, Spain, and indigenous groups. Deep-water ROV required; currently unworkable without government JV.",
		lat: 10.39,
		lng: -75.51,
		tier: 3,
		est_value_usd: 10_000_000_000,
		legal_framework:
			"Colombian cultural heritage law — government JV mandatory, no private access",
		depth_m: 600,
		status: "research",
		historical_confidence: 92,
		value_score: 100,
		location_precision: 62,
		legal_feasibility: 15,
		recovery_ease: 8,
		sensor_validation: 45,
	},
	{
		name: "Flor de la Mar",
		description:
			"Portuguese carrack that sank 1511 in the Strait of Malacca carrying the largest treasure ever loaded onto a single ship — looted from the Sultan of Malacca. High sediment, poor visibility, disputed Malaysia/Indonesia territorial waters. AUV SAS survey required. Primary constraint is legal, not technical.",
		lat: 2.3,
		lng: 103.7,
		tier: 3,
		est_value_usd: 2_500_000_000,
		legal_framework:
			"Malaysia / Indonesia joint jurisdiction — government JV required from both nations",
		depth_m: 15,
		status: "research",
		historical_confidence: 78,
		value_score: 98,
		location_precision: 45,
		legal_feasibility: 25,
		recovery_ease: 50,
		sensor_validation: 10,
	},
	{
		name: "SS Central America (remaining)",
		description:
			"Gold Rush-era steamship that sank 1857 with 21 tons of California gold. Columbus-America Discovery Group recovered ~$150M in gold 1989 after landmark admiralty ruling establishing finder's rights. An estimated $100–300M in gold coins and ingots remains. Legal ownership is established; primary barrier is deep-water ROV access.",
		lat: 31.68,
		lng: -76.74,
		tier: 3,
		est_value_usd: 200_000_000,
		legal_framework:
			"Admiralty — legal precedent established (4th Circuit, 1992), finder's rights confirmed",
		depth_m: 2200,
		status: "research",
		historical_confidence: 95,
		value_score: 82,
		location_precision: 80,
		legal_feasibility: 62,
		recovery_ease: 12,
		sensor_validation: 60,
	},
	{
		name: "Yamashita's Gold",
		description:
			"Alleged WWII Japanese military treasure buried across the Philippines by General Yamashita's forces. Widely considered legend, though some recoveries have been claimed. GPR drone sweeps of the highest-probability sites (Luzon) could validate or definitively eliminate within months. Primary value: definitively closing or opening a massive opportunity.",
		lat: 16.71,
		lng: 121.55,
		tier: 4,
		est_value_usd: 1_000_000_000,
		legal_framework:
			"Philippine National Cultural Heritage Act — government ownership of any finds",
		depth_m: null,
		status: "research",
		historical_confidence: 28,
		value_score: 90,
		location_precision: 25,
		legal_feasibility: 35,
		recovery_ease: 55,
		sensor_validation: 0,
	},
	{
		name: "Merchant Royal",
		description:
			"English merchant vessel that sank 1641 in a storm near Land's End carrying an enormous load of Spanish treasure — estimated 500 tons of silver, 400,000 pieces of eight, and 100,000 gold doubloons. Location known to within ~50km. AUV SAS survey plus drift modelling required. Zero sensor validation to date.",
		lat: 49.95,
		lng: -5.73,
		tier: 4,
		est_value_usd: 1_000_000_000,
		legal_framework:
			"UK Merchant Shipping Act 1995 — Receiver of Wreck notification required",
		depth_m: 200,
		status: "research",
		historical_confidence: 82,
		value_score: 88,
		location_precision: 48,
		legal_feasibility: 72,
		recovery_ease: 40,
		sensor_validation: 0,
	},
	{
		name: "Lost Amazon Cities",
		description:
			"LiDAR surveys are revealing extensive pre-Columbian urban networks across the Amazon basin. Primary value is media, academic partnerships, and demonstrating Ditis Core's geospatial capability — not traditional artifact salvage. Could support a documentary series and platform credibility ahead of a larger raise.",
		lat: -3.46,
		lng: -62.22,
		tier: 4,
		est_value_usd: 50_000_000,
		legal_framework:
			"Brazilian / Peruvian national heritage law — academic partnership required",
		depth_m: null,
		status: "research",
		historical_confidence: 55,
		value_score: 30,
		location_precision: 50,
		legal_feasibility: 45,
		recovery_ease: 35,
		sensor_validation: 20,
	},
	{
		name: "Copper Scroll Treasures",
		description:
			"Dead Sea Scroll (3Q15) describes 64 locations of hidden gold and silver — estimated 200 tons — using cryptic first-century location references. Decoded locations point to sites in the Jordan Valley and Judean hills. Extreme geopolitical sensitivity. GPR + hyperspectral validation study only; full recovery is politically impossible in the near term.",
		lat: 31.72,
		lng: 35.58,
		tier: 4,
		est_value_usd: 1_500_000_000,
		legal_framework:
			"Jordanian Antiquities Law / Israeli Antiquities Authority — state ownership of all finds",
		depth_m: null,
		status: "research",
		historical_confidence: 65,
		value_score: 75,
		location_precision: 35,
		legal_feasibility: 15,
		recovery_ease: 40,
		sensor_validation: 0,
	},
];

// ─── Seed on first run ────────────────────────────────────────────────────────

const [{ total }] = db.select({ total: count() }).from(targets).all();

if (total === 0) {
	db.insert(targets)
		.values(SEED.map((t) => ({ ...t, score: computeScore(t) })))
		.run();
}

// ─── Demo source + note seed ──────────────────────────────────────────────────
// Keyed by target name so IDs don't need to be hard-coded.

type TargetName = (typeof SEED)[number]["name"];

const DEMO_SOURCES: Record<
	TargetName,
	{
		title: string;
		url?: string;
		type: "archival" | "sonar" | "survey" | "imagery";
		confidence_weight: number;
		excerpt?: string;
	}[]
> = {
	"1715 Spanish Treasure Fleet": [
		{
			title: "General Archive of the Indies — 1715 Fleet Manifest",
			type: "archival",
			confidence_weight: 92,
			excerpt:
				"Capitana (Urca de Lima), Almiranta, and eight naos confirmed. Cargo manifests list 14M pesos registered silver plus undeclared contraband estimated at 3×.",
		},
		{
			title: "1715 Fleet Society — Recovery Operations Log 2019–2024",
			type: "survey",
			confidence_weight: 88,
			excerpt:
				"Annual mag sweeps cover ~40% of estimated debris field. ~$4.2M face-value coins recovered to date. Significant unswept area remains north of Wabasso.",
		},
		{
			title: "NOAA Nautical Chart 11476 — Vero Beach to St Lucie Inlet",
			url: "https://charts.noaa.gov/PDFs/11476.pdf",
			type: "imagery",
			confidence_weight: 75,
			excerpt: "Bathymetry confirms 4–9m depth across primary search corridor.",
		},
		{
			title: "FL Division of Historical Resources — Salvage Lease #1715-2024",
			type: "archival",
			confidence_weight: 95,
			excerpt:
				"Active lease valid through December 2027. Revenue split: 80% salvor / 20% State of Florida. Drone magnetometer surveys explicitly permitted under lease terms.",
		},
	],
	"English Farmland Hoards": [
		{
			title: "Portable Antiquities Scheme — East Anglian Finds Database",
			url: "https://finds.org.uk",
			type: "archival",
			confidence_weight: 78,
			excerpt:
				"1,240 significant finds recorded in target parishes since 1997. Roman and medieval coin hoards concentrated along three ridge-line corridors matching aerial crop-mark data.",
		},
		{
			title: "Cambridge Aerial Photography Library — Romano-British Enclosures",
			type: "imagery",
			confidence_weight: 70,
			excerpt:
				"Crop-mark analysis identifies 14 probable villa complexes and 6 field-system boundaries within 20km of primary survey zone.",
		},
	],
	"American West Caches": [
		{
			title: "BLM Land Status Map — AZ/NV/UT Casual Use Zones",
			url: "https://blm.gov",
			type: "archival",
			confidence_weight: 85,
			excerpt:
				"Confirmed casual use eligibility for GPR drone surveys below surface disturbance threshold. No prior-permit requirement for non-invasive sensing.",
		},
		{
			title: "Arizona State Library — Territorial Prison Records 1876–1910",
			type: "archival",
			confidence_weight: 48,
			excerpt:
				"Inmate testimony references 11 cache sites near Wickenburg, Oatman, and Vulture Mine. Cross-referenced against Army escort records.",
		},
	],
	"Bahamas / FL Keys Wrecks": [
		{
			title: "Bahamas Antiquities, Monuments & Museum Act — Licence Template",
			type: "archival",
			confidence_weight: 72,
			excerpt:
				"Government share capped at 25% of appraised value. 12-month exclusivity window post-discovery. Permit turnaround typically 8–14 weeks.",
		},
	],
	"Great Lakes Shipwrecks": [
		{
			title: "NOAA Thunder Bay NMS — Shipwreck Inventory",
			url: "https://thunderbay.noaa.gov",
			type: "archival",
			confidence_weight: 80,
			excerpt:
				"218 wrecks documented within sanctuary boundary. 47 carry manifest records indicating commercial cargo. Side-scan sonar surveys complete for ~60% of sanctuary area.",
		},
	],
	"NC WWII Merchant Wrecks": [
		{
			title: "USNHHC — Eastern Sea Frontier War Diary, Jan–Jun 1942",
			type: "archival",
			confidence_weight: 88,
			excerpt:
				"397 merchant ships attacked in Coastal Frontier, 1942. 87 confirmed sunk within 50nm of Cape Hatteras. Positions accurate to ±2nm from contemporaneous reports.",
		},
		{
			title: "NOAA Graveyard of the Atlantic Survey — Sonar Mosaic 2018",
			type: "sonar",
			confidence_weight: 82,
			excerpt:
				"Side-scan survey identifies 31 anomalies consistent with merchant hull profiles at 25–55m depth. 8 have been positively identified; 23 remain candidate targets.",
		},
	],
	"San José Galleon": [
		{
			title:
				"Colombian Ministry of Culture — Official Discovery Announcement, 2015",
			type: "archival",
			confidence_weight: 90,
			excerpt:
				"Government confirms wreck located at classified coordinates, 600m depth off Cartagena. Bronze cannon with dolphin motifs match 1708 period. Exact position withheld.",
		},
		{
			title: "Spanish Crown Formal Claim to Colombia — Diplomatic Note, 2018",
			type: "archival",
			confidence_weight: 85,
			excerpt:
				"Spain asserts sovereign immunity under UNCLOS Art. 96. Colombia rejects claim. Trilateral dispute (Colombia / Spain / Qhara Qhara nation) unresolved.",
		},
		{
			title: "Woods Hole Oceanographic — Deep-Water ROV Capability Brief",
			type: "survey",
			confidence_weight: 70,
			excerpt:
				"600m recovery is within Nereid UI operational envelope. JV with WHOI or equivalent is a viable path pending government access agreement.",
		},
	],
	"Flor de la Mar": [
		{
			title:
				"Arquivo Histórico Ultramarino — Afonso de Albuquerque Correspondence 1511",
			type: "archival",
			confidence_weight: 78,
			excerpt:
				"Albuquerque's letter to King Manuel I describes loading of Sultan Mahmud's treasury. Ship lost in storm at mouth of Malacca Strait. Search radius ±30km from recorded position.",
		},
	],
	"SS Central America (remaining)": [
		{
			title: "4th Circuit Court of Appeals — Columbus-America Decision, 1992",
			url: "https://law.justia.com/cases/federal/appellate-courts/F2/974/450/",
			type: "archival",
			confidence_weight: 97,
			excerpt:
				"Finder's rights confirmed under Law of Finds. Recovery rights vest exclusively in Columbus-America Discovery Group and successors. No adverse title claims pending as of 2024.",
		},
		{
			title: "Odyssey Marine Exploration — Thompson Recovery Inventory, 1989",
			type: "survey",
			confidence_weight: 88,
			excerpt:
				"~3 tons gold coins and bars recovered. On-site ROV photography estimates 15–20 tons gold-equivalent cargo remaining in collapsed lower decks and surrounding sediment field.",
		},
		{
			title: "New York Times — Loss of the Central America, September 12, 1857",
			type: "archival",
			confidence_weight: 82,
			excerpt:
				"Survivor accounts describe 21 tons of California gold aboard. Ship's manifest confirmed by Wells Fargo records. Insurance claims paid totalling $1.2M (1857 dollars).",
		},
	],
	"Yamashita's Gold": [
		{
			title:
				"Philippine Presidential Commission — Marcos Gold Recovery Claims, 1986",
			type: "archival",
			confidence_weight: 30,
			excerpt:
				"Commission documents 172 alleged cache sites across Luzon. Physical evidence of excavation found at 12 sites. No verified recoveries confirmed by independent parties.",
		},
	],
	"Merchant Royal": [
		{
			title: "Calendar of State Papers — Loss of the Merchant Royal, 1641",
			type: "archival",
			confidence_weight: 82,
			excerpt:
				"Secretary of State correspondence confirms cargo of 500 tons silver, 400k pieces of eight, 100k doubloons loaded at Havana. Ship lost in storm off Land's End, 11 September 1641.",
		},
		{
			title:
				"Historic England — Maritime Archaeology Atlas, Western Approaches",
			type: "survey",
			confidence_weight: 58,
			excerpt:
				"AUV survey tracks from 2019 expedition cover 340km² at 180–220m depth. No high-confidence anomalies detected. Drift modelling suggests wreck lies 15–40km SW of Scilly Isles.",
		},
	],
	"Lost Amazon Cities": [
		{
			title: "Science — Widespread Pre-Columbian Settlement in Amazonia, 2022",
			url: "https://science.org",
			type: "archival",
			confidence_weight: 72,
			excerpt:
				"LiDAR surveys reveal 24 previously unknown urban settlements in Upper Amazon basin. Network of roads, canals, and agricultural terraces covering 4,500km². High media value.",
		},
	],
	"Copper Scroll Treasures": [
		{
			title: "Dead Sea Scrolls — 3Q15 (Copper Scroll) Transcription",
			type: "archival",
			confidence_weight: 65,
			excerpt:
				"64 cache locations described using first-century topographic references. Estimated 65 tons gold, 200 tons silver. Decipherment by Allegro (1960) and Lefkovits (2000) give partially overlapping site lists.",
		},
		{
			title: "GPR Feasibility Study — Jordan Valley Survey Permitting, 2023",
			type: "survey",
			confidence_weight: 40,
			excerpt:
				"Non-invasive GPR surveys permitted under Jordan Antiquities Authority framework. Israeli side requires separate IAA permit. Political coordination is primary bottleneck.",
		},
	],
};

const DEMO_NOTES: Record<TargetName, string[]> = {
	"1715 Spanish Treasure Fleet": [
		"Spoke with FL Division of Historical Resources (Feb 2026) — drone mag surveys explicitly permitted under the existing lease. No additional permit required below 1m disturbance.",
		"Key contact: Bill Bartlett, Key West Maritime Heritage Society. Willing to co-operate on logistics and provide historical chart overlays from the Fisher family collection.",
	],
	"English Farmland Hoards": [
		"PAS East Anglia database cross-referenced with Roman road network. Three high-priority parishes identified: Hoxne (Suffolk), Thetford (Norfolk), Water Newton (Cambridgeshire).",
	],
	"American West Caches": [
		"BLM casual use rules confirmed via phone — GPR drone at <1m altitude with no surface contact qualifies. File a Notice of Intent for any site revisit exceeding 3 days.",
	],
	"Bahamas / FL Keys Wrecks": [],
	"Great Lakes Shipwrecks": [
		"NOAA Thunder Bay Sanctuary requires 30-day advance notice for ROV operations. Research permit application takes ~6 weeks. Recreational dive charters can provide topside support at low cost.",
	],
	"NC WWII Merchant Wrecks": [
		"Admiralty claims require federal court arrest in 4th Circuit. Precedent strongly favours finder. Engage maritime counsel before first ROV contact with any wreck.",
	],
	"San José Galleon": [
		"All private access is blocked until the Colombia/Spain/Qhara Qhara dispute resolves. Monitor for government JV RFP — Colombia has signalled openness to private salvage partner by 2027.",
	],
	"Flor de la Mar": [
		"Primary blocker is dual jurisdiction (Malaysia + Indonesia). Both countries must sign any salvage agreement. Malaysia more receptive historically — approach via SAMA (Salvage Association of Malaysia).",
	],
	"SS Central America (remaining)": [
		"Legal opinion from Blank Rome LLP (Jan 2026): finder's rights remain fully intact post-Thompson settlement. No adverse claims active. ROV access is the only remaining barrier.",
	],
	"Yamashita's Gold": [
		"Consensus among academic historians leans toward legend status. However, GPR drone sweep of 5 highest-probability Luzon sites could definitively validate or eliminate within 2 weeks at low cost. Worth running as a Tier 4 speculative survey.",
	],
	"Merchant Royal": [
		"Drift modelling from 1641 storm track (SSW Force 9) places wreck probability centroid at 49.7°N, 6.2°W. AUV SAS survey of 500km² at this centroid would be definitive.",
	],
	"Lost Amazon Cities": [
		"Strong documentary angle — National Geographic has expressed interest in co-production. Academic partnership with University of São Paulo is the legal path for any survey in Brazil.",
	],
	"Copper Scroll Treasures": [
		"GPR-only validation study is politically feasible and scientifically defensible. Recovery is not the near-term goal — map the sites and establish chain of custody for future access.",
	],
};

const [{ sourceTotal }] = db
	.select({ sourceTotal: count() })
	.from(sources)
	.all();

if (sourceTotal === 0) {
	const allTargets = db.select().from(targets).all();
	const targetsByName = new Map(allTargets.map((t) => [t.name, t.id]));

	for (const [name, srcs] of Object.entries(DEMO_SOURCES)) {
		const tid = targetsByName.get(name);
		if (!tid) continue;
		for (const s of srcs) {
			db.insert(sources)
				.values({ target_id: tid, ...s })
				.run();
		}
	}

	for (const [name, noteTexts] of Object.entries(DEMO_NOTES)) {
		const tid = targetsByName.get(name);
		if (!tid) continue;
		for (const content of noteTexts) {
			db.insert(notes).values({ target_id: tid, content }).run();
		}
	}
}

// ─── Targets ──────────────────────────────────────────────────────────────────

export function getAllTargets(): Target[] {
	return db.select().from(targets).orderBy(desc(targets.score)).all();
}

export function getTarget(id: number): Target | null {
	return db.select().from(targets).where(eq(targets.id, id)).get() ?? null;
}

export function updateScores(id: number, factors: ScoreFactors): void {
	db.update(targets)
		.set({ ...factors, score: computeScore(factors) })
		.where(eq(targets.id, id))
		.run();
}

export function updateStatus(id: number, status: Target["status"]): void {
	db.update(targets).set({ status }).where(eq(targets.id, id)).run();
}

// ─── Sources ──────────────────────────────────────────────────────────────────

export function getSourcesForTarget(targetId: number): Source[] {
	return db
		.select()
		.from(sources)
		.where(eq(sources.target_id, targetId))
		.orderBy(desc(sources.created_at))
		.all();
}

export function addSource(data: {
	target_id: number;
	title: string;
	url?: string | null;
	type: "archival" | "sonar" | "survey" | "imagery";
	confidence_weight: number;
	excerpt?: string | null;
}): void {
	db.insert(sources).values(data).run();
}

export function deleteSource(id: number): void {
	db.delete(sources).where(eq(sources.id, id)).run();
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function getNotesForTarget(targetId: number): Note[] {
	return db
		.select()
		.from(notes)
		.where(eq(notes.target_id, targetId))
		.orderBy(desc(notes.created_at))
		.all();
}

export function addNote(targetId: number, content: string): void {
	db.insert(notes).values({ target_id: targetId, content }).run();
}

export function deleteNote(id: number): void {
	db.delete(notes).where(eq(notes.id, id)).run();
}
