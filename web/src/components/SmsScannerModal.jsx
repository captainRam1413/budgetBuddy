import React, { useState } from 'react';
import { X, Sparkles, MessageSquare, Check, Plus, AlertCircle } from 'lucide-react';
import smsService from '../services/smsService';
import { useExpense } from '../ExpenseContext';
import confetti from 'canvas-confetti';

const SmsScannerModal = ({ isOpen, onClose }) => {
  const [smsText, setSmsText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const { importExpenses, getAllCategories } = useExpense();

  if (!isOpen) return null;

  const categories = getAllCategories();

  const handleParse = () => {
    setErrorMsg('');
    if (!smsText.trim()) {
      setErrorMsg('Please paste SMS text or bank notifications.');
      return;
    }

    const lines = smsText.split(/\n\n|\n---|\r\n\r\n/);
    const results = [];

    lines.forEach((line) => {
      const parsed = smsService.parseTransactionSms(line);
      if (parsed) {
        // match category object
        const catObj = categories.find(c => c.name.toLowerCase() === parsed.category.toLowerCase()) || categories[0] || { name: 'Food', icon: '🍔', color: '#FFB347' };
        results.push({
          id: Math.random().toString(),
          title: parsed.title,
          amount: parsed.amount,
          category: catObj,
          date: new Date().toISOString(),
          type: 'debit',
          rawMessage: line
        });
      }
    });

    if (results.length === 0) {
      // Try parsing single block
      const single = smsService.parseTransactionSms(smsText);
      if (single) {
        const catObj = categories.find(c => c.name.toLowerCase() === single.category.toLowerCase()) || categories[0];
        results.push({
          id: Math.random().toString(),
          title: single.title,
          amount: single.amount,
          category: catObj,
          date: new Date().toISOString(),
          type: 'debit',
          rawMessage: smsText
        });
      }
    }

    if (results.length === 0) {
      setErrorMsg('No valid bank transactional SMS detected. Make sure text includes debit keywords like "debited", "Rs.", or "paid to".');
      setParsedItems([]);
    } else {
      setParsedItems(results);
      const initialSelected = {};
      results.forEach(item => { initialSelected[item.id] = true; });
      setSelectedItems(initialSelected);
    }
  };

  const handleImport = async () => {
    const itemsToImport = parsedItems.filter(i => selectedItems[i.id]);
    if (itemsToImport.length === 0) {
      setErrorMsg('Please select at least one transaction to import.');
      return;
    }

    for (const item of itemsToImport) {
      await importExpenses([item]);
    }

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    onClose();
    setSmsText('');
    setParsedItems([]);
  };

  const sampleSMS = `Sent Rs. 450.00 to SWIGGY via UPI on 25-Aug-2026. Txn ID: 93821093.
Debited Rs 1,299.00 from HDFC Bank A/C XX4921 at AMAZON INDIA on 24-Aug-2026.
Paid Rs. 150 to OLA CABS via PhonePe ref 883921.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Smart SMS Transaction Scanner</h3>
              <p className="text-xs text-slate-400">Paste bank SMS notifications to auto-import expenses</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {parsedItems.length === 0 ? (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Paste Bank SMS Text</label>
                <button
                  type="button"
                  onClick={() => setSmsText(sampleSMS)}
                  className="text-xs text-indigo-400 hover:underline font-medium"
                >
                  Insert Sample SMS
                </button>
              </div>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Paste SMS messages from HDFC, ICICI, SBI, Paytm, GPay, etc."
                rows={6}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
              />
              {errorMsg && (
                <div className="flex items-center gap-2 mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Detected {parsedItems.length} transactions</span>
                <span>Select items to import</span>
              </div>
              {parsedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    selectedItems[item.id]
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg border border-slate-700 flex items-center justify-center bg-slate-900">
                      {selectedItems[item.id] && <Check size={14} className="text-indigo-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-rose-400">-₹{item.amount}</p>
                    <p className="text-[10px] text-slate-500">Debit</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          {parsedItems.length > 0 && (
            <button
              onClick={() => setParsedItems([])}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Back to Input
            </button>
          )}
          {parsedItems.length === 0 ? (
            <button
              onClick={handleParse}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Sparkles size={16} />
              Parse Transactions
            </button>
          ) : (
            <button
              onClick={handleImport}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
            >
              <Plus size={16} />
              Import Selected ({Object.values(selectedItems).filter(Boolean).length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsScannerModal;
