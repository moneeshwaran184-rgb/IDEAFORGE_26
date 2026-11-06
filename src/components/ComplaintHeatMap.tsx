import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CivicReport } from '../types';

export function ComplaintHeatMap({ reports, fullScreen = false, onNavigate }: { reports: CivicReport[]; fullScreen?: boolean; onNavigate: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const points = useMemo(() => reports.flatMap(report => {
    const { lat, lng } = report.location || {};
    if (report.type !== 'complaint' || report.status === 'resolved' ||
        !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < 8 || lat > 13.6 || lng < 76.2 || lng > 80.4) return [];
    return [L.latLng(lat, lng)];
  }), [reports]);

  useEffect(() => {
    if (!host.current) return;
    const map = L.map(host.current, { scrollWheelZoom: fullScreen }).setView([11.1, 78.5], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(host.current);
    const canvas = overlay.current;
    if (!canvas) {
      const markers = L.layerGroup().addTo(map);
      function groupPlaces() {
        markers.clearLayers();
        const groups = new Map<string, L.LatLng[]>();
        for (const point of points) {
          const pixel = map.project(point);
          const key = Math.floor(pixel.x / 48) + ',' + Math.floor(pixel.y / 48);
          const group = groups.get(key) || [];
          group.push(point);
          groups.set(key, group);
        }
        for (const group of groups.values()) {
          const count = group.length;
          const label = count + (count === 1 ? ' open problem' : ' open problems') + ' here';
          L.marker(L.latLngBounds(group).getCenter(), {
            title: label, alt: label,
            icon: L.divIcon({className:'', iconSize:[34,34], iconAnchor:[17,17],
              html:'<span style="display:grid;place-items:center;height:34px;border-radius:50%;background:#164e63;color:white;border:2px solid white;font-weight:bold">' + count + '</span>'})
          }).bindPopup(label).addTo(markers);
        }
      }
      groupPlaces();
      map.on('zoomend', groupPlaces);
      return () => { observer.disconnect(); map.remove(); };
    }
    function draw() {
      const { x, y } = map.getSize();
      if (x < 1 || y < 1) return;
      canvas!.width = x;
      canvas!.height = y;
      const ctx = canvas!.getContext('2d', { willReadFrequently: true });
      if (!ctx || !points.length) return;
      for (const point of points) {
        const { x, y } = map.latLngToContainerPoint(point);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 30);
        glow.addColorStop(0, 'rgba(0,0,0,.48)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 30, y - 30, 60, 60);
      }
      const pixels = ctx.getImageData(0, 0, x, y);
      for (let i = 3; i < pixels.data.length; i += 4) {
        if (!pixels.data[i]) continue;
        const density = Math.min(1, pixels.data[i] / 210);
        pixels.data[i - 3] = 255 * Math.min(1, Math.max(0, 4 * density - 1.5));
        pixels.data[i - 2] = 255 * Math.min(1, 4 * density, 4 * (1 - density));
        pixels.data[i - 1] = 255 * Math.max(0, 1 - 2.5 * density);
        pixels.data[i] = Math.min(218, pixels.data[i] * 1.6);
      }
      ctx.putImageData(pixels, 0, 0);
    }
    let frame = 0;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); };
    map.on('move resize zoom', schedule);
    draw();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); map.remove(); };
  }, [points, fullScreen]);

  return <section className={fullScreen ? 'fixed inset-0 z-[9999] flex flex-col bg-white text-slate-900' : 'overflow-hidden rounded-2xl border-2 border-current'}>
    <header className="flex items-center justify-between gap-3 px-4 py-3">
      <h2 className="font-bold">{fullScreen ? 'Complaint heat map' : 'Open problems by location'}</h2>
      <button type="button" className="rounded-lg border px-3 py-1 font-semibold" onClick={onNavigate}>{fullScreen ? 'Back to dashboard' : 'Open heat map'}</button>
    </header>
    <div className={fullScreen ? 'relative isolate min-h-0 flex-1' : 'relative isolate h-80'}>
      <div ref={host} className="h-full w-full"/>
      {fullScreen && <canvas ref={overlay} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[450]"/>}
    </div>
    <footer className="px-4 py-2 text-sm">
      {points.length ? points.length + ' open complaints mapped.' : 'No open complaints with a mapped location yet.'}
      {fullScreen ? <span className="ml-2 inline-flex items-center gap-2">Lower density <i className="inline-block h-2 w-20 rounded" style={{background:'linear-gradient(to right,blue,cyan,lime,yellow,red)'}}/> Higher density</span> : ' Tap a count or zoom in for a closer view.'}
    </footer>
  </section>;
}
