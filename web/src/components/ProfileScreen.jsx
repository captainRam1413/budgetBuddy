import React, { useState } from 'react';
import { useExpense } from '../ExpenseContext';
import { User, Mail, Phone, Wallet, LogOut, Moon, Sun, Check, Edit2 } from 'lucide-react';
import { userAPI } from '../api';

const ProfileScreen = () => {
  const { userData, setUserData, totalBudget, setBudget, logoutUser, darkMode, toggleDarkMode } = useExpense();
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [budgetInput, setBudgetInput] = useState(totalBudget || '');
  const [isEditing, setIsEditing] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await userAPI.updateProfile(name, phone);
    if (res.success) {
      if (parseFloat(budgetInput) > 0) {
        await setBudget(parseFloat(budgetInput));
      }
      setUserData(prev => ({ ...prev, name, phone }));
      setMsg('Profile updated successfully!');
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Profile & Preferences</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your account information and app configuration</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* User Badge */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
            {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{userData?.name || 'User Profile'}</h2>
            <p className="text-xs text-slate-400">{userData?.email}</p>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              disabled={!isEditing}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Base Monthly Budget Limit (₹)</label>
            <input
              type="number"
              disabled={!isEditing}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-indigo-500 transition font-bold text-indigo-400"
            />
          </div>

          {msg && <p className="text-xs text-emerald-400 font-semibold">{msg}</p>}

          <div className="pt-2 flex gap-3">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition flex items-center gap-2"
              >
                <Edit2 size={14} /> Edit Profile & Budget
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <Check size={14} /> Save Changes
              </button>
            )}
          </div>
        </form>

        {/* System Settings & Actions */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Dark Mode Theme</span>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
            >
              {darkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-400" />}
            </button>
          </div>

          <button
            onClick={logoutUser}
            className="w-full py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign Out Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
