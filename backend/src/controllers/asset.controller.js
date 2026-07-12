import * as assetService from '../services/asset.service.js';

export const registerAsset = async (req, res, next) => {
  try {
    const data = req.body;
    const asset = await assetService.registerAsset(data);
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    // Extract query params for filtering
    const filters = {
      status: req.query.status,
      category_id: req.query.category_id,
      is_bookable: req.query.is_bookable
    };

    const assets = await assetService.getAllAssets(filters);
    res.status(200).json(assets);
  } catch (err) {
    next(err);
  }
};

export const getAssetHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await assetService.getAssetHistory(id);
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// ALLOCATIONS & TRANSFERS
// ==========================================

export const getAllocations = async (req, res, next) => {
  try {
    const allocations = await assetService.getAllAllocations(req.query);
    res.status(200).json({ status: 'success', data: allocations });
  } catch (err) {
    next(err);
  }
};

export const allocateAsset = async (req, res, next) => {
  try {
    const asset_id = req.body.asset_id || req.body.assetId;
    const assigned_to_user_id = req.body.assigned_to_user_id || req.body.assigned_to || req.body.user_id || req.body.userId;
    const expected_return_date = req.body.expected_return_date;
    const condition_notes = req.body.condition_notes || req.body.notes;
    
    // Parse expected_return_date if provided
    const parsedDate = expected_return_date ? new Date(expected_return_date) : null;

    const allocation = await assetService.allocateAsset(asset_id, assigned_to_user_id, parsedDate, condition_notes);
    res.status(201).json(allocation);
  } catch (err) {
    next(err);
  }
};

export const returnAsset = async (req, res, next) => {
  try {
    const { id } = req.params; // allocation id
    const { condition_notes } = req.body;

    const returnedAllocation = await assetService.returnAsset(id, condition_notes);
    res.status(200).json(returnedAllocation);
  } catch (err) {
    next(err);
  }
};

export const requestTransfer = async (req, res, next) => {
  try {
    const asset_id = req.body.asset_id || req.body.assetId;
    const requested_by_user_id = req.body.requested_by_user_id || req.body.to_user_id || req.body.user_id || req.user?.id;
    const reason = req.body.reason || req.body.notes;

    const transfer = await assetService.requestTransfer(asset_id, requested_by_user_id, reason);
    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
};

export const approveTransfer = async (req, res, next) => {
  try {
    const { id } = req.params; // transfer id
    const transfer = await assetService.approveTransfer(id);
    res.status(200).json(transfer);
  } catch (err) {
    next(err);
  }
};
