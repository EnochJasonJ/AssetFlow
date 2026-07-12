import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/summary', dashboardController.getDashboardSummary);

export default router;
