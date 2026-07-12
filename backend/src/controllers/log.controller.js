import { prisma } from '../lib/prisma.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const [assets, bookings, allocations, maintenance, audits] = await Promise.all([
      prisma.asset.findMany({
        take: 15,
        orderBy: { created_at: 'desc' }
      }),
      prisma.resourceBooking.findMany({
        take: 15,
        orderBy: { created_at: 'desc' },
        include: { user: true, asset: true }
      }),
      prisma.assetAllocation.findMany({
        take: 15,
        orderBy: { allocated_at: 'desc' },
        include: { user: true, asset: true }
      }),
      prisma.maintenanceRequest.findMany({
        take: 15,
        orderBy: { created_at: 'desc' },
        include: { user: true, asset: true }
      }),
      prisma.auditCycle.findMany({
        take: 10,
        orderBy: { created_at: 'desc' }
      })
    ]);

    const logs = [];

    assets.forEach(a => {
      logs.push({
        id: `log-asset-${a.id}`,
        actor_id: 'system',
        actor_name: 'System / Admin',
        action: 'Asset Registered',
        entity_type: 'asset',
        entity_id: a.id,
        metadata: { tag: a.asset_tag, name: a.name, status: a.status },
        created_at: a.created_at
      });
    });

    bookings.forEach(b => {
      logs.push({
        id: `log-booking-${b.id}`,
        actor_id: b.user_id,
        actor_name: b.user?.name || b.user?.email || 'Employee',
        action: 'Resource Booked',
        entity_type: 'booking',
        entity_id: b.id,
        metadata: {
          asset: b.asset?.name || 'Resource',
          start: b.start_time,
          end: b.end_time,
          status: b.status
        },
        created_at: b.created_at
      });
    });

    allocations.forEach(al => {
      logs.push({
        id: `log-alloc-${al.id}`,
        actor_id: al.user_id,
        actor_name: al.user?.name || al.user?.email || 'Employee',
        action: 'Asset Allocated',
        entity_type: 'allocation',
        entity_id: al.id,
        metadata: {
          asset: al.asset?.name || 'Asset',
          tag: al.asset?.asset_tag
        },
        created_at: al.allocated_at || al.created_at || new Date()
      });
    });

    maintenance.forEach(m => {
      logs.push({
        id: `log-maint-${m.id}`,
        actor_id: m.raised_by_user_id,
        actor_name: m.user?.name || m.user?.email || 'Employee',
        action: 'Maintenance Raised',
        entity_type: 'maintenance',
        entity_id: m.id,
        metadata: {
          asset: m.asset?.name || 'Asset',
          priority: m.priority,
          status: m.status
        },
        created_at: m.created_at
      });
    });

    audits.forEach(au => {
      logs.push({
        id: `log-audit-${au.id}`,
        actor_id: 'system',
        actor_name: 'Audit Manager',
        action: 'Audit Cycle Created',
        entity_type: 'audit',
        entity_id: au.id,
        metadata: { name: au.name },
        created_at: au.created_at
      });
    });

    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      status: 'success',
      data: logs
    });
  } catch (err) {
    next(err);
  }
};
