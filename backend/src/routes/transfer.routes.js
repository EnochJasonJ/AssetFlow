import { Router } from 'express';
import * as assetController from '../controllers/asset.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

router.use(protect);

router.post('/', assetController.requestTransfer);

// Approving transfers requires Asset Manager or Dept Head privileges
router.patch('/:id/approve', restrictTo('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), assetController.approveTransfer);

export default router;
