// Screen 4 — Asset Registration & Directory
// Owner: Devipriya
import { useState, useEffect } from 'react'
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
    </AppLayout>
  )
}
