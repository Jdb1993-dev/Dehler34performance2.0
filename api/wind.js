// Vercel serverless function versie van de wind-proxy (zelfde logica als server.js /api/wind).
const STATION_CODE = "6258"; // Trintelhaven Houtribdijk
const UPSTREAM_URL = () =>
  `https://www.actuelewind.nl/api/getSpotOverview.php?t=web&p=web&ss=0&${Date.now()}`;
const MS_TO_KN = 1.943844;
const CACHE_TTL_MS = 55_000; // upstream is zelf ook max 60s gecached

// Blijft bestaan zolang de serverless-instance warm is; bij cold start begint dit weer op null.
let cache = { data: null, fetchedAt: 0 };

async function fetchWind() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { ...cache.data, stale: false, ageSeconds: Math.round((now - cache.fetchedAt) / 1000) };
  }

  const res = await fetch(UPSTREAM_URL(), {
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

module.exports = async (req, res) => {
  try {
    const data = await fetchWind();
    res.status(200).json(data);
  } catch (err) {
    if (cache.data) {
      res.status(200).json({
        ...cache.data,
        stale: true,
        ageSeconds: Math.round((Date.now() - cache.fetchedAt) / 1000),
        error: err.message,
      });
    } else {
      res.status(502).json({ error: "Kan winddata niet ophalen: " + err.message });
    }
  }
};
