// Polar diagram voor de Dehler Optima 106.
// Er bestaat geen publiek ORC-certificaat voor dit model, dus dit is een schatting
// gebaseerd op de Dehler 34 (zelfde ontwerp/rompvorm, VDS #320 van E.G. van de Stadt).
// Snelheden in knopen. Pas dit gerust aan in Instellingen zodra je betere cijfers hebt.
const DEFAULT_POLAR = {
  twsCols: [6, 10, 14, 20],
  twaRows: [0, 30, 40, 60, 90, 120, 150, 180],
  speeds: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [3.8, 5.4, 6.0, 6.3],
    [4.6, 6.1, 6.6, 6.9],
    [5.0, 6.6, 7.1, 7.4],
    [4.3, 6.2, 7.0, 7.5],
    [3.0, 4.8, 6.0, 6.8],
    [2.2, 3.6, 4.6, 5.6],
  ],
};

const POLAR_STORAGE_KEY = "dehler-polar-v1";

function loadPolar() {
  try {
    const raw = localStorage.getItem(POLAR_STORAGE_KEY);
    if (!raw) return clonePolar(DEFAULT_POLAR);
    const parsed = JSON.parse(raw);
    if (!parsed.twsCols || !parsed.twaRows || !parsed.speeds) return clonePolar(DEFAULT_POLAR);
    return parsed;
  } catch {
    return clonePolar(DEFAULT_POLAR);
  }
}

function savePolar(polar) {
  localStorage.setItem(POLAR_STORAGE_KEY, JSON.stringify(polar));
}

function resetPolar() {
  localStorage.removeItem(POLAR_STORAGE_KEY);
  return clonePolar(DEFAULT_POLAR);
}

function clonePolar(p) {
  return { twsCols: [...p.twsCols], twaRows: [...p.twaRows], speeds: p.speeds.map((r) => [...r]) };
}

// Lineaire interpolatie tussen twee punten
function lerp(x0, y0, x1, y1, x) {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

// Vind index van omringende waarden in een gesorteerde array, geclamped aan de randen
function bracket(arr, v) {
  if (v <= arr[0]) return [0, 0];
  if (v >= arr[arr.length - 1]) return [arr.length - 1, arr.length - 1];
  for (let i = 0; i < arr.length - 1; i++) {
    if (v >= arr[i] && v <= arr[i + 1]) return [i, i + 1];
  }
  return [arr.length - 1, arr.length - 1];
}

// Bilineaire interpolatie: geeft targetsnelheid (kn) voor gegeven TWA (0-180) en TWS (kn)
function getTargetSpeed(twaAbs, twsKn, polar) {
  const twa = Math.min(180, Math.max(0, twaAbs));
  const [ci0, ci1] = bracket(polar.twsCols, twsKn);
  const [ri0, ri1] = bracket(polar.twaRows, twa);

  const q00 = polar.speeds[ri0][ci0];
  const q01 = polar.speeds[ri0][ci1];
  const q10 = polar.speeds[ri1][ci0];
  const q11 = polar.speeds[ri1][ci1];

  const top = lerp(polar.twsCols[ci0], q00, polar.twsCols[ci1], q01, twsKn);
  const bottom = lerp(polar.twsCols[ci0], q10, polar.twsCols[ci1], q11, twsKn);
  return lerp(polar.twaRows[ri0], top, polar.twaRows[ri1], bottom, twa);
}
