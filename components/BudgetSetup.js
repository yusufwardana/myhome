'use client';

import { useState } from 'react';

export default function BudgetSetup({ onComplete }) {
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

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
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total_budget: String(num) }),
            });
            if (!res.ok) throw new Error('Failed to save');
            onComplete();
        } catch (err) {
            console.error(err);
            setError('Gagal menyimpan budget. Coba lagi.');
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
                    <p>Atur total budget pindah rumah & perabot Anda untuk memulai perencanaan.</p>
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
                            {formatPreview(amount)}
                        </div>
                    )}
                    {error && <div className="budget-setup-error">{error}</div>}

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
                </div>

                <div className="budget-setup-footer">
                    <button
                        className="btn btn-primary budget-setup-submit"
                        onClick={handleSubmit}
                        disabled={saving || !amount || Number(amount) <= 0}
                    >
                        {saving ? '⏳ Menyimpan...' : '🚀 Mulai Planning'}
                    </button>
                    <p className="budget-setup-hint">Budget bisa diubah nanti di halaman Admin → Settings</p>
                </div>
            </div>
        </div>
    );
}
