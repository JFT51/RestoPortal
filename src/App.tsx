import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { Navigation } from './components/Navigation';
import { DetailedView } from './components/DetailedView';
import { DailyView } from './components/DailyView';
import { DayAnalysis } from './components/DayAnalysis';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useRestaurantData } from './hooks/useRestaurantData';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

function App() {
  const { data, loading, error } = useRestaurantData();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [benchmarkDate, setBenchmarkDate] = useState<Date | null>(null);

  useEffect(() => {
    let title = 'RestoPortal';
    if (selectedDate) {
      title += ` - ${format(selectedDate, 'dd MMM yyyy')}`;
      if (benchmarkDate) {
        title += ` vs ${format(benchmarkDate, 'dd MMM yyyy')}`;
      }
    }
    document.title = title;
  }, [selectedDate, benchmarkDate]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">RestoPortal</h1>
              {selectedDate && (
                <p className="mt-2 text-gray-600">
                  Analyzing {format(selectedDate, 'EEEE, dd MMMM yyyy')}
                  {benchmarkDate && ` compared to ${format(benchmarkDate, 'EEEE, dd MMMM yyyy')}`}
                </p>
              )}
            </div>
          </header>
          <Navigation data={data} />
          <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<DailyView data={data} loading={loading} error={error} />} />
              <Route path="/hourly" element={<DetailedView data={data} loading={loading} error={error} />} />
              <Route path="/day-analysis" element={<DayAnalysis 
                data={data} 
                loading={loading} 
                error={error} 
                onDateSelect={setSelectedDate}
                onBenchmarkSelect={setBenchmarkDate}
              />} />
              <Route path="/daily" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;