'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/app/page';
import Modal, { ConfirmModal } from './Modal';

export default function AdminPage() {
    const { showToast, refreshData, formatCurrency, categories, items } = useApp();
    const [stats, setStats] = useState(null);
    const [categorySummary, setCategorySummary] = useState([]);
    const [settings, setSettings] = useState({});
    const [activityLog, setActivityLog] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [confirmModal, setConfirmModal] = useState({ open: false, type: '' });
    const [settingsModal, setSettingsModal] = useState(false);
    const [bulkModal, setBulkModal] = useState(false);
    const [settingsForm, setSettingsForm] = useState({});
    const [bulkAction, setBulkAction] = useState('update_status');
    const [bulkStatus, setBulkStatus] = useState('Done');
    const [bulkCategoryId, setBulkCategoryId] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const fileInputRef = useRef(null);

    // ── Fetch data ──
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const [statsRes, summaryRes, settingsRes, logRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/categories-summary'),
                fetch('/api/admin/settings'),
                fetch('/api/admin/activity?limit=15'),
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (summaryRes.ok) setCategorySummary(await summaryRes.json());
            if (settingsRes.ok) {
                const s = await settingsRes.json();
                setSettings(s);
                setSettingsForm(s);
            }
            if (logRes.ok) setActivityLog(await logRes.json());
        } catch (err) {
            console.error(err);
            showToast('Gagal memuat data admin', 'error');
        }
        setLoadingStats(false);
    }, [showToast]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // ── Export ──
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
            await fetchStats();
        } catch (err) {
            console.error(err);
            showToast('Gagal export data', 'error');
        }
        setActionLoading('');
    };

    // ── Import ──
    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setActionLoading('import');
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Import failed');
            }
            const result = await res.json();
            showToast(`Import berhasil! ${result.categories_imported} kategori, ${result.items_imported} items`);
            await refreshData();
            await fetchStats();
        } catch (err) {
            console.error(err);
            showToast(`Gagal import: ${err.message}`, 'error');
        }
        setActionLoading('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Reset ──
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

    // ── Clear ──
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

    // ── Settings ──
    const handleSaveSettings = async () => {
        setActionLoading('settings');
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsForm),
            });
            if (!res.ok) throw new Error('Save failed');
            const updated = await res.json();
            setSettings(updated);
            showToast('Pengaturan berhasil disimpan!');
            setSettingsModal(false);
            await fetchStats();
        } catch (err) {
            console.error(err);
            showToast('Gagal menyimpan pengaturan', 'error');
        }
        setActionLoading('');
    };

    // ── Bulk Operations ──
    const handleBulkExecute = async () => {
        setActionLoading('bulk');
        try {
            let body = { action: bulkAction };
            if (bulkAction === 'update_status') {
                body.item_ids = selectedItems;
                body.status = bulkStatus;
                if (selectedItems.length === 0) {
                    showToast('Pilih minimal 1 item', 'error');
                    setActionLoading('');
                    return;
                }
            } else {
                body.category_id = Number(bulkCategoryId);
                if (!bulkCategoryId) {
                    showToast('Pilih kategori', 'error');
                    setActionLoading('');
                    return;
                }
            }
            const res = await fetch('/api/admin/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Bulk operation failed');
            showToast('Bulk operation berhasil!');
            setBulkModal(false);
            setSelectedItems([]);
            await refreshData();
            await fetchStats();
        } catch (err) {
            console.error(err);
            showToast('Gagal menjalankan bulk operation', 'error');
        }
        setActionLoading('');
    };

    // ── Clear Activity Log ──
    const handleClearLog = async () => {
        try {
            const res = await fetch('/api/admin/activity', { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            showToast('Activity log dihapus');
            setActivityLog([]);
        } catch (err) {
            showToast('Gagal menghapus log', 'error');
        }
    };

    // ── Toggle item selection ──
    const toggleItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAllItems = () => {
        if (selectedItems.length === items.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items.map(i => i.id));
        }
    };

    // ── Data ──
    const statCards = stats ? [
        { label: 'Total Kategori', value: stats.total_categories, icon: '📁', cls: 'budget' },
        { label: 'Total Items', value: stats.total_items, icon: '📦', cls: 'items-card' },
        { label: 'Total Budget', value: formatCurrency(stats.total_budget), icon: '💰', cls: 'budget' },
        { label: 'Total Spent', value: formatCurrency(stats.total_spent), icon: '💸', cls: 'spent' },
    ] : [];

    const statusOrder = ['Planned', 'Purchased', 'Delivered', 'Done'];

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const actionIcons = {
        'Data Exported': '📥',
        'Data Imported': '📤',
        'Data Reset & Seeded': '🔄',
        'All Data Cleared': '🗑️',
        'Settings Updated': '⚙️',
        'Bulk Status Update': '🔀',
        'Bulk Delete': '🗑️',
    };

    return (
        <>
            <div className="page-header">
                <h1>⚙️ Admin Panel</h1>
                <p>Kelola data dan pengaturan aplikasi MoveBudget</p>
            </div>

            {/* ── Database Overview ── */}
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

            {/* ── Database Info ── */}
            <section className="admin-section">
                <h2 className="admin-section-title">🗄️ Database Info</h2>
                <div className="card">
                    <div className="card-body">
                        <div className="admin-db-info-grid">
                            <div className="admin-db-info-item">
                                <span className="admin-db-info-label">Status</span>
                                <span className="admin-db-info-value">
                                    <span className={`admin-db-dot ${stats ? 'connected' : 'disconnected'}`} />
                                    {stats ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            <div className="admin-db-info-item">
                                <span className="admin-db-info-label">Provider</span>
                                <span className="admin-db-info-value">Neon / Vercel Postgres</span>
                            </div>
                            <div className="admin-db-info-item">
                                <span className="admin-db-info-label">Tables</span>
                                <span className="admin-db-info-value">4 (categories, items, app_settings, activity_log)</span>
                            </div>
                            <div className="admin-db-info-item">
                                <span className="admin-db-info-label">Last Check</span>
                                <span className="admin-db-info-value">{formatTime(new Date())}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Category Summary ── */}
            {categorySummary.length > 0 && (
                <section className="admin-section">
                    <h2 className="admin-section-title">📊 Budget per Kategori</h2>
                    <div className="card">
                        <div className="card-body-flush">
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Kategori</th>
                                            <th>Items</th>
                                            <th>Budget</th>
                                            <th>Spent</th>
                                            <th>Remaining</th>
                                            <th>Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categorySummary.map(cat => (
                                            <tr key={cat.id} className={cat.percentage > 100 ? 'overbudget' : ''}>
                                                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                                <td>{cat.item_count}</td>
                                                <td>{formatCurrency(cat.budget_limit)}</td>
                                                <td>{formatCurrency(cat.total_spent)}</td>
                                                <td style={{ color: cat.remaining < 0 ? 'var(--danger)' : 'var(--success)' }}>
                                                    {formatCurrency(cat.remaining)}
                                                </td>
                                                <td style={{ minWidth: 140 }}>
                                                    <div className="progress-bar-container">
                                                        <div className="progress-bar">
                                                            <div
                                                                className={`progress-bar-fill ${cat.percentage > 100 ? 'danger' : cat.percentage > 80 ? 'warning' : ''}`}
                                                                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="progress-bar-label">{cat.percentage}%</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── App Settings ── */}
            <section className="admin-section">
                <h2 className="admin-section-title">🎛️ App Settings</h2>
                <div className="card">
                    <div className="card-body">
                        <div className="admin-settings-preview">
                            <div className="admin-settings-item">
                                <span className="admin-settings-label">Nama Project</span>
                                <span className="admin-settings-value">{settings.project_name || 'MoveBudget'}</span>
                            </div>
                            <div className="admin-settings-item">
                                <span className="admin-settings-label">Mata Uang</span>
                                <span className="admin-settings-value">{settings.currency || 'IDR'} ({settings.currency_symbol || 'Rp'})</span>
                            </div>
                            <div className="admin-settings-item">
                                <span className="admin-settings-label">Total Budget</span>
                                <span className="admin-settings-value">{formatCurrency(Number(settings.total_budget) || 0)}</span>
                            </div>
                            <div className="admin-settings-item">
                                <span className="admin-settings-label">Budget Warning</span>
                                <span className="admin-settings-value">{settings.budget_warning_threshold || '80'}%</span>
                            </div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <button className="btn btn-secondary" onClick={() => { setSettingsForm({ ...settings }); setSettingsModal(true); }} id="btn-open-settings">
                                ✏️ Edit Settings
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Quick Actions ── */}
            <section className="admin-section">
                <h2 className="admin-section-title">⚡ Quick Actions</h2>
                <div className="admin-actions-grid admin-actions-grid-4">
                    <div className="card admin-action-card">
                        <div className="card-body">
                            <div className="admin-action-icon">📥</div>
                            <h3>Export Data</h3>
                            <p>Download semua data sebagai JSON.</p>
                            <button className="btn btn-primary" onClick={handleExport} disabled={!!actionLoading} id="btn-export">
                                {actionLoading === 'export' ? '⏳ ...' : '📥 Export'}
                            </button>
                        </div>
                    </div>

                    <div className="card admin-action-card">
                        <div className="card-body">
                            <div className="admin-action-icon" style={{ background: 'var(--success-light)' }}>📤</div>
                            <h3>Import Data</h3>
                            <p>Upload file JSON untuk restore.</p>
                            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} id="file-import" />
                            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={!!actionLoading} id="btn-import">
                                {actionLoading === 'import' ? '⏳ ...' : '📤 Import'}
                            </button>
                        </div>
                    </div>

                    <div className="card admin-action-card">
                        <div className="card-body">
                            <div className="admin-action-icon" style={{ background: 'var(--warning-light)' }}>🔄</div>
                            <h3>Reset & Seed</h3>
                            <p>Reset dan muat data demo.</p>
                            <button className="btn btn-secondary" onClick={() => setConfirmModal({ open: true, type: 'reset' })} disabled={!!actionLoading} id="btn-reset">
                                {actionLoading === 'reset' ? '⏳ ...' : '🔄 Reset'}
                            </button>
                        </div>
                    </div>

                    <div className="card admin-action-card">
                        <div className="card-body">
                            <div className="admin-action-icon" style={{ background: 'var(--info-light)' }}>🔀</div>
                            <h3>Bulk Operations</h3>
                            <p>Update status / hapus bulk.</p>
                            <button className="btn btn-secondary" onClick={() => setBulkModal(true)} disabled={!!actionLoading} id="btn-bulk">
                                🔀 Bulk Ops
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Activity Log ── */}
            <section className="admin-section">
                <h2 className="admin-section-title">📜 Activity Log</h2>
                <div className="card">
                    <div className="card-header">
                        <h2>Riwayat Aktivitas</h2>
                        {activityLog.length > 0 && (
                            <button className="btn btn-sm btn-secondary" onClick={handleClearLog}>🗑️ Clear Log</button>
                        )}
                    </div>
                    <div className="card-body-flush">
                        {activityLog.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📜</div>
                                <p>Belum ada aktivitas tercatat</p>
                            </div>
                        ) : (
                            <div className="admin-log-list">
                                {activityLog.map(log => (
                                    <div key={log.id} className="admin-log-item">
                                        <div className="admin-log-icon">{actionIcons[log.action] || '📌'}</div>
                                        <div className="admin-log-content">
                                            <div className="admin-log-action">{log.action}</div>
                                            {log.detail && <div className="admin-log-detail">{log.detail}</div>}
                                        </div>
                                        <div className="admin-log-time">{formatTime(log.created_at)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Danger Zone ── */}
            <section className="admin-section">
                <h2 className="admin-section-title">🚨 Danger Zone</h2>
                <div className="card admin-danger-card">
                    <div className="card-body">
                        <div className="admin-danger-content">
                            <div>
                                <h3>Hapus Semua Data</h3>
                                <p>Aksi ini akan menghapus <strong>semua</strong> kategori dan items secara permanen. Data tidak bisa dikembalikan!</p>
                            </div>
                            <button className="btn btn-danger" onClick={() => setConfirmModal({ open: true, type: 'clear' })} disabled={!!actionLoading} id="btn-clear-all">
                                {actionLoading === 'clear' ? '⏳ ...' : '🗑️ Hapus Semua'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Settings Modal ── */}
            <Modal isOpen={settingsModal} onClose={() => setSettingsModal(false)} title="⚙️ Edit Settings" footer={
                <>
                    <button className="btn btn-secondary" onClick={() => setSettingsModal(false)}>Batal</button>
                    <button className="btn btn-primary" onClick={handleSaveSettings} disabled={actionLoading === 'settings'}>
                        {actionLoading === 'settings' ? '⏳ Saving...' : '💾 Simpan'}
                    </button>
                </>
            }>
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Nama Project</label>
                        <input type="text" value={settingsForm.project_name || ''} onChange={e => setSettingsForm(f => ({ ...f, project_name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Kode Mata Uang</label>
                        <select value={settingsForm.currency || 'IDR'} onChange={e => {
                            const v = e.target.value;
                            const symbols = { IDR: 'Rp', USD: '$', EUR: '€', GBP: '£', JPY: '¥', SGD: 'S$', MYR: 'RM' };
                            setSettingsForm(f => ({ ...f, currency: v, currency_symbol: symbols[v] || v }));
                        }}>
                            <option value="IDR">IDR — Rupiah</option>
                            <option value="USD">USD — Dollar</option>
                            <option value="EUR">EUR — Euro</option>
                            <option value="GBP">GBP — Pound</option>
                            <option value="JPY">JPY — Yen</option>
                            <option value="SGD">SGD — Singapore Dollar</option>
                            <option value="MYR">MYR — Ringgit</option>
                        </select>
                    </div>
                    <div className="form-group full-width">
                        <label>Total Budget (Rp)</label>
                        <input type="number" min="0" value={settingsForm.total_budget || ''} onChange={e => setSettingsForm(f => ({ ...f, total_budget: e.target.value }))} placeholder="e.g. 50000000" />
                        {settingsForm.total_budget && Number(settingsForm.total_budget) > 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                = {formatCurrency(Number(settingsForm.total_budget))}
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Budget Warning Threshold (%)</label>
                        <input type="number" min="1" max="100" value={settingsForm.budget_warning_threshold || '80'} onChange={e => setSettingsForm(f => ({ ...f, budget_warning_threshold: e.target.value }))} />
                    </div>
                </div>
            </Modal>

            {/* ── Bulk Operations Modal ── */}
            <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title="🔀 Bulk Operations" footer={
                <>
                    <button className="btn btn-secondary" onClick={() => setBulkModal(false)}>Batal</button>
                    <button className="btn btn-primary" onClick={handleBulkExecute} disabled={actionLoading === 'bulk'}>
                        {actionLoading === 'bulk' ? '⏳ ...' : '▶️ Execute'}
                    </button>
                </>
            }>
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Aksi</label>
                        <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                            <option value="update_status">Update Status Items</option>
                            <option value="delete_by_category">Hapus Items per Kategori</option>
                        </select>
                    </div>

                    {bulkAction === 'update_status' && (
                        <>
                            <div className="form-group full-width">
                                <label>Status Baru</label>
                                <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                                    {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Pilih Items ({selectedItems.length}/{items.length})</span>
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={selectAllItems} style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                                        {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </label>
                                <div className="admin-bulk-items-list">
                                    {items.map(item => (
                                        <label key={item.id} className="admin-bulk-item">
                                            <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} />
                                            <span>{item.name}</span>
                                            <span className={`badge badge-status-${item.status.toLowerCase()}`}>{item.status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {bulkAction === 'delete_by_category' && (
                        <div className="form-group full-width">
                            <label>Pilih Kategori</label>
                            <select value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value)}>
                                <option value="">-- Pilih Kategori --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Confirm Modals */}
            <ConfirmModal isOpen={confirmModal.open && confirmModal.type === 'reset'} onClose={() => setConfirmModal({ open: false, type: '' })} onConfirm={handleReset} name="Semua data akan dihapus dan diganti dengan data demo. Lanjutkan?" />
            <ConfirmModal isOpen={confirmModal.open && confirmModal.type === 'clear'} onClose={() => setConfirmModal({ open: false, type: '' })} onConfirm={handleClear} name="SEMUA data akan dihapus secara permanen. Aksi ini tidak bisa dibatalkan!" />
        </>
    );
}
