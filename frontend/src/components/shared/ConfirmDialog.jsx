// ConfirmDialog — "Are you sure?" destructive action modal
// Usage: <ConfirmDialog open={...} onClose={...} onConfirm={...} title="..." message="..." danger />
import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="420px">
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Confirm'}
        </button>
      </div>
    </Modal>
  )
}
