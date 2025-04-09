'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use environment variable for the access token
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  console.error('Missing Mapbox token! Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file');
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Place {
  name: string;
  lat: number;
  lng: number;
  address: string;
  type: string;
  rating?: number;
}

interface MapProps {
  places: Place[];
}

const Map = ({ places }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-0.3707, 49.1829], // Caen coordinates [lng, lat]
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Clean up markers
    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each place
    places.forEach(place => {
      // Create custom popup content
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${place.name}</h3>
          ${place.rating ? `<p style="margin: 4px 0;">Rating: ${place.rating}/10</p>` : ''}
          <p style="margin: 4px 0;">Type: ${place.type}</p>
          <p style="margin: 4px 0;">${place.address}</p>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker({
        color: '#ff3333',
      })
        .setLngLat([place.lng, place.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (places.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach(place => {
        bounds.extend([place.lng, place.lat]);
      });
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [places]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: '70vh',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
};

export default Map;
