'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Dashboard from '@/components/Dashboard';
import CategoriesPage from '@/components/CategoriesPage';
import ItemsPage from '@/components/ItemsPage';
import AdminPage from '@/components/AdminPage';
import BudgetSetup from '@/components/BudgetSetup';

// Context for toast + data
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export default function HomePage() {
  const [page, setPage] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [needSetup, setNeedSetup] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('movebudget-theme');
    if (saved) setTheme(saved);
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('movebudget-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat kategori', 'error');
    }
  }, [showToast]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat items', 'error');
    }
  }, [showToast]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
      return data;
    } catch (err) {
      console.error(err);
      return {};
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchCategories(), fetchItems(), fetchSettings()]);
  }, [fetchCategories, fetchItems, fetchSettings]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Ensure DB tables exist, but do NOT auto-seed demo data
        await fetch('/api/seed/init', { method: 'POST' });
      } catch { }
      const s = await fetchSettings();
      // Only load data if budget has been configured
      if (!s.total_budget || s.total_budget === '0') {
        setNeedSetup(true);
      } else {
        await Promise.all([fetchCategories(), fetchItems()]);
      }
      setLoading(false);
    })();
  }, [fetchCategories, fetchItems, fetchSettings]);

  const handleSetupComplete = useCallback(async () => {
    setNeedSetup(false);
    await refreshData();
  }, [refreshData]);

  const navigate = useCallback((p) => {
    setPage(p);
    setSidebarOpen(false);
  }, []);

  const formatCurrency = useCallback((num) => {
    if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  }, []);

  const ctxValue = {
    categories, items, settings, loading,
    fetchCategories, fetchItems, fetchSettings, refreshData,
    showToast, formatCurrency,
    page, navigate, theme,
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Show budget setup if needed
  if (needSetup) {
    return (
      <>
        <BudgetSetup onComplete={handleSetupComplete} showToast={showToast} />
        <Toast toasts={toasts} />
      </>
    );
  }

  return (
    <AppContext.Provider value={ctxValue}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>
        <div className="sidebar-logo">
          <div className="logo-icon">🏠</div>
          <div className="logo-text">Nara<span>Home</span></div>
        </div>
        <div style={{ width: 40 }} />
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="app-layout">
        <Sidebar activePage={page} onNavigate={navigate} open={sidebarOpen} theme={theme} onToggleTheme={toggleTheme} />
        <main className="main-content">
          <>
            {page === 'dashboard' && <Dashboard />}
            {page === 'categories' && <CategoriesPage />}
            {page === 'items' && <ItemsPage />}
            {page === 'admin' && <AdminPage />}
          </>
        </main>
      </div>

      <Toast toasts={toasts} />
    </AppContext.Provider>
  );
}
