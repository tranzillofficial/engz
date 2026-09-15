// ============================================================
// Engz Navigation Service — Google Maps Deep Links (Free)
// Opens Google Maps app on mobile / website on desktop
// Zero API credits needed — just URL construction
// ============================================================

import type { LatLng } from './maps';

/**
 * Generate a Google Maps directions URL.
 * On mobile: opens Google Maps app (if installed)
 * On desktop: opens Google Maps website
 */
export function getGoogleMapsDirectionsUrl(
  origin: LatLng,
  destination: LatLng
): string {
  // Using the universal Google Maps URL format
  // This works on both Android (opens Google Maps app) and iOS (opens Apple Maps or Google Maps)
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

/**
 * Generate a Google Maps URL to a specific location (no directions).
 */
export function getGoogleMapsLocationUrl(location: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
}

/**
 * Generate navigation URL for driver:
 * - From driver's current location to pickup point
 * - From pickup to dropoff
 */
export function getDriverNavigationUrls(params: {
  driverLocation?: LatLng;
  pickupLocation: LatLng;
  dropoffLocation: LatLng;
}): {
  toPickup: string;
  toDropoff: string;
  pickupMapUrl: string;
  dropoffMapUrl: string;
} {
  // To pickup — if driver location is available, use it as origin
  // Otherwise let Google Maps use the user's current location
  const toPickup = params.driverLocation
    ? getGoogleMapsDirectionsUrl(params.driverLocation, params.pickupLocation)
    : `https://www.google.com/maps/dir/?api=1&destination=${params.pickupLocation.lat},${params.pickupLocation.lng}&travelmode=driving`;

  // To dropoff — from pickup to dropoff
  const toDropoff = getGoogleMapsDirectionsUrl(
    params.pickupLocation,
    params.dropoffLocation
  );

  return {
    toPickup,
    toDropoff,
    pickupMapUrl: getGoogleMapsLocationUrl(params.pickupLocation),
    dropoffMapUrl: getGoogleMapsLocationUrl(params.dropoffLocation),
  };
}
