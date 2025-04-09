'use client';

import { useEffect, useState } from 'react';
import { PlaceData, parsePlacesCSV } from '@/utils/placesParser';
import Map from '@/components/Map';

export default function Places() {
  const [placesData, setPlacesData] = useState<PlaceData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await parsePlacesCSV();
      setPlacesData(data);
    };
    loadData();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Places in Caen</h1>
      <div className="mb-8">
        <Map places={placesData} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {placesData.map((place, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{place.name}</h2>
            <div className="mb-2">
              <span className="font-medium">Type:</span> {place.type}
            </div>
            <div className="mb-2">
              <span className="font-medium">Address:</span> {place.address}
            </div>
            {place.notes && (
              <div className="mt-4 text-gray-600">
                <p>{place.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
