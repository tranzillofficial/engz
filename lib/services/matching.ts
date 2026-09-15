// ============================================================
// Engz Driver Matching Service — Radius expansion & ORS Matrix filtering
// Uses batch Matrix API instead of individual route calls per driver
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { defaultMapsProvider, calculateHaversineDistanceKm, type LatLng } from './maps';
import type { Driver, Order, PricingSettings } from '@/lib/types/database';

export interface MatchingCandidate {
  driver: Driver & {
    user: {
      full_name: string;
      phone: string;
      avatar_url: string;
    };
  };
  haversineDistanceKm: number;
  drivingDistanceKm?: number;
  drivingDurationMinutes?: number;
}

export interface MatchingResult {
  orderId: string;
  searchRadiusKm: number;
  candidates: MatchingCandidate[];
  expandedCount: number;
}

/**
 * Finds eligible drivers for a pending order using the 3-tier architecture:
 * 1. Rough geographic candidate filtering (Haversine within current search radius)
 * 2. Radius expansion (default -> step -> max) if no online/eligible driver is found
 * 3. ORS Matrix API called ONCE for all candidates (batch) instead of N individual calls
 */
export async function findEligibleDriversForOrder(order: Pick<Order, 'id' | 'pickup_lat' | 'pickup_lng'>): Promise<MatchingResult> {
  const supabase = await createClient();

  // 1. Fetch pricing/matching settings
  const { data: settingsData } = await supabase
    .from('pricing_settings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const settings: PricingSettings = settingsData || {
    id: 'default',
    base_delivery_fee: 20,
    default_search_radius_km: 2,
    radius_expansion_step_km: 2,
    max_search_radius_km: 10,
    commission_block_threshold: 100,
    currency: 'EGP',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const defaultRadius = Number(settings.default_search_radius_km) || 2;
  const step = Number(settings.radius_expansion_step_km) || 2;
  const maxRadius = Number(settings.max_search_radius_km) || 10;

  // 2. Fetch all online, unblocked, active drivers who have known locations
  const { data: driversData, error: driversError } = await supabase
    .from('drivers')
    .select(`
      *,
      user:users!drivers_user_id_fkey(full_name, phone, avatar_url)
    `)
    .eq('status', 'online')
    .eq('is_blocked', false)
    .eq('is_active', true)
    .not('current_lat', 'is', null)
    .not('current_lng', 'is', null);

  const rawDrivers = (driversData as unknown as MatchingCandidate['driver'][]) || [];

  if (driversError || rawDrivers.length === 0) {
    return {
      orderId: order.id,
      searchRadiusKm: defaultRadius,
      candidates: [],
      expandedCount: 0,
    };
  }

  const pickupLocation: LatLng = {
    lat: order.pickup_lat,
    lng: order.pickup_lng,
  };

  // Step 1 & 2: Radius expansion loop
  let currentRadius = defaultRadius;
  const candidates: MatchingCandidate[] = [];
  let expandedCount = 0;

  while (currentRadius <= maxRadius) {
    // Filter drivers within current Haversine radius (rough, fast filter)
    const nearby = rawDrivers.filter((d) => {
      if (d.current_lat === null || d.current_lng === null) return false;
      const dist = calculateHaversineDistanceKm(pickupLocation, {
        lat: d.current_lat,
        lng: d.current_lng,
      });
      return dist <= currentRadius;
    });

    if (nearby.length > 0) {
      // Step 3: Use ORS Matrix API — SINGLE call for all candidates
      // Origins = driver locations, Destinations = [pickup point]
      const driverLocations: LatLng[] = nearby.map((d) => ({
        lat: d.current_lat!,
        lng: d.current_lng!,
      }));

      const matrix = await defaultMapsProvider.getDistanceMatrix(
        driverLocations,
        [pickupLocation]
      );

      for (let i = 0; i < nearby.length; i++) {
        const driver = nearby[i];
        const haversineDist = calculateHaversineDistanceKm(pickupLocation, {
          lat: driver.current_lat!,
          lng: driver.current_lng!,
        });

        candidates.push({
          driver,
          haversineDistanceKm: haversineDist,
          drivingDistanceKm: matrix.distances[i]?.[0] ?? haversineDist * 1.3,
          drivingDurationMinutes: matrix.durations[i]?.[0] ?? Math.round(haversineDist * 3),
        });
      }

      // Sort candidates by driving distance (closest first)
      candidates.sort((a, b) => (a.drivingDistanceKm || 0) - (b.drivingDistanceKm || 0));
      break;
    }

    currentRadius += step;
    expandedCount++;
  }

  return {
    orderId: order.id,
    searchRadiusKm: currentRadius,
    candidates,
    expandedCount,
  };
}

/**
 * Get available pending orders for a specific online driver.
 * Uses the driver's current coordinates to filter pending orders within their zone.
 */
export async function getAvailableOrdersForDriver(driverId: string) {
  const supabase = await createClient();

  // 1. Fetch driver info
  const { data: driverData } = await supabase
    .from('drivers')
    .select('id, current_lat, current_lng, is_blocked, status')
    .eq('id', driverId)
    .single();

  const driver = driverData as Pick<Driver, 'id' | 'current_lat' | 'current_lng' | 'is_blocked' | 'status'> | null;

  if (!driver || driver.is_blocked || driver.status !== 'online') {
    return [];
  }

  // 2. Fetch pending orders with items
  const { data: ordersData, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      customer:users!orders_customer_id_fkey(full_name, phone)
    `)
    .eq('status', 'pending')
    .is('driver_id', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !ordersData) {
    return [];
  }

  const driverLoc: LatLng = {
    lat: driver.current_lat || 30.0444,
    lng: driver.current_lng || 31.2357,
  };

  const rawOrders = ordersData as unknown as (Order & {
    order_items: unknown[];
    customer: { full_name: string; phone: string };
  })[];

  // Add distance from driver to pickup location for each order
  const ordersWithDistance = rawOrders.map((order) => {
    const pickupLoc: LatLng = { lat: order.pickup_lat, lng: order.pickup_lng };
    const distanceToPickupKm = calculateHaversineDistanceKm(driverLoc, pickupLoc);

    return {
      ...order,
      distanceToPickupKm,
    };
  });

  // Sort by closest to driver
  ordersWithDistance.sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm);

  return ordersWithDistance;
}
