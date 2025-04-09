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
}

interface MapProps {
  places: Place[];
}

const getIconForType = (type: string) => {
  // Get first type if multiple are provided (split by comma or comma+space)
  const firstType = type.split(/,\s*|,/)[0];
  
  switch (firstType.toLowerCase()) {
    case 'bakery':
      return '🥖';
    case 'cafe':
      return '☕';
    case 'café':
      return '☕';
    case 'bar':
      return '🍻';
    case 'restaurant':
      return '🍽️';
    case 'museum':
      return '🏛️';
    case 'library':
      return '📚';
    case 'green space':
      return '🌳';
    case 'study space':
      return '📚';
    default:
      return '📍';
  }
};

const createCustomMarkerElement = (place: Place) => {
  const markerElement = document.createElement('div');
  markerElement.style.fontSize = '32px';
  markerElement.style.cursor = 'pointer';
  markerElement.textContent = getIconForType(place.type);
  markerElement.title = `${place.name} (${place.type})`;
  return markerElement;
};

const Map = ({ places }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [10, 50], // Centered on Europe
      zoom: 1
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
    if (!map.current || !places.length) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    places.forEach(place => {
      const markerElement = createCustomMarkerElement(place);
      
      const marker = new mapboxgl.Marker({
        element: markerElement
      })
        .setLngLat([place.lng, place.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <h3>${place.name}</h3>
              <p>${place.type}</p>
              <p>${place.address}</p>
            `)
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit map to show all markers
    const bounds = new mapboxgl.LngLatBounds();
    places.forEach(place => {
      bounds.extend([place.lng, place.lat]);
    });
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
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
