import { Database } from "bun:sqlite";
import { count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { expeditions, notes, sources, targets } from "./schema.js";
import { computeScore, type ScoreFactors } from "./scoring.js";

export type Target = typeof targets.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Expedition = typeof expeditions.$inferSelect;
export type NewTarget = typeof targets.$inferInsert;

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
		status: "complete",
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
	{
		name: "Cape of Good Hope VOC Wrecks",
		description:
			"Dozens of Portuguese and Dutch East India Company ships lost rounding the Cape of Storms, many carrying silver, spice, and gold cargoes. Dutch VOC records in the Nationaal Archief (The Hague) document cargo manifests precisely. Shallow coastal depths make AUV survey extremely cost-effective. SAHRA permit framework is established and has precedent of successful private partnerships.",
		lat: -34.36,
		lng: 18.47,
		tier: 2,
		est_value_usd: 5_000_000,
		legal_framework:
			"South African Heritage Resources Agency (SAHRA) — permit required, government share negotiable",
		depth_m: 20,
		status: "research",
		historical_confidence: 80,
		value_score: 65,
		location_precision: 72,
		legal_feasibility: 75,
		recovery_ease: 70,
		sensor_validation: 15,
	},
	{
		name: "Kolchak's Gold — Baikal Lead",
		description:
			"In August 2010 the Mir-2 submersible (the same vessel used on the Titanic) descended to ~400m near km 81 of the Circum-Baikal Railway and found 4 bars with a 'characteristic golden shine' wedged in scree near Cape Tolstoy. The manipulator arm could not retrieve them due to unstable substrate. Coordinates were recorded but never publicly released. Train wreckage was separately confirmed in the same area in 2009. The Circum-Baikal Railway runs along a steep, tunnel-riddled shoreline — a derailment scenario is physically plausible. This is the strongest unresolved physical lead in the entire Kolchak file, and has never been followed up.",
		lat: 51.77,
		lng: 103.85,
		tier: 3,
		est_value_usd: 200_000_000,
		legal_framework:
			"Russian cultural heritage law — Russian government partnership mandatory",
		depth_m: 400,
		status: "research",
		historical_confidence: 45,
		value_score: 60,
		location_precision: 55,
		legal_feasibility: 22,
		recovery_ease: 20,
		sensor_validation: 40,
	},
	{
		name: "Kolchak's Gold — Taiga Station Cache",
		description:
			"Estonian soldier Karl Purrok, serving in the 21st Regiment of Kolchak's Siberian Army, testified that in late October 1919 his unit buried 26 boxes of gold coins approximately 5km from Taiga station (Kemerovo Oblast) at a depth of 2–2.5 metres. The NKVD took this seriously enough to fly Purrok from occupied Estonia to Siberia in 1941 and conduct repeated excavations — they found nothing. However 1941 surveying was primitive, terrain had changed over 20 years, and the NKVD may simply have been searching in the wrong spot. This is the most actionable terrestrial lead in the Kolchak file and has never been attempted with modern GPR equipment. Estimated cache weight: ~1–2 metric tons of gold coins.",
		lat: 56.07,
		lng: 85.61,
		tier: 4,
		est_value_usd: 80_000_000,
		legal_framework:
			"Russian cultural heritage law — Russian government partnership mandatory",
		depth_m: null,
		status: "research",
		historical_confidence: 48,
		value_score: 45,
		location_precision: 42,
		legal_feasibility: 25,
		recovery_ease: 65,
		sensor_validation: 0,
	},
	{
		name: "Kolchak's Gold — Czech Legion / Legiobanka",
		description:
			"The Czechoslovak Legion guarded Kolchak's gold train across Siberia in 1919 and negotiated its handover to the Bolsheviks in exchange for safe passage home. Kolchak's Finance Minister accused the Czechs of removing at least 63 million rubles (one full boxcar) before the handover. That same year the Legion founded the Bank of Czechoslovak Legions (Legiobanka) in Irkutsk, capitalised with funds accumulated in Siberia — its Prague headquarters building still stands. Czech historians attribute the capital to three years of Siberian trading operations; Russian historians allege direct theft of tsarist gold. The Vojenský historický archiv (VHA) in Prague holds the complete Legion fonds, including financial records, that have never been cross-referenced against the Soviet June 1921 audit. Primary value for Ditis: an archival intelligence sprint that could resolve the Czech angle definitively and may identify further physical leads.",
		lat: 50.09,
		lng: 14.45,
		tier: 4,
		est_value_usd: 500_000_000,
		legal_framework:
			"Czech Republic — voluntary archival access; no salvage law applies",
		depth_m: null,
		status: "research",
		historical_confidence: 52,
		value_score: 55,
		location_precision: 20,
		legal_feasibility: 70,
		recovery_ease: 50,
		sensor_validation: 0,
	},
	{
		name: "Kublai Khan's Mongol Invasion Fleets",
		description:
			"Two massive Mongol fleets sent to invade Japan — ~900 ships in 1274 and ~4,400 ships in 1281 — were destroyed by typhoons (the 'divine winds', kamikaze) in Imari Bay and the Korea Strait. Exceptionally well-documented in Chinese, Korean, and Japanese records. Active archaeological work by Kyushu University has located some vessels; the vast majority of the wreck field remains unexcavated. Multibeam and SAS survey offers decisive advantage.",
		lat: 33.5,
		lng: 129.9,
		tier: 4,
		est_value_usd: 500_000_000,
		legal_framework:
			"Japanese Agency for Cultural Affairs — permit required; academic partnership expected",
		depth_m: 25,
		status: "research",
		historical_confidence: 85,
		value_score: 70,
		location_precision: 65,
		legal_feasibility: 50,
		recovery_ease: 55,
		sensor_validation: 35,
	},
	{
		name: "Ganj-i-Sawai",
		description:
			"The largest Mughal treasure ship ever recorded, looted in 1695 by English pirate Henry Every in the most valuable piracy act of the age. Cargo records survive in East India Company archives at the British Library. The ship was not sunk during the attack; its fate after Every's raid is unresolved — candidate locations range from the Gujarat coast to the Gulf of Khambhat. An archival research sprint could significantly constrain the search box.",
		lat: 21.5,
		lng: 72.5,
		tier: 4,
		est_value_usd: 400_000_000,
		legal_framework:
			"Archaeological Survey of India (ASI) — state ownership of all underwater cultural heritage",
		depth_m: null,
		status: "research",
		historical_confidence: 72,
		value_score: 78,
		location_precision: 45,
		legal_feasibility: 45,
		recovery_ease: 65,
		sensor_validation: 0,
	},
	{
		name: "Black Sea Anaerobic Wrecks",
		description:
			"The anoxic layer below ~150m in the Black Sea preserves organic materials — wood, rope, leather, cargo — with extraordinary fidelity due to the absence of oxygen and wood-boring organisms. Robert Ballard's 2000 expedition found Byzantine and Ottoman ships with hulls, masts, and rigging intact. The Black Sea Maritime Archaeology Project (2016–2018) documented 65 wrecks. This environment represents a unique preservation window with exceptional media and academic IP value.",
		lat: 43.0,
		lng: 33.0,
		tier: 4,
		est_value_usd: 200_000_000,
		legal_framework:
			"Turkish, Bulgarian, and Romanian EEZ jurisdiction depending on location — bilateral agreements required",
		depth_m: 300,
		status: "research",
		historical_confidence: 70,
		value_score: 55,
		location_precision: 60,
		legal_feasibility: 55,
		recovery_ease: 38,
		sensor_validation: 40,
	},
	{
		name: "Swahili Coast Trade Wrecks",
		description:
			"A 1,000-year corridor of Arab, Indian, and Portuguese merchant trade along the East African coast (Kenya, Tanzania, Mozambique) has left a largely unsurveyed wreck field. Portuguese Estado da India records and Arab navigational manuscripts document dozens of losses. The seafloor along this route is almost entirely uncharted below recreational dive depths. Tanzanian and Kenyan permit frameworks exist and have been used by academic expeditions.",
		lat: -5.0,
		lng: 40.0,
		tier: 4,
		est_value_usd: 150_000_000,
		legal_framework:
			"Tanzanian Antiquities Division / Kenya National Museums — government partnership required",
		depth_m: 40,
		status: "research",
		historical_confidence: 60,
		value_score: 50,
		location_precision: 45,
		legal_feasibility: 55,
		recovery_ease: 65,
		sensor_validation: 5,
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
	"Cape of Good Hope VOC Wrecks": [
		{
			title: "Nationaal Archief (The Hague) — VOC Boekhouder-Generaal Registers",
			type: "archival",
			confidence_weight: 85,
			excerpt:
				"58 VOC vessels recorded as lost rounding the Cape between 1600 and 1795. Cargo manifests survive for 41. Silver, specie, and spice cargoes dominate. Key losses include the Campen (1647), Oosterland (1697), and Meermin (1766).",
		},
		{
			title: "SAHRA Maritime Heritage Register — Cape Peninsula Survey, 2021",
			type: "survey",
			confidence_weight: 72,
			excerpt:
				"SAHRA register documents 26 confirmed wreck sites in the Cape Peninsula MPA. 14 have partial cargo surveys. Drone-based side-scan survey of the remaining search area estimated at 120km².",
		},
	],
	"Kolchak's Gold — Baikal Lead": [
		{
			title: "Mir-2 Expedition Report — Circum-Baikal Railway, km 81, August 2010",
			type: "survey",
			confidence_weight: 72,
			excerpt:
				"Mir-2 submersible descended to ~400m near Cape Tolstoy. Four bars with characteristic golden shine observed wedged in scree crevasse. Manipulator arm unable to retrieve due to substrate instability. Exact coordinates recorded by expedition team. Train wreckage and ammunition boxes confirmed in same zone from 2009 survey.",
		},
		{
			title: "Smele, J.D. — White Gold: The Imperial Russian Gold Reserve in the Anti-Bolshevik East, 1918–? (Europe-Asia Studies, 1994)",
			type: "archival",
			confidence_weight: 85,
			excerpt:
				"Definitive English-language accounting of the reserve. Starting amount at Omsk (May 1919): ~645M gold rubles (~490 metric tons). Amount returned to Bolsheviks (Kazan, May 1920): 409.6M rubles. Gap: ~235M rubles, substantially explained by documented arms purchases and foreign bank deposits.",
		},
	],
	"Kolchak's Gold — Taiga Station Cache": [
		{
			title: "NKVD Operational File — Purrok Testimony and Taiga Station Excavations, 1941",
			type: "survey",
			confidence_weight: 58,
			excerpt:
				"Karl Purrok, Estonian national and former soldier of Kolchak's 21st Regiment, testified to burying 26 boxes of gold coins at ~2m depth approximately 5 versts from Taiga station, October 1919. NKVD transported Purrok to Siberia for excavation guidance. Multiple digs conducted; nothing recovered. Operation abandoned. Failure attributed to terrain change over 20 years and possible location imprecision.",
		},
		{
			title: "Soviet People's Commissariat of Finance — Gold Reserve Certificate, June 1921",
			type: "archival",
			confidence_weight: 90,
			excerpt:
				"Official Soviet accounting concludes 235.6 million rubles (~182 metric tons) of the reserve was expended or disappeared under Kolchak's administration. Formal receipt of 409,626,103 gold rubles (19,437 poods) confirmed at Kazan, 7 May 1920.",
		},
	],
	"Kolchak's Gold — Czech Legion / Legiobanka": [
		{
			title: "Vojenský historický archiv (VHA), Praha — Czechoslovak Legion in Russia Fonds, 1914–1939",
			type: "archival",
			confidence_weight: 70,
			excerpt:
				"Complete operational and financial records of the Czechoslovak Legion in Russia held at the Military Historical Archive, Praha 8–Karlín. Includes armistice documents signed at Nizhneudinsk (January 1920), gold train handover protocols, and financial ledgers of the Legion's commercial operations in Siberia 1918–1920. Legion financial records have not been cross-referenced against the Soviet June 1921 audit.",
		},
		{
			title: "Library of Congress — Tellberg Collection: Kolchak Interrogation Transcript, 1920",
			url: "https://www.loc.gov/loc/lcib/9603/kolchak.html",
			type: "archival",
			confidence_weight: 82,
			excerpt:
				"262-page stenographic transcript of Kolchak's interrogation by the Irkutsk Extraordinary Commission, January–February 1920 (donated by George Tellberg, 1943). Kolchak's testimony on gold train disposition, Czech Legion conduct at Nizhneudinsk, and amounts transferred. Primary source for Kolchak's own account of the handover.",
		},
		{
			title: "Radio Prague International — The Czechoslovak Legions: Myth, Reality, Gold and Glory",
			url: "https://english.radio.cz/czechoslovak-legions-myth-reality-gold-and-glory-8571034",
			type: "archival",
			confidence_weight: 62,
			excerpt:
				"Professor Ivan Šedivý (Charles University): 'Nowadays we can read in many Russian newspapers that this gold was stolen by Czechoslovakia. To tell the truth, there is no evidence it was so. On the other hand no one can argue it was not.' Legiobanka founding capital attributed to three years of Siberian commercial operations, not direct theft — but documentary proof either way is absent.",
		},
	],
	"Kublai Khan's Mongol Invasion Fleets": [
		{
			title: "Yuanshi (元史) — Official History of the Yuan Dynasty, 1370",
			type: "archival",
			confidence_weight: 85,
			excerpt:
				"Yuan dynastic history records 1281 Eastern Route Fleet of 900 vessels and Southern Route Fleet of 3,500 vessels. Combined force destroyed by typhoon ('kamikaze') in eighth month of Zhiyuan 18. Fleet composition and armament documented in detail.",
		},
		{
			title: "Kyushu University — Takashima Underwater Archaeology Survey, 2011–2019",
			type: "survey",
			confidence_weight: 78,
			excerpt:
				"Systematic survey of Imari Bay seabed recovered 3,000+ artefacts including weapons, anchors, and personal effects. Bronze seal of a Yuan commander recovered 2011. Estimated <5% of debris field systematically surveyed.",
		},
	],
	"Ganj-i-Sawai": [
		{
			title: "British Library — East India Company Factory Records, Surat, 1695",
			type: "archival",
			confidence_weight: 78,
			excerpt:
				"EIC factors at Surat record the attack on the Ganj-i-Sawai by Henry Every's fleet in August 1695. Cargo described as 'treasure of inestimable value' including 500,000 gold and silver pieces, gems, and 600 pilgrims. Ship survived the attack but fate thereafter unrecorded.",
		},
		{
			title: "Calendar of State Papers — Every Piracy Investigation, 1696",
			type: "archival",
			confidence_weight: 65,
			excerpt:
				"Privy Council records document recovered loot from Every's crew arrests in Ireland and Nassau. Recovered fraction implies the bulk of the Ganj-i-Sawai cargo was not brought to Europe — consistent with disposal at sea or in Gujarat.",
		},
	],
	"Black Sea Anaerobic Wrecks": [
		{
			title: "Black Sea MAP — ERC Project Final Report, 2016–2018",
			type: "survey",
			confidence_weight: 82,
			excerpt:
				"Black Sea Maritime Archaeology Project documented 65 shipwrecks using AUV survey at depths of 70–2,200m. 41 wrecks in anoxic layer (>150m) showed extraordinary organic preservation including intact rigging, rudders, and cargo amphorae. Byzantine to Ottoman period represented.",
		},
		{
			title: "Ballard, R. et al. — Deep Black Sea Archaeology (National Geographic, 2001)",
			type: "survey",
			confidence_weight: 72,
			excerpt:
				"ROV survey confirms absence of wood-boring organisms below 150m. Two Byzantine vessels photographed with hull planking, masts, and cargo pots intact after 1,000+ years. Estimated hundreds of similar wrecks remain unsurveyed.",
		},
	],
	"Swahili Coast Trade Wrecks": [
		{
			title: "Arquivo Histórico Ultramarino (Lisbon) — Estado da India Loss Records",
			type: "archival",
			confidence_weight: 65,
			excerpt:
				"Portuguese imperial archive documents 34 vessel losses along the East African coast 1498–1750. Cargo manifests for 18 survive. Key losses include the São João (1552, Natal coast) and Santo Alberto (1593, Mozambique). Search areas constrained to ±50km.",
		},
		{
			title: "National Museums of Kenya — Coastal Underwater Heritage Survey, 2019",
			type: "survey",
			confidence_weight: 52,
			excerpt:
				"Reconnaissance survey of Mombasa Old Port environs identified 7 anomalies consistent with pre-colonial vessel remains at 10–30m depth. Full systematic survey not yet conducted.",
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
	"Cape of Good Hope VOC Wrecks": [
		"VOC archival records in The Hague are extensively digitised — Ditis Core ingest pipeline can be pointed directly at the Nationaal Archief online portal. This is an immediate quick-win for the data lake.",
		"SAHRA has previously licensed recovery operations to private entities (e.g., Iziko Museums partnerships). Approach via Cape Town-based maritime law firm to establish local counsel before permit application.",
	],
	"Kolchak's Gold — Baikal Lead": [
		"The 2010 Mir-2 objects are the most important unresolved physical lead. The expedition team recorded exact coordinates — these may be obtainable via the Russian Geographic Society or Institute of Oceanology (RAS), which operated the Mir submersibles. Establishing contact with the expedition scientists is step one before any operational planning.",
		"The Circum-Baikal Railway at km 81 sits within Russian federal territory. Any AUV or ROV operation requires a research permit from the Russian Ministry of Natural Resources. A JV with the Limnological Institute of the Russian Academy of Sciences in Irkutsk is the most credible access route.",
		"Depth ~400m is within the operational envelope of the REMUS 600 AUV. The main challenge is substrate instability — the 2010 Mir-2 manipulator confirmed the scree shifts. A suction dredge-equipped ROV would be needed for any retrieval attempt.",
	],
	"Kolchak's Gold — Taiga Station Cache": [
		"The NKVD's 1941 failure does not eliminate this lead — their excavation technology was pick-and-shovel, and 20-year terrain drift in a forested/agricultural zone near a railway could easily displace reference points by hundreds of metres. A systematic GPR drone sweep of a 5km radius from Taiga station is technically straightforward and inexpensive relative to any marine operation.",
		"The 21st Regiment's retreat route in late October 1919 is documented in White Army operational records. Cross-referencing the regiment's known position on 28–31 October 1919 against modern satellite terrain data could significantly narrow the search radius before any physical survey.",
		"Taiga is a small town with active farming and forestry. Any surface survey requires landowner coordination and a Russian FSB notification — GPR drone surveys of this type are not prohibited but require advance filing.",
	],
	"Kolchak's Gold — Czech Legion / Legiobanka": [
		"Priority archival task: obtain the VHA Praha Legion financial ledgers (Fond: Czechoslovak Legion in Russia) and cross-reference all gold-denominated transactions against the Soviet Commissariat of Finance June 1921 certificate. The delta would either confirm or refute the theft hypothesis.",
		"The Legiobanka building at Na Poříčí 24, Prague 1 is now a Czech savings bank branch. Corporate records of the original Legiobanka (1919–1948, when it was nationalised) were transferred to the Czech National Archives (Národní archiv) — this is a second archival target.",
		"A telegram referencing 'a gold cargo, ostensibly for medical use' transported through Trieste to Czechoslovakia has been cited in Czech historiography but the exact archive location has not been published. The VHA Praha search should specifically target 1920 Legion transport manifests through Vladivostok and the Trans-Siberian exit corridor.",
	],
	"Kublai Khan's Mongol Invasion Fleets": [
		"Kyushu University's Takashima surveys are the authoritative baseline. Contact Prof. Yoshifumi Ikeda's lab for academic partnership discussion — a JV with a Japanese institution is the only viable legal path.",
		"The 1281 fleet is the higher-value target: it was larger, better-equipped, and the typhoon destruction was more sudden. The 1274 fleet had more time to offload before sinking.",
	],
	"Ganj-i-Sawai": [
		"Key archival sprint: digitise and NLP-process the EIC Surat factory records at the British Library (IOR/G/36 series). Every's crew member confessions from the 1696 trials may contain location clues not yet cross-referenced with coastal charts.",
		"ASI underwater cultural heritage framework is complex — engage a Mumbai-based maritime lawyer experienced with ASI permitting before any survey planning.",
	],
	"Black Sea Anaerobic Wrecks": [
		"The Black Sea MAP consortium (University of Southampton) holds the most complete wreck database. Approach for data-sharing agreement or formal partnership — they have the academic credibility, we bring operational and sensing capability.",
		"Turkish EEZ covers the most promising deep-water zone. Turkish Cultural Ministry has an established permit process for foreign research vessels; advance notice period is 6 months.",
	],
	"Swahili Coast Trade Wrecks": [
		"The Arquivo Histórico Ultramarino (Lisbon) has digitised a substantial fraction of the Estado da India records. Cross-referencing these with the Admiralty charts held at the UK Hydrographic Office would significantly constrain search areas.",
		"Tanzania Antiquities Division has been receptive to academic partnerships — approach via the Institute of Maritime Studies at the University of Dar es Salaam as local academic partner.",
	],
};

const DEMO_EXPEDITIONS: {
	target_name: TargetName;
	name: string;
	stage: "research" | "survey" | "validation" | "recovery";
	status: "planned" | "active" | "complete" | "cancelled";
	budget_usd?: number;
	team?: string;
	start_date?: string;
	end_date?: string;
	notes?: string;
}[] = [
	{
		target_name: "1715 Spanish Treasure Fleet",
		name: "FL Lease Survey — Phase 1",
		stage: "survey",
		status: "complete",
		budget_usd: 45000,
		team: "P. Nagel (lead), T. Fischer (AUV), C. Walker (marine arch.)",
		start_date: "2026-10-01",
		end_date: "2026-10-14",
		notes:
			"14-day AUV magnetometer sweep of northern search corridor (Wabasso to Sebastian Inlet). Primary goal: systematic coverage of unswept 40% of debris field. Secondary: establish baseline for permit renewal in Dec 2027.",
	},
	{
		target_name: "1715 Spanish Treasure Fleet",
		name: "FL Lease Recovery — Phase 1",
		stage: "recovery",
		status: "complete",
		budget_usd: 38000,
		team: "P. Nagel (lead), T. Fischer (AUV), C. Walker (marine arch.)",
		start_date: "2026-10-01",
		end_date: "2026-10-14",
		notes:
			"Recovered 23 silver reales and 4 gold escudos from northern corridor. Systematic mag coverage complete. Permit renewed through Dec 2028.",
	},
	{
		target_name: "English Farmland Hoards",
		name: "East Anglia Drone Survey — Hoxne Parish",
		stage: "survey",
		status: "planned",
		budget_usd: 12000,
		team: "P. Nagel (lead), R. Hughes (drone operator)",
		start_date: "2026-11-15",
		end_date: "2026-11-22",
		notes:
			"GPR drone sweep of the three highest-priority parcels in Hoxne parish identified via PAS cross-reference. Landowner agreements in progress.",
	},
];

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

const [{ expTotal }] = db.select({ expTotal: count() }).from(expeditions).all();

if (expTotal === 0) {
	const allTargets = db.select().from(targets).all();
	const targetsByName = new Map(allTargets.map((t) => [t.name, t.id]));
	for (const { target_name, ...exp } of DEMO_EXPEDITIONS) {
		const tid = targetsByName.get(target_name);
		if (!tid) continue;
		db.insert(expeditions)
			.values({ target_id: tid, ...exp })
			.run();
	}
}

// ─── Targets ──────────────────────────────────────────────────────────────────

export function getAllTargets(): Target[] {
	return db.select().from(targets).orderBy(desc(targets.score)).all();
}

export function getTarget(id: number): Target | null {
	return db.select().from(targets).where(eq(targets.id, id)).get() ?? null;
}

export function deleteTarget(id: number): void {
	db.delete(expeditions).where(eq(expeditions.target_id, id)).run();
	db.delete(notes).where(eq(notes.target_id, id)).run();
	db.delete(sources).where(eq(sources.target_id, id)).run();
	db.delete(targets).where(eq(targets.id, id)).run();
}

export function addTarget(data: Omit<NewTarget, "id" | "score">): Target {
	const score = computeScore(data as ScoreFactors);
	return db
		.insert(targets)
		.values({ ...data, score })
		.returning()
		.get();
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

export function recalcHistoricalConfidence(targetId: number): void {
	const rows = db
		.select({ w: sources.confidence_weight })
		.from(sources)
		.where(eq(sources.target_id, targetId))
		.all();
	if (rows.length === 0) return;
	const avg = Math.round(rows.reduce((s, r) => s + r.w, 0) / rows.length);
	const target = db
		.select()
		.from(targets)
		.where(eq(targets.id, targetId))
		.get();
	if (!target) return;
	db.update(targets)
		.set({
			historical_confidence: avg,
			score: computeScore({ ...target, historical_confidence: avg }),
		})
		.where(eq(targets.id, targetId))
		.run();
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
	recalcHistoricalConfidence(data.target_id);
}

export function deleteSource(id: number): void {
	const src = db
		.select({ target_id: sources.target_id })
		.from(sources)
		.where(eq(sources.id, id))
		.get();
	db.delete(sources).where(eq(sources.id, id)).run();
	if (src) recalcHistoricalConfidence(src.target_id);
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

// ─── Expeditions ──────────────────────────────────────────────────────────────

export function getAllExpeditions(): Expedition[] {
	return db.select().from(expeditions).all();
}

export function getExpeditionsForTarget(targetId: number): Expedition[] {
	return db
		.select()
		.from(expeditions)
		.where(eq(expeditions.target_id, targetId))
		.orderBy(desc(expeditions.created_at))
		.all();
}

export function addExpedition(
	data: Omit<typeof expeditions.$inferInsert, "id" | "created_at">,
): Expedition {
	return db.insert(expeditions).values(data).returning().get();
}

export function deleteExpedition(id: number): void {
	db.delete(expeditions).where(eq(expeditions.id, id)).run();
}
