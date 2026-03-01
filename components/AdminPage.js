'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/app/page';
import { ConfirmModal } from './Modal';

export default function AdminPage() {
    const { showToast, refreshData, formatCurrency } = useApp();
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [confirmModal, setConfirmModal] = useState({ open: false, type: '' });

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error(err);
            showToast('Gagal memuat statistik admin', 'error');
        }
        setLoadingStats(false);
    }, [showToast]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleExport = async () => {
        setActionLoading('export');
        try {
            const res = await fetch('/api/admin/export');
            if (!res.ok) throw new Error('Export failed');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `movebudget-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Data berhasil di-export!');
        } catch (err) {
            console.error(err);
            showToast('Gagal export data', 'error');
        }
        setActionLoading('');
    };

    const handleReset = async () => {
        setConfirmModal({ open: false, type: '' });
        setActionLoading('reset');
        try {
            const res = await fetch('/api/admin/reset', { method: 'POST' });
            if (!res.ok) throw new Error('Reset failed');
            showToast('Data berhasil di-reset dan seed ulang!');
            await refreshData();
            await fetchStats();
        } catch (err) {
            console.error(err);
            showToast('Gagal reset data', 'error');
        }
        setActionLoading('');
    };

    const handleClear = async () => {
        setConfirmModal({ open: false, type: '' });
        setActionLoading('clear');
        try {
            const res = await fetch('/api/admin/clear', { method: 'POST' });
            if (!res.ok) throw new Error('Clear failed');
            showToast('Semua data berhasil dihapus!');
            await refreshData();
            await fetchStats();
        } catch (err) {
            console.error(err);
            showToast('Gagal menghapus data', 'error');
        }
        setActionLoading('');
    };

    const statCards = stats ? [
        { label: 'Total Kategori', value: stats.total_categories, icon: '📁', cls: 'budget' },
        { label: 'Total Items', value: stats.total_items, icon: '📦', cls: 'items-card' },
        { label: 'Total Budget', value: formatCurrency(stats.total_budget), icon: '💰', cls: 'budget' },
        { label: 'Total Spent', value: formatCurrency(stats.total_spent), icon: '💸', cls: 'spent' },
    ] : [];

    const statusOrder = ['Planned', 'Purchased', 'Delivered', 'Done'];

    return (
        <>
            <div className="page-header">
                <h1>⚙️ Admin Panel</h1>
                <p>Kelola data dan pengaturan aplikasi MoveBudget</p>
            </div>

            {/* Database Stats */}
            <section className="admin-section">
                <h2 className="admin-section-title">📊 Database Overview</h2>
                {loadingStats ? (
                    <div className="loading-container"><div className="spinner" /></div>
                ) : (
                    <>
                        <div className="stats-grid">
                            {statCards.map((s, i) => (
                                <div key={i} className={`stat-card ${s.cls}`}>
                                    <div className="stat-icon">{s.icon}</div>
                                    <div className="stat-label">{s.label}</div>
                                    <div className="stat-value">{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Status Breakdown */}
                        {stats && Object.keys(stats.status_breakdown).length > 0 && (
                            <div className="card admin-breakdown-card">
                                <div className="card-header">
                                    <h2>📋 Status Breakdown</h2>
                                </div>
                                <div className="card-body">
                                    <div className="admin-status-grid">
                                        {statusOrder.map(status => (
                                            <div key={status} className="admin-status-item">
                                                <div className="admin-status-dot-wrapper">
                                                    <span className={`col-dot ${status.toLowerCase()}`} />
                                                    <span className="admin-status-label">{status}</span>
                                                </div>
                                                <span className="admin-status-count">
                                                    {stats.status_breakdown[status] || 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Quick Actions */}
            <section className="admin-section">
                <h2 className="admin-section-title">⚡ Quick Actions</h2>
                <div className="admin-actions-grid">
                    <div className="card admin-action-card">
                        <div className="card-body">
                            <div className="admin-action-icon">📥</div>
                            <h3>Export Data</h3>
                            <p>Download semua data kategori dan items sebagai file JSON.</p>
                            <button
                                className="btn btn-primary"
                                onClick={handleExport}
                                disabled={!!actionLoading}
                                id="btn-export"
                            >
                                {actionLoading === 'export' ? '⏳ Exporting...' : '📥 Export JSON'}
                            </button>
                        </div>
                    </div>

                    <div className="card admin-action-card">
                        <div className="card-body">
                            <div className="admin-action-icon">🔄</div>
                            <h3>Reset & Seed</h3>
                            <p>Hapus semua data dan muat ulang data demo untuk testing.</p>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setConfirmModal({ open: true, type: 'reset' })}
                                disabled={!!actionLoading}
                                id="btn-reset"
                            >
                                {actionLoading === 'reset' ? '⏳ Resetting...' : '🔄 Reset Data'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="admin-section">
                <h2 className="admin-section-title">🚨 Danger Zone</h2>
                <div className="card admin-danger-card">
                    <div className="card-body">
                        <div className="admin-danger-content">
                            <div>
                                <h3>Hapus Semua Data</h3>
                                <p>Aksi ini akan menghapus <strong>semua</strong> kategori dan items secara permanen. Data tidak bisa dikembalikan!</p>
                            </div>
                            <button
                                className="btn btn-danger"
                                onClick={() => setConfirmModal({ open: true, type: 'clear' })}
                                disabled={!!actionLoading}
                                id="btn-clear-all"
                            >
                                {actionLoading === 'clear' ? '⏳ Menghapus...' : '🗑️ Hapus Semua'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Confirm Modal for Reset */}
            <ConfirmModal
                isOpen={confirmModal.open && confirmModal.type === 'reset'}
                onClose={() => setConfirmModal({ open: false, type: '' })}
                onConfirm={handleReset}
                name="Semua data akan dihapus dan diganti dengan data demo. Lanjutkan?"
            />

            {/* Confirm Modal for Clear */}
            <ConfirmModal
                isOpen={confirmModal.open && confirmModal.type === 'clear'}
                onClose={() => setConfirmModal({ open: false, type: '' })}
                onConfirm={handleClear}
                name="SEMUA data akan dihapus secara permanen. Aksi ini tidak bisa dibatalkan!"
            />
        </>
    );
}
