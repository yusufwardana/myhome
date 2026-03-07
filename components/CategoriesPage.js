'use client';

import { useState } from 'react';
import { useApp } from '@/app/page';
import Modal, { ConfirmModal } from '@/components/Modal';

export default function CategoriesPage() {
    const { categories, settings, formatCurrency, refreshData, showToast } = useApp();
    const totalBudget = Number(settings.total_budget) || 0;
    const allocated = categories.reduce((s, c) => s + Number(c.budget_limit), 0);
    const unallocated = totalBudget - allocated;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingCat, setDeletingCat] = useState(null);
    const [form, setForm] = useState({ name: '', budget_limit: '' });
    const [saving, setSaving] = useState(false);

    function openAdd() {
        setEditingCat(null);
        setForm({ name: '', budget_limit: '' });
        setModalOpen(true);
    }

    function openEdit(cat) {
        setEditingCat(cat);
        setForm({ name: cat.name, budget_limit: cat.budget_limit });
        setModalOpen(true);
    }

    async function handleSave() {
        if (!form.name.trim() || form.budget_limit === '') {
            showToast('Lengkapi semua field', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editingCat) {
                await fetch(`/api/categories/${editingCat.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: form.name, budget_limit: Number(form.budget_limit) }),
                });
                showToast('Kategori berhasil diperbarui');
            } else {
                await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: form.name, budget_limit: Number(form.budget_limit) }),
                });
                showToast('Kategori berhasil ditambahkan');
            }
            setModalOpen(false);
            await refreshData();
        } catch (err) {
            showToast('Gagal menyimpan', 'error');
        }
        setSaving(false);
    }

    function openDelete(cat) {
        setDeletingCat(cat);
        setConfirmOpen(true);
    }

    async function handleDelete() {
        try {
            await fetch(`/api/categories/${deletingCat.id}`, { method: 'DELETE' });
            showToast('Kategori dan item terkait berhasil dihapus');
            setConfirmOpen(false);
            await refreshData();
        } catch (err) {
            showToast('Gagal menghapus', 'error');
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header flex items-center justify-between flex-wrap gap-8">
                <div>
                    <h1>Kategori</h1>
                    <p>Kelola kategori budget pindah rumah</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <span>＋</span> Tambah Kategori
                </button>
            </div>

            {/* Budget Allocation Info */}
            {totalBudget > 0 && (
                <div className={`budget-alloc-bar ${unallocated < 0 ? 'over' : unallocated === 0 ? 'full' : ''}`}>
                    <div className="budget-alloc-info">
                        <span>💰 Total Budget: <strong>{formatCurrency(totalBudget)}</strong></span>
                        <span>📋 Teralokasi: <strong>{formatCurrency(allocated)}</strong></span>
                        <span className={unallocated < 0 ? 'text-danger' : 'text-success'}>
                            {unallocated >= 0 ? '✅' : '⚠️'} Sisa: <strong>{formatCurrency(unallocated)}</strong>
                        </span>
                    </div>
                    <div className="budget-alloc-progress">
                        <div className="progress-bar">
                            <div
                                className={`progress-bar-fill ${allocated > totalBudget ? 'danger' : allocated >= totalBudget * 0.8 ? 'warning' : ''}`}
                                style={{ width: `${Math.min((allocated / totalBudget) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="progress-bar-label">{totalBudget > 0 ? Math.round((allocated / totalBudget) * 100) : 0}% teralokasi</span>
                    </div>
                </div>
            )}

            {/* ═══ MOBILE: Category Card List ═══ */}
            <div className="mobile-categories-list">
                {categories.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px 24px' }}>
                        <div className="empty-icon">📁</div>
                        <p>Belum ada kategori</p>
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>＋ Tambah Kategori</button>
                    </div>
                ) : categories.map(cat => {
                    const spent = Number(cat.total_spent);
                    const budget = Number(cat.budget_limit);
                    const rem = budget - spent;
                    const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                    const ob = rem < 0;
                    const barClass = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : '';

                    return (
                        <div className="cat-card" key={cat.id}>
                            <div className="cat-card-header">
                                <div className="cat-card-title">
                                    <strong>{cat.name}</strong>
                                    {ob && <span className="badge badge-overbudget" style={{ marginLeft: 8 }}>⚠️ Over</span>}
                                </div>
                                <div className="cat-card-actions">
                                    <button className="btn-icon-sm" onClick={() => openEdit(cat)}>✏️</button>
                                    <button className="btn-icon-sm btn-icon-danger" onClick={() => openDelete(cat)}>🗑️</button>
                                </div>
                            </div>

                            <div className="cat-card-stats">
                                <div className="ccs-item">
                                    <span className="ccs-lbl">Budget</span>
                                    <span className="ccs-val">{formatCurrency(budget)}</span>
                                </div>
                                <div className="ccs-item text-right">
                                    <span className="ccs-lbl">Terpakai</span>
                                    <span className="ccs-val">{formatCurrency(spent)}</span>
                                </div>
                            </div>

                            <div className="cat-card-progress">
                                <div className="progress-bar">
                                    <div className={`progress-bar-fill ${barClass}`} style={{ width: `${percent}%` }} />
                                </div>
                                <div className="cat-card-rem-row">
                                    <span className="cc-percent">{percent.toFixed(1)}%</span>
                                    <span className={`cc-rem ${ob ? 'text-danger' : 'text-success'}`}>
                                        Sisa: {formatCurrency(rem)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ DESKTOP: Table View ═══ */}
            <div className="card desktop-categories-view">
                <div className="card-body-flush">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Kategori</th>
                                    <th className="text-right">Budget Limit</th>
                                    <th className="text-right">Total Spent</th>
                                    <th className="text-right">Remaining</th>
                                    <th>Progress</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length === 0 ? (
                                    <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📁</div><p>Belum ada kategori. Tambahkan kategori pertama Anda!</p></div></td></tr>
                                ) : categories.map(cat => {
                                    const spent = Number(cat.total_spent);
                                    const budget = Number(cat.budget_limit);
                                    const rem = budget - spent;
                                    const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                                    const ob = rem < 0;
                                    const barClass = percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : '';

                                    return (
                                        <tr key={cat.id} className={ob ? 'overbudget' : ''}>
                                            <td>
                                                <strong>{cat.name}</strong>
                                                {ob && <span className="badge badge-overbudget" style={{ marginLeft: 6 }}>⚠️ Over Budget</span>}
                                            </td>
                                            <td className="text-right currency">{formatCurrency(budget)}</td>
                                            <td className="text-right currency">{formatCurrency(spent)}</td>
                                            <td className={`text-right currency ${ob ? 'text-danger' : 'text-success'}`}>{formatCurrency(rem)}</td>
                                            <td>
                                                <div className="progress-bar-container">
                                                    <div className="progress-bar">
                                                        <div className={`progress-bar-fill ${barClass}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                                                    </div>
                                                    <div className="progress-bar-label">{percent.toFixed(1)}% used</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-icon" title="Edit" onClick={() => openEdit(cat)}>✏️</button>
                                                    <button className="btn-icon" title="Hapus" onClick={() => openDelete(cat)}>🗑️</button>
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

            {/* Category Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCat ? 'Edit Kategori' : 'Tambah Kategori'}
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
                        <label>Nama Kategori</label>
                        <input
                            type="text" placeholder="e.g. Furniture, Elektronik"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div className="form-group full-width">
                        <label>Budget Limit (Rp)</label>
                        <input
                            type="number" placeholder="0" min="0"
                            value={form.budget_limit} onChange={e => setForm(f => ({ ...f, budget_limit: e.target.value }))}
                        />
                        {totalBudget > 0 && (() => {
                            const currentAlloc = editingCat ? allocated - Number(editingCat.budget_limit) : allocated;
                            const availableForThis = totalBudget - currentAlloc;
                            const inputVal = Number(form.budget_limit) || 0;
                            const isOver = inputVal > availableForThis;
                            return (
                                <div className={`budget-limit-hint ${isOver ? 'over' : ''}`}>
                                    {isOver
                                        ? `⚠️ Melebihi sisa budget! Tersedia: ${formatCurrency(availableForThis)}`
                                        : `✅ Sisa budget tersedia: ${formatCurrency(availableForThis)}`
                                    }
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </Modal>

            {/* Confirm Delete */}
            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                name={deletingCat?.name}
            />
        </div>
    );
}
