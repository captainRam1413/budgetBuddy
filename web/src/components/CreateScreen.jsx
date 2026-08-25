import React, { useState } from 'react';
import { useExpense } from '../ExpenseContext';
import { Plus, ArrowLeft, Check, Sparkles, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import QRScannerModal from './QRScannerModal';

const CreateScreen = ({ onNavigate, initialParams }) => {
  const { getAllCategories, addExpense } = useExpense();
  const categories = getAllCategories();

  const [title, setTitle] = useState(initialParams?.initialData?.title || '');
  const [amount, setAmount] = useState(initialParams?.initialData?.amount || '');
  const [selectedCat, setSelectedCat] = useState(categories[0] || { name: 'Food', icon: '🍔', color: '#FFB347' });
  const [type, setType] = useState('debit'); // debit | credit
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    await addExpense({
      title,
      amount: parseFloat(amount),
      category: selectedCat,
      date: new Date(date).toISOString(),
      type
    });

    confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } });
    setLoading(false);
    onNavigate('home');
  };

  const handleQrScan = (data) => {
    setTitle(`Payment to ${data.displayId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="p-2.5 rounded-2xl glass-card text-slate-400 hover:text-white border border-slate-800 transition flex items-center gap-2 text-xs font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => setIsQrOpen(true)}
          className="px-4 py-2 rounded-2xl glass-card text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition text-xs font-bold flex items-center gap-2"
        >
          <QrCode size={16} />
          <span>Scan Merchant QR</span>
        </button>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Log Transaction</h2>
          <p className="text-xs text-slate-400 mt-1">Record your income or debit payment details.</p>
        </div>

        {/* Transaction Type Selector */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setType('debit')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              type === 'debit'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Debit Expense (-)
          </button>
          <button
            type="button"
            onClick={() => setType('credit')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              type === 'credit'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Credit Income (+)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Title / Merchant Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy Lunch, Grocery Store"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => setSelectedCat(cat)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition ${
                    selectedCat.name === cat.name
                      ? 'bg-indigo-950/50 border-indigo-500 text-white'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-semibold truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transaction Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Saving...' : 'Add Transaction'}</span>
            <Check size={16} />
          </button>
        </form>
      </div>

      <QRScannerModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} onScan={handleQrScan} />
    </div>
  );
};

export default CreateScreen;
