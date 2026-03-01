'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Dashboard from '@/components/Dashboard';
import CategoriesPage from '@/components/CategoriesPage';
import ItemsPage from '@/components/ItemsPage';
import AdminPage from '@/components/AdminPage';

// Context for toast + data
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export default function HomePage() {
  const [page, setPage] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

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

  const refreshData = useCallback(async () => {
    await Promise.all([fetchCategories(), fetchItems()]);
  }, [fetchCategories, fetchItems]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { await fetch('/api/seed', { method: 'POST' }); } catch { }
      await refreshData();
      setLoading(false);
    })();
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
    categories, items, loading,
    fetchCategories, fetchItems, refreshData,
    showToast, formatCurrency,
    page, navigate, theme,
  };

  return (
    <AppContext.Provider value={ctxValue}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>
        <div className="sidebar-logo">
          <div className="logo-icon">🏠</div>
          <div className="logo-text">Move<span>Budget</span></div>
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
          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : (
            <>
              {page === 'dashboard' && <Dashboard />}
              {page === 'categories' && <CategoriesPage />}
              {page === 'items' && <ItemsPage />}
              {page === 'admin' && <AdminPage />}
            </>
          )}
        </main>
      </div>

      <Toast toasts={toasts} />
    </AppContext.Provider>
  );
}

