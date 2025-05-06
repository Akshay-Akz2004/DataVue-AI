'use client';

import { useState, useMemo } from 'react';
import CsvUploader from '../components/CsvUploader';
import QueryInput from '../components/QueryInput';
import ChartComponent from '../components/ChartComponent';
import DataSummary from '../components/DataSummary';
import { analyzeQuery } from '../utils/groqService';

interface ChartConfig {
  chartType: string;
  xAxis: string;
  yAxis: string;
  title: string;
  filter?: {
    column: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    value: number | string | [number, number];
  };
  aggregation?: {
    type: 'count' | 'sum' | 'average' | 'max' | 'min';
    column?: string;
    groupBy?: string;
  };
}

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error('GROQ API key is not defined in environment variables');
}

// Type assertion since we've checked for undefined
const apiKey: string = GROQ_API_KEY;

export default function Home() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process the data for visualization
  const processedData = useMemo(() => {
    if (!rawData.length || !chartConfig) return [];

    let data = [...rawData];

    // Apply filters if specified
    if (chartConfig.filter) {
      data = data.filter(row => {
        const value = parseFloat(row[chartConfig.filter!.column]);
        const filterValue = chartConfig.filter!.value;
        
        switch (chartConfig.filter!.operator) {
          case 'gt':
            return value > (typeof filterValue === 'number' ? filterValue : parseFloat(filterValue as string));
          case 'lt':
            return value < (typeof filterValue === 'number' ? filterValue : parseFloat(filterValue as string));
          case 'eq':
            return value === (typeof filterValue === 'number' ? filterValue : parseFloat(filterValue as string));
          case 'gte':
            return value >= (typeof filterValue === 'number' ? filterValue : parseFloat(filterValue as string));
          case 'lte':
            return value <= (typeof filterValue === 'number' ? filterValue : parseFloat(filterValue as string));
          case 'between':
            const [min, max] = filterValue as [number, number];
            return value >= min && value <= max;
          default:
            return true;
        }
      });
    }

    // Apply aggregation if specified
    if (chartConfig.aggregation) {
      const groupedData = new Map();
      
      data.forEach(row => {
        const groupKey = chartConfig.aggregation!.groupBy 
          ? row[chartConfig.aggregation!.groupBy]
          : 'total';
        
        if (!groupedData.has(groupKey)) {
          groupedData.set(groupKey, []);
        }
        groupedData.get(groupKey).push(row);
      });

      data = Array.from(groupedData.entries()).map(([key, group]: [string, any[]]) => {
        const result: any = {};
        result[chartConfig.aggregation!.groupBy || 'group'] = key;

        const values = group.map(item => 
          parseFloat(item[chartConfig.aggregation!.column || chartConfig.yAxis])
        ).filter(val => !isNaN(val));

        switch (chartConfig.aggregation!.type) {
          case 'count':
            result[chartConfig.yAxis] = values.length;
            break;
          case 'sum':
            result[chartConfig.yAxis] = values.reduce((a, b) => a + b, 0);
            break;
          case 'average':
            result[chartConfig.yAxis] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'max':
            result[chartConfig.yAxis] = Math.max(...values);
            break;
          case 'min':
            result[chartConfig.yAxis] = Math.min(...values);
            break;
        }
        return result;
      });
    }

    // Convert numeric strings to numbers and filter out invalid entries
    return data.map(row => {
      const processedRow: any = {};
      for (let header of headers) {
        const value = row[header];
        processedRow[header] = !isNaN(value) ? parseFloat(value) : value;
      }
      return processedRow;
    }).filter(row => 
      row[chartConfig.xAxis] != null && 
      row[chartConfig.yAxis] != null &&
      row[chartConfig.xAxis] !== '' && 
      row[chartConfig.yAxis] !== ''
    );
  }, [rawData, headers, chartConfig]);

  const handleDataLoaded = (csvData: any[], csvHeaders: string[]) => {
    const processedData = csvData.map(row => {
      const obj: any = {};
      csvHeaders.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    setRawData(processedData);
    setHeaders(csvHeaders);
    setChartConfig(null);
    setError(null);
  };

  const processQuery = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = await analyzeQuery(query, headers, apiKey);
      setChartConfig(config);
    } catch (error) {
      console.error('Error processing query:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while processing your query');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="hero-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-16 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="space-y-8">
                <h1 className="text-[2.75rem] leading-tight mt-10 font-bold text-[#1e293b] lg:text-6xl text-balance">
                  Create Effective<br />
                  Visuals from Your<br />
                  Spreadsheets with<br />
                  <span className="gradient-text">Datavue AI.</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-xl text-balance">
                  Excel. CSV. Spreadsheets. Datavue AI analyzes your data and turns it into effective visualizations, in seconds.
                </p>
                <div className="flex gap-4">
                  <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Try Datavue AI Free
                  </button>
                </div>
              </div>

              {/* Right Column - Demo/Upload Area */}
              <div className="relative">
                <div className="glass-effect rounded-2xl p-8">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-xl text-white">D</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">One Visual, Many Insights.</h2>
                      </div>
                    </div>
                    <CsvUploader onDataLoaded={handleDataLoaded} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {rawData.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Data Loaded Successfully</h2>
                    <p className="text-sm text-gray-500">
                      {rawData.length} rows and {headers.length} columns loaded
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">
                    Available columns: {headers.join(', ')}
                  </p>
                </div>
              </div>
              
              <DataSummary data={rawData} headers={headers} />
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Generate Visualization</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Ask anything about your data in natural language
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <QueryInput onQuerySubmit={processQuery} isLoading={isLoading} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error Processing Query</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {chartConfig && processedData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">{chartConfig.title}</h2>
              </div>
              <div className="p-6">
                <ChartComponent
                  data={processedData}
                  chartType={chartConfig.chartType}
                  xAxis={chartConfig.xAxis}
                  yAxis={chartConfig.yAxis}
                  title={chartConfig.title}
                />
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Showing {processedData.length} data points
                        {chartConfig.filter && (
                          <span className="ml-2">
                            (filtered where {chartConfig.filter.column} {chartConfig.filter.operator} {
                              Array.isArray(chartConfig.filter.value) 
                                ? `between ${chartConfig.filter.value[0]} and ${chartConfig.filter.value[1]}`
                                : chartConfig.filter.value
                            })
                          </span>
                        )}
                        {chartConfig.aggregation && (
                          <span className="ml-2">
                            ({chartConfig.aggregation.type} of {chartConfig.aggregation.column || chartConfig.yAxis}
                            {chartConfig.aggregation.groupBy && ` grouped by ${chartConfig.aggregation.groupBy}`})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 