// Modal — generic overlay modal wrapper
// Usage: <Modal open={open} onClose={() => setOpen(false)} title="...">...</Modal>
export default function Modal({ open, onClose, title, children, width = '520px' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: width }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
