'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeolocation } from '@uidotdev/usehooks';

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
  onMapReady?: (flyToFn: (lat: number, lng: number) => void) => void;
}

const getIconForType = (type: string) => {
  // Split types and trim whitespace
  const types = type.toLowerCase().split(/,\s*/).map(t => t.trim());

  // Priority order for icons when multiple types exist
  if (types.includes('bakery')) {
    return `<svg fill="#e0c17c" height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 58.566 58.566" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M56.704,1.212C55.901,0.407,54.811,0,53.465,0c-2.722,0-6.374,1.744-9.834,4.569l-1.006,4.643 c-0.614,2.069,0.754,3.393,2.006,4.15c0.473,0.286,0.624,0.901,0.338,1.373c-0.188,0.311-0.519,0.482-0.856,0.482 c-0.177,0-0.355-0.047-0.517-0.145c-2.585-1.564-3.645-3.883-2.906-6.358c0,0-0.203-1.218-0.495-0.899 c-0.752,0.379-2.933,1.524-3.961,2.553c-0.302,0.302-0.575,0.622-0.834,0.949V17c-0.004,1.896,0.796,3.448,2.251,4.374 c0.466,0.297,0.604,0.915,0.307,1.381c-0.19,0.3-0.515,0.463-0.845,0.463c-0.184,0-0.369-0.051-0.536-0.156 c-2.023-1.288-3.182-3.498-3.177-6.063c0,0-0.089-0.952-0.118-0.715c-2.188,0.27-4.261,1.298-5.915,2.952 c-0.34,0.34-0.647,0.702-0.933,1.074V26c-0.019,1.891,0.771,3.441,2.222,4.377c0.464,0.3,0.598,0.919,0.299,1.383 c-0.191,0.297-0.514,0.458-0.842,0.458c-0.186,0-0.373-0.052-0.541-0.159c-2.02-1.303-3.163-3.514-3.138-6.068v-0.957 c-0.005,0.039-0.015,0.078-0.02,0.117c-2.188,0.27-4.261,1.298-5.915,2.952c-0.311,0.312-0.593,0.642-0.859,0.981V34 c-0.098,1.772,0.896,3.214,2.954,4.341c0.484,0.266,0.662,0.873,0.396,1.357c-0.182,0.332-0.524,0.52-0.878,0.52 c-0.162,0-0.327-0.039-0.479-0.123c-3.477-1.904-4.09-4.396-3.991-6.15c0,0-0.071-0.117-0.095,0.073 c-2.188,0.27-4.262,1.298-5.915,2.952c-0.293,0.293-0.547,0.591-0.783,0.895v4.136c-0.09,1.512,0.87,2.974,2.851,4.406 c0.447,0.324,0.548,0.949,0.225,1.396c-0.196,0.271-0.502,0.414-0.812,0.414c-0.203,0-0.408-0.062-0.585-0.189 c-2.572-1.861-3.809-3.909-3.677-6.088l0-0.744C2.631,45.681-2.133,53.221,1.28,56.635c1.245,1.245,3.328,1.932,5.866,1.932 c0.001,0,0,0,0.001,0c4.08,0,8.395-1.778,11.257-4.642l35-35c2.397-2.397,4.144-5.857,4.789-9.493 C58.829,5.853,58.273,2.78,56.704,1.212z"></path> </g></svg>`;
  }

  if (types.includes('working space')) {
    return `<svg fill="#4A90E2" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase-business-icon lucide-briefcase-business"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
    </svg>`;
  }

  if (types.includes('restaurant')) {
    return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 81.62" width="24" height="24">
      <path fill="#c7b3e3" fill-rule="evenodd" clip-rule="evenodd" d="M61.63,0c4.97,0,8.5,3.8,8.5,8.5c0,2.02-0.71,3.88-1.89,5.34c5.14,0.64,10.21,2.04,14.99,4.19 c17.51,7.87,31.18,25.79,31.2,53.73c0,1.04-0.85,1.89-1.89,1.89v0.01H10.72c-1.05,0-1.9-0.85-1.9-1.9c0-0.06,0-0.12,0.01-0.18 C8.9,43.74,22.56,25.88,40.02,18.03c4.78-2.15,9.85-3.55,14.99-4.19c-1.18-1.46-1.89-3.32-1.89-5.34C53.13,3.8,56.93,0,61.63,0 L61.63,0z"/>
    </svg>`;
  }

  if (types.includes('bar')) {
    return `<svg viewBox="0 0 24 24" fill="#7AC7A3" width="24" height="24">
      <path d="M21,5V3H3v2l8,9v5H6v2h12v-2h-5v-5l8-9z M7.43,7L5.66,5h12.69l-1.78,2H7.43z"/>
    </svg>`;
  }

  if (types.includes('museum')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 16 16" height="16" width="16"><path d="M12.275 0.95H2.725a1.7937500000000002 1.7937500000000002 0 1 0 1.68125 2.3874999999999997H10.625a1.7874999999999999 1.7874999999999999 0 1 0 1.68125 -2.3874999999999997Z" fill="none" stroke="#800080" stroke-miterlimit="10" stroke-width="1"></path><path d="m10.5875 3.3375 -6.175000000000001 0" fill="none" stroke="#800080" stroke-miterlimit="10" stroke-width="1"></path><path d="m11.08125 14.675 0 -10.60625" fill="none" stroke="#800080" stroke-miterlimit="10" stroke-width="1"></path><path d="m3.9187499999999997 14.675 0 -10.60625" fill="none" stroke="#800080" stroke-miterlimit="10" stroke-width="1"></path><path d="m6.30625 5.725 0 8.95" fill="none" stroke="#800080" stroke-miterlimit="10" stroke-width="1"></path><path d="m8.69375 5.725 0 8.95" fill="none" stroke="#800080" stroke-miterlimit="10" stroke-width="1"></path></svg>`;
  }

  if (types.includes('accommodation')) {
    return `<svg fill="#795548" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h14v-8h3l-3-2.7z"/>
    </svg>`;
  }

  if (types.includes('view')) {
    return `<svg fill="#FFB74D" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>`;
  }

  if (types.includes('greenery')) {
    return `<svg fill="#8BC34A" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4.28-.89.44-1.42.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5z"/>
    </svg>`;
  }

  if (types.includes('café')) {
    return `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M17 11.6V15C17 18.3137 14.3137 21 11 21H9C5.68629 21 3 18.3137 3 15V11.6C3 11.2686 3.26863 11 3.6 11H16.4C16.7314 11 17 11.2686 17 11.6Z" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 9C12 8 12.7143 7 14.1429 7V7C15.7208 7 17 5.72081 17 4.14286V3.5" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 9V8.5C8 6.84315 9.34315 5.5 11 5.5V5.5C12.1046 5.5 13 4.60457 13 3.5V3" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 11H18.5C19.8807 11 21 12.1193 21 13.5C21 14.8807 19.8807 16 18.5 16H17" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  }

  if (types.includes('activities')) {
    return `<svg fill="#FF725C" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`;
  }

  // Default to generic point of interest icon if none of the above match
  return `<?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M17 11.6V15C17 18.3137 14.3137 21 11 21H9C5.68629 21 3 18.3137 3 15V11.6C3 11.2686 3.26863 11 3.6 11H16.4C16.7314 11 17 11.2686 17 11.6Z" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 9C12 8 12.7143 7 14.1429 7V7C15.7208 7 17 5.72081 17 4.14286V3.5" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 9V8.5C8 6.84315 9.34315 5.5 11 5.5V5.5C12.1046 5.5 13 4.60457 13 3.5V3" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 11H18.5C19.8807 11 21 12.1193 21 13.5C21 14.8807 19.8807 16 18.5 16H17" stroke="#FF9999" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
};

const createCustomMarkerElement = (place: Place, mapInstance: mapboxgl.Map) => {
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

  // Create popup
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    offset: [0, -8]
  }).setHTML(`
    <div style="padding: 8px;">
      <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #666;">${place.name}</h3>
      <p style="margin: 0; font-size: 12px; color: #666;">${place.type}</p>
      ${place.address ? `<p style="margin: 4px 0 0; font-size: 12px; color: #666;">${place.address}</p>` : ''}
    </div>
  `);

  // Show/hide popup on click
  let isPopupVisible = false;
  markerElement.addEventListener('click', () => {
    if (isPopupVisible) {
      popup.remove();
      isPopupVisible = false;
    } else {
      popup.addTo(mapInstance);
      isPopupVisible = true;
    }

    // Fly to marker location with animation
    mapInstance.flyTo({
      center: [place.lng, place.lat],
      zoom: 14,
      essential: true
    });
  });

  return { element: markerElement, popup };
};

const Map = ({ places, onMapReady }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ marker: mapboxgl.Marker; popup: mapboxgl.Popup }[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const { latitude, longitude, error: geoError, loading } = useGeolocation();

  // Check if device is iOS/Safari
  const isIOSorSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                        /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Separate function to request location
  const requestLocation = useCallback(() => {
    if (!latitude || !longitude) return;

    // Create user location marker element
    const userMarkerEl = document.createElement('div');
    userMarkerEl.style.width = '20px';
    userMarkerEl.style.height = '20px';
    userMarkerEl.style.borderRadius = '50%';
    userMarkerEl.style.background = '#4A90E2';
    userMarkerEl.style.border = '3px solid white';
    userMarkerEl.style.boxShadow = '0 0 0 2px #4A90E2';
    userMarkerEl.title = 'Your Location';

    // Add pulse animation
    const pulseEl = document.createElement('div');
    pulseEl.style.position = 'absolute';
    pulseEl.style.width = '20px';
    pulseEl.style.height = '20px';
    pulseEl.style.borderRadius = '50%';
    pulseEl.style.background = 'rgba(74, 144, 226, 0.3)';
    pulseEl.style.animation = 'pulse 2s infinite';
    userMarkerEl.appendChild(pulseEl);

    // Add the CSS animation
    if (!document.getElementById('location-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'location-pulse-style';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Add marker to map
    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
    }
    if (map.current) {
      userLocationMarker.current = new mapboxgl.Marker({ element: userMarkerEl })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Fly to user location
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        essential: true
      });
    }
  }, [latitude, longitude]);

  // Handle user location changes
  useEffect(() => {
    if (!showUserLocation) {
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
        userLocationMarker.current = null;
      }
    } else if (latitude && longitude) {
      requestLocation();
    } else if (geoError) {
      let errorMessage = 'Unable to get your location. ';
      
      if (geoError.message.includes('denied')) {
        errorMessage += 'Please enable location access in your device settings and try again.';
      } else if (geoError.message.includes('timeout')) {
        errorMessage += 'The request timed out. Please try again.';
      } else if (geoError.message.includes('unavailable')) {
        errorMessage += 'Location service is unavailable. Please check your device settings.';
      } else {
        errorMessage += 'Please make sure location services are enabled.';
      }
      
      alert(errorMessage);
      setShowUserLocation(false);
    }
  }, [showUserLocation, latitude, longitude, geoError, requestLocation]);

  const flyToLocation = useCallback((lat: number, lng: number) => {
    map.current?.flyTo({
      center: [lng, lat],
      zoom: 14,
      essential: true
    });
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-35, 45], // Position over North Atlantic to show Vermont and Europe
      zoom: 2.5 // Zoomed out to show both continents
    });

    // Hide POI labels and symbols after map loads
    map.current.on('load', () => {
      const layersToHide = [
        'place-label', 'water-label', 'poi-label',
        'road-number-shield', 'transit-label',
      ];

      const pedestrianLayerIds = [
        // 'road-pedestrian',
        'road-pedestrian-case',
        // 'tunnel-pedestrian',
        'road-path',
        'road-path-bg',
        'road-steps',
        'road-steps-bg',
        'road-pedestrian-polygon-fill',
        'road-pedestrian-polygon-pattern',
        'airport-label',
        'road-oneway-arrow-blue',
        'road-oneway-arrow-white',
        'tunnel-oneway-arrow-blue',
        'tunnel-oneway-arrow-white',
        'building-number-label'
      ];

      const allLayersToHide = [...layersToHide, ...pedestrianLayerIds];

      allLayersToHide.forEach(id => {
        if (map.current?.getLayer(id)) {
          map.current?.setLayoutProperty(id, 'visibility', 'none');
        }
      });

      map.current?.setPaintProperty('road-label', 'text-opacity', 0.6); // 0 to 1
      map.current?.setPaintProperty('path-pedestrian-label', 'text-opacity', 0.5); // 0 to 1
    });

    // Re-run this every time  zoom changes
    map.current?.on('zoom', () => map.current?.setPaintProperty('road-label', 'text-opacity', 0.2)); // 0 to 1
    // Notify parent component that map is ready and pass the flyTo function
    onMapReady?.(flyToLocation);

    // Cleanup function
    return () => {
      map.current?.remove();
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
      }
    };
  }, [places, onMapReady, flyToLocation]);

  useEffect(() => {
    if (!map.current || !places) return;

    // Clear existing markers
    markers.current.forEach(({ marker }) => marker.remove());
    markers.current = [];

    // Add new markers
    places.forEach((place) => {
      const { element, popup } = createCustomMarkerElement(place, map.current!);
      const marker = new mapboxgl.Marker({ element: element })
        .setLngLat([place.lng, place.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push({ marker, popup });
    });
  }, [places]);

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <button
          onClick={() => flyToLocation(49.18, -0.358)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
        >
          Go to Caen, France
        </button>
        <button
          onClick={() => flyToLocation(50.7333, 7.0999)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
        >
          Go to Bonn, Germany
        </button>
        {/* Hide location button on iOS/Safari */}
        {!isIOSorSafari && (
          <button
            onClick={() => {
              if (showUserLocation) {
                if (userLocationMarker.current) {
                  userLocationMarker.current.remove();
                  userLocationMarker.current = null;
                }
              } else {
                setShowUserLocation(true);
              }
            }}
            onTouchStart={(e) => {
              // Prevent double-tap zoom on iOS
              e.preventDefault();
            }}
            style={{
              // Disable grey highlight on tap in iOS
              WebkitTapHighlightColor: 'transparent',
              // Prevent text selection
              WebkitUserSelect: 'none',
              userSelect: 'none',
              // Ensure the button is clickable
              cursor: 'pointer',
              // Prevent iOS text size adjust
              WebkitTextSizeAdjust: 'none'
            }}
            className={`flex items-center gap-2 ml-4 px-3 py-2 rounded-lg ${
              showUserLocation 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            } hover:bg-opacity-80 transition-colors active:bg-opacity-70 ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
            disabled={loading}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {loading ? (
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
              ) : (
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
              )}
            </svg>
            {loading ? 'Getting location...' : 'Show my location'}
          </button>
        )}
      </div>
      <div ref={mapContainer} style={{ width: '100%', height: '70vh', borderRadius: '0.5rem' }} />
    </div>
  );
};

export default Map;
