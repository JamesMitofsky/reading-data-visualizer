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
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('all');

  useEffect(() => {
    const loadData = async () => {
      const data = await parseCSV();
      setReadingData(data);
    };
    loadData();
  }, []);

  // Filter books based on time range and completion status
  const filteredBooks = readingData.filter(book => {
    if (book.status !== 'Completed' || !book.dateFinished) return false;

    const finishDate = new Date(book.dateFinished);
    const now = new Date('2025-04-09'); // Using provided current time

    if (timeRange === 'month') {
      // Last month: if we're in April 2025, show March 2025
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      return finishDate.getFullYear() === lastMonth.getFullYear() &&
        finishDate.getMonth() === lastMonth.getMonth();
    } else if (timeRange === 'year') {
      // Last year: if we're in 2025, show books from April 2024 to March 2025
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      oneYearAgo.setMonth(now.getMonth());
      return finishDate >= oneYearAgo && finishDate < now;
    }
    return true; // 'all' time range
  });

  const totalBooks = filteredBooks.length;
  const totalPages = filteredBooks.reduce((sum, book) => sum + (book.pageCount || 0), 0);

  // Calculate genre distribution
  const genreCounts = filteredBooks.reduce((acc: { [key: string]: number }, book) => {
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
  const fictionCount = filteredBooks.filter(book => book.isFiction === true).length;
  // Count both explicit false and null (unspecified) as non-fiction
  const nonFictionCount = filteredBooks.filter(book => book.isFiction === false || book.isFiction === null).length;

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

    if (pagesPerDay >= 50) return 'Fast (50+ pages/day)';
    if (pagesPerDay >= 25) return 'Medium (25-49 pages/day)';
    return 'Slow (0-25 pages/day)';
  };

  const paceDistribution = filteredBooks.reduce((acc: { [key: string]: number }, book) => {
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
  const pageDistribution = filteredBooks.reduce((acc: { [key: string]: number }, book) => {
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
  const authorCounts = filteredBooks.reduce((acc: { [key: string]: number }, book) => {
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
  const monthlyStats = filteredBooks.reduce<MonthlyStats>((acc, book) => {
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
  const averageTimeToFinish = filteredBooks.reduce((sum, book) => {
    if (book.dateStarted && book.dateFinished) {
      const start = new Date(book.dateStarted);
      const end = new Date(book.dateFinished);
      return sum + (end.getTime() - start.getTime());
    }
    return sum;
  }, 0) / (filteredBooks.length || 1);

  const averageMonths = Math.round(averageTimeToFinish / (1000 * 60 * 60 * 24 * 30));
  const monthText = averageMonths === 1 ? 'month' : 'months';

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 ">James Mitofsky&apos;s Reading Statistics</h1>
        <div className='my-8'>
          <p className="text-lg">{totalBooks} books, {totalPages} pages</p>
          <p className="text-gray-600 mt-1">Average time to finish: {averageMonths} {monthText}</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded ${timeRange === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded ${timeRange === 'year'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Last Year
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded ${timeRange === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All Time
          </button>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No books recorded for this period</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
            {/* Books Table */}
            <div className="mt-20 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Genre
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBooks.map((book, index) => (
                    <tr key={`${book.title}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {book.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {book.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {book.genre}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}


        {/* All Books Table */}
        <div className="mt-20 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">All Books</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Genre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readingData.map((book, index) => (
                  <tr key={`${book.title}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {book.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {book.genre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${book.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                        ${book.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}
                        ${book.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${book.status === 'Abandoned' ? 'bg-red-100 text-red-800' : ''}
                        ${book.status === 'Not Started' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {book.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
