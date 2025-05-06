import {
  Line,
  Bar,
  Scatter,
  Pie,
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartComponentProps {
  data: any[];
  chartType: string;
  xAxis: string;
  yAxis: string;
  title?: string;
}

const ChartComponent = ({ data, chartType, xAxis, yAxis, title }: ChartComponentProps) => {
  const renderChart = () => {
    switch (chartType.toLowerCase()) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yAxis} stroke="#8884d8" />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yAxis} fill="#8884d8" />
          </BarChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis dataKey={yAxis} />
            <Tooltip />
            <Legend />
            <Scatter data={data} fill="#8884d8" />
          </ScatterChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yAxis}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            />
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full h-[400px] p-4">
      {title && (
        <h2 className="text-xl font-semibold text-center mb-4">{title}</h2>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent; 