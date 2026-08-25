import React, { useState, useMemo } from 'react';
import { useExpense } from '../ExpenseContext';
import { 
  TrendingUp, TrendingDown, Wallet, Plus, Sparkles, QrCode, 
  ArrowUpRight, ArrowDownRight, Calendar, Filter, Search, Trash2, Edit3 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SmsScannerModal from './SmsScannerModal';
import QRScannerModal from './QRScannerModal';

const HomeScreen = ({ onNavigate }) => {
  const { 
    expenses, totalBudget, getTotalSpending, deleteExpense, 
    userData, isLoading, getAllCategories 
  } = useExpense();

  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const totalSpent = getTotalSpending(true);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const categories = getAllCategories();

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exp.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCat === 'All' || exp.category.toLowerCase() === filterCat.toLowerCase();
      return matchSearch && matchCat;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchQuery, filterCat]);

  const handleQrScan = (data) => {
    onNavigate('create', { initialData: { title: `Payment to ${data.displayId}`, amount: '', upiId: data.fullData } });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{userData?.name || 'Buddy'}</span> 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">Here is your financial overview for this period.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsQrOpen(true)}
            className="px-4 py-2.5 rounded-2xl glass-card text-xs font-bold text-slate-200 hover:text-white border border-slate-700/60 hover:border-indigo-500/50 transition flex items-center gap-2"
          >
            <QrCode size={16} className="text-indigo-400" />
            <span>Scan QR</span>
          </button>

          <button
            onClick={() => setIsSmsOpen(true)}
            className="px-4 py-2.5 rounded-2xl glass-card text-xs font-bold text-slate-200 hover:text-white border border-slate-700/60 hover:border-purple-500/50 transition flex items-center gap-2"
          >
            <Sparkles size={16} className="text-purple-400" />
            <span>Smart SMS</span>
          </button>

          <button
            onClick={() => onNavigate('create')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:opacity-95 transition flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Budget Card */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-slate-800 glow-indigo">
          <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none group-hover:scale-110 transition-transform">
            <Wallet size={120} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Total Budget</p>
          <h2 className="text-3xl font-extrabold text-white mt-2">₹{totalBudget.toLocaleString()}</h2>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Allocated for current period</span>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-slate-800">
          <div className="absolute top-0 right-0 p-8 text-rose-500/10 pointer-events-none group-hover:scale-110 transition-transform">
            <TrendingDown size={120} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Total Spent</p>
          <h2 className="text-3xl font-extrabold text-white mt-2">₹{totalSpent.toLocaleString()}</h2>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <ArrowDownRight size={14} className="text-rose-400" />
            <span>{spentPercentage.toFixed(1)}% of total budget</span>
          </div>
        </div>

        {/* Net Remaining Card */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-slate-800 glow-emerald">
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 pointer-events-none group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Remaining Balance</p>
          <h2 className={`text-3xl font-extrabold mt-2 ${remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            ₹{remainingBudget.toLocaleString()}
          </h2>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <ArrowUpRight size={14} className="text-emerald-400" />
            <span>{remainingBudget < 0 ? 'Budget Overspent!' : 'Available for spending'}</span>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-300">Period Budget Utilization</span>
          <span className="text-xs font-bold text-indigo-400">{spentPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              spentPercentage > 90 ? 'bg-rose-500' : (spentPercentage > 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500')
            }`}
            style={{ width: `${spentPercentage}%` }}
          />
        </div>
      </div>

      {/* Transactions Section Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">View and manage your logged payments</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition w-48"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Transactions List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs mt-1">Try adding a new expense or clearing your search filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-4 rounded-2xl glass-card transition group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md"
                    style={{ backgroundColor: `${exp.color || '#4F46E5'}20`, color: exp.color || '#4F46E5' }}
                  >
                    {exp.icon || '💸'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition">{exp.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`font-bold text-sm ${exp.type === 'credit' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {exp.type === 'credit' ? '+' : '-'}₹{parseFloat(exp.amount).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase">{exp.type || 'debit'}</p>
                  </div>

                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                    title="Delete Transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <SmsScannerModal isOpen={isSmsOpen} onClose={() => setIsSmsOpen(false)} />
      <QRScannerModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} onScan={handleQrScan} />
    </div>
  );
};

export default HomeScreen;
