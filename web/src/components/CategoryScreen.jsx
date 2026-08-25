import React, { useState } from 'react';
import { useExpense } from '../ExpenseContext';
import { Plus, Trash2, Tag, Check, AlertCircle } from 'lucide-react';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constants';

const CategoryScreen = () => {
  const { getAllCategories, addCustomCategory, deleteCategory, categoryBudgets, setCategoryBudget } = useExpense();
  const categories = getAllCategories();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');
  const [color, setColor] = useState('#FFB347');
  const [budgetInput, setBudgetInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const res = await addCustomCategory({
      name: name.trim(),
      icon,
      color,
      budget: parseFloat(budgetInput) || 0
    });

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      if (parseFloat(budgetInput) > 0) {
        await setCategoryBudget(name.trim(), parseFloat(budgetInput));
      }
      setName('');
      setBudgetInput('');
      setErrorMsg('');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Category Management</h1>
        <p className="text-xs text-slate-400 mt-1">Configure custom categories and assign target budget limits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Category Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 h-fit">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-indigo-400" /> Create Custom Category
          </h3>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Subscriptions, Gaming"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Budget Limit (Optional)</label>
              <input
                type="number"
                placeholder="₹0.00"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Choose Icon</label>
              <div className="grid grid-cols-6 gap-2 max-h-28 overflow-y-auto p-2 bg-slate-900 border border-slate-800 rounded-xl">
                {AVAILABLE_ICONS.map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`p-1.5 rounded-lg text-lg transition ${icon === i ? 'bg-indigo-600/40 border border-indigo-500' : 'hover:bg-slate-800'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Choose Color</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Save Category
            </button>
          </form>
        </div>

        {/* Existing Categories List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white">Active Categories ({categories.length})</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.name} className="p-4 rounded-2xl glass-card flex items-center justify-between border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                    <p className="text-xs text-slate-400">
                      Budget: ₹{categoryBudgets[cat.name] || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newB = prompt(`Update budget limit for ${cat.name}:`, categoryBudgets[cat.name] || 0);
                      if (newB !== null) setCategoryBudget(cat.name, parseFloat(newB));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
                  >
                    Edit Limit
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.name)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryScreen;
