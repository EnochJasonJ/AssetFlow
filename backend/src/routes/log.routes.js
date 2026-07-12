import { Router } from 'express';
import * as logController from '../controllers/log.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', logController.getActivityLogs);

export default router;
