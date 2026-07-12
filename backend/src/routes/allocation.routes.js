import { Router } from 'express';
import * as assetController from '../controllers/asset.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';

const router = Router();

router.use(protect);

// Asset Managers allocate assets
router.post('/', restrictTo('ADMIN', 'ASSET_MANAGER'), assetController.allocateAsset);

// Anyone holding an asset can return it, or an Asset Manager can mark it returned
router.patch('/:id/return', assetController.returnAsset);

export default router;
