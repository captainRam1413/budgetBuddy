import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './ExpenseContext';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import HomeScreen from './components/HomeScreen';
import CreateScreen from './components/CreateScreen';
import InsightsScreen from './components/InsightsScreen';
import CategoryScreen from './components/CategoryScreen';
import PDFExportScreen from './components/PDFExportScreen';
import ProfileScreen from './components/ProfileScreen';
import { Wallet, LayoutDashboard, PlusCircle, PieChart, Tag, FileText, User, LogOut } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, hasCompletedOnboarding, isLoading, userData, logoutUser } = useExpense();
  const [currentTab, setCurrentTab] = useState('home');
  const [tabParams, setTabParams] = useState(null);

  const navigateTo = (tab, params = null) => {
    setCurrentTab(tab);
    setTabParams(params);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse text-indigo-400">
          <Wallet size={24} />
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase">Loading BudgetBuddy...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation for Desktop */}
      <aside className="w-full md:w-64 glass-panel border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">BudgetBuddy</h1>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wide uppercase">Web Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'create', label: 'Add Expense', icon: PlusCircle },
              { id: 'insights', label: 'Analytics', icon: PieChart },
              { id: 'category', label: 'Categories', icon: Tag },
              { id: 'pdf', label: 'PDF Reports', icon: FileText },
              { id: 'profile', label: 'Profile Settings', icon: User },
            ].map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30 shrink-0">
              {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userData?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{userData?.email}</p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {currentTab === 'home' && <HomeScreen onNavigate={navigateTo} />}
        {currentTab === 'create' && <CreateScreen onNavigate={navigateTo} initialParams={tabParams} />}
        {currentTab === 'insights' && <InsightsScreen />}
        {currentTab === 'category' && <CategoryScreen />}
        {currentTab === 'pdf' && <PDFExportScreen />}
        {currentTab === 'profile' && <ProfileScreen />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
}
