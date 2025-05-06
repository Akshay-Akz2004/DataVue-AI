import { useMemo, useState, useEffect } from 'react';
import { generateInsights } from '../utils/groqService';

interface DataSummaryProps {
  data: any[];
  headers: string[];
}

interface ColumnStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  count: number;
  numericCount: number;
}

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error('GROQ API key is not defined in environment variables');
}

// Type assertion since we've checked for undefined
const apiKey: string = GROQ_API_KEY;

export default function DataSummary({ data, headers }: DataSummaryProps) {
  const [insights, setInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const statistics = useMemo(() => {
    const stats: Record<string, ColumnStats> = {};

    headers.forEach(header => {
      const values = data.map(row => row[header]);
      const numericValues = values
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));

      if (numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const sum = numericValues.reduce((a, b) => a + b, 0);

        stats[header] = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: sum / numericValues.length,
          median: sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)],
          count: values.length,
          numericCount: numericValues.length,
        };
      }
    });

    return stats;
  }, [data, headers]);

  useEffect(() => {
    const generateDataInsights = async () => {
      if (Object.keys(statistics).length === 0) return;

      setIsLoadingInsights(true);
      try {
        const statsDescription = Object.entries(statistics)
          .map(([column, stats]) => (
            `${column}: min=${stats.min.toFixed(2)}, max=${stats.max.toFixed(2)}, ` +
            `mean=${stats.mean.toFixed(2)}, median=${stats.median.toFixed(2)}, ` +
            `total values=${stats.count}, numeric values=${stats.numericCount}`
          ))
          .join('\n');

        const prompt = `Given this statistical summary of my dataset:\n${statsDescription}\n\n` +
          'Provide a concise but insightful analysis of the data, highlighting key patterns, ' +
          'potential outliers, and any notable characteristics. Keep it to 3-4 sentences.';

        const insights = await generateInsights(prompt, apiKey);
        setInsights(insights);
      } catch (error) {
        console.error('Error generating insights:', error);
        setInsights('Unable to generate insights at this time.');
      } finally {
        setIsLoadingInsights(false);
      }
    };

    generateDataInsights();
  }, [statistics]);

  if (Object.keys(statistics).length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-yellow-800">No numerical data available for summary statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data Summary</h2>
            <p className="text-sm text-gray-500 mt-1">
              Statistical overview of your numerical columns
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Numeric</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Max</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Mean</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Median</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(statistics).map(([column, stats]) => (
              <tr key={column} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{column}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{stats.count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{stats.numericCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{stats.min.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{stats.max.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{stats.mean.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{stats.median.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            {isLoadingInsights ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{insights}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 