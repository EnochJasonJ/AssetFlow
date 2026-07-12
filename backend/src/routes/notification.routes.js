import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markRead);
router.put('/read-all', notificationController.markAllRead);

export default router;
