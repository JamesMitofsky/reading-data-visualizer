import { parse } from 'papaparse';

export interface PlaceData {
  name: string;
  type: string;
  address: string;
  notes?: string;
  lat: number;
  lng: number;
}

interface CSVRow {
  'Name': string;
  'Type': string;
  'Address': string;
  'Notes': string;
  'Latitude': string;
  'Longitude': string;
}

export const parsePlacesCSV = async (): Promise<PlaceData[]> => {
  const response = await fetch('/places-data.csv');
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    parse(csvText, {
      header: true,
      complete: (results: { data: CSVRow[] }) => {
        const data = results.data.map(row => ({
          name: row['Name'],
          type: row['Type'],
          address: row['Address'],
          notes: row['Notes'],
          lat: parseFloat(row['Latitude'] || '49.1829'), // Default to Caen's coordinates
          lng: parseFloat(row['Longitude'] || '-0.3707')
        }));
        resolve(data.filter(place => place.name && place.address));
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};
