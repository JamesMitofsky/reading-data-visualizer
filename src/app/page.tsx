'use client';

import { useEffect, useState } from 'react';
import { ReadingData, parseCSV } from '@/utils/csvParser';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

interface MonthlyStats {
  books: { [key: string]: number };
  pages: { [key: string]: number };
  yearMonths: { [key: string]: string };
}

export default function Home() {
  const [readingData, setReadingData] = useState<ReadingData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await parseCSV();
      setReadingData(data);
    };
    loadData();
  }, []);

  // Only include completed books
  const completedBooks = readingData.filter(book => book.status === 'Completed');
  const totalBooks = completedBooks.length;
  const totalPages = completedBooks.reduce((sum, book) => sum + (book.pageCount || 0), 0);

  // Calculate genre distribution
  const genreCounts = completedBooks.reduce((acc: { [key: string]: number }, book) => {
    if (!book.genre) return acc;

    // Split genres and trim whitespace
    const genres = book.genre.split(',').map(g => g.trim());

    // Count each genre separately
    genres.forEach(genre => {
      if (genre) {
        acc[genre] = (acc[genre] || 0) + 1;
      }
    });

    return acc;
  }, {});

  // Sort genres by count
  const sortedGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .reduce((obj: { [key: string]: number }, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});

  const genreData = {
    labels: Object.keys(sortedGenres),
    datasets: [{
      data: Object.values(sortedGenres),
      backgroundColor: [
        '#6b46c1', '#0ea5e9', '#10b981', '#ec4899',
        '#f97316', '#ef4444', '#84cc16', '#06b6d4'
      ],
      label: 'Books per Genre'
    }]
  };

  // Calculate fiction vs non-fiction using isFiction field
  const fictionCount = completedBooks.filter(book => book.isFiction === true).length;
  // Count both explicit false and null (unspecified) as non-fiction
  const nonFictionCount = completedBooks.filter(book => book.isFiction === false || book.isFiction === null).length;

  const fictionData = {
    labels: ['Fiction', 'Non-fiction'],
    datasets: [{
      data: [fictionCount, nonFictionCount],
      backgroundColor: ['#ec4899', '#6b46c1'],
    }]
  };

  // Calculate reading pace (based on date differences)
  const calculateReadingPace = (book: ReadingData) => {
    if (!book.dateStarted || !book.dateFinished) return null;
    const start = new Date(book.dateStarted);
    const end = new Date(book.dateFinished);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const pagesPerDay = (book.pageCount || 0) / days;

    if (pagesPerDay >= 50) return 'Fast';
    if (pagesPerDay >= 25) return 'Medium';
    return 'Slow';
  };

  const paceDistribution = completedBooks.reduce((acc: { [key: string]: number }, book) => {
    const pace = calculateReadingPace(book);
    if (pace) {
      acc[pace] = (acc[pace] || 0) + 1;
    }
    return acc;
  }, {});

  const paceData = {
    labels: Object.keys(paceDistribution),
    datasets: [{
      data: Object.values(paceDistribution),
      backgroundColor: ['#f97316', '#ef4444', '#6b46c1'],
    }]
  };

  // Calculate page count distribution
  const pageDistribution = completedBooks.reduce((acc: { [key: string]: number }, book) => {
    if (!book.pageCount) return acc;

    if (book.pageCount >= 500) {
      acc['500+'] = (acc['500+'] || 0) + 1;
    } else if (book.pageCount >= 300) {
      acc['300-499'] = (acc['300-499'] || 0) + 1;
    } else {
      acc['<300'] = (acc['<300'] || 0) + 1;
    }
    return acc;
  }, {});

  const pageCountData = {
    labels: Object.keys(pageDistribution),
    datasets: [{
      data: Object.values(pageDistribution),
      backgroundColor: ['#0ea5e9', '#10b981', '#f97316'],
    }]
  };

  // Calculate most read authors
  const authorCounts = completedBooks.reduce((acc: { [key: string]: number }, book) => {
    if (book.author) {
      acc[book.author] = (acc[book.author] || 0) + 1;
    }
    return acc;
  }, {});

  // Sort authors by count and take top 5
  const topAuthors = Object.entries(authorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const authorData = {
    labels: topAuthors.map(([author]) => author),
    datasets: [{
      data: topAuthors.map(([, count]) => count),
      backgroundColor: ['#0ea5e9'],
    }]
  };

  // Calculate books and pages by month
  const monthlyStats = completedBooks.reduce<MonthlyStats>((acc, book) => {
    if (book.dateFinished) {
      const date = new Date(book.dateFinished);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      const yearMonth = `${date.getFullYear()}-${date.getMonth()}`;

      acc.yearMonths[monthKey] = yearMonth;
      acc.books[monthKey] = (acc.books[monthKey] || 0) + 1;
      acc.pages[monthKey] = (acc.pages[monthKey] || 0) + (book.pageCount || 0);
    }
    return acc;
  }, { books: {}, pages: {}, yearMonths: {} });

  // Get current date and calculate last 12 months
  const currentDate = new Date('2025-04-09'); // Using the provided current time
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);
    months.push(date.toLocaleString('default', { month: 'short' }));
  }

  const monthlyData = {
    labels: months,
    datasets: [
      {
        label: 'Books Read',
        data: months.map(month => monthlyStats.books[month] || 0),
        borderColor: '#0ea5e9',
        backgroundColor: '#0ea5e9',
        yAxisID: 'y',
      },
      {
        label: 'Pages Read',
        data: months.map(month => monthlyStats.pages[month] || 0),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        yAxisID: 'y1',
      }
    ]
  };

  // Calculate average time to finish
  const averageTimeToFinish = completedBooks.reduce((sum, book) => {
    if (book.dateStarted && book.dateFinished) {
      const start = new Date(book.dateStarted);
      const end = new Date(book.dateFinished);
      return sum + (end.getTime() - start.getTime());
    }
    return sum;
  }, 0) / (completedBooks.length || 1);

  const averageMonths = Math.round(averageTimeToFinish / (1000 * 60 * 60 * 24 * 30));
  const monthText = averageMonths === 1 ? 'month' : 'months';

  return (
    <div className="min-h-screen p-4 bg-white">
      <main className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1">James&apos; Reading Data</h1>
          <p className="text-lg">{totalBooks} books, {totalPages} pages</p>
          <p className="text-gray-600 mt-1">Average time to finish: {averageMonths} {monthText}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Books and Pages Over Time */}
          <div className="p-4 flex items-center justify-center">
            <div className="w-full" >
              <Line
                data={monthlyData}
                options={{
                  responsive: true,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  plugins: {
                    title: {
                      display: true,
                      text: 'Monthly Reading Progress'
                    },
                    legend: {
                      position: 'bottom' as const
                    }
                  },
                  scales: {
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                      title: {
                        display: true,
                        text: 'Books Read'
                      }
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      title: {
                        display: true,
                        text: 'Pages Read'
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>


          {/* Genres Chart */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <Pie
                data={genreData}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'Genre Distribution'
                    },
                    legend: {
                      position: 'bottom' as const
                    }
                  },
                  radius: '70%' // Decreased from default
                }}
              />
            </div>
          </div>

          {/* Pace Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <Pie
                data={paceData}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'Pace'
                    },
                    legend: {
                      position: 'bottom' as const
                    }
                  },
                  radius: '70%' // Decreased from default
                }}
              />
            </div>
          </div>

           {/* Most Read Authors */}
           <div className="p-4 flex items-center justify-center">
            <div className="w-full" style={{ height: '250px' }}>
              <Bar data={authorData} options={{
                indexAxis: 'y',
                plugins: {
                  title: {
                    display: true,
                    text: 'Most Read Authors'
                  },
                  legend: {
                    display: false
                  }
                }
              }} />
            </div>
          </div>

          {/* Page Count Distribution */}
          <div className="p-4 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <Pie
                data={pageCountData}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'Page Numbers'
                    },
                    legend: {
                      position: 'bottom' as const
                    }
                  },
                  radius: '70%' // Decreased from default
                }}
              />
            </div>
          </div>

          {/* Fiction/Non-fiction Split */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <Pie
                data={fictionData}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'Fiction vs Non-fiction'
                    },
                    legend: {
                      position: 'bottom' as const
                    }
                  },
                  radius: '70%' // Decreased from default
                }}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
