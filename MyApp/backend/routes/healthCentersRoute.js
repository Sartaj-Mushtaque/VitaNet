import express from "express";
import https from "https";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ==================== SIMPLE CACHE ====================
const cache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (latitude, longitude, type) => {
  const lat = parseFloat(latitude).toFixed(2);
  const lng = parseFloat(longitude).toFixed(2);
  return `${lat}_${lng}_${type}`;
};

// ==================== DELAY HELPER ====================
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==================== FETCH FROM OSM ====================
const fetchFromOSM = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "VitaNet/1.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            if (data.trim().startsWith("<")) {
              console.error("OSM returned XML — rate limited");
              resolve(null); // null means rate limited
              return;
            }
            resolve(JSON.parse(data));
          } catch (e) {
            console.error("Parse error:", e.message);
            resolve(null);
          }
        });
      })
      .on("error", (err) => {
        console.error("HTTPS error:", err);
        resolve(null);
      });
  });
};

// ==================== FETCH WITH FALLBACK ====================
const servers = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const fetchWithFallback = async (query) => {
  const encodedQuery = encodeURIComponent(query);

  for (const server of servers) {
    console.log("Trying:", server);
    const url = `${server}?data=${encodedQuery}`;
    const data = await fetchFromOSM(url);

    if (data !== null) {
      return data; // success
    }

    // Rate limited — wait before trying next server
    console.log("Rate limited, waiting 2s before next server...");
    await delay(2000);
  }

  return { elements: [] };
};

// ==================== BUILD QUERY ====================
const buildQuery = (amenity, radius, latitude, longitude) => {
  if (amenity === "blood_bank") {
    return `
      [out:json][timeout:30];
      (
        node["amenity"="blood_bank"](around:${radius},${latitude},${longitude});
        way["amenity"="blood_bank"](around:${radius},${latitude},${longitude});
        node["healthcare"="blood_bank"](around:${radius},${latitude},${longitude});
        way["healthcare"="blood_bank"](around:${radius},${latitude},${longitude});
        node["amenity"="hospital"](around:${radius},${latitude},${longitude});
        way["amenity"="hospital"](around:${radius},${latitude},${longitude});
      );
      out center;
    `;
  }

  if (amenity === "clinic") {
    return `
      [out:json][timeout:30];
      (
        node["amenity"="clinic"](around:${radius},${latitude},${longitude});
        way["amenity"="clinic"](around:${radius},${latitude},${longitude});
        node["amenity"="doctors"](around:${radius},${latitude},${longitude});
        way["amenity"="doctors"](around:${radius},${latitude},${longitude});
        node["healthcare"="clinic"](around:${radius},${latitude},${longitude});
      );
      out center;
    `;
  }

  return `
    [out:json][timeout:30];
    (
      node["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
      way["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
      relation["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;
};

// ==================== TYPE TO AMENITY ====================
const typeToAmenity = {
  hospital: "hospital",
  doctor: "clinic",
  pharmacy: "pharmacy",
  blood_bank: "blood_bank",
};

// ==================== CLEAN PLACES ====================
const cleanPlaces = (elements) => {
  return elements
    .filter((el) => el.tags?.name)
    .map((el) => ({
      id: el.id.toString(),
      name: el.tags.name,
      address: el.tags["addr:street"]
        ? `${el.tags["addr:housenumber"] || ""} ${
            el.tags["addr:street"]
          }, ${el.tags["addr:city"] || ""}`.trim()
        : el.tags["addr:full"] ||
          el.tags["addr:suburb"] ||
          el.tags["addr:city"] ||
          "Address not available",
      rating: null,
      isOpen: null,
      phone:
        el.tags.phone ||
        el.tags["contact:phone"] ||
        el.tags["phone:mobile"] ||
        null,
      website: el.tags.website || el.tags["contact:website"] || null,
      location: {
        latitude: el.lat || el.center?.lat,
        longitude: el.lon || el.center?.lon,
      },
    }))
    .filter((p) => p.location.latitude && p.location.longitude);
};

// ==================== ROUTE ====================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, type = "hospital" } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Check cache first
    const cacheKey = getCacheKey(latitude, longitude, type);
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      console.log(`Cache hit for ${type}`);
      return res.json({
        places: cache[cacheKey].places,
        total: cache[cacheKey].places.length,
        cached: true,
      });
    }

    const amenity = typeToAmenity[type] || "hospital";
    const radius = 5000;

    console.log(`Fetching ${amenity} near ${latitude}, ${longitude}`);

    const query = buildQuery(amenity, radius, latitude, longitude);
    const data = await fetchWithFallback(query);

    const places = cleanPlaces(data.elements || []);

    // Save to cache
    cache[cacheKey] = {
      places,
      timestamp: Date.now(),
    };

    console.log(`Found ${places.length} ${amenity}(s)`);
    res.json({ places, total: places.length });
  } catch (error) {
    console.error("Health Centers Error:", error);
    res.status(500).json({ message: "Failed to fetch health centers" });
  }
});

export default router;