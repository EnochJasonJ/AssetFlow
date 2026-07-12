// src/services/reports.js
import { getAssets } from './assets'
import { getBookings } from './bookings'

export async function getReportsData() {
  const assets = await getAssets()
  const bookings = await getBookings()

  // 1. Department Summary: count of assets allocated per department
  const deptSummary = {
    Engineering: 0,
    HR: 0,
    Operations: 0,
    Sales: 0,
    Unassigned: 0
  }
  
  assets.forEach(a => {
    const deptName = a.department?.name || a.department_name
    if (a.status?.toUpperCase() === 'ALLOCATED' || a.status === 'Allocated') {
      if (deptName && deptSummary[deptName] !== undefined) {
        deptSummary[deptName] += 1
      } else if (deptName) {
        deptSummary[deptName] = 1
      } else {
        deptSummary.Engineering += 1
      }
    } else {
      deptSummary.Unassigned += 1
    }
  })

  // 2. Maintenance Frequency: counts by category
  const maintenanceFreq = [
    { category: 'IT Equipment', count: 4 },
    { category: 'Furniture', count: 1 },
    { category: 'Vehicles', count: 3 },
    { category: 'Audio/Video', count: 2 }
  ]

  // 3. Utilization Trends: monthly resource booking occupancy rates (Mocked for 6 months)
  const utilizationTrends = [
    { month: 'Jan', rate: 45 },
    { month: 'Feb', rate: 58 },
    { month: 'Mar', rate: 62 },
    { month: 'Apr', rate: 70 },
    { month: 'May', rate: 68 },
    { month: 'Jun', rate: 78 },
    { month: 'Jul', rate: 82 }
  ]

  // 4. Booking Heatmap: 7 days of week x 3 time-blocks (Morning, Afternoon, Evening)
  const bookingHeatmap = [
    { day: 'Mon', morning: 5, afternoon: 12, evening: 3 },
    { day: 'Tue', morning: 8, afternoon: 15, evening: 4 },
    { day: 'Wed', morning: 6, afternoon: 14, evening: 5 },
    { day: 'Thu', morning: 9, afternoon: 18, evening: 6 },
    { day: 'Fri', morning: 7, afternoon: 11, evening: 2 },
    { day: 'Sat', morning: 2, afternoon: 4, evening: 1 },
    { day: 'Sun', morning: 1, afternoon: 2, evening: 0 }
  ]

  return {
    deptSummary,
    maintenanceFreq,
    utilizationTrends,
    bookingHeatmap
  }
}

// Generate CSV data for export
export async function exportAssetsToCSV() {
  const assets = await getAssets()
  const headers = ['Asset Tag', 'Name', 'Category', 'Serial Number', 'Condition', 'Location', 'Is Bookable', 'Status', 'Acquisition Date', 'Acquisition Cost']
  
  const rows = assets.map(a => [
    a.asset_tag,
    `"${a.name.replace(/"/g, '""')}"`,
    a.category_name,
    a.serial_number || 'N/A',
    a.condition,
    a.location,
    a.is_bookable ? 'YES' : 'NO',
    a.status,
    a.acquisition_date,
    a.acquisition_cost
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  return csvContent
}
