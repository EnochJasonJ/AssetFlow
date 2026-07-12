import { prisma } from '../lib/prisma.js';

export const getNotifications = async (req, res, next) => {
  try {
    let notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });

    if (!notifications || notifications.length === 0) {
      // Also check for any notifications across all users or generate dynamic notifications from recent allocations/bookings
      const recentAlloc = await prisma.assetAllocation.findMany({
        take: 3,
        orderBy: { allocated_at: 'desc' },
        include: { asset: true }
      });
      const recentBookings = await prisma.resourceBooking.findMany({
        take: 3,
        orderBy: { created_at: 'desc' },
        include: { asset: true }
      });

      const dynamicNotifs = [];
      recentAlloc.forEach((al, idx) => {
        dynamicNotifs.push({
          id: `notif-alloc-${al.id}`,
          employee_id: req.user.id,
          type: 'AssetAssigned',
          message: `Asset ${al.asset?.name || 'Item'} (${al.asset?.asset_tag || ''}) has been allocated.`,
          related_entity_type: 'asset',
          related_entity_id: al.asset_id,
          read_at: null,
          created_at: al.allocated_at || new Date()
        });
      });
      recentBookings.forEach((b, idx) => {
        dynamicNotifs.push({
          id: `notif-booking-${b.id}`,
          employee_id: req.user.id,
          type: 'BookingConfirmed',
          message: `Booking for ${b.asset?.name || 'Resource'} is scheduled.`,
          related_entity_type: 'booking',
          related_entity_id: b.id,
          read_at: null,
          created_at: b.created_at || new Date()
        });
      });
      return res.status(200).json({ status: 'success', data: dynamicNotifs });
    }

    const formatted = notifications.map(n => ({
      ...n,
      employee_id: n.user_id,
      read_at: n.read ? n.created_at : null
    }));

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (notification) {
      await prisma.notification.update({
        where: { id },
        data: { read: true }
      });
    }
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, read: false },
      data: { read: true }
    });
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};
