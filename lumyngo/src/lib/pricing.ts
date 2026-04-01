const BASE_FARE = 50;
const PER_KM_RATE = 20;
const MIN_FARE = 80;
const SURGE_THRESHOLD = 5;

export interface PriceEstimate {
  distance: number;
  price: number;
  breakdown: {
    baseFare: number;
    distanceCharge: number;
    surgeMultiplier: number;
  };
}

export function calculatePrice(
  distanceKm: number,
  activeConcurrentOrders = 0
): PriceEstimate {
  const surgeMultiplier =
    activeConcurrentOrders >= SURGE_THRESHOLD ? 1.5 : 1.0;

  const distanceCharge = distanceKm * PER_KM_RATE;
  const rawPrice = (BASE_FARE + distanceCharge) * surgeMultiplier;
  const price = Math.max(rawPrice, MIN_FARE);

  return {
    distance: distanceKm,
    price: Math.round(price),
    breakdown: {
      baseFare: BASE_FARE,
      distanceCharge: Math.round(distanceCharge),
      surgeMultiplier,
    },
  };
}

export function applyPromoCode(
  price: number,
  discount: number,
  isPercent: boolean
): number {
  if (isPercent) {
    return Math.max(price - (price * discount) / 100, 0);
  }
  return Math.max(price - discount, 0);
}

export async function getDistanceFromGoogleMaps(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<number> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return haversineDistance(originLat, originLng, destLat, destLng);
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${apiKey}&units=metric`
    );
    const data = await res.json();
    const distanceMeters =
      data.rows?.[0]?.elements?.[0]?.distance?.value ?? null;
    if (distanceMeters) {
      return distanceMeters / 1000;
    }
  } catch {
    // fallback to haversine
  }

  return haversineDistance(originLat, originLng, destLat, destLng);
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number) {
  return deg * (Math.PI / 180);
}
