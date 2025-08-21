import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ProgressChartProps {
  data: Array<{
    week?: string;
    month?: string;
    workouts: number;
    duration: number;
    calories: number;
  }>;
  type: 'line' | 'area' | 'bar';
  metric: 'workouts' | 'duration' | 'calories';
  title: string;
  timeframe: 'weekly' | 'monthly';
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  type,
  metric,
  title,
  timeframe
}) => {
  const formatXAxisLabel = (value: string) => {
    if (timeframe === 'weekly') {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return new Date(value + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  const formatTooltipLabel = (value: string) => {
    if (timeframe === 'weekly') {
      return `Week of ${new Date(value).toLocaleDateString()}`;
    } else {
      return new Date(value + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'workouts':
        return 'Workouts';
      case 'duration':
        return 'Duration (min)';
      case 'calories':
        return 'Calories';
      default:
        return 'Value';
    }
  };

  const getMetricColor = () => {
    switch (metric) {
      case 'workouts':
        return '#0ea5e9'; // primary-500
      case 'duration':
        return '#dd6b20'; // accent-500
      case 'calories':
        return '#ef4444'; // error-500
      default:
        return '#6b7280'; // neutral-500
    }
  };

  const chartData = data.map(item => ({
    ...item,
    period: timeframe === 'weekly' ? item.week : item.month,
  }));

  const renderChart = (): React.ReactElement => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="period" 
              tickFormatter={formatXAxisLabel}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              labelFormatter={formatTooltipLabel}
              formatter={(value: number) => [value, getMetricLabel()]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey={metric} 
              stroke={getMetricColor()}
              strokeWidth={3}
              dot={{ fill: getMetricColor(), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: getMetricColor(), strokeWidth: 2 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="period" 
              tickFormatter={formatXAxisLabel}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              labelFormatter={formatTooltipLabel}
              formatter={(value: number) => [value, getMetricLabel()]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey={metric} 
              stroke={getMetricColor()}
              fill={getMetricColor()}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="period" 
              tickFormatter={formatXAxisLabel}
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              labelFormatter={formatTooltipLabel}
              formatter={(value: number) => [value, getMetricLabel()]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey={metric} 
              fill={getMetricColor()}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      default:
        return <></>;
    }
  };

  const calculateTrend = () => {
    if (chartData.length < 2) return null;
    
    const recent = chartData.slice(-3).reduce((sum, item) => sum + item[metric], 0) / 3;
    const older = chartData.slice(0, -3).reduce((sum, item) => sum + item[metric], 0) / (chartData.length - 3);
    
    const change = ((recent - older) / older) * 100;
    
    if (Math.abs(change) < 5) return { type: 'stable', value: 0 };
    return { 
      type: change > 0 ? 'increase' : 'decrease', 
      value: Math.abs(change) 
    };
  };

  const trend = calculateTrend();

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
        {trend && (
          <Badge 
            variant={trend.type === 'increase' ? 'success' : trend.type === 'decrease' ? 'warning' : 'secondary'}
            size="sm"
          >
            {trend.type === 'increase' ? '↗️' : trend.type === 'decrease' ? '↘️' : '➡️'} 
            {trend.value > 0 ? ` ${trend.value.toFixed(1)}%` : ' Stable'}
          </Badge>
        )}
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
        <div className="text-center">
          <p className="text-sm text-neutral-600">Total</p>
          <p className="text-lg font-bold text-neutral-900">
            {chartData.reduce((sum, item) => sum + item[metric], 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-neutral-600">Average</p>
          <p className="text-lg font-bold text-neutral-900">
            {Math.round(chartData.reduce((sum, item) => sum + item[metric], 0) / chartData.length).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-neutral-600">Best {timeframe.slice(0, -2)}</p>
          <p className="text-lg font-bold text-neutral-900">
            {Math.max(...chartData.map(item => item[metric])).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

// Workout Type Distribution Chart
interface WorkoutTypeChartProps {
  data: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export const WorkoutTypeChart: React.FC<WorkoutTypeChartProps> = ({ data }) => {
  const COLORS = ['#0ea5e9', '#dd6b20', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card>
      <h3 className="text-xl font-bold text-neutral-900 mb-6">Workout Type Distribution</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="count"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, _name: string, props: any) => [
                `${value} workouts (${props.payload.percentage}%)`,
                props.payload.type
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.type} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium text-neutral-700">{item.type}</span>
            </div>
            <span className="text-sm text-neutral-600">{item.count} ({item.percentage}%)</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
