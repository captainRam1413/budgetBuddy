import React, { useState } from 'react';
import { useExpense } from '../ExpenseContext';
import { Sparkles, ArrowRight, Wallet, Check, Plus, FolderPlus } from 'lucide-react';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constants';
import confetti from 'canvas-confetti';

const OnboardingScreen = () => {
  const [step, setStep] = useState(1);
  const [monthlyBudget, setMonthlyBudget] = useState('25000');
  const [selectedCategories, setSelectedCategories] = useState({
    'Food': true,
    'Shopping': true,
    'Transportation': true,
    'Bills/Utilities': true,
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍔');
  const [newCatColor, setNewCatColor] = useState('#FFB347');
  const [customCatsList, setCustomCatsList] = useState([]);
  const [showAddCustom, setShowAddCustom] = useState(false);

  const { setBudget, completeOnboarding, addCustomCategory } = useExpense();

  const handleNext = () => {
    if (step === 1) {
      if (!monthlyBudget || parseFloat(monthlyBudget) <= 0) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      handleFinish();
    }
  };

  const handleAddCustomCat = () => {
    if (!newCatName.trim()) return;
    const cat = { name: newCatName.trim(), icon: newCatIcon, color: newCatColor };
    setCustomCatsList(prev => [...prev, cat]);
    setSelectedCategories(prev => ({ ...prev, [cat.name]: true }));
    setNewCatName('');
    setShowAddCustom(false);
  };

  const handleFinish = async () => {
    await setBudget(parseFloat(monthlyBudget));
    for (const cat of customCatsList) {
      await addCustomCategory(cat);
    }
    await completeOnboarding();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg glass-panel p-8 rounded-3xl shadow-2xl relative z-10 border border-slate-800">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400">Step {step} of 3</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-indigo-500' : (i < step ? 'w-4 bg-indigo-500/40' : 'w-4 bg-slate-800')
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center mb-3">
                <Wallet size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white">Set Your Monthly Budget</h2>
              <p className="text-xs text-slate-400 mt-1">What is your total target budget for spending each month?</p>
            </div>

            <div className="relative max-w-xs mx-auto">
              <span className="absolute left-4 top-3.5 text-lg font-bold text-indigo-400">₹</span>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="25000"
                className="w-full bg-slate-900 border border-indigo-500/40 rounded-2xl pl-10 pr-4 py-3 text-2xl font-bold text-white text-center focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mx-auto flex items-center justify-center mb-3">
                <FolderPlus size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white">Select Categories</h2>
              <p className="text-xs text-slate-400 mt-1">Choose default categories or create your own custom ones.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {['Food', 'Shopping', 'Transportation', 'Bills/Utilities', ...customCatsList.map(c => c.name)].map((cat) => (
                <div
                  key={cat}
                  onClick={() => setSelectedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    selectedCategories[cat]
                      ? 'bg-indigo-950/40 border-indigo-500 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-semibold">{cat}</span>
                  {selectedCategories[cat] && <Check size={14} className="text-indigo-400" />}
                </div>
              ))}
            </div>

            {!showAddCustom ? (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Custom Category
              </button>
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <div className="flex gap-2">
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-sm text-white"
                  >
                    {AVAILABLE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-10 h-8 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCat}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">All Set & Ready!</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your budget of <span className="text-emerald-400 font-bold">₹{monthlyBudget}</span> and category tracking have been configured. Let's start managing your expenses!
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleNext}
          className="w-full mt-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:opacity-95 transition flex items-center justify-center gap-2"
        >
          <span>{step === 3 ? 'Go to Dashboard' : 'Continue'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
