'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;
const TILE_SIZE = 256;

function project(lat: number, lng: number, zoom: number) {
  const scale = 2 ** zoom;
  const x = ((lng + 180) / 360) * scale * TILE_SIZE;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale * TILE_SIZE;
  return { x, y };
}

function unproject(x: number, y: number, zoom: number) {
  const scale = 2 ** zoom;
  const px = x / (scale * TILE_SIZE);
  const py = y / (scale * TILE_SIZE);
  const lng = px * 360 - 180;
  const n = Math.PI - 2 * Math.PI * py;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
  className = '',
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(14);
  const [mapCenter, setMapCenter] = useState({
    lat: lat ?? DEFAULT_LAT,
    lng: lng ?? DEFAULT_LNG,
  });
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lat != null && lng != null) {
      setMapCenter({ lat, lng });
    }
  }, [lat, lng]);

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

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const center = project(mapCenter.lat, mapCenter.lng, zoom);
    const worldX = center.x + (event.clientX - rect.left - rect.width / 2);
    const worldY = center.y + (event.clientY - rect.top - rect.height / 2);
    const next = unproject(worldX, worldY, zoom);
    onChange(next.lat, next.lng);
    setMapCenter(next);
    setMessage('تم تحديد النقطة على الخريطة');
  };

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(next);
        onChange(next.lat, next.lng);
        setMessage('تم تحديد موقعك الحالي بدقة عبر GPS 📍');
        setLocating(false);
      },
      (err) => {
        console.error(err);
        setMessage('تعذر الوصول للموقع. يرجى تفعيل الـ GPS والضغط على الخريطة.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, [onChange]);

  const marker = project(lat ?? mapCenter.lat, lng ?? mapCenter.lng, zoom);
  const center = project(mapCenter.lat, mapCenter.lng, zoom);
  const markerLeft = 50 + ((marker.x - center.x) / 3.0);
  const markerTop = 50 + ((marker.y - center.y) / 3.0);

  return (
    <div className={`rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm ${className}`}>
      {/* Header Info */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">
            تحديد موقع التسليم الدقيق
          </p>
          <p className="text-[10px] text-slate-400">
            اضغط على الخريطة لتحريك الدبوس، أو استخدم زر تحديد الموقع
          </p>
        </div>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FA3802] border border-orange-200 dark:border-orange-900/50 text-xs font-black hover:bg-orange-100 transition-colors shadow-2xs"
        >
          <span>📍</span>
          <span>{locating ? 'جاري التحديد...' : 'موقعي الحالي'}</span>
        </button>
      </div>

      {/* Interactive Map Area */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className="relative h-64 sm:h-72 overflow-hidden cursor-crosshair bg-[#e8e5df]"
      >
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

        {/* Pin Marker */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full pointer-events-none transition-transform duration-150"
          style={{
            left: `${Math.max(4, Math.min(96, markerLeft))}%`,
            top: `${Math.max(6, Math.min(96, markerTop))}%`,
          }}
        >
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold shadow-md whitespace-nowrap mb-0.5">
              مكان التسليم
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FA3802] border-3 border-white shadow-xl flex items-center justify-center text-white text-xs">
              📍
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(z + 1, 18));
            }}
            className="w-8 h-8 rounded-xl bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 font-bold shadow-md flex items-center justify-center text-sm hover:bg-slate-100"
            title="تكبير"
          >
            +
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(z - 1, 10));
            }}
            className="w-8 h-8 rounded-xl bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 font-bold shadow-md flex items-center justify-center text-sm hover:bg-slate-100"
            title="تصغير"
          >
            -
          </button>
        </div>

        {/* Floating Locate Button in Map */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            locateMe();
          }}
          disabled={locating}
          className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-[#FA3802] text-xs font-black shadow-lg hover:scale-105 transition-all"
        >
          <span>🎯</span>
          <span>{locating ? 'تحديد GPS...' : 'تثبيت موقعي'}</span>
        </button>

        <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur text-[8px] text-slate-500">
          © OpenStreetMap
        </div>
      </div>

      {/* Footer Details */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        {message && (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
            {message}
          </p>
        )}
        {lat != null && lng != null ? (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">الإحداثيات الجغرافية:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono" dir="ltr">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">
            اضغط على موقعك في الخريطة لتثبيت مكان التوصيل
          </p>
        )}
      </div>
    </div>
  );
}
