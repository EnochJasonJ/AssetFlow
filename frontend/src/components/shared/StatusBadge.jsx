// StatusBadge — colored pill for asset/booking/maintenance statuses
const STATUS_MAP = {
  // Asset statuses
  Available:        'available',
  Allocated:        'allocated',
  Reserved:         'reserved',
  UnderMaintenance: 'maintenance',
  Lost:             'lost',
  Retired:          'retired',
  Disposed:         'disposed',
  // Request statuses
  Pending:          'pending',
  Approved:         'approved',
  Rejected:         'rejected',
  // Generic
  Active:           'approved',
  Inactive:         'retired',
  Upcoming:         'reserved',
  Ongoing:          'allocated',
  Completed:        'approved',
  Cancelled:        'lost',
  Returned:         'available',
  Overdue:          'lost',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] ?? 'pending'
  return (
    <span className={`badge badge-${cls}`}>
      {status?.replace(/([A-Z])/g, ' $1').trim()}
    </span>
  )
}
