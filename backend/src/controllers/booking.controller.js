import * as bookingService from '../services/booking.service.js';

export const createBooking = async (req, res, next) => {
  try {
    const asset_id = req.body.asset_id || req.body.resource_id || req.body.assetId || req.body.resourceId;
    const start_time = req.body.start_time || req.body.startTime;
    const end_time = req.body.end_time || req.body.endTime;
    // Use the authenticated user's ID
    const user_id = req.body.user_id || req.user.id;

    const booking = await bookingService.createBooking({
      asset_id,
      user_id,
      start_time,
      end_time
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { asset_id, user_id } = req.query;
    const bookings = await bookingService.getBookings({ asset_id, user_id });
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g. CANCELLED, COMPLETED

    const updatedBooking = await bookingService.updateBookingStatus(id, status);
    res.status(200).json(updatedBooking);
  } catch (err) {
    next(err);
  }
};
