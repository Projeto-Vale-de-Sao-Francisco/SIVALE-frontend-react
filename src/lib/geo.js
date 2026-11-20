// Geometria em coordenadas reais [lat, lng].

const R = 6378137; // raio da Terra (m)
const rad = d => (d * Math.PI) / 180;

/** Área geodésica de um polígono [[lat,lng],...] em hectares. */
export function areaHa(pts) {
  if (!pts || pts.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [lat1, lng1] = pts[i];
    const [lat2, lng2] = pts[(i + 1) % pts.length];
    a += rad(lng2 - lng1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return Math.abs((a * R * R) / 2) / 10000;
}

/** Centroide simples (média dos vértices). */
export function centroid(pts) {
  if (!pts || !pts.length) return [0, 0];
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
}

/** Distância em metros entre dois pontos [lat,lng]. */
export function distM(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Limites [[minLat,minLng],[maxLat,maxLng]] de vários polígonos. */
export function boundsOf(polys) {
  const pts = polys.flat().filter(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]));
  if (!pts.length) return null;
  const lats = pts.map(p => p[0]);
  const lngs = pts.map(p => p[1]);
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
}

/**
 * Converte o layout original do protótipo (canvas 1000×620 px) em coordenadas reais
 * ao redor de um centro, mantendo ~3,1 m por pixel — o que preserva as áreas originais.
 */
export function fromCanvas(center, pts, mPerPx = 3.1) {
  const [clat, clng] = center;
  const mLat = 110574;
  const mLng = 111320 * Math.cos(rad(clat));
  return pts.map(([x, y]) => [+(clat - ((y - 310) * mPerPx) / mLat).toFixed(6), +(clng + ((x - 500) * mPerPx) / mLng).toFixed(6)]);
}

export const fmtCoord = p => p[0].toFixed(5) + ', ' + p[1].toFixed(5);
