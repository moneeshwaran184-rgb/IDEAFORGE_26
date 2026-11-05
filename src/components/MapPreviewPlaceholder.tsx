import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
interface Props {
 lat: number; lng: number; areaName: string; address?: string;
 onLocationChange?: (lat: number, lng: number) => void;
 interactive?: boolean; className?: string;
}
export function MapPreviewPlaceholder({lat,lng,onLocationChange,interactive=true,className=''}: Props) {
 const host=useRef<HTMLDivElement>(null);
 const map=useRef<L.Map | null>(null);
 const marker=useRef<L.Marker | null>(null);
 const callback=useRef(onLocationChange);
 callback.current=onLocationChange;
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!host.current) return;
  const instance=L.map(host.current,{scrollWheelZoom:false}).setView([lat,lng],13);
  map.current=instance;
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
   maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(instance);
  tiles.on('tileerror',()=>setError('Map images could not load. Check your internet connection.'));
  const pin=L.marker([lat,lng],{draggable:interactive,keyboard:true,alt:'Selected problem location',
   icon:L.divIcon({className:'civic-map-pin',html:'<span></span>',iconSize:[24,24],iconAnchor:[12,12]})
  }).addTo(instance);
  marker.current=pin;
  const select=(point:L.LatLng)=>{
   if(point.lat<8 || point.lat>13.6 || point.lng<76.2 || point.lng>80.4){
    setError('Choose a location in Tamil Nadu.'); pin.setLatLng(map.current!.getCenter()); return;
   }
   setError(''); pin.setLatLng(point); callback.current?.(point.lat,point.lng);
  };
  if(interactive){
   instance.on('click',(e:L.LeafletMouseEvent)=>select(e.latlng));
   pin.on('dragend',()=>select(pin.getLatLng()));
  }
  const observer=new ResizeObserver(()=>instance.invalidateSize());
  observer.observe(host.current);
  return ()=>{observer.disconnect();instance.remove();map.current=null;};
 },[interactive]);
 useEffect(()=>{marker.current?.setLatLng([lat,lng]);map.current?.setView([lat,lng]);},[lat,lng]);
 return <div className={'rounded-2xl border overflow-hidden '+className}>
  <div ref={host} className="relative z-0 h-72 sm:h-80" aria-label="Problem location map"/>
  <div className="p-3 text-xs"><p>{interactive?'Click the map or drag the pin to select the problem location.':'Reported location'}</p><p>{lat.toFixed(5)}, {lng.toFixed(5)}</p>{error&&<p role="alert">{error}</p>}</div>
 </div>;
}
