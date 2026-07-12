import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', maintenanceController.getMaintenanceRequests);
router.post('/', maintenanceController.createMaintenanceRequest);

// Only Asset Managers (or Admins) can approve/reject/update maintenance status
router.patch('/:id/status', restrictTo('ADMIN', 'ASSET_MANAGER'), maintenanceController.updateMaintenanceStatus);

export default router;
