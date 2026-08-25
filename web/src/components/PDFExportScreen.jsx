import React, { useState } from 'react';
import { useExpense } from '../ExpenseContext';
import { Download, Calendar, Filter, FileText, ArrowRight } from 'lucide-react';
import exportExpensesAsPDF from '../services/pdfService';

const PDFExportScreen = () => {
  const { expenses, userData, totalBudget, getTotalSpending } = useExpense();
  const [viewMode, setViewMode] = useState('monthly'); // monthly | all
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const filteredExpenses = expenses.filter(exp => {
    if (viewMode === 'monthly') {
      const d = new Date(exp.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }
    return true;
  });

  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const balance = totalBudget - totalSpent;

  const handleExportPDF = async () => {
    setLoading(true);
    await exportExpensesAsPDF({
      expenses: filteredExpenses,
      totalBudget,
      userData,
      totalSpent,
      monthName: viewMode === 'monthly' ? currentDate.toLocaleDateString('en-US', { month: 'long' }) : 'All Time',
      year: currentDate.getFullYear().toString()
    });
    setLoading(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Export & Reports</h1>
        <p className="text-xs text-slate-400 mt-1">Generate and download official PDF statements of your transaction records</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        {/* Toggle View Mode */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 max-w-md">
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time Statement
          </button>
        </div>

        {/* Date Selector for Monthly */}
        {viewMode === 'monthly' && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const prev = new Date(currentDate);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentDate(prev);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
            >
              ← Previous Month
            </button>
            <span className="font-bold text-sm text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentDate);
                next.setMonth(next.getMonth() + 1);
                setCurrentDate(next);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
            >
              Next Month →
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <p className="text-[10px] font-bold uppercase">Total Budget</p>
            <p className="text-xl font-extrabold mt-1">₹{totalBudget}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <p className="text-[10px] font-bold uppercase">Total Expense</p>
            <p className="text-xl font-extrabold mt-1">₹{totalSpent}</p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <p className="text-[10px] font-bold uppercase">Net Balance</p>
            <p className="text-xl font-extrabold mt-1">₹{balance}</p>
          </div>
        </div>

        {/* PDF Download Button */}
        <button
          onClick={handleExportPDF}
          disabled={loading || filteredExpenses.length === 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FileText size={18} />
          <span>{loading ? 'Generating PDF Document...' : `Download PDF Statement (${filteredExpenses.length} Records)`}</span>
        </button>

        {/* Preview List */}
        <div className="space-y-3 pt-4">
          <h4 className="text-sm font-bold text-white">Statement Preview</h4>
          {filteredExpenses.map((exp) => (
            <div key={exp.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <span className="font-bold text-white">{exp.title}</span>
                <span className="text-slate-400 ml-2">({exp.category})</span>
              </div>
              <span className="font-bold text-rose-400">-₹{exp.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFExportScreen;
