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
    if (book.genre) {
      acc[book.genre] = (acc[book.genre] || 0) + 1;
    }
    return acc;
  }, {});

  const genreData = {
    labels: Object.keys(genreCounts),
    datasets: [{
      data: Object.values(genreCounts),
      backgroundColor: [
        '#6b46c1', '#0ea5e9', '#10b981', '#ec4899', 
        '#f97316', '#ef4444', '#84cc16', '#06b6d4'
      ],
    }]
  };

  // Calculate fiction vs non-fiction
  const fictionCount = completedBooks.filter(book => book.genre === 'Fiction').length;
  const nonFictionCount = completedBooks.filter(book => book.genre === 'Non-Fiction').length;

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
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const authorData = {
    labels: topAuthors.map(([author]) => author),
    datasets: [{
      data: topAuthors.map(([,count]) => count),
      backgroundColor: ['#0ea5e9'],
    }]
  };

  // Calculate books and pages by month
  const monthlyStats = completedBooks.reduce((acc: { 
    books: { [key: string]: number }, 
    pages: { [key: string]: number } 
  }, book) => {
    if (book.dateFinished) {
      const date = new Date(book.dateFinished);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      
      acc.books[monthKey] = (acc.books[monthKey] || 0) + 1;
      acc.pages[monthKey] = (acc.pages[monthKey] || 0) + (book.pageCount || 0);
    }
    return acc;
  }, { books: {}, pages: {} });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
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

  return (
    <div className="min-h-screen p-8 bg-white">
      <main className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Read</h1>
          <p className="text-xl">{totalBooks} books, {totalPages} pages</p>
          <p className="text-gray-600 mt-2">Average time to finish: {averageMonths} months</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Genres Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Genres</h2>
            <Bar data={genreData} options={{ indexAxis: 'y' }} />
          </div>

          {/* Pace Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Pace</h2>
            <Pie data={paceData} />
          </div>

          {/* Page Count Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Page Numbers</h2>
            <Pie data={pageCountData} />
          </div>

          {/* Fiction/Non-fiction Split */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Fiction/Nonfiction</h2>
            <Pie data={fictionData} />
          </div>

          {/* Most Read Authors */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Most Read Authors</h2>
            <Bar data={authorData} options={{ 
              indexAxis: 'y',
              plugins: {
                legend: {
                  display: false
                }
              }
            }} />
          </div>

          {/* Books and Pages Over Time */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Number of books and pages</h2>
            <Line 
              data={monthlyData} 
              options={{
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
