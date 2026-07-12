// Screen 3 — Organization Setup (Admin only)
// Tabs: A) Departments  B) Asset Categories  C) Employee Directory (role promotion here only)
import { useState, useEffect } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import DataTable from '../../components/shared/DataTable'
import Modal from '../../components/shared/Modal'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import StatusBadge from '../../components/shared/StatusBadge'
import { supabase } from '../../lib/supabase'

// ─── Departments Tab ───────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [depts, setDepts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', head_employee_id: '', parent_department_id: '', status: 'Active' })
  const [del, setDel] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: d }, { data: e }] = await Promise.all([
      supabase.from('departments').select('*, head:head_employee_id(name), parent:parent_department_id(name)').order('name'),
      supabase.from('employees').select('id, name').eq('status', 'Active').order('name'),
    ])
    setDepts(d ?? [])
    setEmployees(e ?? [])
    setLoading(false)
  }

  const openAdd = () => { setEditing(null); setForm({ name: '', head_employee_id: '', parent_department_id: '', status: 'Active' }); setModal(true) }
  const openEdit = (r) => { setEditing(r); setForm({ name: r.name, head_employee_id: r.head_employee_id ?? '', parent_department_id: r.parent_department_id ?? '', status: r.status }); setModal(true) }
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    const payload = { name: form.name, head_employee_id: form.head_employee_id || null, parent_department_id: form.parent_department_id || null, status: form.status }
    if (editing) await supabase.from('departments').update(payload).eq('id', editing.id)
    else await supabase.from('departments').insert(payload)
    setSaving(false); setModal(false); fetchAll()
  }

  async function deleteDept() {
    await supabase.from('departments').delete().eq('id', del.id)
    setDel(null); fetchAll()
  }

  const cols = [
    { key: 'name', label: 'Department Name' },
    { key: 'head', label: 'Head', render: r => r.head?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'parent', label: 'Parent', render: r => r.parent?.name ?? <span style={{ color: 'var(--text-muted)' }}>Root</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', noSort: true, render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(r)}>Edit</button>
        <button className="btn btn-sm btn-danger" onClick={() => setDel(r)}>Delete</button>
      </div>
    )},
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={openAdd}>＋ Add Department</button>
      </div>
      <DataTable columns={cols} data={depts} loading={loading} emptyMessage="No departments yet. Add one to get started." />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <div className="form-group"><label>Department Name *</label><input value={form.name} onChange={set('name')} placeholder="e.g. Engineering" required /></div>
        <div className="form-group">
          <label>Department Head</label>
          <select value={form.head_employee_id} onChange={set('head_employee_id')}>
            <option value="">— None —</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Parent Department</label>
          <select value={form.parent_department_id} onChange={set('parent_department_id')}>
            <option value="">— Root (no parent) —</option>
            {depts.filter(d => d.id !== editing?.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={set('status')}>
            <option>Active</option><option>Inactive</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!form.name || saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={deleteDept} title="Delete Department" message={`Delete "${del?.name}"? This cannot be undone.`} danger />
    </>
  )
}

// ─── Asset Categories Tab ──────────────────────────────────────────────────────
function CategoriesTab() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', custom_fields: '' })
  const [del, setDel] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchCats() }, [])

  async function fetchCats() {
    setLoading(true)
    const { data } = await supabase.from('asset_categories').select('*').order('name')
    setCats(data ?? [])
    setLoading(false)
  }

  const openAdd = () => { setEditing(null); setForm({ name: '', custom_fields: '' }); setError(''); setModal(true) }
  const openEdit = (r) => { setEditing(r); setForm({ name: r.name, custom_fields: r.custom_fields ? JSON.stringify(r.custom_fields, null, 2) : '' }); setError(''); setModal(true) }
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setError('')
    let custom_fields = null
    if (form.custom_fields.trim()) {
      try { custom_fields = JSON.parse(form.custom_fields) }
      catch { setError('Custom fields must be valid JSON.'); return }
    }
    setSaving(true)
    const payload = { name: form.name, custom_fields }
    if (editing) await supabase.from('asset_categories').update(payload).eq('id', editing.id)
    else await supabase.from('asset_categories').insert(payload)
    setSaving(false); setModal(false); fetchCats()
  }

  async function deleteCat() {
    await supabase.from('asset_categories').delete().eq('id', del.id)
    setDel(null); fetchCats()
  }

  const cols = [
    { key: 'name', label: 'Category Name' },
    { key: 'custom_fields', label: 'Custom Fields', render: r => r.custom_fields ? <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{JSON.stringify(r.custom_fields)}</code> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'created_at', label: 'Created', render: r => new Date(r.created_at).toLocaleDateString() },
    { key: 'actions', label: '', noSort: true, render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(r)}>Edit</button>
        <button className="btn btn-sm btn-danger" onClick={() => setDel(r)}>Delete</button>
      </div>
    )},
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={openAdd}>＋ Add Category</button>
      </div>
      <DataTable columns={cols} data={cats} loading={loading} emptyMessage="No asset categories yet." />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group"><label>Category Name *</label><input value={form.name} onChange={set('name')} placeholder="e.g. Laptops" required /></div>
        <div className="form-group">
          <label>Custom Fields (JSON)</label>
          <textarea value={form.custom_fields} onChange={set('custom_fields')} rows={4} placeholder={'{\n  "warranty_period_months": 24,\n  "brand": ""\n}'} style={{ fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Optional — define extra fields for this category as a JSON object.</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!form.name || saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={deleteCat} title="Delete Category" message={`Delete "${del?.name}"? Assets using this category will lose their category.`} danger />
    </>
  )
}

// ─── Employee Directory Tab ────────────────────────────────────────────────────
const ROLES = ['Employee', 'DepartmentHead', 'AssetManager', 'Admin']
const ROLE_LABELS = { Employee: 'Employee', DepartmentHead: 'Department Head', AssetManager: 'Asset Manager', Admin: 'Admin' }

function EmployeeDirectoryTab() {
  const [employees, setEmployees] = useState([])
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'Employee', department_id: '', status: 'Active' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: e }, { data: d }] = await Promise.all([
      supabase.from('employees').select('*, dept:department_id(name)').order('name'),
      supabase.from('departments').select('id, name').eq('status', 'Active').order('name'),
    ])
    setEmployees(e ?? [])
    setDepts(d ?? [])
    setLoading(false)
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({ name: r.name, email: r.email, role: r.role, department_id: r.department_id ?? '', status: r.status })
    setModal(true)
  }
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    const payload = { name: form.name, role: form.role, department_id: form.department_id || null, status: form.status }
    await supabase.from('employees').update(payload).eq('id', editing.id)
    setSaving(false); setModal(false); fetchAll()
  }

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => {
      const cls = { Admin: 'role-admin', AssetManager: 'role-manager', DepartmentHead: 'role-head', Employee: 'role-employee' }[r.role]
      return <span className={`badge badge-allocated ${cls}`} style={{ background: 'transparent', padding: 0, fontSize: '0.8rem' }}>{ROLE_LABELS[r.role] ?? r.role}</span>
    }},
    { key: 'dept', label: 'Department', render: r => r.dept?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', noSort: true, render: r => (
      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(r)}>Edit / Promote</button>
    )},
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <input placeholder="🔍  Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          ⚠️ Role promotion can ONLY happen here — not anywhere else in the app.
        </div>
      </div>
      <DataTable columns={cols} data={filtered} loading={loading} emptyMessage="No employees found." />

      <Modal open={modal} onClose={() => setModal(false)} title={`Edit Employee — ${editing?.name}`}>
        <div className="form-group"><label>Full Name</label><input value={form.name} onChange={set('name')} /></div>
        <div className="form-group"><label>Email</label><input value={form.email} disabled style={{ opacity: 0.5 }} /><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Email cannot be changed here.</span></div>
        <div className="form-group">
          <label>Role</label>
          <select value={form.role} onChange={set('role')}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
            ⚠️ This is the ONLY place in the app where roles can be changed. Changes take effect on next login.
          </span>
        </div>
        <div className="form-group">
          <label>Department</label>
          <select value={form.department_id} onChange={set('department_id')}>
            <option value="">— No department —</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save Changes'}</button>
        </div>
      </Modal>
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['Departments', 'Asset Categories', 'Employee Directory']

export default function OrgSetupPage() {
  const [tab, setTab] = useState(0)

  return (
    <AppLayout title="Organization Setup">
      <div className="page-header">
        <div>
          <h2>Organization Setup</h2>
          <p>Manage departments, asset categories, and employee roles. Admin access only.</p>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {TABS.map((t, i) => (
            <button key={t} className={`tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
        {tab === 0 && <DepartmentsTab />}
        {tab === 1 && <CategoriesTab />}
        {tab === 2 && <EmployeeDirectoryTab />}
      </div>
    </AppLayout>
  )
}
