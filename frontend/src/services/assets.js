// src/services/assets.js
import { supabase } from '../lib/supabase'

// Mock Data for fallback
const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'IT Equipment', custom_fields: { warranty_period_months: 24 } },
  { id: 'cat-2', name: 'Furniture', custom_fields: { material: 'Wood' } },
  { id: 'cat-3', name: 'Vehicles', custom_fields: { mileage_limit: 50000 } },
  { id: 'cat-4', name: 'Audio/Video', custom_fields: { resolution: '4K' } }
]

const INITIAL_DEPARTMENTS = [
  { id: 'dept-1', name: 'Engineering' },
  { id: 'dept-2', name: 'HR' },
  { id: 'dept-3', name: 'Operations' },
  { id: 'dept-4', name: 'Sales' }
]

const INITIAL_ASSETS = [
  {
    id: 'asset-1',
    asset_tag: 'AF-0001',
    name: 'MacBook Pro M3 16"',
    category_id: 'cat-1',
    serial_number: 'C02F89XXQ05D',
    qr_code: 'AF-0001-QR',
    acquisition_date: '2026-01-15',
    acquisition_cost: 2499,
    condition: 'Excellent',
    location: 'Head Office (NY)',
    photo_url: '',
    is_bookable: true,
    status: 'Available',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 'asset-2',
    asset_tag: 'AF-0002',
    name: 'Ergonomic Desk Chair',
    category_id: 'cat-2',
    serial_number: 'CH-8819A',
    qr_code: 'AF-0002-QR',
    acquisition_date: '2026-02-10',
    acquisition_cost: 450,
    condition: 'Good',
    location: 'Branch Office (SF)',
    photo_url: '',
    is_bookable: false,
    status: 'Allocated',
    created_at: '2026-02-10T00:00:00Z',
    updated_at: '2026-02-10T00:00:00Z'
  },
  {
    id: 'asset-3',
    asset_tag: 'AF-0003',
    name: 'Conference Room Projector',
    category_id: 'cat-4',
    serial_number: 'PRJ-SONY-99',
    qr_code: 'AF-0003-QR',
    acquisition_date: '2026-03-01',
    acquisition_cost: 1200,
    condition: 'Good',
    location: 'Head Office (NY)',
    photo_url: '',
    is_bookable: true,
    status: 'Available',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'asset-4',
    asset_tag: 'AF-0004',
    name: 'Toyota Prius',
    category_id: 'cat-3',
    serial_number: 'VIN-992817A',
    qr_code: 'AF-0004-QR',
    acquisition_date: '2025-05-20',
    acquisition_cost: 28000,
    condition: 'Fair',
    location: 'Warehouse A',
    photo_url: '',
    is_bookable: true,
    status: 'UnderMaintenance',
    created_at: '2025-05-20T00:00:00Z',
    updated_at: '2026-07-12T10:00:00Z'
  }
]

const INITIAL_ALLOCATIONS = [
  {
    id: 'alloc-1',
    asset_id: 'asset-2',
    employee_name: 'Alice Johnson',
    department_name: 'Engineering',
    allocated_at: '2026-02-15',
    expected_return_date: '2026-12-15',
    actual_return_date: null,
    return_condition_notes: '',
    status: 'Active'
  },
  {
    id: 'alloc-2',
    asset_id: 'asset-1',
    employee_name: 'Bob Smith',
    department_name: 'Sales',
    allocated_at: '2026-01-20',
    expected_return_date: '2026-04-20',
    actual_return_date: '2026-04-19',
    return_condition_notes: 'Returned in perfect shape.',
    status: 'Returned'
  }
]

const INITIAL_MAINTENANCE = [
  {
    id: 'maint-1',
    asset_id: 'asset-4',
    issue_description: 'AC blowing hot air, needs gas recharge and filter replacement.',
    priority: 'Medium',
    status: 'InProgress',
    raised_by: 'Devipriya',
    technician_name: 'Dave Miller',
    raised_at: '2026-07-10',
    resolved_at: null
  },
  {
    id: 'maint-2',
    asset_id: 'asset-1',
    issue_description: 'Screen flickering occasionally.',
    priority: 'Low',
    status: 'Resolved',
    raised_by: 'Bob Smith',
    technician_name: 'Repair Tech',
    raised_at: '2026-05-02',
    resolved_at: '2026-05-03'
  }
]

// LocalStorage helpers to simulate persistence
function getStorage(key, fallback) {
  const data = localStorage.getItem(key)
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  return JSON.parse(data)
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const isSupabaseValid = () => {
  return supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project.supabase.co')
}

export async function getCategories() {
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase.from('asset_categories').select('*')
      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase getCategories failed, falling back to mock:', e)
    }
  }
  return getStorage('af_categories', INITIAL_CATEGORIES)
}

export async function getDepartments() {
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase.from('departments').select('*').eq('status', 'Active')
      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase getDepartments failed, falling back to mock:', e)
    }
  }
  return getStorage('af_departments', INITIAL_DEPARTMENTS)
}

export async function getAssets() {
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*, asset_categories(name)')
      if (!error && data) {
        // format to flatten category name
        return data.map(item => ({
          ...item,
          category_name: item.asset_categories?.name || 'Uncategorized'
        }))
      }
    } catch (e) {
      console.warn('Supabase getAssets failed, falling back to mock:', e)
    }
  }
  const assets = getStorage('af_assets', INITIAL_ASSETS)
  const categories = getStorage('af_categories', INITIAL_CATEGORIES)
  return assets.map(asset => ({
    ...asset,
    category_name: categories.find(c => c.id === asset.category_id)?.name || 'Uncategorized'
  }))
}

export async function registerAsset(assetData) {
  if (isSupabaseValid()) {
    try {
      // Server generates the asset_tag, but we can compute one for safety or use a default
      const { data, error } = await supabase
        .from('assets')
        .insert([{ ...assetData, status: 'Available' }])
        .select()
      if (!error && data) return data[0]
    } catch (e) {
      console.warn('Supabase registerAsset failed, falling back to mock:', e)
    }
  }
  
  const assets = getStorage('af_assets', INITIAL_ASSETS)
  
  // Auto-generate tag (e.g. AF-0005)
  const nextNum = assets.reduce((max, a) => {
    const match = a.asset_tag?.match(/AF-(\d+)/)
    if (match) {
      const val = parseInt(match[1], 10)
      return val > max ? val : max
    }
    return max
  }, 0) + 1
  const asset_tag = `AF-${String(nextNum).padStart(4, '0')}`

  const newAsset = {
    id: `asset-${Date.now()}`,
    asset_tag,
    name: assetData.name,
    category_id: assetData.category_id,
    serial_number: assetData.serial_number || '',
    qr_code: assetData.qr_code || `${asset_tag}-QR`,
    acquisition_date: assetData.acquisition_date || new Date().toISOString().split('T')[0],
    acquisition_cost: Number(assetData.acquisition_cost) || 0,
    condition: assetData.condition || 'Excellent',
    location: assetData.location || 'Head Office (NY)',
    photo_url: assetData.photo_url || '',
    is_bookable: !!assetData.is_bookable,
    status: 'Available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const updatedAssets = [newAsset, ...assets]
  setStorage('af_assets', updatedAssets)

  // Log activity
  const logs = getStorage('af_logs', [])
  logs.unshift({
    id: `log-${Date.now()}`,
    actor_id: 'current-user',
    action: 'Asset Registered',
    entity_type: 'asset',
    entity_id: newAsset.id,
    metadata: { name: newAsset.name, asset_tag: newAsset.asset_tag },
    created_at: new Date().toISOString()
  })
  setStorage('af_logs', logs)

  // Trigger notification
  const notifications = getStorage('af_notifications', [])
  notifications.unshift({
    id: `notif-${Date.now()}`,
    employee_id: 'current-user',
    type: 'AssetRegistered',
    message: `Asset ${newAsset.name} (${newAsset.asset_tag}) registered successfully.`,
    related_entity_type: 'asset',
    related_entity_id: newAsset.id,
    read_at: null,
    created_at: new Date().toISOString()
  })
  setStorage('af_notifications', notifications)

  return newAsset
}

export async function getAssetHistories(assetId) {
  if (isSupabaseValid()) {
    try {
      const [allocRes, maintRes] = await Promise.all([
        supabase.from('allocations').select('*').eq('asset_id', assetId).order('allocated_at', { ascending: false }),
        supabase.from('maintenance_requests').select('*').eq('asset_id', assetId).order('raised_at', { ascending: false })
      ])
      return {
        allocations: allocRes.data || [],
        maintenance: maintRes.data || []
      }
    } catch (e) {
      console.warn('Supabase getAssetHistories failed, falling back to mock:', e)
    }
  }

  const allocations = getStorage('af_allocations', INITIAL_ALLOCATIONS)
  const maintenance = getStorage('af_maintenance', INITIAL_MAINTENANCE)

  return {
    allocations: allocations.filter(a => a.asset_id === assetId),
    maintenance: maintenance.filter(m => m.asset_id === assetId)
  }
}
