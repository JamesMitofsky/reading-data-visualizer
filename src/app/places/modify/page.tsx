'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

interface Place {
  Name: string;
  Type: string[];
  Address: string;
  Latitude: string;
  Longitude: string;
  Notes: string;
}

type RawPlace = Omit<Place, 'Type'> & { Type: string };

export default function ModifyPlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [open, setOpen] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/places-data.csv');
      const text = await response.text();
      
      Papa.parse<RawPlace>(text, {
        header: true,
        complete: (results) => {
          const parsedPlaces = results.data
            .map(row => ({
              ...row,
              Type: row.Type ? row.Type.split(',').map((t: string) => t.trim()) : []
            }))
            .filter(place => place.Name);

          // Extract unique types from all type arrays
          const uniqueTypes = [...new Set(
            parsedPlaces.flatMap(place => place.Type)
          )].filter(Boolean);
          
          setPlaces(parsedPlaces as Place[]);
          setTypes(uniqueTypes);
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleChange = (index: number, field: keyof Place, value: string | string[]) => {
    const updatedPlaces = [...places];
    updatedPlaces[index] = { ...updatedPlaces[index], [field]: value };
    setPlaces(updatedPlaces);
  };

  const addNewRow = () => {
    setPlaces([...places, { Name: '', Type: [], Address: '', Latitude: '', Longitude: '', Notes: '' }]);
  };

  const exportCSV = () => {
    const exportData = places.map(place => ({
      ...place,
      Type: place.Type.join(', ') // Join types back into comma-separated string
    }));

    const csv = Papa.unparse(exportData, {
      quotes: true, // Force quotes around all fields
      quoteChar: '"'
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'places-data.csv';
    link.click();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Modify Places</h1>
        <div className="space-x-4">
          <Button onClick={addNewRow}>Add New Place</Button>
          <Button onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[200px]">Type</TableHead>
              <TableHead className="w-[250px]">Address</TableHead>
              <TableHead className="w-[100px]">Latitude</TableHead>
              <TableHead className="w-[100px]">Longitude</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {places.map((place, index) => (
              <TableRow key={index}>
                <TableCell className="p-0">
                  <Input
                    value={place.Name}
                    onChange={(e) => handleChange(index, 'Name', e.target.value)}
                    className="border-0 focus-visible:ring-0"
                  />
                </TableCell>
                <TableCell className="p-0">
                  <Popover open={open[index]} onOpenChange={(isOpen) => setOpen({ ...open, [index]: isOpen })}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between border-0 rounded-none h-10"
                      >
                        <span className="truncate">
                          {place.Type.join(', ') || "Select type..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search or add type..." 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = (e.target as HTMLInputElement).value.trim();
                              if (input && !types.includes(input)) {
                                setTypes([...types, input]);
                                const updatedTypes = [...place.Type];
                                if (!updatedTypes.includes(input)) {
                                  updatedTypes.push(input);
                                  handleChange(index, 'Type', updatedTypes);
                                }
                                setOpen({ ...open, [index]: false });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <CommandEmpty>Press Enter to add as new type</CommandEmpty>
                        <CommandGroup>
                          <div className="p-2">
                            <div className="mb-2 text-sm text-muted-foreground">Selected:</div>
                            {place.Type.map((selectedType) => (
                              <div
                                key={selectedType}
                                className="flex items-center gap-2 p-1"
                              >
                                <button
                                  onClick={() => {
                                    const updatedTypes = place.Type.filter(
                                      (t) => t !== selectedType
                                    );
                                    handleChange(index, 'Type', updatedTypes);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  ×
                                </button>
                                {selectedType}
                              </div>
                            ))}
                          </div>
                          <div className="px-2 pt-2 pb-1 text-sm text-muted-foreground">
                            Available types:
                          </div>
                          {types
                            .filter((type) => !place.Type.includes(type))
                            .map((type) => (
                              <CommandItem
                                key={type}
                                value={type}
                                onSelect={() => {
                                  const updatedTypes = [...place.Type];
                                  if (!updatedTypes.includes(type)) {
                                    updatedTypes.push(type);
                                  }
                                  handleChange(index, 'Type', updatedTypes);
                                  setOpen({ ...open, [index]: false });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 opacity-0"
                                  )}
                                />
                                {type}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell className="p-0">
                  <Input
                    value={place.Address}
                    onChange={(e) => handleChange(index, 'Address', e.target.value)}
                    className="border-0 focus-visible:ring-0"
                  />
                </TableCell>
                <TableCell className="p-0">
                  <Input
                    value={place.Latitude}
                    onChange={(e) => handleChange(index, 'Latitude', e.target.value)}
                    className="border-0 focus-visible:ring-0"
                  />
                </TableCell>
                <TableCell className="p-0">
                  <Input
                    value={place.Longitude}
                    onChange={(e) => handleChange(index, 'Longitude', e.target.value)}
                    className="border-0 focus-visible:ring-0"
                  />
                </TableCell>
                <TableCell className="p-0">
                  <Input
                    value={place.Notes}
                    onChange={(e) => handleChange(index, 'Notes', e.target.value)}
                    className="border-0 focus-visible:ring-0"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <a href="https://www.gps-coordinates.net/" target="_blank" rel="noopener noreferrer" className='mt-20 block underline text-blue-500'>Address to coordinate converter</a>
    </div>
  );
}
