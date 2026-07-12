import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', bookingController.getBookings);
router.post('/', bookingController.createBooking);
router.patch('/:id', bookingController.updateBookingStatus);

export default router;
