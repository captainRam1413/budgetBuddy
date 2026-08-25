import React, { useMemo } from 'react';
import { useExpense } from '../ExpenseContext';
import { PieChart as PieIcon, BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

const InsightsScreen = () => {
  const { expenses, totalBudget, getAllCategories, getCategoryBudgetStatus, getTotalSpending } = useExpense();
  const categories = getAllCategories();

  const totalSpent = getTotalSpending(true);

  // Category breakdown calculation
  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const status = getCategoryBudgetStatus(cat.name);
      return {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        spent: status.spent,
        budget: status.budget,
        percentage: status.percentage,
        isOverBudget: status.isOverBudget
      };
    }).filter(c => c.spent > 0 || c.budget > 0);
  }, [categories, expenses]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Analytics & Insights</h1>
        <p className="text-xs text-slate-400 mt-1">Deep breakdown of your spending habits and category budgets</p>
      </div>

      {/* Category Budget Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoryStats.map((stat) => (
          <div key={stat.name} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm"
                  style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{stat.name}</h3>
                  <p className="text-xs text-slate-400">
                    Target Budget: {stat.budget > 0 ? `₹${stat.budget}` : 'Not set'}
                  </p>
                </div>
              </div>

              {stat.isOverBudget && (
                <div className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={12} />
                  <span>Over Budget</span>
                </div>
              )}
            </div>

            {/* Spending vs Budget Progress */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                <span className="text-slate-400">Spent: ₹{stat.spent}</span>
                <span className={stat.isOverBudget ? 'text-rose-400' : 'text-indigo-400'}>
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stat.isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Spending Distribution */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Expense Distribution</h3>
        <div className="flex h-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-1 gap-1">
          {categoryStats.map((stat) => {
            const widthPct = totalSpent > 0 ? (stat.spent / totalSpent) * 100 : 0;
            if (widthPct <= 0) return null;
            return (
              <div
                key={stat.name}
                className="h-full rounded-xl transition-all duration-300 relative group"
                style={{ width: `${widthPct}%`, backgroundColor: stat.color }}
                title={`${stat.name}: ₹${stat.spent} (${widthPct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          {categoryStats.map((stat) => (
            <div key={stat.name} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></span>
              <span>{stat.name}: ₹{stat.spent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightsScreen;
