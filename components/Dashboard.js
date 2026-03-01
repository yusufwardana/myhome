'use client';

import { useApp } from '@/app/page';
import { useRef, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#a855f7', '#06b6d4'];

export default function Dashboard() {
    const { categories, items, formatCurrency, navigate } = useApp();

    const totalBudget = categories.reduce((s, c) => s + Number(c.budget_limit), 0);
    const totalSpent = items.reduce((s, i) => s + Number(i.final_price || 0), 0);
    const remaining = totalBudget - totalSpent;
    const overbudget = remaining < 0;
    const activeItems = items.filter(i => i.status !== 'Done');
    const purchasedCount = items.filter(i => Number(i.final_price) > 0).length;

    function isBestDeal(item) {
        return Number(item.final_price) > 0 && Number(item.estimated_price) > 0 && Number(item.final_price) < Number(item.estimated_price);
    }

    // Chart data
    const catSpentData = categories.map(c => ({ label: c.name, value: Number(c.total_spent) })).filter(d => d.value > 0);

    const doughnutData = {
        labels: catSpentData.map(d => d.label),
        datasets: [{
            data: catSpentData.map(d => d.value),
            backgroundColor: COLORS.slice(0, catSpentData.length),
            borderWidth: 0,
            hoverOffset: 8,
        }],
    };

    const doughnutOpts = {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 16, font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyleWidth: 10 } },
            tooltip: {
                backgroundColor: '#1c1f2e', titleColor: '#e8eaed', bodyColor: '#9ca3af',
                borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, padding: 12,
                callbacks: { label: (ctx) => ' Rp ' + Number(ctx.raw).toLocaleString('id-ID') },
            },
        },
    };

    const barData = {
        labels: categories.map(c => c.name),
        datasets: [
            {
                label: 'Budget', data: categories.map(c => Number(c.budget_limit)),
                backgroundColor: 'rgba(99,102,241,0.3)', borderColor: '#6366f1',
                borderWidth: 1, borderRadius: 6, barPercentage: 0.6,
            },
            {
                label: 'Spent', data: categories.map(c => Number(c.total_spent)),
                backgroundColor: 'rgba(245,158,11,0.3)', borderColor: '#f59e0b',
                borderWidth: 1, borderRadius: 6, barPercentage: 0.6,
            },
        ],
    };

    const barOpts = {
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } } },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: {
                    color: '#6b7280', font: { family: 'Inter', size: 11 },
                    callback: (v) => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v,
                },
            },
        },
        plugins: {
            legend: { position: 'top', labels: { color: '#9ca3af', padding: 16, font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyleWidth: 10 } },
            tooltip: {
                backgroundColor: '#1c1f2e', titleColor: '#e8eaed', bodyColor: '#9ca3af',
                borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, padding: 12,
                callbacks: { label: (ctx) => ' ' + ctx.dataset.label + ': Rp ' + Number(ctx.raw).toLocaleString('id-ID') },
            },
        },
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Ringkasan biaya pindah rumah &amp; perabot Anda</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card budget">
                    <div className="stat-icon">💰</div>
                    <div className="stat-label">Total Budget</div>
                    <div className="stat-value currency">{formatCurrency(totalBudget)}</div>
                    <div className="stat-sub">{categories.length} kategori</div>
                </div>
                <div className="stat-card spent">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value currency">{formatCurrency(totalSpent)}</div>
                    <div className="stat-sub">{purchasedCount} item dibeli</div>
                </div>
                <div className={`stat-card remaining ${overbudget ? 'overbudget' : ''}`}>
                    <div className="stat-icon">{overbudget ? '⚠️' : '✅'}</div>
                    <div className="stat-label">Remaining Budget</div>
                    <div className="stat-value currency">{formatCurrency(remaining)}</div>
                    <div className="stat-sub">{overbudget ? 'Over budget!' : 'Dalam budget'}</div>
                </div>
                <div className="stat-card items-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-label">Item Aktif</div>
                    <div className="stat-value">{activeItems.length}</div>
                    <div className="stat-sub">dari {items.length} total item</div>
                </div>
            </div>

            {/* Charts */}
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h2>📊 Pengeluaran per Kategori</h2></div>
                    <div className="card-body">
                        <div className="chart-container">
                            {catSpentData.length > 0 ? (
                                <Doughnut data={doughnutData} options={doughnutOpts} />
                            ) : (
                                <div className="empty-state"><div className="empty-icon">📊</div><p>Belum ada data pengeluaran</p></div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h2>📈 Budget vs Spent</h2></div>
                    <div className="card-body">
                        <div className="chart-container">
                            {categories.length > 0 ? (
                                <Bar data={barData} options={barOpts} />
                            ) : (
                                <div className="empty-state"><div className="empty-icon">📈</div><p>Belum ada data kategori</p></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Items */}
            <div className="card">
                <div className="card-header">
                    <h2>🔄 Item Aktif</h2>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>{activeItems.length} item aktif</span>
                </div>
                <div className="card-body-flush">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th><th>Kategori</th><th>Priority</th><th>Status</th><th className="text-right">Harga Final</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeItems.length === 0 ? (
                                    <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">🎉</div><p>Semua item sudah selesai!</p></div></td></tr>
                                ) : activeItems.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.name}</strong>
                                            {isBestDeal(item) && <span className="badge badge-best-deal" style={{ marginLeft: 6 }}>🏷️ Best Deal</span>}
                                        </td>
                                        <td>{item.category_name || '—'}</td>
                                        <td><span className={`badge badge-priority-${item.priority?.toLowerCase()}`}>{item.priority}</span></td>
                                        <td><span className={`badge badge-status-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                        <td className="text-right currency">{Number(item.final_price) ? formatCurrency(item.final_price) : <span className="text-muted">—</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
