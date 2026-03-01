'use client';

import { useState } from 'react';

export default function BudgetSetup({ onComplete, showToast }) {
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [loadDemo, setLoadDemo] = useState(false);

    const formatPreview = (val) => {
        const num = Number(val);
        if (!val || isNaN(num) || num <= 0) return '';
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    const handleSubmit = async () => {
        const num = Number(amount);
        if (!amount || isNaN(num) || num <= 0) {
            setError('Masukkan jumlah budget yang valid');
            return;
        }
        if (num < 100000) {
            setError('Budget minimal Rp 100.000');
            return;
        }
        setError('');
        setSaving(true);
        try {
            // 1. Save total_budget to settings
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total_budget: String(num) }),
            });
            if (!res.ok) throw new Error('Gagal menyimpan budget');

            // 2. Optionally seed demo data
            if (loadDemo) {
                const seedRes = await fetch('/api/seed', { method: 'POST' });
                if (!seedRes.ok) throw new Error('Gagal memuat data demo');
            }

            showToast?.('Budget berhasil disimpan! 🎉');
            onComplete();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Gagal menyimpan. Coba lagi.');
        }
        setSaving(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const presets = [
        { label: '25 Juta', value: 25000000 },
        { label: '50 Juta', value: 50000000 },
        { label: '75 Juta', value: 75000000 },
        { label: '100 Juta', value: 100000000 },
        { label: '150 Juta', value: 150000000 },
    ];

    return (
        <div className="budget-setup-overlay">
            <div className="budget-setup-card">
                <div className="budget-setup-header">
                    <div className="budget-setup-logo">
                        <span className="budget-setup-logo-icon">🏠</span>
                        <span className="budget-setup-logo-text">Nara<span>Home</span></span>
                    </div>
                    <h1>Selamat Datang!</h1>
                    <p>Atur total budget pindah rumah &amp; perabot Anda untuk memulai perencanaan.</p>
                </div>

                <div className="budget-setup-body">
                    <label className="budget-setup-label">Total Budget Keseluruhan</label>
                    <div className="budget-setup-input-wrapper">
                        <span className="budget-setup-prefix">Rp</span>
                        <input
                            type="number"
                            className="budget-setup-input"
                            placeholder="Contoh: 50000000"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError(''); }}
                            onKeyDown={handleKeyDown}
                            min="0"
                            autoFocus
                        />
                    </div>
                    {amount && Number(amount) > 0 && (
                        <div className="budget-setup-preview">
                            = {formatPreview(amount)}
                        </div>
                    )}
                    {error && <div className="budget-setup-error">⚠️ {error}</div>}

                    <div className="budget-setup-presets">
                        <span className="budget-setup-presets-label">Quick set:</span>
                        {presets.map(p => (
                            <button
                                key={p.value}
                                className={`budget-setup-preset-btn ${Number(amount) === p.value ? 'active' : ''}`}
                                onClick={() => { setAmount(String(p.value)); setError(''); }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Demo data toggle */}
                    <label className="budget-setup-demo-toggle">
                        <div className={`budget-setup-toggle-track ${loadDemo ? 'on' : ''}`} onClick={() => setLoadDemo(v => !v)}>
                            <div className="budget-setup-toggle-thumb" />
                        </div>
                        <div className="budget-setup-demo-text">
                            <span className="budget-setup-demo-label">Muat data demo</span>
                            <span className="budget-setup-demo-sub">
                                {loadDemo
                                    ? 'Akan diisi contoh kategori & items — bisa dihapus nanti'
                                    : 'Mulai dari database kosong'}
                            </span>
                        </div>
                    </label>
                </div>

                <div className="budget-setup-footer">
                    <button
                        className="btn btn-primary budget-setup-submit"
                        onClick={handleSubmit}
                        disabled={saving || !amount || Number(amount) <= 0}
                        id="btn-budget-setup-submit"
                    >
                        {saving ? '⏳ Menyimpan...' : '🚀 Mulai Planning'}
                    </button>
                    <p className="budget-setup-hint">Budget bisa diubah nanti di halaman Admin → Settings</p>
                </div>
            </div>
        </div>
    );
}
