'use client';

import { useEffect, useState, useCallback } from 'react';
import { PlaceData, parsePlacesCSV } from '@/utils/placesParser';
import Map from '@/components/Map';

const extractCity = (address: string): string => {
  // Extract city from address (assumes format: street, postal code CITY, Country)
  const match = address.match(/\d{5}\s+([^,]+)/);
  return match ? match[1] : 'Other';
};

export default function Places() {
  const [placesData, setPlacesData] = useState<PlaceData[]>([]);
  const [groupedPlaces, setGroupedPlaces] = useState<Record<string, PlaceData[]>>({});
  const [flyToLocation, setFlyToLocation] = useState<((lat: number, lng: number) => void) | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await parsePlacesCSV();
      setPlacesData(data);
      
      // Group places by city
      const grouped = data.reduce((acc: Record<string, PlaceData[]>, place) => {
        const city = extractCity(place.address);
        if (!acc[city]) {
          acc[city] = [];
        }
        acc[city].push(place);
        return acc;
      }, {});
      setGroupedPlaces(grouped);
    };
    loadData();
  }, []);

  const handleMapReady = useCallback((flyToFn: (lat: number, lng: number) => void) => {
    setFlyToLocation(() => flyToFn);
  }, []);

  const handlePlaceClick = (place: PlaceData) => {
    if (flyToLocation) {
      // Smooth scroll to map
      document.querySelector('.map-container')?.scrollIntoView({ behavior: 'smooth' });
      // Fly to location
      flyToLocation(place.lat, place.lng);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Favorite Places</h1>
      <div className="mb-8 map-container">
        <Map places={placesData} onMapReady={handleMapReady} />
      </div>
      <div className="space-y-8">
        {Object.entries(groupedPlaces).map(([city, places]) => (
          <div key={city}>
            <h2 className="text-2xl font-semibold mb-4">{city}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {places.map((place, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => handlePlaceClick(place)}
                >
                  <h3 className="text-xl font-semibold mb-2">{place.name}</h3>
                  <div className="mb-2">
                    <span className="font-medium">{place.type}</span>
                  </div>
                  <div className="mb-2 text-gray-500 text-sm">
                    {place.address}
                  </div>
                  {place.notes && (
                    <div className="mt-4 text-gray-600">
                      <p>{place.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
