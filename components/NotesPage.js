'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext } from '@/app/page';

const NOTE_CATEGORIES = [
    'Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas',
    'Kesehatan', 'Hiburan', 'Pendidikan', 'Investasi',
    'Gaji & Penghasilan', 'Bonus', 'Freelance', 'Lainnya'
];

const TYPE_COLORS = {
    income: { bg: 'var(--income-bg)', text: 'var(--income-text)', border: 'var(--income-border)', label: 'Pemasukan' },
    expense: { bg: 'var(--expense-bg)', text: 'var(--expense-text)', border: 'var(--expense-border)', label: 'Pengeluaran' },
};

function StatCard({ icon, label, value, sub, colorClass }) {
    return (
        <div className={`notes-stat-card ${colorClass}`}>
            <div className="notes-stat-icon">{icon}</div>
            <div className="notes-stat-body">
                <div className="notes-stat-label">{label}</div>
                <div className="notes-stat-value">{value}</div>
                {sub && <div className="notes-stat-sub">{sub}</div>}
            </div>
        </div>
    );
}

function NoteCard({ note, onEdit, onDelete, formatCurrency }) {
    const type = TYPE_COLORS[note.type] || TYPE_COLORS.expense;
    const tags = note.tags ? note.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    return (
        <div className="note-card" style={{ borderLeft: `4px solid ${type.border}` }}>
            <div className="note-card-header">
                <div className="note-card-title-row">
                    <span className={`note-type-badge ${note.type}`}>{type.label}</span>
                    <h3 className="note-card-title">{note.title}</h3>
                </div>
                <div className="note-card-amount" style={{ color: type.text }}>
                    {note.type === 'expense' ? '−' : '+'}{formatCurrency(note.amount)}
                </div>
            </div>
            <div className="note-card-meta">
                <span className="note-meta-item">
                    <span className="note-meta-icon">📅</span>
                    {new Date(note.note_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {note.category && (
                    <span className="note-meta-item">
                        <span className="note-meta-icon">🏷️</span>
                        {note.category}
                    </span>
                )}
            </div>
            {note.description && (
                <p className="note-card-desc">{note.description}</p>
            )}
            {tags.length > 0 && (
                <div className="note-tags">
                    {tags.map((tag, i) => (
                        <span key={i} className="note-tag">#{tag}</span>
                    ))}
                </div>
            )}
            <div className="note-card-actions">
                <button className="note-action-btn edit" onClick={() => onEdit(note)}>✏️ Edit</button>
                <button className="note-action-btn delete" onClick={() => onDelete(note)}>🗑️ Hapus</button>
            </div>
        </div>
    );
}

function NoteModal({ note, onClose, onSave }) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        title: note?.title || '',
        amount: note?.amount || '',
        type: note?.type || 'expense',
        category: note?.category || '',
        description: note?.description || '',
        note_date: note?.note_date || today,
        tags: note?.tags || '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Judul wajib diisi';
        if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
            e.amount = 'Jumlah harus berupa angka positif';
        if (!form.note_date) e.note_date = 'Tanggal wajib diisi';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setSaving(true);
        try {
            await onSave({ ...form, amount: Number(form.amount) });
        } finally {
            setSaving(false);
        }
    };

    const set = (field, val) => {
        setForm(prev => ({ ...prev, [field]: val }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box notes-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {note ? '✏️ Edit Catatan' : '➕ Catatan Baru'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="notes-form">
                    {/* Type Toggle */}
                    <div className="form-group">
                        <label className="form-label">Jenis</label>
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={`type-btn expense ${form.type === 'expense' ? 'active' : ''}`}
                                onClick={() => set('type', 'expense')}
                            >
                                📤 Pengeluaran
                            </button>
                            <button
                                type="button"
                                className={`type-btn income ${form.type === 'income' ? 'active' : ''}`}
                                onClick={() => set('type', 'income')}
                            >
                                📥 Pemasukan
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label className="form-label">Judul <span className="required">*</span></label>
                        <input
                            className={`form-input ${errors.title ? 'input-error' : ''}`}
                            placeholder="Contoh: Bayar listrik bulan Maret"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                        />
                        {errors.title && <span className="form-error">{errors.title}</span>}
                    </div>

                    {/* Amount + Date */}
                    <div className="form-row-2">
                        <div className="form-group">
                            <label className="form-label">Jumlah (Rp) <span className="required">*</span></label>
                            <input
                                type="number"
                                className={`form-input ${errors.amount ? 'input-error' : ''}`}
                                placeholder="0"
                                min="0"
                                value={form.amount}
                                onChange={e => set('amount', e.target.value)}
                            />
                            {errors.amount && <span className="form-error">{errors.amount}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal <span className="required">*</span></label>
                            <input
                                type="date"
                                className={`form-input ${errors.note_date ? 'input-error' : ''}`}
                                value={form.note_date}
                                onChange={e => set('note_date', e.target.value)}
                            />
                            {errors.note_date && <span className="form-error">{errors.note_date}</span>}
                        </div>
                    </div>

                    {/* Category */}
                    <div className="form-group">
                        <label className="form-label">Kategori</label>
                        <select
                            className="form-input"
                            value={form.category}
                            onChange={e => set('category', e.target.value)}
                        >
                            <option value="">— Pilih Kategori —</option>
                            {NOTE_CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <textarea
                            className="form-input form-textarea"
                            placeholder="Deskripsi singkat (opsional)"
                            rows={3}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                        />
                    </div>

                    {/* Tags */}
                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <input
                            className="form-input"
                            placeholder="Pisahkan dengan koma: rumah, penting, bulanan"
                            value={form.tags}
                            onChange={e => set('tags', e.target.value)}
                        />
                        <span className="form-hint">Gunakan koma untuk memisahkan beberapa tag</span>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? '⏳ Menyimpan...' : (note ? '💾 Simpan Perubahan' : '➕ Tambah Catatan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteModal({ note, onClose, onConfirm, formatCurrency }) {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        setDeleting(true);
        try { await onConfirm(); } finally { setDeleting(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box delete-modal-box" onClick={e => e.stopPropagation()}>
                <div className="delete-modal-icon">🗑️</div>
                <h3 className="delete-modal-title">Hapus Catatan?</h3>
                <p className="delete-modal-desc">
                    Catatan <strong>"{note.title}"</strong> ({formatCurrency(note.amount)}) akan dihapus secara permanen.
                </p>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? '⏳ Menghapus...' : '🗑️ Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function NotesPage() {
    const { showToast, formatCurrency } = useContext(AppContext);
    const [notes, setNotes] = useState([]);
    const [stats, setStats] = useState({ income: { count: 0, total: 0 }, expense: { count: 0, total: 0 }, net: 0, by_category: [] });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editNote, setEditNote] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [filter, setFilter] = useState({ type: '', category: '', search: '' });
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'stats'

    const fetchNotes = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter.type) params.set('type', filter.type);
            if (filter.category) params.set('category', filter.category);
            if (filter.search) params.set('search', filter.search);
            const res = await fetch(`/api/notes?${params}`);
            if (!res.ok) throw new Error('Gagal memuat catatan');
            setNotes(await res.json());
        } catch (err) {
            showToast(err.message, 'error');
        }
    }, [filter, showToast]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/notes/stats');
            if (!res.ok) throw new Error();
            setStats(await res.json());
        } catch { }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([fetchNotes(), fetchStats()]);
            setLoading(false);
        })();
    }, [fetchNotes, fetchStats]);

    const handleSave = async (data) => {
        try {
            let res;
            if (editNote) {
                res = await fetch(`/api/notes/${editNote.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                res = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Gagal menyimpan');
            }
            showToast(editNote ? 'Catatan diperbarui' : 'Catatan ditambahkan', 'success');
            setShowModal(false);
            setEditNote(null);
            await Promise.all([fetchNotes(), fetchStats()]);
        } catch (err) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/notes/${deleteTarget.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Gagal menghapus');
            showToast('Catatan dihapus', 'success');
            setDeleteTarget(null);
            await Promise.all([fetchNotes(), fetchStats()]);
        } catch (err) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const openAdd = () => { setEditNote(null); setShowModal(true); };
    const openEdit = (note) => { setEditNote(note); setShowModal(true); };

    const netPositive = stats.net >= 0;

    // Group notes by month
    const grouped = {};
    notes.forEach(n => {
        const d = new Date(n.note_date + 'T00:00:00');
        const key = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(n);
    });

    return (
        <div className="notes-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">📒 Catatan Keuangan</h1>
                    <p className="page-subtitle">Catat pemasukan dan pengeluaran harian Anda</p>
                </div>
                <button className="btn btn-primary" id="add-note-btn" onClick={openAdd}>
                    ➕ Tambah Catatan
                </button>
            </div>

            {/* Summary Stats */}
            <div className="notes-stats-row">
                <StatCard
                    icon="📥"
                    label="Total Pemasukan"
                    value={formatCurrency(stats.income.total)}
                    sub={`${stats.income.count} transaksi`}
                    colorClass="income-card"
                />
                <StatCard
                    icon="📤"
                    label="Total Pengeluaran"
                    value={formatCurrency(stats.expense.total)}
                    sub={`${stats.expense.count} transaksi`}
                    colorClass="expense-card"
                />
                <StatCard
                    icon={netPositive ? '📈' : '📉'}
                    label="Saldo Bersih"
                    value={formatCurrency(Math.abs(stats.net))}
                    sub={netPositive ? '✅ Surplus' : '⚠️ Defisit'}
                    colorClass={netPositive ? 'net-positive-card' : 'net-negative-card'}
                />
            </div>

            {/* View Toggle + Filters */}
            <div className="notes-toolbar">
                <div className="notes-filters">
                    {/* Search */}
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            className="filter-input search-input"
                            placeholder="Cari catatan..."
                            value={filter.search}
                            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                        />
                    </div>
                    {/* Type filter */}
                    <select
                        className="filter-input filter-select"
                        value={filter.type}
                        onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
                    >
                        <option value="">Semua Jenis</option>
                        <option value="income">📥 Pemasukan</option>
                        <option value="expense">📤 Pengeluaran</option>
                    </select>
                    {/* Category filter */}
                    <select
                        className="filter-input filter-select"
                        value={filter.category}
                        onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
                    >
                        <option value="">Semua Kategori</option>
                        {NOTE_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    {/* Clear filter */}
                    {(filter.type || filter.category || filter.search) && (
                        <button
                            className="btn btn-ghost clear-filter-btn"
                            onClick={() => setFilter({ type: '', category: '', search: '' })}
                        >
                            ✕ Reset
                        </button>
                    )}
                </div>

                <div className="view-toggle">
                    <button
                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="Tampilan daftar"
                    >📋 Daftar</button>
                    <button
                        className={`view-toggle-btn ${viewMode === 'stats' ? 'active' : ''}`}
                        onClick={() => setViewMode('stats')}
                        title="Tampilan statistik"
                    >📊 Statistik</button>
                </div>
            </div>

            {loading ? (
                <div className="notes-loading">
                    <div className="spinner" />
                    <span>Memuat catatan...</span>
                </div>
            ) : viewMode === 'stats' ? (
                /* STATS VIEW */
                <div className="notes-stats-detail">
                    <h2 className="section-title">📊 Ringkasan per Kategori</h2>
                    {stats.by_category.length === 0 ? (
                        <div className="notes-empty">Belum ada data statistik</div>
                    ) : (
                        <div className="category-stats-list">
                            {stats.by_category.map((c, i) => {
                                const maxTotal = Math.max(...stats.by_category.map(x => x.total), 1);
                                const pct = Math.round((c.total / maxTotal) * 100);
                                const isIncome = c.type === 'income';
                                return (
                                    <div key={i} className={`cat-stat-row ${c.type}`}>
                                        <div className="cat-stat-header">
                                            <span className="cat-stat-name">
                                                <span className={`note-type-badge ${c.type}`}>
                                                    {isIncome ? 'Masuk' : 'Keluar'}
                                                </span>
                                                {c.category || '(Tanpa kategori)'}
                                            </span>
                                            <span className="cat-stat-amount" style={{ color: isIncome ? 'var(--income-text)' : 'var(--expense-text)' }}>
                                                {formatCurrency(c.total)}
                                            </span>
                                        </div>
                                        <div className="cat-stat-bar-track">
                                            <div
                                                className={`cat-stat-bar-fill ${c.type}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : notes.length === 0 ? (
                /* EMPTY STATE */
                <div className="notes-empty-state">
                    <div className="empty-icon">📒</div>
                    <h3>Belum Ada Catatan</h3>
                    <p>Tambahkan catatan keuangan pertama Anda sekarang</p>
                    <button className="btn btn-primary" onClick={openAdd}>➕ Tambah Catatan</button>
                </div>
            ) : (
                /* LIST VIEW — Grouped by month */
                <div className="notes-list">
                    {Object.entries(grouped).map(([month, monthNotes]) => {
                        const monthIncome = monthNotes.filter(n => n.type === 'income').reduce((s, n) => s + n.amount, 0);
                        const monthExpense = monthNotes.filter(n => n.type === 'expense').reduce((s, n) => s + n.amount, 0);
                        return (
                            <div key={month} className="notes-month-group">
                                <div className="notes-month-header">
                                    <span className="notes-month-title">📅 {month}</span>
                                    <div className="notes-month-summary">
                                        {monthIncome > 0 && (
                                            <span className="month-badge income">+{formatCurrency(monthIncome)}</span>
                                        )}
                                        {monthExpense > 0 && (
                                            <span className="month-badge expense">−{formatCurrency(monthExpense)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="notes-cards">
                                    {monthNotes.map(note => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            onEdit={openEdit}
                                            onDelete={setDeleteTarget}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {showModal && (
                <NoteModal
                    note={editNote}
                    onClose={() => { setShowModal(false); setEditNote(null); }}
                    onSave={handleSave}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    note={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    formatCurrency={formatCurrency}
                />
            )}
        </div>
    );
}
