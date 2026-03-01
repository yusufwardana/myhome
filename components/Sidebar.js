'use client';

export default function Sidebar({ activePage, onNavigate, open }) {
    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'categories', icon: '📁', label: 'Kategori' },
        { id: 'items', icon: '📦', label: 'Items' },
    ];

    const adminItems = [
        { id: 'admin', icon: '⚙️', label: 'Admin' },
    ];

    return (
        <aside className={`sidebar ${open ? 'open' : ''}`}>
            <div className="sidebar-header">
                <a href="#" className="sidebar-logo" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
                    <div className="logo-icon">🏠</div>
                    <div className="logo-text">Move<span>Budget</span></div>
                </a>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
                <div className="nav-divider" />
                {adminItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-footer-info">MoveBudget v2.0<br />© 2026</div>
            </div>
        </aside>
    );
}

