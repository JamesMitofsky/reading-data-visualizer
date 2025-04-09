import { parse } from 'papaparse';

export interface ReadingData {
  title: string;
  dateStarted: string;
  dateFinished: string;
  status: string;
  author: string;
  genre: string;
  pageCount: number;
  notes?: string;
  rating?: number;
}

interface CSVRow {
  'Book Title': string;
  'Date Started': string;
  'Date Finished': string;
  'Status': string;
  'Author (AI managed)': string;
  'Genre (AI managed)': string;
  'Page Count (AI managed)': string;
  'Notes': string;
  'Rating': string;
}

export const parseCSV = async (): Promise<ReadingData[]> => {
  const response = await fetch('/books-data.csv');
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    parse(csvText, {
      header: true,
      transform: (value, field) => {
        if (field === 'Page Count (AI managed)') {
          return value ? parseInt(value, 10) : 0;
        }
        return value;
      },
      complete: (results: { data: CSVRow[] }) => {
        const data = results.data.map(row => ({
          title: row['Book Title'],
          dateStarted: row['Date Started'],
          dateFinished: row['Date Finished'],
          status: row['Status'],
          author: row['Author (AI managed)'],
          genre: row['Genre (AI managed)'],
          pageCount: row['Page Count (AI managed)'] ? parseInt(row['Page Count (AI managed)'], 10) : 0,
          notes: row['Notes'],
          rating: row['Rating'] ? parseInt(row['Rating'], 10) : undefined
        }));
        resolve(data.filter(book => book.title && book.author));
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};
