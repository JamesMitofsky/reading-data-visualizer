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
      return `<svg fill="#e0c17c" height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 58.566 58.566" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M56.704,1.212C55.901,0.407,54.811,0,53.465,0c-2.722,0-6.374,1.744-9.834,4.569l-1.006,4.643 c-0.614,2.069,0.754,3.393,2.006,4.15c0.473,0.286,0.624,0.901,0.338,1.373c-0.188,0.311-0.519,0.482-0.856,0.482 c-0.177,0-0.355-0.047-0.517-0.145c-2.585-1.564-3.645-3.883-2.906-6.358c0,0-0.203-1.218-0.495-0.899 c-0.752,0.379-2.933,1.524-3.961,2.553c-0.302,0.302-0.575,0.622-0.834,0.949V17c-0.004,1.896,0.796,3.448,2.251,4.374 c0.466,0.297,0.604,0.915,0.307,1.381c-0.19,0.3-0.515,0.463-0.845,0.463c-0.184,0-0.369-0.051-0.536-0.156 c-2.023-1.288-3.182-3.498-3.177-6.063c0,0-0.089-0.952-0.118-0.715c-2.188,0.27-4.261,1.298-5.915,2.952 c-0.34,0.34-0.647,0.702-0.933,1.074V26c-0.019,1.891,0.771,3.441,2.222,4.377c0.464,0.3,0.598,0.919,0.299,1.383 c-0.191,0.297-0.514,0.458-0.842,0.458c-0.186,0-0.373-0.052-0.541-0.159c-2.02-1.303-3.163-3.514-3.138-6.068v-0.957 c-0.005,0.039-0.015,0.078-0.02,0.117c-2.188,0.27-4.261,1.298-5.915,2.952c-0.311,0.312-0.593,0.642-0.859,0.981V34 c-0.098,1.772,0.896,3.214,2.954,4.341c0.484,0.266,0.662,0.873,0.396,1.357c-0.182,0.332-0.524,0.52-0.878,0.52 c-0.162,0-0.327-0.039-0.479-0.123c-3.477-1.904-4.09-4.396-3.991-6.15c0,0-0.071-0.117-0.095,0.073 c-2.188,0.27-4.262,1.298-5.915,2.952c-0.293,0.293-0.547,0.591-0.783,0.895v4.136c-0.09,1.512,0.87,2.974,2.851,4.406 c0.447,0.324,0.548,0.949,0.225,1.396c-0.196,0.271-0.502,0.414-0.812,0.414c-0.203,0-0.408-0.062-0.585-0.189 c-2.572-1.861-3.809-3.909-3.677-6.088l0-0.744C2.631,45.681-2.133,53.221,1.28,56.635c1.245,1.245,3.328,1.932,5.866,1.932 c0.001,0,0,0,0.001,0c4.08,0,8.395-1.778,11.257-4.642l35-35c2.397-2.397,4.144-5.857,4.789-9.493 C58.829,5.853,58.273,2.78,56.704,1.212z"></path> </g></svg>`;
    case 'cafe':
    case 'café':
      return `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M17 11.6V15C17 18.3137 14.3137 21 11 21H9C5.68629 21 3 18.3137 3 15V11.6C3 11.2686 3.26863 11 3.6 11H16.4C16.7314 11 17 11.2686 17 11.6Z" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 9C12 8 12.7143 7 14.1429 7V7C15.7208 7 17 5.72081 17 4.14286V3.5" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 9V8.5C8 6.84315 9.34315 5.5 11 5.5V5.5C12.1046 5.5 13 4.60457 13 3.5V3" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 11H18.5C19.8807 11 21 12.1193 21 13.5C21 14.8807 19.8807 16 18.5 16H17" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
    case 'bar':
      return `<svg viewBox="0 0 24 24" fill="#7AC7A3" width="24" height="24">
        <path d="M21,5V3H3v2l8,9v5H6v2h12v-2h-5v-5l8-9z M7.43,7L5.66,5h12.69l-1.78,2H7.43z"/>
      </svg>`;
    case 'restaurant':
      return `<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 81.62" style="enable-background:new 0 0 122.88 81.62" xml:space="preserve"><style type="text/css">.st0{fill:#c7b3e3;fill-rule:evenodd;clip-rule:evenodd;}</style><g><path class="st0" d="M61.63,0c4.69,0,8.5,3.8,8.5,8.5c0,2.02-0.71,3.88-1.89,5.34c5.14,0.64,10.21,2.04,14.99,4.19 c17.51,7.87,31.18,25.79,31.2,53.73c0,1.04-0.85,1.89-1.89,1.89v0.01H10.72c-1.05,0-1.9-0.85-1.9-1.9c0-0.06,0-0.12,0.01-0.18 C8.9,43.74,22.56,25.88,40.02,18.03c4.78-2.15,9.85-3.55,14.99-4.19c-1.18-1.46-1.89-3.32-1.89-5.34C53.13,3.8,56.93,0,61.63,0 L61.63,0z M1.9,81.62c-1.05,0-1.9-0.85-1.9-1.9c0-1.05,0.85-1.9,1.9-1.9h119.09c1.05,0,1.9,0.85,1.9,1.9c0,1.05-0.85,1.9-1.9,1.9 H1.9L1.9,81.62z M12.63,69.86h97.99c-0.61-25.13-13.08-41.25-28.93-48.38c-6.32-2.84-13.19-4.26-20.06-4.26 c-6.88,0-13.74,1.42-20.06,4.26C25.71,28.61,13.24,44.73,12.63,69.86L12.63,69.86z M24.34,57.73c-0.31,1-1.37,1.56-2.37,1.25 c-1-0.31-1.56-1.37-1.25-2.37c1.9-6.07,4.88-11.08,8.85-15.13c3.96-4.03,8.87-7.08,14.63-9.25c0.98-0.37,2.07,0.13,2.44,1.1 c0.37,0.98-0.13,2.07-1.1,2.44c-5.25,1.98-9.71,4.73-13.27,8.36C28.73,47.74,26.05,52.24,24.34,57.73L24.34,57.73z"/></g></svg>`;
    case 'museum':
      return `<svg viewBox="0 0 24 24" fill="#FF7F7F" width="24" height="24">
        <path d="M12,2L2,8v2h20V8L12,2z M12,5l4,2.5L12,10L8,7.5L12,5z M20,20H4v-8H2v10h20V12h-2V20z"/>
      </svg>`;
    case 'library':
    case 'study space':
      return `<svg viewBox="0 0 24 24" fill="#7FB3D5" width="24" height="24">
        <path d="M21,5c-1.11-0.35-2.33-0.5-3.5-0.5c-1.95,0-4.05,0.4-5.5,1.5c-1.45-1.1-3.55-1.5-5.5-1.5S2.45,4.9,1,6v14.65 c0,0.25,0.25,0.5,0.5,0.5c0.1,0,0.15-0.05,0.25-0.05C3.1,20.45,5.05,20,6.5,20c1.95,0,4.05,0.4,5.5,1.5c1.35-0.85,3.8-1.5,5.5-1.5 c1.65,0,3.35,0.3,4.75,1.05c0.1,0.05,0.15,0.05,0.25,0.05c0.25,0,0.5-0.25,0.5-0.5V6C22.4,5.55,21.75,5.25,21,5z M21,18.5 c-1.1-0.35-2.3-0.5-3.5-0.5c-1.7,0-4.15,0.65-5.5,1.5V8c1.35-0.85,3.8-1.5,5.5-1.5c1.2,0,2.4,0.15,3.5,0.5V18.5z"/>
      </svg>`;
    case 'green space':
      return `<svg viewBox="0 0 24 24" fill="#66CDAA" width="24" height="24">
        <path d="M12,2L4,9h2v11h12V9h2L12,2z M12,17c-1.1,0-2-0.9-2-2c0-1.1,2-4,2-4s2,2.9,2,4C14,16.1,13.1,17,12,17z"/>
      </svg>`;
    default:
      return `<svg viewBox="0 0 24 24" fill="#85B8A4" width="24" height="24">
        <path d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5 s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z"/>
      </svg>`;
  }
};

const createCustomMarkerElement = (place: Place) => {
  const markerElement = document.createElement('div');
  markerElement.style.cursor = 'pointer';
  
  const root = document.createElement('div');
  root.style.display = 'flex';
  root.style.alignItems = 'center';
  root.style.justifyContent = 'center';
  root.style.width = '32px';
  root.style.height = '32px';
  root.style.background = 'white';
  root.style.borderRadius = '50%';
  root.style.padding = '4px';
  root.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  
  root.innerHTML = getIconForType(place.type);
  markerElement.appendChild(root);
  markerElement.title = `${place.name} (${place.type})`;
  
  return markerElement;
};

const Map = ({ places }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const flyToLocation = (lng: number, lat: number, zoom: number) => {
    map.current?.flyTo({
      center: [lng, lat],
      zoom,
      essential: true
    });
  };

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
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => flyToLocation(-0.358, 49.18, 14)} 
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          Go to Caen, France
        </button>
        <button 
          onClick={() => flyToLocation(7.0999, 50.7333, 14)} 
          style={{ 
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          Go to Bonn, Germany
        </button>
      </div>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '70vh',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
};

export default Map;
