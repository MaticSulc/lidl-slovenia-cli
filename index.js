const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
require('dotenv').config();

const STORE_CACHE_PATH = path.resolve(__dirname, 'stores.json');
const MAPS_HOST = process.env.MAPS_HOST;
const MAPS_API_KEY = process.env.MAPS_API_KEY;
const LIDL_STOCK_API = process.env.LIDL_STOCK_API;

if(!LIDL_STOCK_API) {
	console.error("❌ Missing environment variable: LIDL_STOCK_API");
	process.exit(1);
}

const icon_cypher = {
	"eCharger": "Electric Car Charger",
	"hotDrinks": "Hot Drinks",
	"garage": "Parking Garage",
	"freeWiFi": "Free Wi-Fi",
	"parking": "Parking",
	"disParking": "Disabled Parking",
};

async function askQuestion(query) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise(resolve => rl.question(query, ans => {
		rl.close();
		resolve(ans);
	}));
}

function parseServices(location) {
	const services = [];
	for (let i = 1; i <= 41; i++) {
		const iconKey = `INFOICON${i}`;
		if (location[iconKey]) {
			const name = icon_cypher[location[iconKey]];
			if (name) services.push(name);
			else services.push(location[iconKey]);
		}
	}
	return services;
}

async function fetchLidlStores() {

	if (!MAPS_HOST || !MAPS_API_KEY) {
		console.error("❌ Missing environment variables: MAPS_HOST or MAPS_API_KEY");
		process.exit(1);
	}

	const url = `${MAPS_HOST}?key=${MAPS_API_KEY}&$filter=Adresstyp%20eq%201&$format=json&$top=5000`;
	
	try {
		var response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
	} catch (error) {
 		console.error("❌ Failed to fetch Lidl stores:", error.message);
		process.exit(1);
	}
		
	
	const data = await response.json();
	const stores = data.d.results.map(s => ({
		id: s.EntityID,
		address: `${s.AddressLine}, ${s.PostalCode} ${s.Locality}`,
		postalCode: s.PostalCode,
		latitude: s.Latitude,
		longitude: s.Longitude,
		services: parseServices(s)
	}));
	fs.writeFileSync(STORE_CACHE_PATH, JSON.stringify(stores, null, 2));
	return stores;
}

function loadCachedStores() {
	if (fs.existsSync(STORE_CACHE_PATH)) {
		return JSON.parse(fs.readFileSync(STORE_CACHE_PATH, 'utf-8'));
	}
	return null;
}

async function fetchProductAvailability(productId, storeIds) {
	const url = `${LIDL_STOCK_API}${productId}?storeids=${storeIds}`;
	const response = await fetch(url);
	if (!response.ok) throw new Error("Failed to fetch product availability");
	return response.json();
}

async function findInStockStores(productId, stores) {
	console.log("\n🔍 Checking stock across stores...");
	const inStockStores = [];

	const storeIds = stores.map(store => store.id);
	const data = await fetchProductAvailability(productId, storeIds.join(','));


	if (!data || !Array.isArray(data) || data.length === 0) {
		console.log("❌ No stock data found for the given product.");
		return;
	}

	for (const stockInfo of data) {
		const store = stores.find(s => s.id === stockInfo.storeId);
		if (!store) continue; // Skip if store not found in cached list
		const status = stockInfo.storeAvailabilityIndicator;

		switch (status) {
			case 'AVAILABLE':
				console.log(`✅ In stock at ${store.address}`);
				inStockStores.push(store);
				break;
			case 'LOW_STOCK':
				console.log(`⚠️ Low stock at ${store.address}`);
				inStockStores.push(store);
				break;
			case 'UNKNOWN':
				console.log(`❓ Stock status unknown at ${store.address}`);
				break;
			default:
				console.log(`❌ Not in stock at ${store.address}`);
		}
	}

	console.log(`\n✅ Found ${inStockStores.length} stores with stock.`);
}

async function fetchProductVariants(productUrl) {
	const productId = productUrl.match(/p(\d+)/)?.[1];
	if (!productId) return null;

	const browser = await puppeteer.launch({ headless: 'new' });
	const page = await browser.newPage();
	await page.goto(productUrl, { waitUntil: 'networkidle2' });

	const variants = await page.evaluate((productId) => {
		const raw = window.__NUXT__.data[`&erp${productId}`]?.variants;
		if (!raw || typeof raw !== 'object') return [];
		const plain = Object.values(raw);
		return JSON.parse(JSON.stringify(plain));
	}, productId);

	const fullTitle = await page.evaluate((productId) => {
		return window.__NUXT__.data[`&erp${productId}`]?.keyfacts?.fullTitle || null;
	}, productId);

	await browser.close();
	return { productId, variants, fullTitle };
}

async function productSearchFlow() {
	const url = await askQuestion("🔗 Enter Lidl product URL: ");
	const result = await fetchProductVariants(url);

	if(!result || !result.fullTitle) {
		console.log("❌ Failed to fetch product data. Please check the URL.");
		return;
	}

	console.log(`\n🔍 Searching for product: ${result.fullTitle}`);

	if(result.variants && result.variants.length > 0) {
		console.log(`\n✅ Found ${result.variants.length} variants for this product.`);
		result.variants.forEach((v, i) => {
			console.log(`${i + 1}. ${v.fullTitle || v.productTitle || v.erpNumber} (ID: ${v.erpNumber || v.articleId})`);
		});

		const choice = await askQuestion("\n👉 Choose a variant number: ");
		var selected = result.variants[parseInt(choice) - 1];
		if (!selected) return console.log("❌ Invalid selection.");
	} 
	else {
		var selected = {
			erpNumber: result.productId,
			articleId: result.productId,
			fullTitle: result.fullTitle
		}
	}


	let stores = loadCachedStores();

	let filterPostcode = await askQuestion("🔍 Filter by postcode (press Enter to skip): ");

	while (filterPostcode && !/^\d{4}$/.test(filterPostcode)) {
		console.log("❌ Invalid postcode format. Please enter a 4-digit postcode.");
		filterPostcode = await askQuestion("🔍 Filter by postcode (press Enter to skip): ");
	}

	if (filterPostcode) {
		stores = stores.filter(store => store.postalCode.includes(filterPostcode));
		if (stores.length === 0) {
			console.log(`❌ No stores found for postcode ${filterPostcode}.`);
			return;
		}
	}

	if (!stores) {
		console.log("⚠️ Store list not cached, fetching now...");
		stores = await fetchLidlStores();
	}
	await findInStockStores(selected.erpNumber || selected.articleId, stores);
	
}

function listStores() {
	const stores = loadCachedStores();
	if (!stores || stores.length === 0) {
		console.log("❌ No cached store data found.");
		return;
	}

	const table = new Table({
		head: ['#', 'Address', 'ID', 'Coords', 'Services'],
		colWidths: [5, 40, 20, 25, 50],
		wordWrap: true,
		style: { head: ['cyan'] }
	});

	stores.forEach((store, index) => {
		const coords = `${store.latitude}, ${store.longitude}`;
		const services = store.services?.length ? store.services.join(', ') : '—';
		table.push([
			index + 1,
			store.address,
			store.id,
			coords,
			services
		]);
	});

	console.log(`\n📍 Total stores: ${stores.length}\n`);
	console.log(table.toString());
}


async function mainMenu() {
	console.log("\nWelcome to LIDL Product Stock CLI!");
	console.log("1. Check product availability");
	console.log("2. Update and list LIDL stores");
	console.log("3. Exit\n");

	const choice = await askQuestion("Select an option: ");
	if (choice === "1") {
		await productSearchFlow();
	} else if (choice === "2") {
		await fetchLidlStores();
		listStores();
	} else {
		console.log("👋 Bye!");
		process.exit(0);
	}

	mainMenu();
}

mainMenu();