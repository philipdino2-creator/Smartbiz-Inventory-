import React, { useState } from 'react';
import { formatCurrency } from '../../utils/calculations';

interface TrendDataPoint {
  dayLabel: string;
  date: string;
  sales: number;
  expenses: number;
  profit: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  currencySymbol: string;
  hideProfit?: boolean;
}

export const SalesExpenseTrendChart: React.FC<TrendChartProps> = ({ data, currencySymbol, hideProfit = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(...data.map(d => Math.max(d.sales, d.expenses)), 10000);
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 24;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">7-Day Sales vs Expenses Performance</h3>
          <p className="text-xs text-slate-500">
            {hideProfit ? 'Daily sales turnover and operational expenses' : 'Daily cash inflow, operating expenses, and net gain'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#4C0196]" />
            <span>Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#7B001C]" />
            <span>Expenses</span>
          </div>
          {!hideProfit && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500" />
              <span>Net Profit</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative pt-4 overflow-x-auto">
        <div className="min-w-[420px]">
          <svg className="w-full h-48 overflow-visible" viewBox={`0 0 ${data.length * 70 + paddingX * 2} ${chartHeight + paddingY * 2}`}>
            {/* Background Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = chartHeight - (pct * chartHeight) + paddingY;
              const val = Math.round(maxVal * pct);
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={data.length * 70 + paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? '0' : '4 4'}
                  />
                  <text
                    x={paddingX - 4}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-400 font-mono tabular-nums"
                  >
                    {val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Bars for Sales and Expenses */}
            {data.map((item, idx) => {
              const colX = paddingX + idx * 70 + 20;
              const salesHeight = (item.sales / maxVal) * chartHeight;
              const expenseHeight = (item.expenses / maxVal) * chartHeight;
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Hover highlight background */}
                  {isHovered && (
                    <rect
                      x={colX - 16}
                      y={paddingY}
                      width={52}
                      height={chartHeight}
                      fill="#f8fafc"
                      rx="4"
                    />
                  )}

                  {/* Sales Bar */}
                  <rect
                    x={colX - 12}
                    y={chartHeight - salesHeight + paddingY}
                    width={18}
                    height={Math.max(2, salesHeight)}
                    fill="#4C0196"
                    rx="3"
                    className="transition-all duration-200 hover:opacity-90"
                  />

                  {/* Expense Bar */}
                  <rect
                    x={colX + 8}
                    y={chartHeight - expenseHeight + paddingY}
                    width={18}
                    height={Math.max(2, expenseHeight)}
                    fill="#7B001C"
                    rx="3"
                    className="transition-all duration-200 hover:opacity-90"
                  />

                  {/* Day Label */}
                  <text
                    x={colX + 7}
                    y={chartHeight + paddingY + 16}
                    textAnchor="middle"
                    className={`text-[11px] font-medium transition-colors ${
                      isHovered ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                    }`}
                  >
                    {item.dayLabel}
                  </text>
                </g>
              );
            })}

            {/* Profit Polyline (Hidden when profit is restricted) */}
            {!hideProfit && data.length > 1 && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={data
                  .map((item, idx) => {
                    const colX = paddingX + idx * 70 + 27;
                    const profitHeight = (Math.max(0, item.profit) / maxVal) * chartHeight;
                    const y = chartHeight - profitHeight + paddingY;
                    return `${colX},${y}`;
                  })
                  .join(' ')}
              />
            )}

            {/* Profit Points (Hidden when profit is restricted) */}
            {!hideProfit && data.map((item, idx) => {
              const colX = paddingX + idx * 70 + 27;
              const profitHeight = (Math.max(0, item.profit) / maxVal) * chartHeight;
              const y = chartHeight - profitHeight + paddingY;
              return (
                <circle
                  key={`dot-${idx}`}
                  cx={colX}
                  cy={y}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip Details */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="mt-3 p-2.5 bg-slate-900 text-white rounded-lg text-xs flex flex-wrap items-center justify-between gap-4">
            <span className="font-semibold text-slate-200">
              {data[hoveredIndex].date} ({data[hoveredIndex].dayLabel})
            </span>
            <div className="flex items-center gap-4 tabular-nums font-mono">
              <span className="text-purple-300">
                Sales: {formatCurrency(data[hoveredIndex].sales, currencySymbol)}
              </span>
              <span className="text-rose-300">
                Expenses: {formatCurrency(data[hoveredIndex].expenses, currencySymbol)}
              </span>
              {!hideProfit && (
                <span className={data[hoveredIndex].profit >= 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  Net: {formatCurrency(data[hoveredIndex].profit, currencySymbol)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CategoryShareProps {
  categories: { name: string; amount: number; percentage: number; color?: string }[];
  currencySymbol: string;
}

const CATEGORY_COLORS = [
  '#4C0196',
  '#7B001C',
  '#0284C7',
  '#059669',
  '#D97706',
  '#6366F1',
  '#EC4899',
  '#64748B',
];

export const ExpenseCategoryBreakdown: React.FC<CategoryShareProps> = ({ categories, currencySymbol }) => {
  const total = categories.reduce((sum, c) => sum + c.amount, 0);

  if (categories.length === 0 || total === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 p-5 text-center text-slate-400 text-xs">
        No expense records found for this period.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Expense Breakdown by Category</h3>
          <p className="text-xs text-slate-500">Distribution of operating costs</p>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
          Total: {formatCurrency(total, currencySymbol)}
        </span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex my-4">
        {categories.map((cat, idx) => {
          const color = cat.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <div
              key={idx}
              style={{ width: `${cat.percentage}%`, backgroundColor: color }}
              className="h-full transition-all duration-300"
              title={`${cat.name}: ${cat.percentage.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Category List */}
      <div className="space-y-2 mt-2">
        {categories.slice(0, 6).map((cat, idx) => {
          const color = cat.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
          return (
            <div key={idx} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="font-medium text-slate-700 truncate max-w-[140px] sm:max-w-[200px]">
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-3 tabular-nums font-mono">
                <span className="text-slate-900 font-semibold">{formatCurrency(cat.amount, currencySymbol)}</span>
                <span className="text-slate-400 w-10 text-right">{cat.percentage.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
