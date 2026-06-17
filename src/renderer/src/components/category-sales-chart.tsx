import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from './ui/chart';

interface CategoryData {
  name: string | null;
  saleCount: number;
  revenue: number;
}

interface CategorySalesChartProps {
  data: CategoryData[];
}

const COLORS = [
  '#a855f7', // purple-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f43f5e', // rose-500
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

export const CategorySalesChart: React.FC<CategorySalesChartProps> = ({ data }) => {
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  
  const chartData = data.map((item, index) => {
    const revenue = item.revenue || 0;
    const percentage = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;
    return {
      name: item.name || 'Uncategorized',
      revenue,
      percentage,
      fill: COLORS[index % COLORS.length]
    };
  }).filter(item => item.revenue > 0);

  const chartConfig = chartData.reduce((acc, curr) => {
    acc[curr.name] = {
      label: curr.name,
      color: curr.fill
    };
    return acc;
  }, {} as any);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-border/50 rounded-[32px] bg-card shadow-sm">
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No category data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center bg-card border border-border/50 rounded-[32px] p-8 lg:p-12 shadow-sm">
      <div className="flex-1 w-full space-y-8">
        <h3 className="text-3xl font-black tracking-tight text-foreground">Sales by product category</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.fill }} />
                <span className="text-sm font-bold truncate text-foreground/80">{item.name}</span>
              </div>
              <span className="text-base font-black text-foreground ml-2 shrink-0">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-full md:w-[350px] h-[350px] shrink-0 relative">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="revenue"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={100}
              outerRadius={150}
              strokeWidth={0}
              paddingAngle={3}
              cornerRadius={8}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              content={<ChartTooltipContent hideIndicator={false} />} 
              cursor={false}
            />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
};
