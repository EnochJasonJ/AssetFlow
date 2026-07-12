import { prisma } from '../lib/prisma.js';

export const getDashboardSummary = async () => {
  const [
    totalAssets,
    availableAssets,
    allocatedAssets,
    underMaintenanceAssets,
    activeBookings,
    openAuditCycles,
    pendingMaintenanceRequests
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { status: 'ALLOCATED' } }),
    prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } }),
    prisma.resourceBooking.count({ where: { status: 'ONGOING' } }),
    prisma.auditCycle.count({ where: { is_closed: false } }),
    prisma.maintenanceRequest.count({ where: { status: 'PENDING' } })
  ]);

  return {
    kpis: {
      total_assets: totalAssets,
      available_assets: availableAssets,
      allocated_assets: allocatedAssets,
      under_maintenance_assets: underMaintenanceAssets,
      active_bookings: activeBookings,
      open_audit_cycles: openAuditCycles,
      pending_maintenance_requests: pendingMaintenanceRequests
    }
  };
};
