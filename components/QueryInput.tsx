import { useState } from 'react';

interface QueryInputProps {
  onQuerySubmit: (query: string) => void;
  isLoading: boolean;
}

const QueryInput = ({ onQuerySubmit, isLoading }: QueryInputProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onQuerySubmit(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try 'Show me a bar chart of sales by region' or 'Create a line chart of revenue over time'"
            className="w-full p-4 pr-32 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-gray-800 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing</span>
              </div>
            ) : (
              'Visualize'
            )}
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Example queries:
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>&ldquo;Show total sales by region as a bar chart&rdquo;</li>
            <li>&ldquo;Create a line chart of monthly revenue trends&rdquo;</li>
            <li>&ldquo;Display a pie chart of customer distribution by country&rdquo;</li>
          </ul>
        </div>
      </div>
    </form>
  );
};

export default QueryInput; 