'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;
const ZOOM = 14;
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

export default function LocationPicker({ lat, lng, onChange, className = '' }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState({ lat: lat ?? DEFAULT_LAT, lng: lng ?? DEFAULT_LNG });
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lat != null && lng != null) setMapCenter({ lat, lng });
  }, [lat, lng]);

  const tiles = useMemo(() => {
    const center = project(mapCenter.lat, mapCenter.lng, ZOOM);
    const tileX = Math.floor(center.x / TILE_SIZE);
    const tileY = Math.floor(center.y / TILE_SIZE);
    const offsetX = center.x - tileX * TILE_SIZE;
    const offsetY = center.y - tileY * TILE_SIZE;

    return Array.from({ length: 9 }, (_, index) => {
      const row = Math.floor(index / 3) - 1;
      const col = (index % 3) - 1;
      const x = tileX + col;
      const y = tileY + row;
      const max = 2 ** ZOOM;
      const wrappedX = ((x % max) + max) % max;
      const px = col * TILE_SIZE + TILE_SIZE - offsetX;
      const py = row * TILE_SIZE + TILE_SIZE - offsetY;
      return { x: wrappedX, y, px, py, key: `${ZOOM}-${wrappedX}-${y}` };
    });
  }, [mapCenter.lat, mapCenter.lng]);

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const center = project(mapCenter.lat, mapCenter.lng, ZOOM);
    const worldX = center.x + (event.clientX - rect.left - rect.width / 2);
    const worldY = center.y + (event.clientY - rect.top - rect.height / 2);
    const next = unproject(worldX, worldY, ZOOM);
    onChange(next.lat, next.lng);
    setMapCenter(next);
    setMessage('تم اختيار الموقع على الخريطة');
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setMessage('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMapCenter(next);
        onChange(next.lat, next.lng);
        setMessage('تم تحديد موقعك الحالي');
        setLocating(false);
      },
      () => {
        setMessage('لم نتمكن من تحديد موقعك. يمكنك اختيار المكان على الخريطة.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const marker = project(lat ?? mapCenter.lat, lng ?? mapCenter.lng, ZOOM);
  const center = project(mapCenter.lat, mapCenter.lng, ZOOM);
  const markerLeft = 50 + ((marker.x - center.x) / 3.0);
  const markerTop = 50 + ((marker.y - center.y) / 3.0);

  return (
    <div className={`rounded-3xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm ${className}`}>
      <div className="p-3 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">حدد موقع التسليم</p>
          <p className="text-[11px] text-slate-500 mt-0.5">اضغط على الخريطة أو استخدم موقعك الحالي</p>
        </div>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 text-[#FA3802] border border-orange-100 text-xs font-extrabold hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA3802]/40 disabled:opacity-60"
        >
          <span aria-hidden>⌖</span>{locating ? 'جاري التحديد...' : 'موقعي الحالي'}
        </button>
      </div>

      <div ref={mapRef} onClick={handleMapClick} className="relative h-64 sm:h-72 overflow-hidden cursor-crosshair bg-[#e8e5df]">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={`https://tile.openstreetmap.org/${ZOOM}/${tile.x}/${tile.y}.png`}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute w-64 h-64 max-w-none select-none pointer-events-none"
            style={{ left: `calc(50% + ${tile.px - TILE_SIZE / 2}px)`, top: `calc(50% + ${tile.py - TILE_SIZE / 2}px)` }}
          />
        ))}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: `${Math.max(4, Math.min(96, markerLeft))}%`, top: `${Math.max(6, Math.min(96, markerTop))}%` }}
        >
          <div className="w-9 h-9 rounded-full bg-[#FA3802] border-4 border-white shadow-xl flex items-center justify-center text-white text-sm">●</div>
        </div>
        <div className="absolute bottom-2 left-2 z-20 px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-[9px] text-slate-500 shadow-sm">© OpenStreetMap contributors</div>
      </div>

      <div className="p-3 bg-white border-t border-gray-100">
        {message && <p className="text-xs font-bold text-emerald-600 mb-2">✓ {message}</p>}
        {lat != null && lng != null ? (
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-500">الموقع المحدد</span>
            <span className="font-bold text-slate-700" dir="ltr">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">لم يتم اختيار موقع بعد</p>
        )}
      </div>
    </div>
  );
}
