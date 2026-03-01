'use client';

export default function Toast({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>
                    <span>{t.type === 'success' ? '✅' : '❌'}</span> {t.message}
                </div>
            ))}
        </div>
    );
}
