'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { updateDriverLocationAction } from '@/lib/actions/drivers';

interface DriverNavigationMapProps {
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  driverId?: string;
}

const TILE_SIZE = 256;

function project(lat: number, lng: number, zoom: number) {
  const scale = 2 ** zoom;
  const x = ((lng + 180) / 360) * scale * TILE_SIZE;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale * TILE_SIZE;
  return { x, y };
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function DriverNavigationMap({
  dropoffLat,
  dropoffLng,
  dropoffAddress,
}: DriverNavigationMapProps) {
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Auto-fetch and watch driver's GPS location
  const refreshLocation = useCallback((silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setGpsError('خاصية تحديد الموقع غير مدعومة على هذا الجهاز');
      return;
    }

    if (!silent) setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLoc(coords);
        setGpsError(null);
        if (!silent) setLocating(false);
        // Sync with backend
        updateDriverLocationAction(coords.lat, coords.lng).catch(() => {});
      },
      (err) => {
        console.warn('[DriverMap] GPS Error:', err);
        if (!silent) {
          setGpsError('يرجى تفعيل الـ GPS في الهاتف لتحديد المسافة الدقيقة');
          setLocating(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    refreshLocation(true);

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLoc(coords);
        updateDriverLocationAction(coords.lat, coords.lng).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [refreshLocation]);

  // Center between driver and customer
  const mapCenter = useMemo(() => {
    if (!driverLoc) {
      return { lat: dropoffLat, lng: dropoffLng };
    }
    return {
      lat: (driverLoc.lat + dropoffLat) / 2,
      lng: (driverLoc.lng + dropoffLng) / 2,
    };
  }, [driverLoc, dropoffLat, dropoffLng]);

  // Determine appropriate zoom level based on distance
  const { distanceKm, drivingDurationMinutes, zoom } = useMemo(() => {
    if (!driverLoc) {
      return { distanceKm: null, drivingDurationMinutes: null, zoom: 15 };
    }
    const dist = calculateDistanceKm(driverLoc.lat, driverLoc.lng, dropoffLat, dropoffLng);
    // Rough driving distance estimate (straight line * 1.3 road factor)
    const actualRoadKm = dist < 0.2 ? 0.2 : dist * 1.25;
    // Avg speed ~25 km/h in city
    const duration = Math.max(2, Math.round((actualRoadKm / 25) * 60));

    let z = 15;
    if (dist > 15) z = 11;
    else if (dist > 8) z = 12;
    else if (dist > 4) z = 13;
    else if (dist > 1.5) z = 14;
    else z = 15;

    return {
      distanceKm: actualRoadKm,
      drivingDurationMinutes: duration,
      zoom: z,
    };
  }, [driverLoc, dropoffLat, dropoffLng]);

  // Generate OSM tiles
  const tiles = useMemo(() => {
    const center = project(mapCenter.lat, mapCenter.lng, zoom);
    const tileX = Math.floor(center.x / TILE_SIZE);
    const tileY = Math.floor(center.y / TILE_SIZE);
    const offsetX = center.x - tileX * TILE_SIZE;
    const offsetY = center.y - tileY * TILE_SIZE;

    const list = [];
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        const x = tileX + col;
        const y = tileY + row;
        const max = 2 ** zoom;
        const wrappedX = ((x % max) + max) % max;
        const px = col * TILE_SIZE + TILE_SIZE - offsetX;
        const py = row * TILE_SIZE + TILE_SIZE - offsetY;
        list.push({ x: wrappedX, y, px, py, key: `${zoom}-${wrappedX}-${y}` });
      }
    }
    return list;
  }, [mapCenter.lat, mapCenter.lng, zoom]);

  // Calculate pixel positions for markers
  const centerProj = project(mapCenter.lat, mapCenter.lng, zoom);
  const customerProj = project(dropoffLat, dropoffLng, zoom);
  const driverProj = driverLoc ? project(driverLoc.lat, driverLoc.lng, zoom) : null;

  const customerLeft = 50 + ((customerProj.x - centerProj.x) / 3.0);
  const customerTop = 50 + ((customerProj.y - centerProj.y) / 3.0);

  const driverLeft = driverProj ? 50 + ((driverProj.x - centerProj.x) / 3.0) : null;
  const driverTop = driverProj ? 50 + ((driverProj.y - centerProj.y) / 3.0) : null;

  // Google Maps Direct Navigation Link
  const googleMapsNavUrl = driverLoc
    ? `https://www.google.com/maps/dir/?api=1&origin=${driverLoc.lat},${driverLoc.lng}&destination=${dropoffLat},${dropoffLng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${dropoffLat},${dropoffLng}&travelmode=driving`;

  const wazeNavUrl = `https://waze.com/ul?ll=${dropoffLat},${dropoffLng}&navigate=yes`;

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-0">
      {/* Top Distance & Status Bar */}
      <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-850 border-b border-orange-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-black text-[#FA3802] uppercase tracking-wider block">
            المسافة الحقيقية للعميل ⚡
          </span>
          {distanceKm !== null ? (
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">
              تبعد عنك <span className="text-[#FA3802] text-sm">{distanceKm.toFixed(1)} كم</span> • حوالي{' '}
              <span className="text-emerald-600 dark:text-emerald-400">{drivingDurationMinutes} دقيقة</span>
            </p>
          ) : (
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
              جاري قياس المسافة الحية عبر GPS...
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => refreshLocation(false)}
          disabled={locating}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[#FA3802] text-xs font-black border border-orange-200 dark:border-slate-700 hover:bg-orange-50 shadow-2xs transition-all flex items-center gap-1"
        >
          <span>🎯</span>
          <span>{locating ? '...' : 'تحديث GPS'}</span>
        </button>
      </div>

      {/* Interactive Map Visual */}
      <div className="relative h-64 sm:h-72 overflow-hidden bg-[#e8e5df] select-none">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute w-64 h-64 max-w-none select-none pointer-events-none"
            style={{
              left: `calc(50% + ${tile.px - TILE_SIZE / 2}px)`,
              top: `calc(50% + ${tile.py - TILE_SIZE / 2}px)`,
            }}
          />
        ))}

        {/* Customer Location Marker */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-300"
          style={{
            left: `${Math.max(5, Math.min(95, customerLeft))}%`,
            top: `${Math.max(8, Math.min(95, customerTop))}%`,
          }}
        >
          <div className="flex flex-col items-center animate-bounce">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-white text-[9px] font-black shadow-lg whitespace-nowrap mb-0.5">
              موقع العميل 📍
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FA3802] border-3 border-white shadow-xl flex items-center justify-center text-white text-sm">
              📍
            </div>
          </div>
        </div>

        {/* Driver Location Marker (if available) */}
        {driverLeft !== null && driverTop !== null && (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-300"
            style={{
              left: `${Math.max(5, Math.min(95, driverLeft))}%`,
              top: `${Math.max(8, Math.min(95, driverTop))}%`,
            }}
          >
            <div className="flex flex-col items-center">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black shadow-lg whitespace-nowrap mb-0.5">
                موقعي الحالي (كابتن) 🛵
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500 border-3 border-white shadow-xl flex items-center justify-center text-white text-sm">
                🛵
              </div>
            </div>
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md text-[10px] font-black border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FA3802]" />
            <span>مكان العميل</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>موقعك (الطيار)</span>
          </div>
        </div>
      </div>

      {/* Customer Address Card & GPS Details */}
      <div className="p-4 bg-white dark:bg-slate-900 space-y-3">
        <div className="p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100/60 dark:border-orange-900/30 text-xs">
          <span className="text-[10px] font-black text-[#FA3802] block mb-0.5">عنوان التسليم المطلوب:</span>
          <p className="font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            {dropoffAddress}
          </p>
        </div>

        {gpsError && (
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
            ⚠️ {gpsError}
          </p>
        )}

        {/* NAVIGATION ACTION BUTTONS */}
        <div className="space-y-2 pt-1">
          <a
            href={googleMapsNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FD7B03] to-[#FA3802] text-white font-black text-sm shadow-md shadow-orange-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-center group"
          >
            <span className="text-lg">🗺️</span>
            <span>فتح الملاحة وتوجيه المسار في Google Maps</span>
            <span className="group-hover:translate-x-[-3px] transition-transform">←</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={wazeNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs text-center hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>🚗</span>
              <span>الملاحة عبر Waze</span>
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${dropoffLat},${dropoffLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs text-center hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>📍</span>
              <span>موقع العميل فقط</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
