// ============================================================
// Engz Maps Abstraction Service — MapsProvider interface & implementation
// Now using OpenRouteService (ORS) — no Google Maps dependency
// ============================================================

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'ERROR';
}

export interface MatrixResult {
  distances: number[][]; // km
  durations: number[][]; // minutes
}

export interface MapsProvider {
  geocode(address: string): Promise<GeocodeResult | null>;
  reverseGeocode(location: LatLng): Promise<string | null>;
  getDrivingRoute(origin: LatLng, destination: LatLng): Promise<RouteResult>;
  getDistanceMatrix(origins: LatLng[], destinations: LatLng[]): Promise<MatrixResult>;
  calculateHaversineDistanceKm(origin: LatLng, destination: LatLng): number;
}

/**
 * Standard Haversine distance in KM.
 * Used ONLY as a quick first-pass filter before querying driving routes.
 */
export function calculateHaversineDistanceKm(origin: LatLng, destination: LatLng): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// ============================================================
// OpenRouteService Provider
// Docs: https://openrouteservice.org/dev/#/api-docs
// ============================================================

const ORS_BASE_URL = 'https://api.openrouteservice.org';

function getOrsApiKey(): string {
  return process.env.ORS_API_KEY || '';
}

export class OpenRouteServiceProvider implements MapsProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || getOrsApiKey();
  }

  /**
   * Geocode an address using ORS Geocode Search (Pelias-based).
   * Biased towards Egypt for better local results.
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      console.warn('[ORS] No API key. Using Cairo fallback coordinates.');
      return {
        formattedAddress: address,
        location: { lat: 30.0444, lng: 31.2357 },
      };
    }

    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        text: address,
        'boundary.country': 'EG',
        size: '1',
        lang: 'ar',
      });

      const res = await fetch(`${ORS_BASE_URL}/geocode/search?${params}`);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.geometry.coordinates;
        return {
          formattedAddress: feature.properties.label || address,
          location: { lat, lng },
          placeId: feature.properties.id,
        };
      }

      return null;
    } catch (err) {
      console.error('[ORS] Geocode error:', err);
      return null;
    }
  }

  /**
   * Reverse geocode a lat/lng to a human-readable address.
   */
  async reverseGeocode(location: LatLng): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        'point.lon': String(location.lng),
        'point.lat': String(location.lat),
        size: '1',
        lang: 'ar',
      });

      const res = await fetch(`${ORS_BASE_URL}/geocode/reverse?${params}`);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].properties.label || null;
      }

      return null;
    } catch (err) {
      console.error('[ORS] ReverseGeocode error:', err);
      return null;
    }
  }

  /**
   * Get driving route between two points.
   * ORS returns distance in meters and duration in seconds.
   */
  async getDrivingRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
    if (!this.apiKey) {
      // Fallback: Haversine * 1.3 (city driving factor)
      const straightDistance = calculateHaversineDistanceKm(origin, destination);
      const estimatedDrivingKm = Math.max(1, Number((straightDistance * 1.3).toFixed(2)));
      const estimatedMinutes = Math.max(5, Math.round(estimatedDrivingKm * 3));
      return {
        distanceKm: estimatedDrivingKm,
        durationMinutes: estimatedMinutes,
        status: 'OK',
      };
    }

    try {
      // ORS Directions API — POST with coordinates as [lng, lat]
      const res = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[ORS] Directions API error:', res.status, errorText);
        // Fallback to Haversine estimate
        const fallbackDist = calculateHaversineDistanceKm(origin, destination);
        return {
          distanceKm: Math.max(1, Number((fallbackDist * 1.3).toFixed(2))),
          durationMinutes: Math.max(5, Math.round(fallbackDist * 1.3 * 3)),
          status: 'OK',
        };
      }

      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceMeters = route.summary.distance;
        const durationSeconds = route.summary.duration;

        return {
          distanceKm: Number((distanceMeters / 1000).toFixed(2)),
          durationMinutes: Math.round(durationSeconds / 60),
          status: 'OK',
        };
      }

      return { distanceKm: 0, durationMinutes: 0, status: 'ZERO_RESULTS' };
    } catch (err) {
      console.error('[ORS] Directions error:', err);
      return { distanceKm: 0, durationMinutes: 0, status: 'ERROR' };
    }
  }

  /**
   * Distance Matrix: calculate distances between multiple origins and destinations
   * in a SINGLE API call. Critical for efficient driver matching.
   *
   * ORS Matrix API: POST /v2/matrix/driving-car
   * - locations: array of [lng, lat]
   * - sources: indexes of origin locations
   * - destinations: indexes of destination locations
   * - metrics: ["distance", "duration"]
   */
  async getDistanceMatrix(origins: LatLng[], destinations: LatLng[]): Promise<MatrixResult> {
    if (!this.apiKey || origins.length === 0 || destinations.length === 0) {
      // Fallback: calculate Haversine * 1.3 for each pair
      const distances = origins.map((o) =>
        destinations.map((d) => Number((calculateHaversineDistanceKm(o, d) * 1.3).toFixed(2)))
      );
      const durations = distances.map((row) =>
        row.map((dist) => Math.max(5, Math.round(dist * 3)))
      );
      return { distances, durations };
    }

    try {
      // Combine all locations: origins first, then destinations
      const allLocations = [
        ...origins.map((o) => [o.lng, o.lat]),
        ...destinations.map((d) => [d.lng, d.lat]),
      ];

      const sourceIndexes = origins.map((_, i) => i);
      const destIndexes = destinations.map((_, i) => i + origins.length);

      const res = await fetch(`${ORS_BASE_URL}/v2/matrix/driving-car`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations: allLocations,
          sources: sourceIndexes,
          destinations: destIndexes,
          metrics: ['distance', 'duration'],
        }),
      });

      if (!res.ok) {
        console.error('[ORS] Matrix API error:', res.status);
        // Fallback
        const distances = origins.map((o) =>
          destinations.map((d) => Number((calculateHaversineDistanceKm(o, d) * 1.3).toFixed(2)))
        );
        const durations = distances.map((row) =>
          row.map((dist) => Math.max(5, Math.round(dist * 3)))
        );
        return { distances, durations };
      }

      const data = await res.json();

      // ORS returns distances in meters, durations in seconds
      const distances = (data.distances as number[][]).map((row: number[]) =>
        row.map((m: number) => Number((m / 1000).toFixed(2)))
      );
      const durations = (data.durations as number[][]).map((row: number[]) =>
        row.map((s: number) => Math.round(s / 60))
      );

      return { distances, durations };
    } catch (err) {
      console.error('[ORS] Matrix error:', err);
      // Fallback
      const distances = origins.map((o) =>
        destinations.map((d) => Number((calculateHaversineDistanceKm(o, d) * 1.3).toFixed(2)))
      );
      const durations = distances.map((row) =>
        row.map((dist) => Math.max(5, Math.round(dist * 3)))
      );
      return { distances, durations };
    }
  }

  calculateHaversineDistanceKm(origin: LatLng, destination: LatLng): number {
    return calculateHaversineDistanceKm(origin, destination);
  }
}

// Singleton Default Provider
export const defaultMapsProvider: MapsProvider = new OpenRouteServiceProvider();
