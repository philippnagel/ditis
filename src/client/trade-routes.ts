export interface TradeRoute {
	name: string;
	era: string;
	path: [number, number][]; // [lng, lat]
	color: [number, number, number, number];
}

export const TRADE_ROUTES: TradeRoute[] = [
	{
		name: "Spanish Treasure Fleet (Flota)",
		era: "1565–1790",
		// Cartagena → Portobelo → Havana → Florida Straits → Bermuda → Azores → Cadiz
		path: [
			[-75.5, 10.4], // Cartagena
			[-79.6, 9.6], // Portobelo
			[-84.9, 9.9], // Costa Rica waypoint
			[-87.2, 13.7], // Gulf of Honduras
			[-84.1, 19.8], // Yucatan Channel
			[-82.4, 23.1], // Havana
			[-79.9, 25.7], // Florida Straits
			[-78.0, 26.5], // Bahama Channel
			[-75.5, 28.0], // Off Carolinas
			[-64.7, 32.3], // Bermuda
			[-44.0, 36.0], // Mid-Atlantic
			[-27.2, 38.5], // Azores
			[-13.5, 37.2], // Cape St Vincent
			[-6.3, 36.5], // Cadiz
		],
		color: [245, 158, 11, 160], // amber
	},
	{
		name: "New Spain Flota (Veracruz)",
		era: "1561–1789",
		// Cadiz → Canaries → Caribbean → Veracruz → Havana → (joins main flota)
		path: [
			[-6.3, 36.5], // Cadiz
			[-15.4, 28.1], // Canaries
			[-61.0, 13.2], // Lesser Antilles
			[-72.3, 19.7], // Hispaniola
			[-84.1, 19.8], // Yucatan Channel
			[-96.1, 19.2], // Veracruz
		],
		color: [245, 158, 11, 100], // amber lighter
	},
	{
		name: "Manila Galleon (outbound)",
		era: "1565–1815",
		// Acapulco → North Pacific → Manila
		path: [
			[-99.9, 16.8], // Acapulco
			[-118.0, 24.0], // Baja waypoint
			[-138.0, 32.0], // North Pacific drift
			[-165.0, 38.0], // Mid-Pacific
			[175.0, 40.0], // Date Line
			[152.0, 35.0], // Japan Current
			[130.0, 25.0], // Approaching Philippines
			[120.9, 14.6], // Manila
		],
		color: [16, 185, 129, 160], // emerald
	},
	{
		name: "Manila Galleon (return)",
		era: "1565–1815",
		// Manila → Guam → South Pacific → Acapulco
		path: [
			[120.9, 14.6], // Manila
			[117.0, 10.0], // South China Sea
			[130.0, 8.0], // Mindanao
			[144.7, 13.5], // Guam
			[175.0, 13.0], // Western Pacific
			[-160.0, 12.0], // Central Pacific
			[-130.0, 14.0], // Eastern Pacific
			[-104.0, 15.5], // Approaching Mexico
			[-99.9, 16.8], // Acapulco
		],
		color: [16, 185, 129, 100], // emerald lighter
	},
	{
		name: "Portuguese Carreira da India",
		era: "1498–1663",
		// Lisbon → Cape Verde → Cape of Good Hope → Goa → Malacca
		path: [
			[-9.1, 38.7], // Lisbon
			[-15.4, 28.1], // Canaries
			[-23.5, 15.1], // Cape Verde
			[-28.0, 0.0], // Equator crossing
			[3.0, -18.0], // South Atlantic
			[18.5, -34.4], // Cape of Good Hope
			[35.0, -25.0], // Mozambique Channel south
			[40.7, -15.0], // Mozambique
			[44.0, -11.0], // Comoros
			[60.0, 8.0], // Arabian Sea
			[73.8, 15.5], // Goa
			[80.0, 8.0], // Sri Lanka
			[102.2, 2.2], // Malacca
		],
		color: [99, 102, 241, 160], // indigo
	},
	{
		name: "Dutch/English East India",
		era: "1600–1800",
		// Amsterdam → Cape Verde → Cape of Good Hope → Batavia
		path: [
			[4.9, 52.4], // Amsterdam
			[-4.0, 47.0], // Biscay
			[-9.0, 38.7], // Lisbon
			[-16.9, 32.6], // Madeira
			[-23.5, 15.1], // Cape Verde
			[-5.0, -10.0], // Gulf of Guinea
			[5.0, -20.0], // South Atlantic
			[18.5, -34.4], // Cape of Good Hope
			[55.0, -20.0], // Mascarene Islands
			[73.0, -8.0], // Indian Ocean
			[95.0, 5.0], // Sumatra approach
			[106.8, -6.2], // Batavia (Jakarta)
		],
		color: [239, 68, 68, 140], // red
	},
];
