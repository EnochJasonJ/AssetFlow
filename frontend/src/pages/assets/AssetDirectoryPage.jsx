// src/pages/assets/AssetDirectoryPage.jsx
import { useState, useEffect } from 'react'
// Screen 4 — Asset Registration & Directory
// Owner: Devipriya (built by Hari as additional commit)
import { useState } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import DataTable from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'
import Modal from '../../components/shared/Modal'
import { useAuth } from '../../context/AuthContext'
import { getAssets, getCategories, registerAsset } from '../../services/assets'
import AssetDetailPage from './AssetDetailPage'

export default function AssetDirectoryPage() {
  const { profile } = useAuth()
  const isAuthorized = profile?.role === 'Admin' || profile?.role === 'AssetManager'

  const [assets, setAssets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  // Selected Asset for Detail Drawer
  const [selectedAsset, setSelectedAsset] = useState(null)

  // Register Modal State
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    name: '',
    category_id: '',
    serial_number: '',
    qr_code: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_cost: '',
    condition: 'Excellent',
    location: 'Head Office (NY)',
    photo_url: '',
    is_bookable: false
  })
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [assetsData, catsData] = await Promise.all([
        getAssets(),
        getCategories()
      ])
      setAssets(assetsData)
      setCategories(catsData)
    } catch (err) {
      console.error('Failed to load assets data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!registerForm.name || !registerForm.category_id) {
      setRegisterError('Name and Category are required.')
      return
    }
    setRegisterLoading(true)
    setRegisterError('')
    try {
      await registerAsset(registerForm)
      setRegisterOpen(false)
      // Reset form
      setRegisterForm({
        name: '',
        category_id: '',
        serial_number: '',
        qr_code: '',
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_cost: '',
        condition: 'Excellent',
        location: 'Head Office (NY)',
        photo_url: '',
        is_bookable: false
      })
      await loadData()
    } catch (err) {
      setRegisterError(err.message || 'Failed to register asset.')
    } finally {
      setRegisterLoading(false)
    }
  }

  // Filter and Search Logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.name?.toLowerCase().includes(search.toLowerCase()) ||
      asset.asset_tag?.toLowerCase().includes(search.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = !categoryFilter || asset.category_id === categoryFilter
    const matchesStatus = !statusFilter || asset.status === statusFilter
    const matchesLocation = !locationFilter || asset.location?.toLowerCase().includes(locationFilter.toLowerCase())

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation
  })

  // Locations list for filter dropdown (extracted dynamically from data)
  const locations = Array.from(new Set(assets.map(a => a.location).filter(Boolean)))

  const columns = [
    {
      key: 'asset_tag',
      label: 'Asset Tag',
      render: (row) => (
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: 0, fontWeight: 'bold', color: 'var(--accent)', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}
          onClick={() => setSelectedAsset(row)}
        >
          {row.asset_tag}
        </button>
      )
    },
    { key: 'name', label: 'Name' },
    { key: 'category_name', label: 'Category' },
    { key: 'serial_number', label: 'Serial Number' },
    { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      render: (row) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedAsset(row)}
        >
          View Details
        </button>
      )
    }
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { useAssets, useAsset } from '../../hooks/useAssets'
import { useDepartments, useCategories } from '../../hooks/useLookups'
import { assetService } from '../../services/assetService'
import { useAuth } from '../../context/AuthContext'

const STATUSES = ['Available', 'Allocated', 'Reserved', 'UnderMaintenance', 'Lost', 'Retired', 'Disposed']
const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged']

// ─── Register / Edit Asset Modal ──────────────────────────────────────────────
function AssetFormModal({ open, onClose, onSaved, editing = null }) {
  const { categories } = useCategories()
  const [form, setForm] = useState(editing ?? {
    name: '', category_id: '', serial_number: '', qr_code: '', acquisition_date: '',
    acquisition_cost: '', condition: 'Good', location: '', photo_url: '', is_bookable: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function save() {
    if (!form.name || !form.category_id) { setError('Name and category are required.'); return }
    setSaving(true); setError('')
    const payload = { ...form, acquisition_cost: form.acquisition_cost ? parseFloat(form.acquisition_cost) : null }
    const { error: err } = editing
      ? await assetService.update(editing.id, payload)
      : await assetService.create(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit Asset — ${editing.asset_tag}` : 'Register New Asset'} width="620px">
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>Asset Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="e.g. MacBook Pro 14-inch" />
        </div>
        <div className="form-group">
          <label>Category *</label>
          <select value={form.category_id} onChange={set('category_id')}>
            <option value="">— Select —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Condition</label>
          <select value={form.condition} onChange={set('condition')}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Serial Number</label>
          <input value={form.serial_number} onChange={set('serial_number')} placeholder="SN-XXXX" />
        </div>
        <div className="form-group">
          <label>QR Code</label>
          <input value={form.qr_code} onChange={set('qr_code')} placeholder="QR identifier" />
        </div>
        <div className="form-group">
          <label>Acquisition Date</label>
          <input type="date" value={form.acquisition_date} onChange={set('acquisition_date')} />
        </div>
        <div className="form-group">
          <label>Acquisition Cost (₹)</label>
          <input type="number" value={form.acquisition_cost} onChange={set('acquisition_cost')} placeholder="0.00" min="0" step="0.01" />
        </div>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>Location</label>
          <input value={form.location} onChange={set('location')} placeholder="e.g. Floor 2, Rack B" />
        </div>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>Photo URL</label>
          <input value={form.photo_url} onChange={set('photo_url')} placeholder="https://..." />
        </div>
        <div className="form-group" style={{ gridColumn: '1/-1', flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
          <input id="is-bookable" type="checkbox" checked={form.is_bookable} onChange={set('is_bookable')} style={{ width: 'auto' }} />
          <label htmlFor="is-bookable" style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
            This asset is bookable (can be reserved via the Booking screen)
          </label>
        </div>
      </div>

      {!editing && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', border: '1px solid var(--border)' }}>
          ℹ️ Asset tag (AF-XXXX) is auto-generated by the system — you don't need to enter it.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <span className="spinner" /> : editing ? 'Save Changes' : 'Register Asset'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Asset Detail Drawer ──────────────────────────────────────────────────────
function AssetDetailDrawer({ assetId, onClose }) {
  const { data: asset, loading } = useAsset(assetId)
  const [tab, setTab] = useState('allocation')

  if (!assetId) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '460px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border-light)', height: '100%', overflowY: 'auto', padding: '1.5rem', zIndex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : asset ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{asset.asset_tag}</div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{asset.name}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{asset.category?.name}</div>
              </div>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            {/* Asset info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                ['Status', <StatusBadge status={asset.status} />],
                ['Condition', asset.condition],
                ['Location', asset.location || '—'],
                ['Serial No.', asset.serial_number || '—'],
                ['Acquisition Date', asset.acquisition_date ? new Date(asset.acquisition_date).toLocaleDateString() : '—'],
                ['Acquisition Cost', asset.acquisition_cost ? `₹${Number(asset.acquisition_cost).toLocaleString()}` : '—'],
                ['Bookable', asset.is_bookable ? '✅ Yes' : 'No'],
                ['QR Code', asset.qr_code || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* History tabs */}
            <div className="tabs">
              <button className={`tab${tab === 'allocation' ? ' active' : ''}`} onClick={() => setTab('allocation')}>Allocation History</button>
              <button className={`tab${tab === 'maintenance' ? ' active' : ''}`} onClick={() => setTab('maintenance')}>Maintenance History</button>
            </div>

            {tab === 'allocation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(asset.allocations ?? []).length === 0
                  ? <div className="empty-state"><div className="empty-icon">🔗</div><p>No allocation history.</p></div>
                  : (asset.allocations ?? []).map(a => (
                    <div key={a.id} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.employee?.name ?? a.department?.name ?? 'Unknown'}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        {new Date(a.allocated_at).toLocaleDateString()} {a.actual_return_date ? `→ ${new Date(a.actual_return_date).toLocaleDateString()}` : '→ Present'}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {tab === 'maintenance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(asset.maintenance_requests ?? []).length === 0
                  ? <div className="empty-state"><div className="empty-icon">🔧</div><p>No maintenance history.</p></div>
                  : (asset.maintenance_requests ?? []).map(m => (
                    <div key={m.id} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '0.75rem 1rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.priority} Priority</span>
                        <StatusBadge status={m.status} />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.issue_description}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        Raised by {m.raised_by_emp?.name} · {new Date(m.raised_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Asset not found.</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AssetDirectoryPage() {
  const { profile } = useAuth()
  const canManage = ['Admin', 'AssetManager'].includes(profile?.role)

  const { data: assets, loading, refetch, setFilters, filters } = useAssets()
  const { categories } = useCategories()

  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCatFilter]  = useState('')

  const [formOpen, setFormOpen]       = useState(false)
  const [editAsset, setEditAsset]     = useState(null)
  const [detailId, setDetailId]       = useState(null)

  const applyFilters = () => setFilters({ search, status: statusFilter, category_id: categoryFilter })

  const columns = [
    { key: 'asset_tag', label: 'Asset Tag', render: r => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>{r.asset_tag}</span> },
    { key: 'name', label: 'Asset Name' },
    { key: 'category', label: 'Category', render: r => r.category?.name ?? '—' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'location', label: 'Location', render: r => r.location || <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'condition', label: 'Condition' },
    { key: 'is_bookable', label: 'Bookable', render: r => r.is_bookable ? '✅' : '—', noSort: true },
    { key: 'actions', label: '', noSort: true, render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-sm btn-secondary" onClick={() => setDetailId(r.id)}>View</button>
        {canManage && <button className="btn btn-sm btn-ghost" onClick={() => { setEditAsset(r); setFormOpen(true) }}>Edit</button>}
      </div>
    )},
  ]

  return (
    <AppLayout title="Asset Directory">
      {/* Styles for the detail drawer */}
      <style>{`
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
          display: flex;
          justify-content: flex-end;
          z-index: 999;
          animation: fadeIn 0.2s ease-out;
        }
        .drawer-box {
          background: var(--bg-card);
          width: 100%;
          max-width: 500px;
          height: 100vh;
          box-shadow: var(--shadow-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          animation: slideInRight 0.2s ease-out;
          border-left: 1px solid var(--border-light);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Asset Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Browse, filter, and register physical assets or bookable resources.
          </p>
        </div>
        {isAuthorized && (
          <button className="btn btn-primary" onClick={() => setRegisterOpen(true)}>
      <div className="page-header">
        <div>
          <h2>Asset Registration & Directory</h2>
          <p>Register, search, and manage all organization assets.</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditAsset(null); setFormOpen(true) }}>
            ＋ Register Asset
          </button>
        )}
      </div>

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search Assets</label>
            <input
              type="text"
              placeholder="Search by name, tag, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Reserved">Reserved</option>
              <option value="UnderMaintenance">Under Maintenance</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Location</label>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="card" style={{ padding: 0 }}>
        <DataTable
          columns={columns}
          data={filteredAssets}
          loading={loading}
          emptyMessage="No assets match the search criteria."
        />
      </div>

      {/* Register Asset Modal */}
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register New Asset" width="600px">
        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {registerError && (
            <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              {registerError}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Asset Name *</label>
              <input
                type="text"
                placeholder="e.g. MacBook Pro 16"
                required
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                required
                value={registerForm.category_id}
                onChange={(e) => setRegisterForm({ ...registerForm, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Serial Number</label>
              <input
                type="text"
                placeholder="e.g. S/N 12345"
                value={registerForm.serial_number}
                onChange={(e) => setRegisterForm({ ...registerForm, serial_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>QR Code (Optional)</label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={registerForm.qr_code}
                onChange={(e) => setRegisterForm({ ...registerForm, qr_code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Acquisition Date</label>
              <input
                type="date"
                value={registerForm.acquisition_date}
                onChange={(e) => setRegisterForm({ ...registerForm, acquisition_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Acquisition Cost ($)</label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={registerForm.acquisition_cost}
                onChange={(e) => setRegisterForm({ ...registerForm, acquisition_cost: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Initial Condition</label>
              <select
                value={registerForm.condition}
                onChange={(e) => setRegisterForm({ ...registerForm, condition: e.target.value })}
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="e.g. Head Office (NY)"
                value={registerForm.location}
                onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                style={{ width: 'auto', cursor: 'pointer' }}
                checked={registerForm.is_bookable}
                onChange={(e) => setRegisterForm({ ...registerForm, is_bookable: e.target.checked })}
              />
              <span>Is Bookable (Can be booked for specific slots by employees)</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setRegisterOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={registerLoading}>
              {registerLoading ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Asset Detail Drawer */}
      {selectedAsset && (
        <AssetDetailPage
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 200px auto', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Search</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, asset tag, serial number…" onKeyDown={e => e.key === 'Enter' && applyFilters()} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Category</label>
            <select value={categoryFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={applyFilters} style={{ marginBottom: 0 }}>Filter</button>
        </div>
      </div>

      {/* Summary chips */}
      {!loading && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {STATUSES.map(s => {
            const count = assets.filter(a => a.status === s).length
            if (!count) return null
            return (
              <button key={s} className="badge badge-pending" style={{ cursor: 'pointer', fontSize: '0.78rem', padding: '0.25rem 0.75rem' }}
                onClick={() => { setStatusFilter(s); setFilters({ ...filters, status: s }) }}>
                {s}: {count}
              </button>
            )
          })}
        </div>
      )}

      <DataTable columns={columns} data={assets} loading={loading} emptyMessage="No assets found. Register one to get started." />

      {/* Register / Edit modal */}
      <AssetFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditAsset(null) }}
        onSaved={() => { setFormOpen(false); setEditAsset(null); refetch() }}
        editing={editAsset}
      />

      {/* Detail side drawer */}
      {detailId && <AssetDetailDrawer assetId={detailId} onClose={() => setDetailId(null)} />}
    </AppLayout>
  )
}
