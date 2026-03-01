'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/app/page';
import Modal, { ConfirmModal } from '@/components/Modal';

export default function ItemsPage() {
    const { categories, items, formatCurrency, refreshData, showToast } = useApp();
    const [view, setView] = useState('table');
    const [filterCat, setFilterCat] = useState('');
    const [filterPri, setFilterPri] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', category_id: '', estimated_price: '', final_price: '',
        priority: 'Medium', status: 'Planned', purchase_date: '', notes: '',
    });

    const filtered = useMemo(() => {
        return items.filter(i => {
            if (filterCat && i.category_id !== Number(filterCat)) return false;
            if (filterPri && i.priority !== filterPri) return false;
            if (filterStatus && i.status !== filterStatus) return false;
            return true;
        });
    }, [items, filterCat, filterPri, filterStatus]);

    function isBestDeal(item) {
        return Number(item.final_price) > 0 && Number(item.estimated_price) > 0 && Number(item.final_price) < Number(item.estimated_price);
    }

    function formatDate(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function openAdd() {
        setEditingItem(null);
        setForm({ name: '', category_id: '', estimated_price: '', final_price: '', priority: 'Medium', status: 'Planned', purchase_date: '', notes: '' });
        setModalOpen(true);
    }

    function openEdit(item) {
        setEditingItem(item);
        setForm({
            name: item.name,
            category_id: item.category_id,
            estimated_price: item.estimated_price || '',
            final_price: item.final_price || '',
            priority: item.priority,
            status: item.status,
            purchase_date: item.purchase_date || '',
            notes: item.notes || '',
        });
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.category_id) {
            showToast('Lengkapi nama item dan kategori', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                category_id: Number(form.category_id),
                estimated_price: Number(form.estimated_price) || 0,
                final_price: Number(form.final_price) || 0,
                purchase_date: form.purchase_date || null,
            };

            if (editingItem) {
                await fetch(`/api/items/${editingItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Item berhasil diperbarui');
            } else {
                await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Item berhasil ditambahkan');
            }
            setModalOpen(false);
            await refreshData();
        } catch (err) {
            showToast('Gagal menyimpan', 'error');
        }
        setSaving(false);
    }

    function openDelete(item) {
        setDeletingItem(item);
        setConfirmOpen(true);
    }

    async function handleDelete() {
        try {
            await fetch(`/api/items/${deletingItem.id}`, { method: 'DELETE' });
            showToast('Item berhasil dihapus');
            setConfirmOpen(false);
            await refreshData();
        } catch (err) {
            showToast('Gagal menghapus', 'error');
        }
    }

    const updateField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    // Kanban data
    const statuses = ['Planned', 'Purchased', 'Delivered', 'Done'];
    const statusDot = { Planned: 'planned', Purchased: 'purchased', Delivered: 'delivered', Done: 'done' };

    return (
        <div className="fade-in">
            <div className="page-header flex items-center justify-between flex-wrap gap-8">
                <div>
                    <h1>Items</h1>
                    <p>Daftar semua item yang dibutuhkan</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <span>＋</span> Tambah Item
                </button>
            </div>

            {/* Filters & View Toggle */}
            <div className="card mb-24">
                <div className="card-header">
                    <div className="filters-bar">
                        <div className="filter-group">
                            <label>Kategori</label>
                            <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                                <option value="">Semua</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Priority</label>
                            <select className="filter-select" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
                                <option value="">Semua</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Status</label>
                            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="">Semua</option>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="view-toggle">
                        <button className={`view-toggle-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>📋 Table</button>
                        <button className={`view-toggle-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>📌 Kanban</button>
                    </div>
                </div>
            </div>

            {/* Table View */}
            {view === 'table' && (
                <div className="card">
                    <div className="card-body-flush">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item</th><th>Kategori</th><th>Priority</th><th>Status</th>
                                        <th className="text-right">Est. Price</th><th className="text-right">Final Price</th>
                                        <th>Tanggal</th><th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">📦</div><p>Tidak ada item ditemukan</p></div></td></tr>
                                    ) : filtered.map(item => {
                                        const bestDeal = isBestDeal(item);
                                        const savings = bestDeal ? Number(item.estimated_price) - Number(item.final_price) : 0;
                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <strong>{item.name}</strong>
                                                    {bestDeal && <span className="badge badge-best-deal" style={{ marginLeft: 6 }}>🏷️ Best Deal</span>}
                                                    {item.notes && <br />}
                                                    {item.notes && <small className="text-muted">{item.notes.substring(0, 50)}{item.notes.length > 50 ? '...' : ''}</small>}
                                                </td>
                                                <td>{item.category_name || '—'}</td>
                                                <td><span className={`badge badge-priority-${item.priority?.toLowerCase()}`}>{item.priority}</span></td>
                                                <td><span className={`badge badge-status-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                                <td className="text-right currency">{Number(item.estimated_price) ? formatCurrency(item.estimated_price) : <span className="text-muted">—</span>}</td>
                                                <td className="text-right currency">
                                                    {Number(item.final_price) ? formatCurrency(item.final_price) : <span className="text-muted">—</span>}
                                                    {bestDeal && <><br /><small className="text-success">Hemat {formatCurrency(savings)}</small></>}
                                                </td>
                                                <td>{formatDate(item.purchase_date)}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-icon" title="Edit" onClick={() => openEdit(item)}>✏️</button>
                                                        <button className="btn-icon" title="Hapus" onClick={() => openDelete(item)}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban View */}
            {view === 'kanban' && (
                <div className="kanban-board">
                    {statuses.map(st => {
                        const colItems = filtered.filter(i => i.status === st);
                        return (
                            <div className="kanban-column" key={st}>
                                <div className="kanban-column-header">
                                    <div className="col-title"><span className={`col-dot ${statusDot[st]}`} /> {st}</div>
                                    <span className="col-count">{colItems.length}</span>
                                </div>
                                <div className="kanban-column-body">
                                    {colItems.length === 0 ? (
                                        <div className="empty-state" style={{ padding: '24px 12px' }}><p className="text-muted" style={{ fontSize: '0.8rem' }}>Tidak ada item</p></div>
                                    ) : colItems.map(item => {
                                        const bestDeal = isBestDeal(item);
                                        return (
                                            <div className="kanban-card" key={item.id} onClick={() => openEdit(item)}>
                                                <div className="kc-name">{item.name}</div>
                                                <div className="kc-category">{item.category_name || '—'}</div>
                                                <div className="kc-footer">
                                                    <span className={`badge badge-priority-${item.priority?.toLowerCase()}`}>{item.priority}</span>
                                                    <span className="kc-price">{Number(item.final_price) ? formatCurrency(item.final_price) : (Number(item.estimated_price) ? formatCurrency(item.estimated_price) : '—')}</span>
                                                </div>
                                                {bestDeal && <div style={{ marginTop: 8 }}><span className="badge badge-best-deal">🏷️ Best Deal</span></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Item Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingItem ? 'Edit Item' : 'Tambah Item'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Nama Item</label>
                        <input type="text" placeholder="e.g. Sofa, TV, AC" value={form.name} onChange={updateField('name')} />
                    </div>
                    <div className="form-group">
                        <label>Kategori</label>
                        <select value={form.category_id} onChange={updateField('category_id')}>
                            <option value="">Pilih Kategori</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Priority</label>
                        <select value={form.priority} onChange={updateField('priority')}>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Estimasi Harga (Rp)</label>
                        <input type="number" placeholder="0" min="0" value={form.estimated_price} onChange={updateField('estimated_price')} />
                    </div>
                    <div className="form-group">
                        <label>Harga Final (Rp)</label>
                        <input type="number" placeholder="0" min="0" value={form.final_price} onChange={updateField('final_price')} />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select value={form.status} onChange={updateField('status')}>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tanggal Beli</label>
                        <input type="date" value={form.purchase_date} onChange={updateField('purchase_date')} />
                    </div>
                    <div className="form-group full-width">
                        <label>Catatan</label>
                        <textarea placeholder="Catatan tambahan..." value={form.notes} onChange={updateField('notes')} />
                    </div>
                </div>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                name={deletingItem?.name}
            />
        </div>
    );
}
