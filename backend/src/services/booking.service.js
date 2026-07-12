import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

export const createBooking = async ({ asset_id, user_id, start_time, end_time }) => {
  const startTime = new Date(start_time);
  const endTime = new Date(end_time);

  if (startTime >= endTime) {
    throw new AppError('End time must be after start time', 400);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Verify asset exists and is bookable
    const asset = await tx.asset.findUnique({ where: { id: asset_id } });
    if (!asset) throw new AppError('Asset not found', 404);
    if (!asset.is_bookable) throw new AppError('This asset is not marked as a shared bookable resource', 400);

    // 2. Check for overlapping bookings
    // Overlap condition: existing.start_time < new.endTime AND existing.end_time > new.startTime
    const overlappingBooking = await tx.resourceBooking.findFirst({
      where: {
        asset_id,
        status: {
          in: ['UPCOMING', 'ONGOING']
        },
        start_time: {
          lt: endTime
        },
        end_time: {
          gt: startTime
        }
      }
    });

    if (overlappingBooking) {
      throw new AppError('This resource is already booked during the requested time slot', 409);
    }

    // 3. Create the booking
    return tx.resourceBooking.create({
      data: {
        asset_id,
        user_id,
        start_time: startTime,
        end_time: endTime,
        status: 'UPCOMING'
      },
      include: {
        asset: true,
        user: true
      }
    });
  });
};

export const getBookings = async ({ asset_id, user_id }) => {
  const where = {};
  if (asset_id) where.asset_id = asset_id;
  if (user_id) where.user_id = user_id;

  return prisma.resourceBooking.findMany({
    where,
    include: {
      asset: true,
      user: true
    },
    orderBy: {
      start_time: 'asc'
    }
  });
};

export const updateBookingStatus = async (booking_id, status) => {
  const booking = await prisma.resourceBooking.findUnique({ where: { id: booking_id } });
  if (!booking) throw new AppError('Booking not found', 404);

  return prisma.resourceBooking.update({
    where: { id: booking_id },
    data: { status }
  });
};
