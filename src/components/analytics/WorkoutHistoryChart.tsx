import React from 'react';
import { motion } from 'framer-motion';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import type { WorkoutSession } from '../../types';

interface WorkoutHistoryChartProps {
  workouts: WorkoutSession[];
}

export const WorkoutHistoryChart: React.FC<WorkoutHistoryChartProps> = ({ workouts }) => {
  // Generate last 7 days data
  const generateChartData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.startTime);
        return workoutDate.toDateString() === date.toDateString() && 
               workout.status === 'completed';
      });
      
      const totalMinutes = dayWorkouts.reduce((acc, workout) => {
        if (workout.endTime) {
          return acc + (workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60);
        }
        return acc;
      }, 0);
      
      days.push({
        date,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        workouts: dayWorkouts.length,
        minutes: Math.round(totalMinutes)
      });
    }
    
    return days;
  };

  const chartData = generateChartData();
  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 1);


  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChartBarIcon className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
        </div>
        <div className="text-sm text-gray-500">Last 7 days</div>
      </div>

      {chartData.every(d => d.workouts === 0) ? (
        <div className="text-center py-12">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h4>
          <p className="text-gray-600">Start working out to see your progress here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart */}
          <div className="flex items-end justify-between h-32 space-x-2">
            {chartData.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ height: 0 }}
                animate={{ height: `${(day.minutes / maxMinutes) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-1 bg-primary-500 rounded-t-sm min-h-[4px] relative group cursor-pointer"
                style={{ minHeight: day.workouts > 0 ? '8px' : '4px' }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {day.workouts} workout{day.workouts !== 1 ? 's' : ''}
                    <br />
                    {day.minutes} min
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Labels */}
          <div className="flex justify-between text-sm text-gray-600">
            {chartData.map((day) => (
              <div key={day.day} className="flex-1 text-center">
                {day.day}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 pt-4 border-t">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary-500 rounded mr-2"></div>
              <span>Workout Minutes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
