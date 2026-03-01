'use client';

export default function Modal({ isOpen, onClose, title, children, footer }) {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, name }) {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-body">
                    <div className="confirm-dialog">
                        <div className="confirm-icon">⚠️</div>
                        <p>Apakah Anda yakin ingin menghapus:</p>
                        <p className="confirm-name">{name}</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Hapus</button>
                </div>
            </div>
        </div>
    );
}
