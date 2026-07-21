// Gedeelde logica om de actuele wind voor Trintelhaven Houtribdijk op te halen bij actuelewind.nl.
// Wordt gebruikt door zowel server.js (lokaal/Render) als api/wind.js (Vercel serverless).
const STATION_CODE = "6258"; // Trintelhaven Houtribdijk
const MS_TO_KN = 1.943844;
const CACHE_TTL_MS = 55_000; // upstream is zelf ook max 60s gecached

let cache = { data: null, fetchedAt: 0 };

function upstreamUrl() {
  return `https://www.actuelewind.nl/api/getSpotOverview.php?t=web&p=web&ss=0&${Date.now()}`;
}

async function fetchWind() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { ...cache.data, stale: false, ageSeconds: Math.round((now - cache.fetchedAt) / 1000) };
  }

  const res = await fetch(upstreamUrl(), {
    headers: { "User-Agent": "Mozilla/5.0 (dehler-performance-app)" },
  });
  if (!res.ok) throw new Error(`upstream status ${res.status}`);
  const json = await res.json();
  const spot = json.wind && json.wind[STATION_CODE];
  if (!spot || !spot.winddata || !spot.winddata.length) {
    throw new Error("spot data ontbreekt in upstream response");
  }
  const latest = spot.winddata[0];

  const result = {
    spotnaam: spot.windspot.spotnaam,
    speedKn: Math.round(latest.windsnelheidMS * MS_TO_KN * 10) / 10,
    gustKn: latest.windstotenMS != null ? Math.round(latest.windstotenMS * MS_TO_KN * 10) / 10 : null,
    dirDeg: latest.windrichtingGR,
    dirText: latest.windrichting,
    stationTimestamp: latest.tijdstip,
  };

  cache = { data: result, fetchedAt: now };
  return { ...result, stale: false, ageSeconds: 0 };
}

// Geeft altijd bruikbare data terug (desnoods verouderd uit cache) met een {status, body} shape,
// zodat elke server-laag er hetzelfde mee kan omgaan.
async function getWindResponse() {
  try {
    const data = await fetchWind();
    return { status: 200, body: data };
  } catch (err) {
    if (cache.data) {
      return {
        status: 200,
        body: {
          ...cache.data,
          stale: true,
          ageSeconds: Math.round((Date.now() - cache.fetchedAt) / 1000),
          error: err.message,
        },
      };
    }
    return { status: 502, body: { error: "Kan winddata niet ophalen: " + err.message } };
  }
}

module.exports = { getWindResponse };
